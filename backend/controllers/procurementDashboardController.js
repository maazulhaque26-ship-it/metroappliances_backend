const Vendor              = require('../models/Vendor');
const PurchaseRequisition = require('../models/PurchaseRequisition');
const RFQ                 = require('../models/RFQ');
const PurchaseOrder       = require('../models/PurchaseOrder');
const VendorPerformance   = require('../models/VendorPerformance');
const { ok, serverError } = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const now    = new Date();
    const month0 = new Date(now.getFullYear(), now.getMonth(), 1);
    const month1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalVendors, activeVendors, pendingVendors,
      totalPRs, pendingPRs, approvedPRs,
      openRFQs, totalRFQs,
      openPOs, totalPOs, completedPOs,
      pendingApprovals,
      monthlySpend, totalSpend,
      topVendors, lateDeliveries,
    ] = await Promise.all([
      Vendor.countDocuments({ isDeleted: false }),
      Vendor.countDocuments({ status: 'active', isDeleted: false }),
      Vendor.countDocuments({ status: 'pending_approval', isDeleted: false }),
      PurchaseRequisition.countDocuments({ isDeleted: false }),
      PurchaseRequisition.countDocuments({ status: { $in: ['submitted', 'manager_review', 'finance_review'] }, isDeleted: false }),
      PurchaseRequisition.countDocuments({ status: 'approved', isDeleted: false }),
      RFQ.countDocuments({ status: { $in: ['published', 'closed'] }, isDeleted: false }),
      RFQ.countDocuments({ isDeleted: false }),
      PurchaseOrder.countDocuments({ status: { $in: ['released', 'sent', 'acknowledged', 'supplier_accepted', 'partially_delivered'] }, isDeleted: false }),
      PurchaseOrder.countDocuments({ isDeleted: false }),
      PurchaseOrder.countDocuments({ status: 'completed', isDeleted: false }),
      PurchaseOrder.countDocuments({ status: 'pending_approval', isDeleted: false }),
      PurchaseOrder.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: month0 }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { status: 'completed', isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { status: 'completed', isDeleted: false } },
        { $group: { _id: '$vendor', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
        { $unwind: '$vendor' },
        { $project: { vendorName: '$vendor.companyName', vendorCode: '$vendor.vendorCode', total: 1, count: 1 } },
      ]),
      PurchaseOrder.countDocuments({
        status: { $in: ['sent', 'acknowledged', 'supplier_accepted'] },
        expectedDeliveryDate: { $lt: now },
        isDeleted: false,
      }),
    ]);

    // Spend trend last 6 months
    const spendTrend = await PurchaseOrder.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }, isDeleted: false } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ]);

    return ok(res, {
      vendors:         { total: totalVendors, active: activeVendors, pending: pendingVendors },
      requisitions:    { total: totalPRs, pending: pendingPRs, approved: approvedPRs },
      rfqs:            { open: openRFQs, total: totalRFQs },
      purchaseOrders:  { open: openPOs, total: totalPOs, completed: completedPOs },
      pendingApprovals,
      spend:           { thisMonth: monthlySpend[0]?.total || 0, total: totalSpend[0]?.total || 0 },
      topVendors,
      lateDeliveries,
      spendTrend,
    });
  } catch (err) { return serverError(res, err); }
};

exports.getApprovalQueue = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [prs, prTotal] = await Promise.all([
      PurchaseRequisition.find({ status: { $in: ['submitted', 'manager_review', 'finance_review'] }, isDeleted: false })
        .populate('requestedBy', 'name email')
        .sort({ createdAt: 1 })
        .skip(skip).limit(Number(limit)),
      PurchaseRequisition.countDocuments({ status: { $in: ['submitted', 'manager_review', 'finance_review'] }, isDeleted: false }),
    ]);

    const [pos, poTotal] = await Promise.all([
      PurchaseOrder.find({ status: 'pending_approval', isDeleted: false })
        .populate('vendor', 'companyName').populate('createdBy', 'name')
        .sort({ createdAt: 1 })
        .skip(skip).limit(Number(limit)),
      PurchaseOrder.countDocuments({ status: 'pending_approval', isDeleted: false }),
    ]);

    return ok(res, {
      requisitions: { data: prs, total: prTotal },
      purchaseOrders: { data: pos, total: poTotal },
    });
  } catch (err) { return serverError(res, err); }
};
