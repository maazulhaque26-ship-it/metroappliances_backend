const VoicePickingSession = require('../models/VoicePickingSession');
const { ok, created, fail, notFound, serverError } = require('../utils/response');

function sysMsg(text, action, itemIndex) {
  return { timestamp: new Date(), direction: 'system', text, action, itemIndex };
}

// ── Warehouse: start a new voice picking session ──────────────────────────────
exports.startSession = async (req, res) => {
  try {
    const { pickingListId, warehouseId, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
      return fail(res, 'items array is required');

    const itemList = items.map(it => ({
      productId:   it.productId,
      sku:         it.sku,
      productName: it.productName,
      binCode:     it.binCode,
      requiredQty: it.requiredQty,
      pickedQty:   0,
      status:      'pending',
    }));

    const first = itemList[0];
    const greeting = sysMsg(
      `Voice picking session started. ${itemList.length} items to pick. ` +
      `Go to bin ${first.binCode} and pick ${first.requiredQty} of ${first.productName}.`,
      'start', 0
    );

    const session = await VoicePickingSession.create({
      pickingListId,
      warehouseUserId: req.warehouseUser._id,
      warehouseId,
      status: 'active',
      items: itemList,
      totalItems: itemList.length,
      currentItemIndex: 0,
      voiceLogs: [greeting],
      startedAt: new Date(),
    });

    const io = req.app.locals.io;
    if (io) io.emit('voice:session_started', { sessionId: session._id, warehouseId });
    return created(res, { session, instruction: greeting.text }, 'Session started');
  } catch (err) { return serverError(res, err); }
};

// ── Warehouse: get current session state ─────────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const session = await VoicePickingSession.findById(req.params.id).lean();
    if (!session) return notFound(res, 'VoicePickingSession');
    const current = session.items[session.currentItemIndex];
    return ok(res, { session, currentItem: current });
  } catch (err) { return serverError(res, err); }
};

// ── Warehouse: get next item instruction ─────────────────────────────────────
exports.nextItem = async (req, res) => {
  try {
    const session = await VoicePickingSession.findById(req.params.id);
    if (!session) return notFound(res, 'VoicePickingSession');
    if (session.status !== 'active') return fail(res, `Session is ${session.status}`);

    const idx = session.currentItemIndex;
    if (idx >= session.items.length) {
      return ok(res, { instruction: 'All items have been picked. Say COMPLETE to finish.' });
    }

    const item = session.items[idx];
    const instruction = `Go to bin ${item.binCode} and pick ${item.requiredQty} of ${item.productName}. Say CONFIRM when done.`;
    const log = sysMsg(instruction, 'next', idx);
    session.voiceLogs.push(log);
    await session.save();
    return ok(res, { instruction, item, itemIndex: idx });
  } catch (err) { return serverError(res, err); }
};

// ── Warehouse: confirm pick for current item ──────────────────────────────────
exports.confirmPick = async (req, res) => {
  try {
    const session = await VoicePickingSession.findById(req.params.id);
    if (!session) return notFound(res, 'VoicePickingSession');
    if (session.status !== 'active') return fail(res, `Session is ${session.status}`);

    const { pickedQty, operatorText } = req.body;
    const idx  = session.currentItemIndex;
    const item = session.items[idx];
    if (!item) return fail(res, 'No current item');

    const qty        = pickedQty !== undefined ? pickedQty : item.requiredQty;
    item.pickedQty   = qty;
    item.status      = qty >= item.requiredQty ? 'confirmed' : 'partial';
    item.pickedAt    = new Date();

    if (operatorText) {
      session.voiceLogs.push({ timestamp: new Date(), direction: 'operator', text: operatorText, action: 'confirm', itemIndex: idx });
    }

    session.confirmedItems += 1;
    session.currentItemIndex += 1;

    let instruction;
    if (session.currentItemIndex < session.items.length) {
      const next = session.items[session.currentItemIndex];
      instruction = `Confirmed ${qty} of ${item.productName}. Next: go to bin ${next.binCode} and pick ${next.requiredQty} of ${next.productName}.`;
    } else {
      instruction = `Confirmed ${qty} of ${item.productName}. All items picked. Say COMPLETE to finish.`;
    }

    session.voiceLogs.push(sysMsg(instruction, 'confirm', idx));
    await session.save();

    const io = req.app.locals.io;
    if (io) io.emit('voice:item_confirmed', { sessionId: session._id, itemIndex: idx, pickedQty: qty });
    return ok(res, { instruction, progress: { done: session.confirmedItems + session.skippedItems, total: session.totalItems } });
  } catch (err) { return serverError(res, err); }
};

