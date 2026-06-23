const PurchaseOrder  = require('../models/PurchaseOrder');
const Vendor         = require('../models/Vendor');
const VendorRating   = require('../models/VendorRating');
const { ok, serverError } = require('../utils/response');

exports.getSpendReport = async (req, res) => {
  try {
    const { from, to, vendor } = req.query;
    const match = { status: 'completed', isDeleted: false };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to)   match.createdAt.$lte = new Date(to);
    }
    if (vendor) match.vendor = require('mongoose').Types.ObjectId(vendor);

    const [byVendor, byMonth, summary] = await Promise.all([
      PurchaseOrder.aggregate([
        { $match: match },
        { $group: { _id: '$vendor', vendorName: { $first: '$vendorName' }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 20 },
      ]),
      PurchaseOrder.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      PurchaseOrder.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 }, avg: { $avg: '$totalAmount' } } },
      ]),
    ]);

    return ok(res, { byVendor, byMonth, summary: summary[0] || { total: 0, count: 0, avg: 0 } });
  } catch (err) { return serverError(res, err); }
};

exports.getVendorPerformanceReport = async (req, res) => {
  try {
    const vendors = await Vendor.find({ isDeleted: false, status: 'active' })
      .select('companyName vendorCode overallRating onTimeDeliveryRate qualityScore totalOrders totalSpend averageLeadTime')
      .sort({ overallRating: -1 })
      .limit(50);
    return ok(res, vendors);
  } catch (err) { return serverError(res, err); }
};

exports.getOpenOrdersReport = async (req, res) => {
  try {
    const openStatuses = ['released', 'sent', 'acknowledged', 'supplier_accepted', 'partially_delivered'];
    const orders = await PurchaseOrder.find({ status: { $in: openStatuses }, isDeleted: false })
      .populate('vendor', 'companyName vendorCode')
      .sort({ expectedDeliveryDate: 1 });

    const now = new Date();
    const data = orders.map(o => ({
      _id:              o._id,
      poNumber:         o.poNumber,
      vendor:           o.vendor,
      vendorName:       o.vendorName,
      totalAmount:      o.totalAmount,
      status:           o.status,
      expectedDelivery: o.expectedDeliveryDate,
      isLate:           o.expectedDeliveryDate && o.expectedDeliveryDate < now,
      daysLate:         o.expectedDeliveryDate ? Math.max(0, Math.ceil((now - o.expectedDeliveryDate) / 86400000)) : 0,
      createdAt:        o.createdAt,
    }));

    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.getDeliveryDelaysReport = async (req, res) => {
  try {
    const now = new Date();
    const delayed = await PurchaseOrder.find({
      expectedDeliveryDate: { $lt: now },
      status: { $in: ['sent', 'acknowledged', 'supplier_accepted', 'partially_delivered'] },
      isDeleted: false,
    })
    .populate('vendor', 'companyName vendorCode email')
    .sort({ expectedDeliveryDate: 1 });

    const data = delayed.map(o => ({
      _id:      o._id,
      poNumber: o.poNumber,
      vendor:   o.vendor,
      status:   o.status,
      expected: o.expectedDeliveryDate,
      daysLate: Math.ceil((now - o.expectedDeliveryDate) / 86400000),
    }));
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.getSupplierRatingsReport = async (req, res) => {
  try {
    const ratings = await VendorRating.aggregate([
      { $match: { isDeleted: false } },
      { $group: {
        _id: '$vendor',
        avgDelivery:       { $avg: '$deliveryRating' },
        avgQuality:        { $avg: '$qualityRating' },
        avgCommunication:  { $avg: '$communicationRating' },
        avgPricing:        { $avg: '$pricingRating' },
        avgOverall:        { $avg: '$overallRating' },
        count:             { $sum: 1 },
      }},
      { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
      { $unwind: '$vendor' },
      { $project: {
        vendorName: '$vendor.companyName',
        vendorCode: '$vendor.vendorCode',
        avgDelivery: { $round: ['$avgDelivery', 1] },
        avgQuality:  { $round: ['$avgQuality', 1] },
        avgCommunication: { $round: ['$avgCommunication', 1] },
        avgPricing:  { $round: ['$avgPricing', 1] },
        avgOverall:  { $round: ['$avgOverall', 1] },
        count: 1,
      }},
      { $sort: { avgOverall: -1 } },
    ]);
    return ok(res, ratings);
  } catch (err) { return serverError(res, err); }
};
