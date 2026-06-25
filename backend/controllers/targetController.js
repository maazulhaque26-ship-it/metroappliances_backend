const Target      = require('../models/Target');
const Order       = require('../models/Order');
const DealerOrder = require('../models/DealerOrder');
const Lead        = require('../models/Lead');
const VisitReport = require('../models/VisitReport');

function getTargetDateRange(t) {
  const { period, year, month, quarter } = t;
  if (period === 'monthly')
    return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) };
  if (period === 'quarterly')
    return { start: new Date(year, (quarter - 1) * 3, 1), end: new Date(year, quarter * 3, 1) };
  return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) };
}

// GET /api/admin/bi/targets
exports.getTargets = async (req, res, next) => {
  try {
    const { period, year, month, quarter, targetType } = req.query;
    const filter = {};
    if (period)     filter.period     = period;
    if (year)       filter.year       = parseInt(year);
    if (month)      filter.month      = parseInt(month);
    if (quarter)    filter.quarter    = parseInt(quarter);
    if (targetType) filter.targetType = targetType;

    const targets = await Target.find(filter)
      .populate('agent',     'name agentCode')
      .populate('territory', 'name code')
      .sort({ year: -1, month: -1, quarter: -1 })
      .lean();

    res.json({ success: true, targets });
  } catch (err) { next(err); }
};

// POST /api/admin/bi/targets
exports.createTarget = async (req, res, next) => {
  try {
    const target = await Target.create(req.body);
    const populated = await Target.findById(target._id)
      .populate('agent', 'name agentCode')
      .populate('territory', 'name code')
      .lean();
    res.status(201).json({ success: true, target: populated });
  } catch (err) { next(err); }
};

// PUT /api/admin/bi/targets/:id
exports.updateTarget = async (req, res, next) => {
  try {
    const target = await Target.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('agent', 'name agentCode')
      .populate('territory', 'name code');
    if (!target) return res.status(404).json({ message: 'Target not found' });
    res.json({ success: true, target });
  } catch (err) { next(err); }
};

// DELETE /api/admin/bi/targets/:id
exports.deleteTarget = async (req, res, next) => {
  try {
    await Target.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// GET /api/admin/bi/targets/:id/achievement
exports.getAchievement = async (req, res, next) => {
  try {
    const target = await Target.findById(req.params.id)
      .populate('agent', 'name agentCode')
      .populate('territory', 'name code')
      .lean();
    if (!target) return res.status(404).json({ message: 'Target not found' });

    const { start, end } = getTargetDateRange(target);
    const dateFilter = { $gte: start, $lt: end };
    const agentFilter = target.agent ? { assignedAgent: target.agent._id } : {};

    const [b2cArr, b2bArr, actualLeads, actualWon, actualVisits] = await Promise.all([
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' }, createdAt: dateFilter } }, { $group: { _id: null, v: { $sum: '$totalPrice' } } }]),
      DealerOrder.aggregate([{ $match: { status: { $nin: ['cancelled'] }, isApproved: true, createdAt: dateFilter } }, { $group: { _id: null, v: { $sum: '$totalAmount' } } }]),
      Lead.countDocuments({ isDeleted: false, createdAt: dateFilter, ...agentFilter }),
      Lead.countDocuments({ isDeleted: false, stage: 'won', createdAt: dateFilter, ...agentFilter }),
      VisitReport.countDocuments({ createdAt: dateFilter }),
    ]);

    const actualRevenue    = (b2cArr[0]?.v || 0) + (b2bArr[0]?.v || 0);
    const actualB2BRevenue = b2bArr[0]?.v || 0;
    const pct = (actual, t) => t > 0 ? +((actual / t) * 100).toFixed(1) : null;

    res.json({
      success: true,
      target,
      achievement: {
        revenue:     { actual: actualRevenue,    target: target.targetRevenue,     pct: pct(actualRevenue, target.targetRevenue) },
        b2bRevenue:  { actual: actualB2BRevenue, target: target.targetB2BRevenue,  pct: pct(actualB2BRevenue, target.targetB2BRevenue) },
        leads:       { actual: actualLeads,      target: target.targetLeads,        pct: pct(actualLeads, target.targetLeads) },
        conversions: { actual: actualWon,        target: target.targetConversions,  pct: pct(actualWon, target.targetConversions) },
        visits:      { actual: actualVisits,     target: target.targetVisits,       pct: pct(actualVisits, target.targetVisits) },
      },
    });
  } catch (err) { next(err); }
};