// ── Warehouse: skip current item ──────────────────────────────────────────────
exports.skipItem = async (req, res) => {
  try {
    const session = await VoicePickingSession.findById(req.params.id);
    if (!session) return notFound(res, 'VoicePickingSession');
    if (session.status !== 'active') return fail(res, `Session is ${session.status}`);

    const idx  = session.currentItemIndex;
    const item = session.items[idx];
    if (!item) return fail(res, 'No current item');

    item.status       = 'skipped';
    session.skippedItems += 1;
    session.currentItemIndex += 1;

    let instruction;
    if (session.currentItemIndex < session.items.length) {
      const next = session.items[session.currentItemIndex];
      instruction = `Skipped ${item.productName}. Go to bin ${next.binCode} and pick ${next.requiredQty} of ${next.productName}.`;
    } else {
      instruction = `Skipped ${item.productName}. All items processed. Say COMPLETE to finish.`;
    }

    session.voiceLogs.push(sysMsg(instruction, 'skip', idx));
    await session.save();
    return ok(res, { instruction });
  } catch (err) { return serverError(res, err); }
};

// ── Warehouse: repeat current instruction ────────────────────────────────────
exports.repeatInstruction = async (req, res) => {
  try {
    const session = await VoicePickingSession.findById(req.params.id).lean();
    if (!session) return notFound(res, 'VoicePickingSession');
    const item = session.items[session.currentItemIndex];
    if (!item) return ok(res, { instruction: 'No more items. Say COMPLETE.' });
    const instruction = `Repeat: go to bin ${item.binCode} and pick ${item.requiredQty} of ${item.productName}.`;
    return ok(res, { instruction, item, itemIndex: session.currentItemIndex });
  } catch (err) { return serverError(res, err); }
};

// ── Warehouse: complete session ───────────────────────────────────────────────
exports.completeSession = async (req, res) => {
  try {
    const session = await VoicePickingSession.findById(req.params.id);
    if (!session) return notFound(res, 'VoicePickingSession');
    if (session.status === 'completed') return fail(res, 'Session already completed');

    const now         = new Date();
    session.status    = 'completed';
    session.completedAt     = now;
    session.totalDurationMs = now - session.startedAt;
    session.accuracy  = session.totalItems
      ? ((session.confirmedItems / session.totalItems) * 100).toFixed(1)
      : 0;

    session.voiceLogs.push(sysMsg(
      `Session complete. Picked ${session.confirmedItems}/${session.totalItems} items. Accuracy: ${session.accuracy}%.`,
      'complete', session.currentItemIndex
    ));
    await session.save();

    const io = req.app.locals.io;
    if (io) io.emit('voice:session_completed', {
      sessionId: session._id, accuracy: session.accuracy,
      confirmedItems: session.confirmedItems, skippedItems: session.skippedItems,
    });
    return ok(res, { session, summary: { confirmedItems: session.confirmedItems, skippedItems: session.skippedItems, accuracy: session.accuracy } });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: get session logs ───────────────────────────────────────────────────
exports.getSessionLogs = async (req, res) => {
  try {
    const session = await VoicePickingSession.findById(req.params.id).lean();
    if (!session) return notFound(res, 'VoicePickingSession');
    return ok(res, { session, logs: session.voiceLogs });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: list sessions ──────────────────────────────────────────────────────
exports.getSessions = async (req, res) => {
  try {
    const { warehouseId, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (warehouseId) filter.warehouseId = warehouseId;
    if (status)      filter.status      = status;
    const { paginated } = require('../utils/response');
    const total    = await VoicePickingSession.countDocuments(filter);
    const sessions = await VoicePickingSession.find(filter)
      .sort({ startedAt: -1 }).skip((page-1)*limit).limit(+limit).lean();
    return paginated(res, sessions, total, page, limit);
  } catch (err) { return serverError(res, err); }
};
