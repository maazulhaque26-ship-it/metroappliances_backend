const Alert = require('../models/Alert');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

// ── Internal helper reused by other controllers ───────────────────────────────
exports.generateAlert = async (io, { type, severity = 'medium', title, message, details, warehouseId, entityType, entityId }) => {
  try {
    const alert = await Alert.create({ type, severity, title, message, details, warehouseId, entityType, entityId });
    if (io) io.emit('alert:created', { alert });
    return alert;
  } catch { return null; }
};

// ── Admin: create manual alert ────────────────────────────────────────────────
exports.createAlert = async (req, res) => {
  try {
    const { type, severity, title, message, details, warehouseId, entityType, entityId } = req.body;
    if (!type || !title || !message) return fail(res, 'type, title and message are required');
    const alert = await Alert.create({ type: type || 'manual', severity, title, message, details, warehouseId, entityType, entityId });
    const io = req.app.locals.io;
    if (io) io.emit('alert:created', { alert });
    return created(res, alert, 'Alert created');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: list alerts ────────────────────────────────────────────────────────
exports.getAlerts = async (req, res) => {
  try {
    const { warehouseId, status, severity, type, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (warehouseId) filter.warehouseId = warehouseId;
    if (status)      filter.status      = status;
    if (severity)    filter.severity    = severity;
    if (type)        filter.type        = type;
    const total  = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit).lean();
    return paginated(res, alerts, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

// ── Admin: acknowledge alert ──────────────────────────────────────────────────
exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return notFound(res, 'Alert');
    if (alert.status !== 'active') return fail(res, `Alert is already ${alert.status}`);
    alert.status          = 'acknowledged';
    alert.acknowledgedBy  = req.user._id;
    alert.acknowledgedAt  = new Date();
    await alert.save();
    const io = req.app.locals.io;
    if (io) io.emit('alert:acknowledged', { alertId: alert._id });
    return ok(res, alert, 'Alert acknowledged');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: resolve alert ──────────────────────────────────────────────────────
exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return notFound(res, 'Alert');
    if (alert.status === 'resolved') return fail(res, 'Alert already resolved');
    alert.status     = 'resolved';
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    await alert.save();
    const io = req.app.locals.io;
    if (io) io.emit('alert:resolved', { alertId: alert._id });
    return ok(res, alert, 'Alert resolved');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: dismiss alert ──────────────────────────────────────────────────────
exports.dismissAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id,
      { status: 'dismissed' }, { new: true });
    if (!alert) return notFound(res, 'Alert');
    return ok(res, alert, 'Alert dismissed');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: alert stats ────────────────────────────────────────────────────────
exports.getAlertStats = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const filter = {};
    if (warehouseId) filter.warehouseId = warehouseId;

    const since24h = new Date(Date.now() - 86_400_000);

    const [total, active, acknowledged, resolved, today] = await Promise.all([
      Alert.countDocuments(filter),
      Alert.countDocuments({ ...filter, status: 'active' }),
      Alert.countDocuments({ ...filter, status: 'acknowledged' }),
      Alert.countDocuments({ ...filter, status: 'resolved' }),
      Alert.countDocuments({ ...filter, createdAt: { $gte: since24h } }),
    ]);

    const bySeverity = await Alert.aggregate([
      { $match: { ...filter, status: { $in: ['active', 'acknowledged'] } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byType = await Alert.aggregate([
      { $match: { ...filter, createdAt: { $gte: since24h } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return ok(res, { total, active, acknowledged, resolved, today, bySeverity, byType });
  } catch (err) { return serverError(res, err); }
};

// ── Admin: alert history with time-bucketing ──────────────────────────────────
exports.getAlertHistory = async (req, res) => {
  try {
    const { warehouseId, days = 7 } = req.query;
    const since = new Date(Date.now() - days * 86_400_000);
    const filter = { createdAt: { $gte: since } };
    if (warehouseId) filter.warehouseId = warehouseId;

    const history = await Alert.aggregate([
      { $match: filter },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        high:     { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);

    return ok(res, history);
  } catch (err) { return serverError(res, err); }
};
