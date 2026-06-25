'use strict';
const DocumentControl = require('../models/DocumentControl');
const RevisionHistory = require('../models/RevisionHistory');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated } = require('../utils/response');

exports.getDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, documentType, category, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (documentType) filter.documentType = documentType;
    if (category) filter.category = category;
    if (search) filter.$or = [
      { documentNumber: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
    const total = await DocumentControl.countDocuments(filter);
    const data = await DocumentControl.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Documents retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createDocument = async (req, res) => {
  try {
    const doc = await DocumentControl.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'DocumentControl', entityId: doc._id, entityLabel: doc.documentNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    // Create initial revision history entry
    await RevisionHistory.create({ document: doc._id, documentNumber: doc.documentNumber, revision: doc.currentRevision, revisionType: 'initial', changeDescription: 'Document created', preparedBy: req.user._id, preparedByName: req.user.name, effectiveDate: doc.effectiveDate || new Date() });
    return success(res, doc, 'Document created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getDocument = async (req, res) => {
  try {
    const doc = await DocumentControl.findOne({ _id: req.params.id, isDeleted: false })
      .populate('owner', 'name email')
      .populate('preparedBy', 'name')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name');
    if (!doc) return error(res, 'Document not found', 404);
    const revisions = await RevisionHistory.find({ document: doc._id, isDeleted: false }).sort({ effectiveDate: -1 });
    return success(res, { doc, revisions });
  } catch (err) { return error(res, err.message); }
};

exports.updateDocument = async (req, res) => {
  try {
    const before = await DocumentControl.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return error(res, 'Document not found', 404);
    const doc = await DocumentControl.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'update', entity: 'DocumentControl', entityId: doc._id, entityLabel: doc.documentNumber, changes: { before: before.toObject(), after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, doc, 'Document updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await DocumentControl.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return error(res, 'Document not found', 404);
    return success(res, null, 'Document deleted');
  } catch (err) { return error(res, err.message); }
};

exports.approveDocument = async (req, res) => {
  try {
    const doc = await DocumentControl.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: 'under_review' },
      { status: 'approved', approvedBy: req.user._id, approvedByName: req.user.name, approvedAt: new Date() },
      { new: true }
    );
    if (!doc) return error(res, 'Document not found or not under review', 404);
    return success(res, doc, 'Document approved');
  } catch (err) { return error(res, err.message); }
};

exports.activateDocument = async (req, res) => {
  try {
    const doc = await DocumentControl.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: 'approved' },
      { status: 'active', effectiveDate: req.body.effectiveDate || new Date() },
      { new: true }
    );
    if (!doc) return error(res, 'Document not found or not approved', 404);
    return success(res, doc, 'Document activated');
  } catch (err) { return error(res, err.message); }
};

exports.obsoleteDocument = async (req, res) => {
  try {
    const doc = await DocumentControl.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'obsolete' },
      { new: true }
    );
    if (!doc) return error(res, 'Document not found', 404);
    return success(res, doc, 'Document obsoleted');
  } catch (err) { return error(res, err.message); }
};

// ── Revision History ──────────────────────────────────────────────────────────
exports.createRevision = async (req, res) => {
  try {
    const doc = await DocumentControl.findOne({ _id: req.params.docId, isDeleted: false });
    if (!doc) return error(res, 'Document not found', 404);
    const revision = await RevisionHistory.create({ ...req.body, document: doc._id, documentNumber: doc.documentNumber });
    // Update document's currentRevision
    await DocumentControl.findByIdAndUpdate(doc._id, { currentRevision: revision.revision, status: 'under_review' });
    return success(res, revision, 'Revision created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getRevisions = async (req, res) => {
  try {
    const revisions = await RevisionHistory.find({ document: req.params.docId, isDeleted: false }).sort({ effectiveDate: -1 });
    return success(res, revisions);
  } catch (err) { return error(res, err.message); }
};
