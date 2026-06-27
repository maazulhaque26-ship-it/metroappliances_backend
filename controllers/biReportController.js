const mongoose = require('mongoose');
const { ok, created, notFound, serverError } = require('../utils/response');
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

const BIReport = () => mongoose.model('BIReport');
const ytdStart = () => new Date(new Date().getFullYear(), 0, 1);
const mtdStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);

exports.getBoardPack = async (req, res) => {
  try {
    const ytd = ytdStart();
    const mtd = mtdStart();

    const [
      revYTD, revMTD, ordersPending, headcount, activeProjects,
      openService, productionByStatus, poValue, inventoryValue,
      assetCount, workflowActive, documentCount,
      customerInvoiceStats, vendorInvoiceStats, leadStats
    ] = await Promise.all([
      safeAgg('Order', [
        { $match: { createdAt: { $gte: ytd }, status: { $in: ['delivered','completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeAgg('Order', [
        { $match: { createdAt: { $gte: mtd }, status: { $in: ['delivered','completed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeCount('Order', { status: { $in: ['pending','confirmed','processing'] } }),
      safeCount('Employee', { isActive: true }),
      safeCount('Project', { status: { $in: ['active','in_progress'] } }),
      safeCount('ServiceRequest', { status: { $in: ['open','in_progress'] } }),
      safeAgg('ProductionOrder', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      safeAgg('PurchaseOrder', [
        { $match: { createdAt: { $gte: ytd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeAgg('Inventory', [{ $group: { _id: null, value: { $sum: { $multiply: ['$quantity', { $ifNull: ['$unitCost', 0] }] } } } }]),
      safeCount('Asset', { status: 'active' }),
      safeCount('WorkflowInstance', { status: 'active' }),
      safeCount('Document', { isDeleted: false }),
      safeAgg('CustomerInvoice', [{ $group: { _id: '$status', total: { $sum: '$totalAmount' } } }]),
      safeAgg('VendorInvoice',   [{ $group: { _id: '$status', total: { $sum: '$totalAmount' } } }]),
      safeAgg('Lead',            [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const reportData = {
      generatedAt: new Date(),
      period: { ytd: ytd.toISOString().slice(0, 10), mtd: mtd.toISOString().slice(0, 10) },
      executive: {
        revenue: { ytd: revYTD[0]?.total || 0, mtd: revMTD[0]?.total || 0, ytdOrders: revYTD[0]?.count || 0 },
        headcount,
        activeProjects,
        pendingOrders: ordersPending,
        openServiceTickets: openService,
      },
      finance: { ar: customerInvoiceStats, ap: vendorInvoiceStats },
      operations: { production: productionByStatus, procurement: poValue[0] || { total: 0, count: 0 } },
      assets: { count: assetCount, inventoryValue: inventoryValue[0]?.value || 0 },
      platform: { activeWorkflows: workflowActive, documents: documentCount },
      crm: { leads: leadStats },
    };

    emit(req.app.locals.io, 'bi:report_ready', { type: 'board_pack' });
    ok(res, reportData);
  } catch (e) { serverError(res, e); }
};

exports.getManagementSummary = async (req, res) => {
  try {
    const mtd = mtdStart();
    const [revMTD, ordersPending, headcount, openService, productionByStatus] = await Promise.all([
      safeAgg('Order', [
        { $match: { createdAt: { $gte: mtd } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      safeCount('Order', { status: { $in: ['pending','confirmed'] } }),
      safeCount('Employee', { isActive: true }),
      safeCount('ServiceRequest', { status: { $in: ['open','in_progress'] } }),
      safeAgg('ProductionOrder', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    ok(res, {
      generatedAt: new Date(),
      revenue:    revMTD[0] || { total: 0, count: 0 },
      operations: { pendingOrders: ordersPending, openService, production: productionByStatus },
      hr:         { headcount },
    });
  } catch (e) { serverError(res, e); }
};

exports.getDepartmentScorecard = async (req, res) => {
  try {
    const { dept } = req.params;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let scorecard = { department: dept, generatedAt: new Date() };

    if (dept === 'hr' || dept === 'human_resources') {
      const [headcount, pendingLeave, attendance, openPositions] = await Promise.all([
        safeCount('Employee', { isActive: true }),
        safeCount('LeaveRequest', { status: 'pending' }),
        safeAgg('Attendance', [
          { $match: { date: { $gte: monthStart } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        safeCount('JobOpening', { status: 'open' }),
      ]);
      scorecard.kpis = { headcount, pendingLeave, attendance, openPositions };
    } else if (dept === 'finance') {
      const [arStats, apStats, overdueAR] = await Promise.all([
        safeAgg('CustomerInvoice', [{ $group: { _id: '$status', total: { $sum: '$totalAmount' } } }]),
        safeAgg('VendorInvoice',   [{ $group: { _id: '$status', total: { $sum: '$totalAmount' } } }]),
        safeCount('CustomerInvoice', { status: 'overdue' }),
      ]);
      scorecard.kpis = { ar: arStats, ap: apStats, overdueAR };
    } else if (dept === 'operations') {
      const [poOpen, grnPending, shipmentsPending, lowStock] = await Promise.all([
        safeCount('PurchaseOrder', { status: { $nin: ['completed','cancelled'] } }),
        safeCount('GRN', { status: 'pending' }),
        safeCount('Shipment', { status: 'pending' }),
        safeCount('Inventory', { quantity: { $lte: 5 } }),
      ]);
      scorecard.kpis = { openPOs: poOpen, pendingGRN: grnPending, pendingShipments: shipmentsPending, lowStock };
    } else if (dept === 'manufacturing') {
      const [prodByStatus, openMaintenance, pendingInspections] = await Promise.all([
        safeAgg('ProductionOrder', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        safeCount('MaintenanceWorkOrder', { status: { $in: ['open','in_progress'] } }),
        safeCount('InspectionLot', { status: 'pending' }),
      ]);
      scorecard.kpis = { production: prodByStatus, openMaintenance, pendingInspections };
    } else if (dept === 'sales') {
      const [revMTD, leadsByStatus, agentCount] = await Promise.all([
        safeAgg('Order', [
          { $match: { createdAt: { $gte: monthStart } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
        ]),
        safeAgg('Lead', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        safeCount('SalesAgent', { isActive: true }),
      ]);
      scorecard.kpis = { revenue: revMTD[0] || { revenue: 0, count: 0 }, leads: leadsByStatus, activeAgents: agentCount };
    } else {
      scorecard.kpis = { message: `No scorecard configured for department: ${dept}` };
    }

    ok(res, scorecard);
  } catch (e) { serverError(res, e); }
};

// ── Report Config CRUD ────────────────────────────────────────────────────────
exports.listReports = async (req, res) => {
  try {
    const reports = await BIReport().find({ isActive: true }).sort({ createdAt: -1 }).lean();
    ok(res, reports);
  } catch (e) { serverError(res, e); }
};

exports.createReport = async (req, res) => {
  try {
    const r = await BIReport().create({ ...req.body, owner: req.user?._id });
    created(res, r);
  } catch (e) { serverError(res, e); }
};

exports.getReport = async (req, res) => {
  try {
    const r = await BIReport().findById(req.params.id).lean();
    if (!r) return notFound(res, 'Report not found');
    ok(res, r);
  } catch (e) { serverError(res, e); }
};

exports.updateReport = async (req, res) => {
  try {
    const r = await BIReport().findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!r) return notFound(res, 'Report not found');
    ok(res, r);
  } catch (e) { serverError(res, e); }
};

exports.deleteReport = async (req, res) => {
  try {
    await BIReport().findByIdAndUpdate(req.params.id, { isActive: false });
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};

exports.generateReport = async (req, res) => {
  try {
    const r = await BIReport().findById(req.params.id).lean();
    if (!r) return notFound(res, 'Report not found');
    await BIReport().findByIdAndUpdate(req.params.id, { lastGenerated: new Date(), $inc: { generatedCount: 1 } });
    emit(req.app.locals.io, 'bi:report_ready', { reportId: req.params.id, name: r.name });
    ok(res, { reportId: req.params.id, generatedAt: new Date(), config: r });
  } catch (e) { serverError(res, e); }
};

exports.exportBoardPack = async (req, res) => {
  try {
    const { format = 'json' } = req.params;
    const [revYTD, headcount, activeProjects, productionByStatus] = await Promise.all([
      safeAgg('Order', [
        { $match: { createdAt: { $gte: ytdStart() } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      safeCount('Employee', { isActive: true }),
      safeCount('Project', { status: { $in: ['active','in_progress'] } }),
      safeAgg('ProductionOrder', [{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const exportData = {
      title: 'Board Pack Report',
      generatedAt: new Date(),
      summary: { revenueYTD: revYTD[0]?.total || 0, headcount, activeProjects, production: productionByStatus },
    };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="board-pack.csv"');
      return res.send(`Metric,Value\nRevenue YTD,${exportData.summary.revenueYTD}\nHeadcount,${exportData.summary.headcount}\nActive Projects,${exportData.summary.activeProjects}`);
    }
    if (format === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename="board-pack.json"');
    }
    ok(res, exportData);
  } catch (e) { serverError(res, e); }
};
