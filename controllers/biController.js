const Order       = require('../models/Order');
const DealerOrder  = require('../models/DealerOrder');
const SalesAgent   = require('../models/SalesAgent');
const Lead         = require('../models/Lead');
const Territory    = require('../models/Territory');
const Dealer       = require('../models/Dealer');
const VisitReport  = require('../models/VisitReport');

function getPeriodRange(period) {
  const now = new Date();
  if (period === 'thisMonth')
    return { $gte: new Date(now.getFullYear(), now.getMonth(), 1), $lte: now };
  if (period === 'lastMonth')
    return { $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), $lt: new Date(now.getFullYear(), now.getMonth(), 1) };
  if (period === 'thisQuarter') {
    const q = Math.floor(now.getMonth() / 3);
    return { $gte: new Date(now.getFullYear(), q * 3, 1), $lte: now };
  }
  if (period === 'thisYear')
    return { $gte: new Date(now.getFullYear(), 0, 1), $lte: now };
  return null; // 'all'
}

// ── GET /api/admin/bi/overview ────────────────────────────────────────────────
exports.getOverview = async (req, res, next) => {
  try {
    const now            = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = thisMonthStart;

    const [
      b2cTotal, b2cThisMonth, b2cLastMonth,
      b2bTotal, b2bThisMonth, b2bLastMonth,
      totalAgents, activeAgents,
      totalDealers, activeDealers,
      totalLeads, wonLeads, activeLeads,
      totalVisits,
    ] = await Promise.all([
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } },                                                                                    { $group: { _id: null, v: { $sum: '$totalPrice' } } }]),
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: thisMonthStart } } },                                               { $group: { _id: null, v: { $sum: '$totalPrice' } } }]),
      Order.aggregate([{ $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } } },                            { $group: { _id: null, v: { $sum: '$totalPrice' } } }]),
      DealerOrder.aggregate([{ $match: { status: { $nin: ['cancelled'] }, isApproved: true } },                                                          { $group: { _id: null, v: { $sum: '$totalAmount' } } }]),
      DealerOrder.aggregate([{ $match: { status: { $nin: ['cancelled'] }, isApproved: true, createdAt: { $gte: thisMonthStart } } },                    { $group: { _id: null, v: { $sum: '$totalAmount' } } }]),
      DealerOrder.aggregate([{ $match: { status: { $nin: ['cancelled'] }, isApproved: true, createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd } } }, { $group: { _id: null, v: { $sum: '$totalAmount' } } }]),
      SalesAgent.countDocuments(),
      SalesAgent.countDocuments({ status: 'active' }),
      Dealer.countDocuments(),
      Dealer.countDocuments({ status: 'approved' }),
      Lead.countDocuments({ isDeleted: false }),
      Lead.countDocuments({ stage: 'won', isDeleted: false }),
      Lead.countDocuments({ stage: { $nin: ['won', 'lost'] }, isDeleted: false }),
      VisitReport.countDocuments(),
    ]);

    const b2cR  = b2cTotal[0]?.v      || 0;
    const b2cTM = b2cThisMonth[0]?.v  || 0;
    const b2cLM = b2cLastMonth[0]?.v  || 0;
    const b2bR  = b2bTotal[0]?.v      || 0;
    const b2bTM = b2bThisMonth[0]?.v  || 0;
    const b2bLM = b2bLastMonth[0]?.v  || 0;
    const growth = (c, p) => p > 0 ? +((c - p) / p * 100).toFixed(1) : null;

    res.json({
      success: true,
      overview: {
        b2c:      { total: b2cR,        thisMonth: b2cTM,        lastMonth: b2cLM,        growth: growth(b2cTM, b2cLM) },
        b2b:      { total: b2bR,        thisMonth: b2bTM,        lastMonth: b2bLM,        growth: growth(b2bTM, b2bLM) },
        combined: { total: b2cR + b2bR, thisMonth: b2cTM + b2bTM, lastMonth: b2cLM + b2bLM, growth: growth(b2cTM + b2bTM, b2cLM + b2bLM) },
        agents:   { total: totalAgents,  active: activeAgents },
        dealers:  { total: totalDealers, active: activeDealers },
        leads:    { total: totalLeads, won: wonLeads, active: activeLeads, conversionRate: totalLeads > 0 ? +((wonLeads / totalLeads) * 100).toFixed(1) : 0 },
        visits:   totalVisits,
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/admin/bi/revenue ─────────────────────────────────────────────────
exports.getRevenue = async (req, res, next) => {
  try {
    const period = req.query.period || 'monthly';
    const year   = parseInt(req.query.year) || new Date().getFullYear();

    const yearStart = new Date(year, 0, 1);
    const yearEnd   = new Date(year + 1, 0, 1);

    let groupId, sortSpec;
    const isYearly = period === 'yearly';

    if (period === 'daily') {
      groupId  = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
      sortSpec = { '_id.year': 1, '_id.month': 1, '_id.day': 1 };
    } else if (period === 'weekly') {
      groupId  = { year: { $year: '$createdAt' }, week: { $isoWeek: '$createdAt' } };
      sortSpec = { '_id.year': 1, '_id.week': 1 };
    } else if (period === 'quarterly') {
      groupId  = { year: { $year: '$createdAt' }, quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } } };
      sortSpec = { '_id.year': 1, '_id.quarter': 1 };
    } else if (isYearly) {
      groupId  = { year: { $year: '$createdAt' } };
      sortSpec = { '_id.year': 1 };
    } else {
      groupId  = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
      sortSpec = { '_id.year': 1, '_id.month': 1 };
    }

    const b2cMatch = isYearly ? { status: { $ne: 'Cancelled' } } : { status: { $ne: 'Cancelled' }, createdAt: { $gte: yearStart, $lt: yearEnd } };
    const b2bMatch = isYearly
      ? { status: { $nin: ['cancelled'] }, isApproved: true }
      : { status: { $nin: ['cancelled'] }, isApproved: true, createdAt: { $gte: yearStart, $lt: yearEnd } };

    const [b2c, b2b] = await Promise.all([
      Order.aggregate([{ $match: b2cMatch }, { $group: { _id: groupId, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } }, { $sort: sortSpec }]),
      DealerOrder.aggregate([{ $match: b2bMatch }, { $group: { _id: groupId, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } }, { $sort: sortSpec }]),
    ]);

    res.json({ success: true, period, year: isYearly ? 'all' : year, b2c, b2b });
  } catch (err) { next(err); }
};

// ── GET /api/admin/bi/agents ──────────────────────────────────────────────────
exports.getAgentPerformance = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;

    const agents    = await SalesAgent.find().populate('territory', 'name code').lean();
    const leadMatch = { isDeleted: false };
    const dr        = getPeriodRange(period);
    if (dr) leadMatch.createdAt = dr;

    const leadStats = await Lead.aggregate([
      { $match: leadMatch },
      { $group: {
        _id:            '$assignedAgent',
        leads:          { $sum: 1 },
        won:            { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] } },
        lost:           { $sum: { $cond: [{ $eq: ['$stage', 'lost'] }, 1, 0] } },
        estimatedValue: { $sum: '$estimatedValue' },
      } },
    ]);

    const sm = {};
    leadStats.forEach(s => { sm[s._id.toString()] = s; });

    const result = agents.map(a => {
      const s     = sm[a._id.toString()] || {};
      const leads = s.leads || 0;
      const won   = s.won   || 0;
      return {
        _id: a._id, name: a.name, agentCode: a.agentCode, status: a.status,
        territory: a.territory, joiningDate: a.joiningDate,
        leads, won, lost: s.lost || 0,
        conversionRate: leads > 0 ? +((won / leads) * 100).toFixed(1) : 0,
        estimatedValue: s.estimatedValue || 0,
        totalLeads:  a.totalLeads  || 0,
        totalVisits: a.totalVisits || 0,
        totalWon:    a.wonLeads    || 0,
      };
    }).sort((a, b) => b.won - a.won);

    res.json({ success: true, agents: result, total: result.length });
  } catch (err) { next(err); }
};

