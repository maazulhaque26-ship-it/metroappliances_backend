const Dispatch      = require('../models/Dispatch');
const Shipment      = require('../models/Shipment');
const StockTransfer = require('../models/StockTransfer');
const PickingList   = require('../models/PickingList');
const { respOk, respErr } = require('../utils/logisticsHelpers');

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      pendingDispatches, todayDispatches, inTransit, deliveredToday,
      deliveredMonth, failed, returns,
      pendingTransfers, avgDelivery,
      recentDispatches, recentShipments,
      courierBreakdown,
    ] = await Promise.all([
      Dispatch.countDocuments({ status: { $in: ['pending','assigned','picking','picked','packing','packed','ready'] }, isDeleted: false }),
      Dispatch.countDocuments({ status: 'dispatched', isDeleted: false, dispatchedAt: { $gte: today, $lt: tomorrow } }),
      Shipment.countDocuments({ status: { $in: ['dispatched','in_transit','out_for_delivery'] }, isDeleted: false }),
      Shipment.countDocuments({ status: 'delivered', isDeleted: false, deliveredAt: { $gte: today, $lt: tomorrow } }),
      Shipment.countDocuments({ status: 'delivered', isDeleted: false, deliveredAt: { $gte: monthStart } }),
      Shipment.countDocuments({ status: 'failed', isDeleted: false }),
      Shipment.countDocuments({ status: 'returned', isDeleted: false }),
      StockTransfer.countDocuments({ status: { $in: ['submitted','approved'] }, isDeleted: false }),
      Shipment.aggregate([
        { $match: { status: 'delivered', deliveredAt: { $exists: true }, createdAt: { $gte: monthStart }, isDeleted: false } },
        { $project: { days: { $divide: [{ $subtract: ['$deliveredAt', '$createdAt'] }, 86400000] } } },
        { $group: { _id: null, avg: { $avg: '$days' } } },
      ]),
      Dispatch.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).lean(),
      Shipment.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).populate('courier').lean(),
      Shipment.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: monthStart } } },
        { $group: { _id: '$courierName', total: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
      ]),
    ]);

    respOk(res, {
      kpis: {
        pendingDispatches, todayDispatches, inTransit,
        deliveredToday, deliveredMonth, failed, returns,
        pendingTransfers,
        avgDeliveryDays: avgDelivery[0]?.avg ? +avgDelivery[0].avg.toFixed(1) : 0,
      },
      recentDispatches,
      recentShipments,
      courierBreakdown,
    });
  } catch (err) { respErr(res, err.message, 500); }
};

exports.getLogisticsReports = async (req, res) => {
  try {
    const { from, to, warehouse } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const end   = to   ? new Date(to)   : new Date();
    end.setHours(23, 59, 59, 999);

    const matchBase = { isDeleted: false, createdAt: { $gte: start, $lte: end } };
    if (warehouse) matchBase.warehouse = require('mongoose').Types.ObjectId(warehouse);

    const [dispatchByStatus, shipmentByCourier, dailyDispatches, transferStats] = await Promise.all([
      Dispatch.aggregate([
        { $match: matchBase },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Shipment.aggregate([
        { $match: { ...matchBase } },
        { $group: { _id: '$courierName', total: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } } } },
        { $sort: { total: -1 } },
      ]),
      Dispatch.aggregate([
        { $match: matchBase },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } } } },
        { $sort: { _id: 1 } },
      ]),
      StockTransfer.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    respOk(res, { dispatchByStatus, shipmentByCourier, dailyDispatches, transferStats, dateRange: { from: start, to: end } });
  } catch (err) { respErr(res, err.message, 500); }
};
