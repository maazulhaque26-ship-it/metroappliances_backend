const mongoose  = require('mongoose');
const RFIDTag   = require('../models/RFIDTag');
const RFIDReader= require('../models/RFIDReader');
const RFIDScan  = require('../models/RFIDScan');
const Alert     = require('../models/Alert');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ─── Internal: emit RFID event via socket ────────────────────────────────────
function emitRFID(req, event, data) {
  const io = req.app.locals.io;
  if (io) io.emit(`rfid:${event}`, data);
}

// ─── Internal: create alert for RFID event ───────────────────────────────────
async function raiseAlert(io, warehouseId, type, severity, title, message, details) {
  try {
    const alert = await Alert.create({ type, severity, title, message, details, warehouseId });
    if (io) io.emit('alert:created', { alert });
  } catch { /* non-fatal */ }
}

// ── Admin: register RFID tag ──────────────────────────────────────────────────
exports.registerTag = async (req, res) => {
  try {
    const { epc, tid, format, entityType, entityId, label, warehouseId } = req.body;
    if (!epc || !entityType) return fail(res, 'epc and entityType are required');
    const existing = await RFIDTag.findOne({ epc: epc.toUpperCase() });
    if (existing) return fail(res, `EPC ${epc} is already registered`);
    const tag = await RFIDTag.create({ epc, tid, format, entityType, entityId, label, warehouseId, assignedAt: new Date() });
    emitRFID(req, 'tag_registered', { tag });
    return created(res, tag, 'RFID tag registered');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: assign/reassign tag to entity ─────────────────────────────────────
exports.assignTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { entityType, entityId, label } = req.body;
    const tag = await RFIDTag.findById(id);
    if (!tag) return notFound(res, 'RFIDTag');
    tag.entityType = entityType || tag.entityType;
    tag.entityId   = entityId   || tag.entityId;
    tag.label      = label      || tag.label;
    tag.assignedAt = new Date();
    tag.status     = 'active';
    tag.history.push({ eventType: 'assignment', timestamp: new Date() });
    await tag.save();
    return ok(res, tag, 'Tag assigned');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: replace damaged/lost tag ──────────────────────────────────────────
exports.replaceTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEpc, reason } = req.body;
    const oldTag = await RFIDTag.findById(id);
    if (!oldTag) return notFound(res, 'RFIDTag');
    if (!newEpc) return fail(res, 'newEpc is required');

    oldTag.status = 'replaced';
    oldTag.replacedByEpc = newEpc.toUpperCase();
    await oldTag.save();

    const newTag = await RFIDTag.create({
      epc: newEpc.toUpperCase(),
      entityType: oldTag.entityType,
      entityId:   oldTag.entityId,
      label:      oldTag.label,
      warehouseId: oldTag.warehouseId,
      currentBinId: oldTag.currentBinId,
      assignedAt: new Date(),
      status: 'active',
      history: [{ eventType: 'replacement', timestamp: new Date() }],
    });
    return created(res, { oldTag, newTag }, 'Tag replaced');
  } catch (err) { return serverError(res, err); }
};