// ── GET /api/admin/bi/dealers ─────────────────────────────────────────────────
exports.getDealerAnalytics = async (req, res, next) => {
  try {
    const topDealers = await DealerOrder.aggregate([
      { $match: { status: { $nin: ['cancelled'] }, isApproved: true } },
      { $group: { _id: '$dealer', revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 }, lastOrder: { $max: '$createdAt' } } },
      { $sort: { revenue: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'dealers', localField: '_id', foreignField: '_id', as: 'info' } },
      { $unwind: { path: '$info', preserveNullAndEmpty: true } },
      { $project: {
        businessName: '$info.businessName', city: '$info.city', state: '$info.state',
        dealerCode: '$info.dealerCode', revenue: 1, orders: 1, lastOrder: 1,
      } },
    ]);

    const allRevs = await DealerOrder.aggregate([
      { $match: { status: { $nin: ['cancelled'] }, isApproved: true } },
      { $group: { _id: '$dealer', revenue: { $sum: '$totalAmount' } } },
    ]);
    const segments = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
    allRevs.forEach(d => {
      if      (d.revenue >= 1000000) segments.Platinum++;
      else if (d.revenue >= 500000)  segments.Gold++;
      else if (d.revenue >= 100000)  segments.Silver++;
      else                           segments.Bronze++;
    });

    const trend = await DealerOrder.aggregate([
      { $match: { status: { $nin: ['cancelled'] }, isApproved: true, createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, topDealers, segments, trend });
  } catch (err) { next(err); }
};

// ── GET /api/admin/bi/territories ─────────────────────────────────────────────
exports.getTerritoryAnalytics = async (req, res, next) => {
  try {
    const territories = await Territory.find({ isDeleted: false })
      .populate('primaryAgent', 'name agentCode').lean();

    const leadStats = await Lead.aggregate([
      { $match: { isDeleted: false, territory: { $exists: true, $ne: null } } },
      { $group: { _id: '$territory', leads: { $sum: 1 }, won: { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] } }, value: { $sum: '$estimatedValue' } } },
    ]);
    const lm = {};
    leadStats.forEach(l => { lm[l._id.toString()] = l; });

    const result = territories.map(t => ({
      _id: t._id, name: t.name, code: t.code, states: t.states, cities: t.cities,
      primaryAgent: t.primaryAgent,
      agentCount:  t.assignedAgents?.length  || 0,
      dealerCount: t.assignedDealers?.length || 0,
      leads: lm[t._id.toString()]?.leads || 0,
      won:   lm[t._id.toString()]?.won   || 0,
      value: lm[t._id.toString()]?.value || 0,
    }));

    const stateStats = await Lead.aggregate([
      { $match: { isDeleted: false, state: { $exists: true, $ne: '' } } },
      { $group: { _id: '$state', leads: { $sum: 1 }, won: { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] } }, value: { $sum: '$estimatedValue' } } },
      { $sort: { leads: -1 } }, { $limit: 20 },
    ]);

    res.json({ success: true, territories: result, stateStats });
  } catch (err) { next(err); }
};

