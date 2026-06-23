const AuditLog = require('../models/AuditLog');

// GET /api/admin/audit-logs
exports.getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, entity, action, adminId, search } = req.query;
    const lim = Math.min(Number(limit), 200);

    const query = {};
    if (entity)  query.entity = entity;
    if (action)  query.action = action;
    if (adminId) query.admin  = adminId;
    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [{ entityLabel: re }, { adminName: re }, { adminEmail: re }];
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * lim)
        .limit(lim)
        .populate('admin', 'name email role')
        .lean(),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { total, page: Number(page), limit: lim, pages: Math.ceil(total / lim) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/audit-logs/meta  — distinct values for filter dropdowns
exports.getMeta = async (req, res) => {
  try {
    const [entities, actions] = await Promise.all([
      AuditLog.distinct('entity'),
      AuditLog.distinct('action'),
    ]);
    res.json({ success: true, data: { entities: entities.sort(), actions: actions.sort() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/audit-logs/entity/:entity/:entityId  — timeline for one record
exports.getEntityTimeline = async (req, res) => {
  try {
    const { entity, entityId } = req.params;
    const logs = await AuditLog.find({ entity, entityId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('admin', 'name email')
      .lean();
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
