const VendorBill  = require('../models/VendorBill');
const VendorAging = require('../models/VendorAging');
const { ok, created, serverError, notFound, paginated } = require('../utils/response');

// ── Calculate live aging ──────────────────────────────────────────────────────

exports.getAgingReport = async (req, res) => {
  try {
    const asOf = req.query.asOfDate ? new Date(req.query.asOfDate) : new Date();

    const bills = await VendorBill.find({
      isDeleted: false,
      status: { $in: ['approved', 'partially_paid', 'overdue'] },
      outstandingAmount: { $gt: 0 },
    }).populate('vendor', 'name').lean();

    const vendorMap = {};

    for (const bill of bills) {
      const dueDate = bill.dueDate ? new Date(bill.dueDate) : new Date(bill.billDate);
      const daysOverdue = Math.floor((asOf - dueDate) / 86400000);
      let bucket = 'current';
      if (daysOverdue > 0   && daysOverdue <= 30)  bucket = '1-30';
      else if (daysOverdue > 30  && daysOverdue <= 60)  bucket = '31-60';
      else if (daysOverdue > 60  && daysOverdue <= 90)  bucket = '61-90';
      else if (daysOverdue > 90  && daysOverdue <= 120) bucket = '91-120';
      else if (daysOverdue > 120) bucket = '120+';

      const vid = bill.vendor?._id?.toString() || bill.vendor?.toString();
      if (!vendorMap[vid]) {
        vendorMap[vid] = {
          vendor:       bill.vendor?._id || bill.vendor,
          vendorName:   bill.vendor?.name || bill.vendorName,
          aging:        { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days91_120: 0, days120Plus: 0, total: 0 },
          outstandingBills: [],
          totalOutstanding: 0,
          totalOverdue:     0,
        };
      }

      const entry = vendorMap[vid];
      const outstanding = bill.outstandingAmount;
      const bucketKey = { 'current': 'current', '1-30': 'days1_30', '31-60': 'days31_60', '61-90': 'days61_90', '91-120': 'days91_120', '120+': 'days120Plus' }[bucket];
      entry.aging[bucketKey]   += outstanding;
      entry.aging.total        += outstanding;
      entry.totalOutstanding   += outstanding;
      if (daysOverdue > 0) entry.totalOverdue += outstanding;

      entry.outstandingBills.push({
        vendorBill:  bill._id,
        billNumber:  bill.billNumber,
        billDate:    bill.billDate,
        dueDate:     bill.dueDate,
        totalAmount: bill.totalAmount,
        paidAmount:  bill.paidAmount,
        outstanding,
        daysOverdue,
        agingBucket: bucket,
      });
    }

    const vendors = Object.values(vendorMap);
    const summary = vendors.reduce((acc, v) => {
      acc.current    += v.aging.current;
      acc.days1_30   += v.aging.days1_30;
      acc.days31_60  += v.aging.days31_60;
      acc.days61_90  += v.aging.days61_90;
      acc.days91_120 += v.aging.days91_120;
      acc.days120Plus += v.aging.days120Plus;
      acc.total      += v.aging.total;
      return acc;
    }, { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days91_120: 0, days120Plus: 0, total: 0 });

    return ok(res, { asOfDate: asOf, summary, vendors });
  } catch (e) { return serverError(res, e); }
};

// ── Save aging snapshot ───────────────────────────────────────────────────────

exports.saveAgingSnapshot = async (req, res) => {
  try {
    const asOf = req.body.asOfDate ? new Date(req.body.asOfDate) : new Date();

    const bills = await VendorBill.find({
      isDeleted: false,
      status: { $in: ['approved', 'partially_paid', 'overdue'] },
      outstandingAmount: { $gt: 0 },
    }).populate('vendor', 'name').lean();

    const vendorMap = {};

    for (const bill of bills) {
      const dueDate     = bill.dueDate ? new Date(bill.dueDate) : new Date(bill.billDate);
      const daysOverdue = Math.floor((asOf - dueDate) / 86400000);
      let bucket = 'current';
      if (daysOverdue > 0   && daysOverdue <= 30)  bucket = '1-30';
      else if (daysOverdue > 30  && daysOverdue <= 60)  bucket = '31-60';
      else if (daysOverdue > 60  && daysOverdue <= 90)  bucket = '61-90';
      else if (daysOverdue > 90  && daysOverdue <= 120) bucket = '91-120';
      else if (daysOverdue > 120) bucket = '120+';

      const vid = bill.vendor?._id?.toString() || bill.vendor?.toString();
      if (!vendorMap[vid]) {
        vendorMap[vid] = {
          vendor: bill.vendor?._id || bill.vendor,
          vendorName: bill.vendor?.name || bill.vendorName,
          aging: { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days91_120: 0, days120Plus: 0, total: 0 },
          outstandingBills: [],
          totalOutstanding: 0,
          totalOverdue: 0,
        };
      }
      const entry = vendorMap[vid];
      const outstanding = bill.outstandingAmount;
      const bucketKey = { 'current': 'current', '1-30': 'days1_30', '31-60': 'days31_60', '61-90': 'days61_90', '91-120': 'days91_120', '120+': 'days120Plus' }[bucket];
      entry.aging[bucketKey] += outstanding;
      entry.aging.total      += outstanding;
      entry.totalOutstanding += outstanding;
      if (daysOverdue > 0) entry.totalOverdue += outstanding;
      entry.outstandingBills.push({ vendorBill: bill._id, billNumber: bill.billNumber, billDate: bill.billDate, dueDate: bill.dueDate, totalAmount: bill.totalAmount, paidAmount: bill.paidAmount, outstanding, daysOverdue, agingBucket: bucket });
    }

    const snapshots = await Promise.all(Object.values(vendorMap).map(v =>
      VendorAging.create({ vendor: v.vendor, vendorName: v.vendorName, asOfDate: asOf, aging: v.aging, outstandingBills: v.outstandingBills, totalOutstanding: v.totalOutstanding, totalOverdue: v.totalOverdue })
    ));

    const io = req.app.locals.io;
    if (io) io.emit('finance:aging_updated', { asOfDate: asOf, vendorCount: snapshots.length });

    return created(res, { count: snapshots.length, asOfDate: asOf }, 'Aging snapshot saved');
  } catch (e) { return serverError(res, e); }
};

// ── Get saved aging snapshots ─────────────────────────────────────────────────

exports.getAgingSnapshots = async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor } = req.query;
    const q = { isDeleted: false };
    if (vendor) q.vendor = vendor;
    const [data, total] = await Promise.all([
      VendorAging.find(q).sort({ asOfDate: -1 }).populate('vendor', 'name').skip((page - 1) * limit).limit(Number(limit)).lean(),
      VendorAging.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getAgingSnapshot = async (req, res) => {
  try {
    const doc = await VendorAging.findOne({ _id: req.params.id, isDeleted: false }).populate('vendor', 'name');
    if (!doc) return notFound(res, 'Aging Snapshot');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};