// ── GET /api/admin/bi/leads ───────────────────────────────────────────────────
exports.getLeadFunnel = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    const match = { isDeleted: false };
    const dr    = getPeriodRange(period);
    if (dr) match.createdAt = dr;

    const [stages, lostReasons, sources, priorities, monthlyTrend] = await Promise.all([
      Lead.aggregate([{ $match: match }, { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$estimatedValue' } } }]),
      Lead.aggregate([
        { $match: { ...match, stage: 'lost', lostReason: { $exists: true, $ne: '' } } },
        { $group: { _id: '$lostReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 },
      ]),
      Lead.aggregate([{ $match: match }, { $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Lead.aggregate([{ $match: match }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Lead.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, won: { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] } } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const STAGE_ORDER = ['prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    const sm = {};
    stages.forEach(s => { sm[s._id] = s; });
    const funnel = STAGE_ORDER.map(s => ({ stage: s, count: sm[s]?.count || 0, value: sm[s]?.value || 0 }));

    res.json({ success: true, funnel, lostReasons, sources, priorities, monthlyTrend });
  } catch (err) { next(err); }
};

// ── GET /api/admin/bi/export/:type ────────────────────────────────────────────
exports.exportData = async (req, res, next) => {
  try {
    const { type }     = req.params;
    const { period = 'all' } = req.query;
    const dr           = getPeriodRange(period);
    let data           = [];

    if (type === 'agents') {
      const agents    = await SalesAgent.find().populate('territory', 'name').lean();
      const leadMatch = { isDeleted: false };
      if (dr) leadMatch.createdAt = dr;
      const ls = await Lead.aggregate([
        { $match: leadMatch },
        { $group: { _id: '$assignedAgent', leads: { $sum: 1 }, won: { $sum: { $cond: [{ $eq: ['$stage', 'won'] }, 1, 0] } } } },
      ]);
      const lm = {};
      ls.forEach(l => { lm[l._id.toString()] = l; });
      data = agents.map(a => {
        const s = lm[a._id.toString()] || {};
        return { agentCode: a.agentCode, name: a.name, status: a.status, territory: a.territory?.name || '', leads: s.leads || 0, won: s.won || 0, visits: a.totalVisits || 0 };
      });
    } else if (type === 'dealers') {
      data = await DealerOrder.aggregate([
        { $match: { status: { $nin: ['cancelled'] }, isApproved: true } },
        { $group: { _id: '$dealer', revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $lookup: { from: 'dealers', localField: '_id', foreignField: '_id', as: 'info' } },
        { $unwind: { path: '$info', preserveNullAndEmpty: true } },
        { $project: { _id: 0, businessName: '$info.businessName', city: '$info.city', state: '$info.state', revenue: 1, orders: 1 } },
      ]);
    } else if (type === 'leads') {
      const leadMatch = { isDeleted: false };
      if (dr) leadMatch.createdAt = dr;
      const leads = await Lead.find(leadMatch).populate('assignedAgent', 'name agentCode').populate('territory', 'name').lean();
      data = leads.map(l => ({
        leadNumber: l.leadNumber, businessName: l.businessName, stage: l.stage,
        priority: l.priority, source: l.source,
        agent: l.assignedAgent?.name || '', territory: l.territory?.name || '',
        estimatedValue: l.estimatedValue, city: l.city, state: l.state,
      }));
    } else {
      const orderMatch = { status: { $ne: 'Cancelled' } };
      if (dr) orderMatch.createdAt = dr;
      const orders = await Order.find(orderMatch).populate('user', 'name email').lean();
      data = orders.map(o => ({
        orderNumber: o.orderNumber, customer: o.user?.name || '',
        status: o.status, total: o.totalPrice, paymentMethod: o.paymentMethod,
        createdAt: o.createdAt?.toISOString().split('T')[0],
      }));
    }

    res.json({ success: true, data, count: data.length });
  } catch (err) { next(err); }
};
