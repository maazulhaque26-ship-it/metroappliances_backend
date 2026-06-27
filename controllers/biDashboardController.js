const mongoose = require('mongoose');
const { ok, serverError } = require('../utils/response');
const { emit } = require('../utils/socket');

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

const periodStart = (type) => {
  const n = new Date();
  if (type === 'mtd') return new Date(n.getFullYear(), n.getMonth(), 1);
  if (type === 'ytd') return new Date(n.getFullYear(), 0, 1);
  if (type === 'qtd') return new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1);
  return new Date(n.getFullYear(), 0, 1);
};

exports.getCEODashboard = async (req, res) => {
  try {
    const mtd = periodStart('mtd');
    const ytd = periodStart('ytd');
    const twelveMonthsAgo = new Date(); twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11); twelveMonthsAgo.setDate(1);

    const [
      mtdRevenue, ytdRevenue, pendingOrders,
      headcount, activeProjects, openService,
      revenueTrend, deptHeadcount, portfolioSummary,
      dealerRevenue
    ] = await Promise.all([
      safeAgg('Order', [
        { $match: { status: { $in: ['delivered','completed','processing'] }, createdAt: { $gte: mtd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeAgg('Order', [
        { $match: { status: { $in: ['delivered','completed','processing'] }, createdAt: { $gte: ytd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeCount('Order', { status: { $in: ['pending','confirmed','processing'] } }),
      safeCount('Employee', { isActive: true }),
      safeCount('Project', { status: { $in: ['active','in_progress','planning'] } }),
      safeCount('ServiceRequest', { status: { $in: ['open','assigned','in_progress'] } }),
      safeAgg('Order', [
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]),
      safeAgg('Employee', [
        { $match: { isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 }
      ]),
      safeAgg('Portfolio', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('DealerOrder', [
        { $match: { createdAt: { $gte: mtd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
    ]);

    emit(req.app.locals.io, 'bi:dashboard_refreshed', { type: 'ceo' });

    ok(res, {
      revenue: {
        mtd: mtdRevenue[0]?.total || 0, mtdOrders: mtdRevenue[0]?.count || 0,
        ytd: ytdRevenue[0]?.total || 0, ytdOrders: ytdRevenue[0]?.count || 0,
        dealer: dealerRevenue[0]?.total || 0,
      },
      operations: { pendingOrders, activeProjects, openService },
      hr: { headcount, byDept: deptHeadcount },
      portfolio: portfolioSummary,
      revenueTrend,
    });
  } catch (e) { serverError(res, e); }
};

exports.getCOODashboard = async (req, res) => {
  try {
    const [
      productionByStatus, workOrderByStatus, pendingGRN,
      pendingShipments, serviceByStatus, openMaintenance,
      pendingInspections, inventoryLow, stockTransfers
    ] = await Promise.all([
      safeAgg('ProductionOrder', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('WorkOrder',       [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeCount('GRN',           { status: 'pending' }),
      safeCount('Shipment',      { status: { $in: ['pending','processing'] } }),
      safeAgg('ServiceRequest',  [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeCount('MaintenanceWorkOrder', { status: { $in: ['open','in_progress'] } }),
      safeCount('InspectionLot', { status: 'pending' }),
      safeCount('Inventory',     { quantity: { $lte: 5 } }),
      safeCount('StockTransfer', { status: 'pending' }),
    ]);

    ok(res, {
      production:  productionByStatus,
      workOrders:  workOrderByStatus,
      warehouse:   { pendingGRN, lowStock: inventoryLow },
      logistics:   { pendingShipments, stockTransfers },
      service:     serviceByStatus,
      maintenance: { open: openMaintenance },
      quality:     { pendingInspections },
    });
  } catch (e) { serverError(res, e); }
};

exports.getCFODashboard = async (req, res) => {
  try {
    const ytd = periodStart('ytd');
    const [
      salesRevenue, arByStatus, apByStatus,
      journalSummary, glSummary, overdueAR
    ] = await Promise.all([
      safeAgg('Order', [
        { $match: { createdAt: { $gte: ytd } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeAgg('CustomerInvoice', [{ $group: { _id: '$status', total: { $sum: '$totalAmount' }, outstanding: { $sum: '$outstandingAmount' } } }]),
      safeAgg('VendorInvoice',   [{ $group: { _id: '$status', total: { $sum: '$totalAmount' }, outstanding: { $sum: '$outstandingAmount' } } }]),
      safeAgg('JournalEntry', [
        { $match: { status: 'posted', entryDate: { $gte: ytd } } },
        { $unwind: '$lines' },
        { $group: { _id: '$lines.accountType', debit: { $sum: '$lines.debit' }, credit: { $sum: '$lines.credit' } } }
      ]),
      safeAgg('GeneralLedger', [
        { $group: { _id: '$accountType', balance: { $sum: '$balance' } } }
      ]),
      safeAgg('CustomerInvoice', [
        { $match: { status: { $in: ['overdue','partially_paid'] } } },
        { $group: { _id: null, total: { $sum: '$outstandingAmount' }, count: { $sum: 1 } } }
      ]),
    ]);

    ok(res, {
      salesRevenue:  salesRevenue[0] || { revenue: 0, count: 0 },
      ar:            arByStatus,
      ap:            apByStatus,
      journal:       journalSummary,
      generalLedger: glSummary,
      overdueAR:     overdueAR[0] || { total: 0, count: 0 },
    });
  } catch (e) { serverError(res, e); }
};

exports.getCHRODashboard = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [
      activeCount, totalCount, byDept, byType,
      attendance, pendingLeave, openPositions, payrollRuns
    ] = await Promise.all([
      safeCount('Employee', { isActive: true }),
      safeCount('Employee', {}),
      safeAgg('Employee', [
        { $match: { isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      safeAgg('Employee', [{ $group: { _id: '$employmentType', count: { $sum: 1 } } }]),
      safeAgg('Attendance', [
        { $match: { date: { $gte: monthStart } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      safeCount('LeaveRequest', { status: 'pending' }),
      safeCount('JobOpening',   { status: 'open' }),
      safeAgg('PayrollRun', [
        { $match: { status: 'completed' } },
        { $sort: { createdAt: -1 } }, { $limit: 3 },
        { $group: { _id: null, totalCost: { $sum: '$totalNetPay' }, employees: { $sum: '$employeeCount' } } }
      ]),
    ]);

    ok(res, {
      headcount:  { active: activeCount, total: totalCount, inactive: totalCount - activeCount, byDept, byType },
      attendance:  attendance,
      leave:      { pending: pendingLeave },
      recruitment: { openPositions },
      payroll:    payrollRuns[0] || { totalCost: 0, employees: 0 },
    });
  } catch (e) { serverError(res, e); }
};

exports.getOperationsDashboard = async (req, res) => {
  try {
    const [
      ordersByStatus, grnPending, shipmentsByStatus,
      inventoryLow, transfersPending, poOpen, installationsPending
    ] = await Promise.all([
      safeAgg('Order',        [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeCount('GRN',        { status: 'pending' }),
      safeAgg('Shipment',     [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeCount('Inventory',  { quantity: { $lte: 5 } }),
      safeCount('StockTransfer', { status: 'pending' }),
      safeCount('PurchaseOrder', { status: { $nin: ['completed','cancelled'] } }),
      safeCount('InstallationRequest', { status: { $in: ['pending','scheduled'] } }),
    ]);

    ok(res, {
      orders:       ordersByStatus,
      warehouse:    { pendingGRN: grnPending, lowStock: inventoryLow },
      logistics:    { shipments: shipmentsByStatus, transfers: transfersPending },
      procurement:  { openPOs: poOpen },
      installation: { pending: installationsPending },
    });
  } catch (e) { serverError(res, e); }
};

exports.getManufacturingDashboard = async (req, res) => {
  try {
    const [
      productionByStatus, workOrderByStatus, qualityLots,
      topDowntime, machineStatus, prodTrend
    ] = await Promise.all([
      safeAgg('ProductionOrder', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('WorkOrder',       [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('InspectionLot',   [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('MachineDowntime', [
        { $group: { _id: '$reason', totalMinutes: { $sum: '$durationMinutes' }, count: { $sum: 1 } } },
        { $sort: { totalMinutes: -1 } }, { $limit: 5 }
      ]),
      safeAgg('Machine', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('ProductionOrder', [
        { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)) } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]),
    ]);

    ok(res, {
      production:  productionByStatus,
      workOrders:  workOrderByStatus,
      quality:     qualityLots,
      downtime:    topDowntime,
      machines:    machineStatus,
      trend:       prodTrend,
    });
  } catch (e) { serverError(res, e); }
};

exports.getSupplyChainDashboard = async (req, res) => {
  try {
    const [
      poByStatus, vendorCount, grnByStatus,
      shipmentByStatus, inventoryValue, overdueDeliveries
    ] = await Promise.all([
      safeAgg('PurchaseOrder', [{ $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$totalAmount' } } }]),
      safeCount('Vendor',      { isActive: true }),
      safeAgg('GRN',           [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('Shipment',      [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('Inventory', [
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$unitCost', 0] }] } }, totalQty: { $sum: '$quantity' } } }
      ]),
      safeCount('PurchaseOrder', {
        status: { $nin: ['completed','cancelled'] },
        expectedDeliveryDate: { $lt: new Date() }
      }),
    ]);

    ok(res, {
      purchaseOrders:     poByStatus,
      vendors:            { active: vendorCount },
      grn:                grnByStatus,
      shipments:          shipmentByStatus,
      inventory:          inventoryValue[0] || { totalValue: 0, totalQty: 0 },
      overdueDeliveries,
    });
  } catch (e) { serverError(res, e); }
};

exports.getSalesExecutiveDashboard = async (req, res) => {
  try {
    const mtd = periodStart('mtd');
    const [
      mtdSales, dealerSales, leadsByStatus,
      agentsByStatus, salesTrend, topRegions
    ] = await Promise.all([
      safeAgg('Order', [
        { $match: { createdAt: { $gte: mtd } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeAgg('DealerOrder', [
        { $match: { createdAt: { $gte: mtd } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeAgg('Lead',        [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('SalesAgent',  [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('Order', [
        { $match: { createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)) } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]),
      safeAgg('Order', [
        { $match: { createdAt: { $gte: mtd } } },
        { $group: { _id: '$shippingAddress.city', revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { revenue: -1 } }, { $limit: 5 }
      ]),
    ]);

    ok(res, {
      mtdSales:    mtdSales[0] || { revenue: 0, count: 0 },
      dealerSales: dealerSales[0] || { revenue: 0, count: 0 },
      leads:       leadsByStatus,
      agents:      agentsByStatus,
      salesTrend,
      topRegions,
    });
  } catch (e) { serverError(res, e); }
};

exports.getCustomerDashboard = async (req, res) => {
  try {
    const [
      ordersByStatus, serviceByStatus, installationsByStatus,
      reviewStats, warrantyActive, productRegistrations
    ] = await Promise.all([
      safeAgg('Order',               [{ $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$totalAmount' } } }]),
      safeAgg('ServiceRequest',      [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('InstallationRequest', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('Review', [
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]),
      safeCount('ProductRegistration', { warrantyActive: true }),
      safeCount('ProductRegistration', {}),
    ]);

    ok(res, {
      orders:        ordersByStatus,
      service:       serviceByStatus,
      installations: installationsByStatus,
      reviews:       reviewStats[0] || { avgRating: 0, count: 0 },
      warranty:      { active: warrantyActive, total: productRegistrations },
    });
  } catch (e) { serverError(res, e); }
};

exports.getProjectsDashboard = async (req, res) => {
  try {
    const [
      projectsByStatus, tasksByStatus, portfolioByStatus,
      budgetSummary, milestonesByStatus, resourceSummary
    ] = await Promise.all([
      safeAgg('Project',      [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('ProjectTask',  [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('Portfolio',    [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('ProjectBudget', [
        { $group: { _id: null, budgeted: { $sum: '$budgetedAmount' }, actual: { $sum: '$actualAmount' } } }
      ]),
      safeAgg('Milestone', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('Project', [
        { $group: { _id: null, totalBudget: { $sum: '$budget' }, totalActual: { $sum: '$actualCost' }, count: { $sum: 1 } } }
      ]),
    ]);

    ok(res, {
      projects:   projectsByStatus,
      tasks:      tasksByStatus,
      portfolio:  portfolioByStatus,
      budget:     budgetSummary[0] || { budgeted: 0, actual: 0 },
      milestones: milestonesByStatus,
      resources:  resourceSummary[0] || { totalBudget: 0, totalActual: 0, count: 0 },
    });
  } catch (e) { serverError(res, e); }
};

exports.getEnterpriseHealthDashboard = async (req, res) => {
  try {
    const [
      orders, employees, documents, workflows, services,
      projects, purchaseOrders, productionOrders, assets, alerts
    ] = await Promise.all([
      safeCount('Order', {}),
      safeCount('Employee', { isActive: true }),
      safeCount('Document', { isDeleted: false }),
      safeCount('WorkflowInstance', { status: 'active' }),
      safeCount('ServiceRequest', { status: { $in: ['open','in_progress'] } }),
      safeCount('Project', { status: { $in: ['active','in_progress'] } }),
      safeCount('PurchaseOrder', { status: { $nin: ['completed','cancelled'] } }),
      safeCount('ProductionOrder', { status: { $nin: ['completed','cancelled'] } }),
      safeCount('Asset', { status: 'active' }),
      safeCount('BIAlert', { isActive: true }),
    ]);

    const modules = [
      { name: 'Orders',              count: orders,         icon: 'cart',       health: 'healthy' },
      { name: 'Active Employees',    count: employees,      icon: 'users',      health: 'healthy' },
      { name: 'Documents (DMS)',     count: documents,      icon: 'file',       health: 'healthy' },
      { name: 'Active Workflows',    count: workflows,      icon: 'flow',       health: workflows > 0 ? 'active' : 'idle' },
      { name: 'Open Service Tickets',count: services,       icon: 'headset',    health: services > 100 ? 'attention' : 'healthy' },
      { name: 'Active Projects',     count: projects,       icon: 'briefcase',  health: 'healthy' },
      { name: 'Open POs',            count: purchaseOrders, icon: 'truck',      health: 'healthy' },
      { name: 'Active Production',   count: productionOrders,icon: 'factory',   health: 'healthy' },
      { name: 'Active Assets',       count: assets,         icon: 'server',     health: 'healthy' },
      { name: 'BI Alert Rules',      count: alerts,         icon: 'bell',       health: 'healthy' },
    ];

    const healthy   = modules.filter(m => m.health === 'healthy').length;
    const attention = modules.filter(m => m.health === 'attention').length;

    emit(req.app.locals.io, 'bi:dashboard_refreshed', { type: 'enterprise_health' });

    ok(res, { modules, summary: { total: modules.length, healthy, attention, active: modules.filter(m => m.health === 'active').length } });
  } catch (e) { serverError(res, e); }
};
