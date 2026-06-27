const mongoose = require('mongoose');
const { ok, serverError } = require('../utils/response');

const tryM = (name) => { try { return mongoose.model(name); } catch { return null; } };
const safeAgg = async (model, pipeline, fallback = []) => {
  const M = tryM(model);
  if (!M) return fallback;
  try { return await M.aggregate(pipeline); } catch { return fallback; }
};
const safeCount = async (model, filter = {}) => {
  const M = tryM(model);
  if (!M) return 0;
  try { return await M.countDocuments(filter); } catch { return 0; }
};

const monthlyGroupPipeline = (since) => ([
  { $match: { createdAt: { $gte: since } } },
  { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
  { $sort: { '_id.y': 1, '_id.m': 1 } }
]);

exports.getCrossModuleAnalytics = async (req, res) => {
  try {
    const ytd = new Date(new Date().getFullYear(), 0, 1);
    const [
      salesData, hrData, mfgData, procData,
      projectData, serviceData, warehouseData, financeData
    ] = await Promise.all([
      safeAgg('Order', [
        { $match: { createdAt: { $gte: ytd } } },
        { $group: { _id: { m: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { '_id.m': 1 } }
      ]),
      Promise.all([
        safeCount('Employee', { isActive: true }),
        safeCount('LeaveRequest', { status: 'pending' }),
        safeCount('JobOpening', { status: 'open' }),
      ]),
      safeAgg('ProductionOrder', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('PurchaseOrder', [
        { $match: { createdAt: { $gte: ytd } } },
        { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$totalAmount' } } }
      ]),
      safeAgg('Project', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('ServiceRequest', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('Inventory', [
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$unitCost', 0] }] } } } }
      ]),
      safeAgg('CustomerInvoice', [
        { $group: { _id: '$status', total: { $sum: '$totalAmount' } } }
      ]),
    ]);

    ok(res, {
      sales:     salesData,
      hr:        { active: hrData[0], pendingLeave: hrData[1], openPositions: hrData[2] },
      manufacturing: mfgData,
      procurement:   procData[0] || { count: 0, value: 0 },
      projects:  projectData,
      service:   serviceData,
      warehouse: warehouseData[0] || { totalValue: 0 },
      finance:   financeData,
    });
  } catch (e) { serverError(res, e); }
};

exports.getDrillDown = async (req, res) => {
  try {
    const { module, metric } = req.query;
    const since = new Date(); since.setMonth(since.getMonth() - 2); since.setDate(1);
    let data = [];

    if (module === 'sales' && metric === 'revenue') {
      data = await safeAgg('Order', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    } else if (module === 'hr' && metric === 'headcount') {
      data = await safeAgg('Employee', [
        { $match: { isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    } else if (module === 'manufacturing' && metric === 'production') {
      data = await safeAgg('ProductionOrder', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 }, planned: { $sum: '$plannedQuantity' }, actual: { $sum: '$completedQuantity' } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]);
    } else if (module === 'procurement' && metric === 'spend') {
      data = await safeAgg('PurchaseOrder', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$vendor', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }, { $limit: 10 }
      ]);
    } else if (module === 'service' && metric === 'tickets') {
      data = await safeAgg('ServiceRequest', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$serviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    } else if (module === 'projects' && metric === 'status') {
      data = await safeAgg('Project', [
        { $group: { _id: '$status', count: { $sum: 1 }, budget: { $sum: '$budget' } } }
      ]);
    } else if (module === 'warehouse' && metric === 'inventory') {
      data = await safeAgg('Inventory', [
        { $group: { _id: '$warehouseZone', count: { $sum: 1 }, value: { $sum: { $multiply: ['$quantity', { $ifNull: ['$unitCost', 0] }] } } } },
        { $sort: { value: -1 } }
      ]);
    } else if (module === 'finance' && metric === 'ar') {
      data = await safeAgg('CustomerInvoice', [
        { $group: { _id: '$status', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]);
    }

    ok(res, { module, metric, data });
  } catch (e) { serverError(res, e); }
};

exports.getTrendAnalysis = async (req, res) => {
  try {
    const { metrics = 'revenue', period = 'monthly', months = 12 } = req.query;
    const m = Math.min(parseInt(months), 24);
    const since = new Date(); since.setMonth(since.getMonth() - m + 1); since.setDate(1);
    const metricList = metrics.split(',').slice(0, 5);
    const result = {};

    if (metricList.includes('revenue')) {
      result.revenue = await safeAgg('Order', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, value: { $sum: '$totalAmount' } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]);
    }
    if (metricList.includes('orders')) {
      result.orders = await safeAgg('Order', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, value: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]);
    }
    if (metricList.includes('production')) {
      result.production = await safeAgg('ProductionOrder', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, value: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]);
    }
    if (metricList.includes('procurement')) {
      result.procurement = await safeAgg('PurchaseOrder', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, value: { $sum: '$totalAmount' } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]);
    }
    if (metricList.includes('service')) {
      result.service = await safeAgg('ServiceRequest', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, value: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]);
    }

    ok(res, { period, metrics: metricList, data: result });
  } catch (e) { serverError(res, e); }
};

exports.getYoYComparison = async (req, res) => {
  try {
    const now = new Date();
    const thisYear = new Date(now.getFullYear(), 0, 1);
    const lastYear = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear(), 0, 0);

    const [currentYearRev, lastYearRev, currentYearOrders, lastYearOrders] = await Promise.all([
      safeAgg('Order', [
        { $match: { createdAt: { $gte: thisYear }, status: { $in: ['delivered','completed'] } } },
        { $group: { _id: { m: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.m': 1 } }
      ]),
      safeAgg('Order', [
        { $match: { createdAt: { $gte: lastYear, $lte: lastYearEnd }, status: { $in: ['delivered','completed'] } } },
        { $group: { _id: { m: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.m': 1 } }
      ]),
      safeCount('Order', { createdAt: { $gte: thisYear } }),
      safeCount('Order', { createdAt: { $gte: lastYear, $lte: lastYearEnd } }),
    ]);

    ok(res, {
      currentYear: now.getFullYear(), lastYear: now.getFullYear() - 1,
      revenue: { current: currentYearRev, previous: lastYearRev },
      orders:  { current: currentYearOrders, previous: lastYearOrders },
    });
  } catch (e) { serverError(res, e); }
};

exports.getMoMComparison = async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [curRev, prevRev, curOrders, prevOrders] = await Promise.all([
      safeAgg('Order', [
        { $match: { createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeAgg('Order', [
        { $match: { createdAt: { $gte: lastMonth, $lte: lastMonthEnd } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeCount('PurchaseOrder', { createdAt: { $gte: thisMonth } }),
      safeCount('PurchaseOrder', { createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),
    ]);

    const curRevVal  = curRev[0]?.revenue  || 0;
    const prevRevVal = prevRev[0]?.revenue || 0;
    const revChange  = prevRevVal > 0 ? +((curRevVal - prevRevVal) / prevRevVal * 100).toFixed(1) : 0;

    ok(res, {
      currentMonth: thisMonth.toISOString().slice(0, 7),
      previousMonth: lastMonth.toISOString().slice(0, 7),
      revenue: { current: curRevVal, previous: prevRevVal, changePct: revChange },
      orders:  { current: curRev[0]?.count || 0, previous: prevRev[0]?.count || 0 },
      procurement: { current: curOrders, previous: prevOrders },
    });
  } catch (e) { serverError(res, e); }
};

exports.getQoQComparison = async (req, res) => {
  try {
    const now = new Date();
    const currentQ = Math.floor(now.getMonth() / 3);
    const thisQStart  = new Date(now.getFullYear(), currentQ * 3, 1);
    const lastQStart  = new Date(now.getFullYear(), (currentQ - 1) * 3, 1);
    const lastQEnd    = new Date(now.getFullYear(), currentQ * 3, 0);

    const [curRev, prevRev] = await Promise.all([
      safeAgg('Order', [
        { $match: { createdAt: { $gte: thisQStart } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeAgg('Order', [
        { $match: { createdAt: { $gte: lastQStart, $lte: lastQEnd } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
    ]);

    const cur  = curRev[0]?.revenue  || 0;
    const prev = prevRev[0]?.revenue || 0;
    const pct  = prev > 0 ? +((cur - prev) / prev * 100).toFixed(1) : 0;

    ok(res, {
      currentQ:  `Q${currentQ + 1} ${now.getFullYear()}`,
      previousQ: `Q${currentQ} ${now.getFullYear()}`,
      revenue: { current: cur, previous: prev, changePct: pct },
      orders:  { current: curRev[0]?.count || 0, previous: prevRev[0]?.count || 0 },
    });
  } catch (e) { serverError(res, e); }
};

exports.getHeatmap = async (req, res) => {
  try {
    const { module = 'sales' } = req.params;
    const since = new Date(); since.setDate(since.getDate() - 90);
    let data = [];

    if (module === 'sales') {
      data = await safeAgg('Order', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, value: { $sum: '$totalAmount' } } },
        { $sort: { _id: 1 } }
      ]);
    } else if (module === 'service') {
      data = await safeAgg('ServiceRequest', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    } else if (module === 'manufacturing') {
      data = await safeAgg('ProductionOrder', [
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    }

    ok(res, { module, period: '90d', data });
  } catch (e) { serverError(res, e); }
};

exports.getForecast = async (req, res) => {
  try {
    const { metric = 'revenue', periods = 3 } = req.query;
    const since = new Date(); since.setMonth(since.getMonth() - 11); since.setDate(1);
    const historical = await safeAgg('Order', [
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, value: { $sum: '$totalAmount' } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);

    const values = historical.map(d => d.value);
    const n = values.length;
    const avgGrowth = n > 1 ? values.reduce((acc, v, i) => {
      if (i === 0) return acc;
      return acc + (v - values[i - 1]) / (values[i - 1] || 1);
    }, 0) / (n - 1) : 0;

    const lastVal  = values[n - 1] || 0;
    const lastPeriod = historical[n - 1]?._id || { y: new Date().getFullYear(), m: new Date().getMonth() + 1 };
    const forecast = [];
    let cur = lastVal;
    let { y, m } = lastPeriod;

    for (let i = 0; i < Math.min(parseInt(periods), 12); i++) {
      m++; if (m > 12) { m = 1; y++; }
      cur = cur * (1 + avgGrowth);
      forecast.push({ _id: { y, m }, value: Math.round(cur) });
    }

    ok(res, { metric, historical, forecast, avgGrowthRate: +(avgGrowth * 100).toFixed(2) });
  } catch (e) { serverError(res, e); }
};

exports.getVarianceAnalysis = async (req, res) => {
  try {
    const KPITarget = () => mongoose.model('BIKPITarget');
    const targets = await KPITarget().find({ isActive: true }).lean().catch(() => []);
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthlyTargets = targets.filter(t => t.period === period || t.periodType === 'monthly');

    const results = await Promise.all(monthlyTargets.map(async (t) => {
      const ytd = new Date(now.getFullYear(), 0, 1);
      let actual = 0;
      if (t.kpiName === 'revenue') {
        const r = await safeAgg('Order', [
          { $match: { createdAt: { $gte: ytd } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        actual = r[0]?.total || 0;
      }
      const variance = actual - t.targetValue;
      const variancePct = t.targetValue > 0 ? +((variance / t.targetValue) * 100).toFixed(1) : 0;
      return { kpiName: t.kpiName, targetValue: t.targetValue, actual, variance, variancePct, status: variance >= 0 ? 'on_track' : 'below_target' };
    }));

    ok(res, results);
  } catch (e) { serverError(res, e); }
};

exports.getBenchmarks = async (req, res) => {
  try {
    const KPITarget = () => mongoose.model('BIKPITarget');
    const targets = await KPITarget().find({ isActive: true }).lean().catch(() => []);

    const benchmarks = await Promise.all(
      targets.slice(0, 10).map(async (t) => {
        return {
          kpiName: t.kpiName, period: t.period,
          target: t.targetValue, stretch: t.stretchTarget, minimum: t.minimumTarget,
          unit: t.unit, module: t.module,
        };
      })
    );

    ok(res, benchmarks);
  } catch (e) { serverError(res, e); }
};