// ── Admin / Warehouse: bulk scan (array of EPC + reader info) ────────────────
exports.bulkScan = async (req, res) => {
  try {
    const { epcs, readerId, eventType = 'bulk_scan', warehouseId, zoneId, binId } = req.body;
    if (!Array.isArray(epcs) || epcs.length === 0) return fail(res, 'epcs array is required');

    const io = req.app.locals.io;
    const readerDoc = readerId ? await RFIDReader.findOne({ readerId: readerId.toUpperCase() }) : null;
    const batchId   = new mongoose.Types.ObjectId().toHexString();
    const upperEPCs = epcs.map(e => e.toUpperCase());

    // Detect duplicates within batch
    const seen = new Set();
    const results = { total: upperEPCs.length, known: 0, unknown: 0, duplicates: 0, scans: [] };

    const tagMap = await RFIDTag.find({ epc: { $in: upperEPCs } }).lean();
    const tagByEpc = Object.fromEntries(tagMap.map(t => [t.epc, t]));

    const scanDocs = [];
    for (const epc of upperEPCs) {
      const isDuplicate = seen.has(epc);
      seen.add(epc);
      const tag        = tagByEpc[epc];
      const isUnknown  = !tag;
      if (isDuplicate) results.duplicates++;
      else if (isUnknown) results.unknown++;
      else results.known++;

      scanDocs.push({
        epc,
        tagId:   tag?._id,
        readerId: readerDoc?._id,
        readerReaderId: readerId,
        eventType,
        warehouseId: warehouseId || tag?.warehouseId,
        zoneId,
        binId,
        isDuplicate,
        isUnknown,
        batchId,
        scannedAt: new Date(),
      });
    }

    await RFIDScan.insertMany(scanDocs, { ordered: false });

    // Update lastSeenAt for known, non-duplicate tags
    const knownEPCs = upperEPCs.filter(e => tagByEpc[e]);
    if (knownEPCs.length > 0) {
      await RFIDTag.updateMany(
        { epc: { $in: knownEPCs } },
        { $set: { lastSeenAt: new Date(), lastReaderId: readerDoc?._id, currentBinId: binId || undefined } }
      );
    }

    // Alert on unknown tags
    if (results.unknown > 0 && warehouseId) {
      const unknownEPCs = upperEPCs.filter(e => !tagByEpc[e]);
      await raiseAlert(io, warehouseId, 'rfid_unknown', 'medium',
        `${results.unknown} Unknown RFID Tag(s) Detected`,
        `Batch ${batchId}: ${unknownEPCs.slice(0, 5).join(', ')}${unknownEPCs.length > 5 ? '…' : ''}`,
        { batchId, unknownEPCs, eventType });
    }

    if (io) io.emit('rfid:bulk_scan', { batchId, warehouseId, results, eventType });
    return ok(res, { batchId, results }, 'Bulk scan processed');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: inventory count (expected vs. found) ───────────────────────────────
exports.getInventoryCount = async (req, res) => {
  try {
    const { warehouseId, zoneId, batchId } = req.query;
    if (!warehouseId && !batchId) return fail(res, 'warehouseId or batchId required');

    const scanFilter = { eventType: 'inventory_count', isDuplicate: false };
    if (batchId)     scanFilter.batchId = batchId;
    if (warehouseId) scanFilter.warehouseId = new mongoose.Types.ObjectId(warehouseId);
    if (zoneId)      scanFilter.zoneId     = new mongoose.Types.ObjectId(zoneId);

    const scanned = await RFIDScan.find(scanFilter).distinct('epc');
    const scannedSet = new Set(scanned);

    const tagFilter = { isActive: true, status: 'active' };
    if (warehouseId) tagFilter.warehouseId = new mongoose.Types.ObjectId(warehouseId);

    const expectedTags = await RFIDTag.find(tagFilter).lean();
    const expectedSet  = new Set(expectedTags.map(t => t.epc));

    const found   = scanned.filter(e => expectedSet.has(e));
    const missing = expectedTags.filter(t => !scannedSet.has(t.epc));
    const unknown = scanned.filter(e => !expectedSet.has(e));

    return ok(res, {
      expected:      expectedTags.length,
      found:         found.length,
      missingCount:  missing.length,
      unknownCount:  unknown.length,
      accuracy:      expectedTags.length ? ((found.length / expectedTags.length) * 100).toFixed(1) : 0,
      missingTags:   missing.slice(0, 50).map(t => ({ epc: t.epc, label: t.label, entityType: t.entityType })),
      unknownEPCs:   unknown.slice(0, 50),
    });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: scan history for a specific tag ────────────────────────────────────
exports.getRFIDHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await RFIDTag.findById(id);
    if (!tag) return notFound(res, 'RFIDTag');
    const scans = await RFIDScan.find({ epc: tag.epc }).sort({ scannedAt: -1 }).limit(100).lean();
    return ok(res, { tag, scans });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: list RFID tags ─────────────────────────────────────────────────────
exports.getTags = async (req, res) => {
  try {
    const { warehouseId, status, entityType, page = 1, limit = 50 } = req.query;
    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouseId = warehouseId;
    if (status)      filter.status      = status;
    if (entityType)  filter.entityType  = entityType;
    const total = await RFIDTag.countDocuments(filter);
    const tags  = await RFIDTag.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit).lean();
    return paginated(res, tags, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: RFID readers ───────────────────────────────────────────────────────
exports.getReaders = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const filter = { isActive: true };
    if (warehouseId) filter.warehouseId = warehouseId;
    const readers = await RFIDReader.find(filter).sort({ name: 1 }).lean();
    return ok(res, readers);
  } catch (err) { return serverError(res, err); }
};

exports.createReader = async (req, res) => {
  try {
    const reader = await RFIDReader.create(req.body);
    return created(res, reader, 'Reader registered');
  } catch (err) { return serverError(res, err); }
};

exports.updateReaderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, firmware, lastHeartbeat } = req.body;
    const reader = await RFIDReader.findByIdAndUpdate(id,
      { $set: { status, firmware, lastHeartbeat: lastHeartbeat || new Date() } },
      { new: true }
    );
    if (!reader) return notFound(res, 'RFIDReader');
    emitRFID(req, 'reader_status', { readerId: reader._id, status });
    return ok(res, reader);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: conflict detection (same tag in multiple locations recently) ────────
exports.detectConflicts = async (req, res) => {
  try {
    const { warehouseId, hours = 1 } = req.query;
    const since = new Date(Date.now() - hours * 3_600_000);
    const filter = { scannedAt: { $gte: since }, isDuplicate: false };
    if (warehouseId) filter.warehouseId = new mongoose.Types.ObjectId(warehouseId);

    const pipeline = [
      { $match: filter },
      { $group: { _id: '$epc', zones: { $addToSet: '$zoneId' }, bins: { $addToSet: '$binId' }, count: { $sum: 1 } } },
      { $match: { $expr: { $gt: [{ $size: { $filter: { input: '$bins', cond: { $ne: ['$$this', null] } } } }, 1] } } },
      { $limit: 50 },
    ];
    const conflicts = await RFIDScan.aggregate(pipeline);
    return ok(res, { conflicts, count: conflicts.length, windowHours: hours });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: RFID dashboard stats ───────────────────────────────────────────────
exports.getRFIDStats = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouseId = new mongoose.Types.ObjectId(warehouseId);

    const [total, active, inactive, lost, today] = await Promise.all([
      RFIDTag.countDocuments(filter),
      RFIDTag.countDocuments({ ...filter, status: 'active' }),
      RFIDTag.countDocuments({ ...filter, status: 'inactive' }),
      RFIDTag.countDocuments({ ...filter, status: 'lost' }),
      RFIDScan.countDocuments({ scannedAt: { $gte: new Date(Date.now() - 86_400_000) }, ...(warehouseId ? { warehouseId } : {}) }),
    ]);

    const byType = await RFIDTag.aggregate([
      { $match: filter },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return ok(res, { total, active, inactive, lost, scansToday: today, byEntityType: byType });
  } catch (err) { return serverError(res, err); }
};
