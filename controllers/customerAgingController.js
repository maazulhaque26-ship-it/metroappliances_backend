const CustomerInvoice = require('../models/CustomerInvoice');
const CustomerAging   = require('../models/CustomerAging');
const { ok, created, serverError, notFound, paginated } = require('../utils/response');

const BUCKET_MAP = {
  'current': 'current', '1-30': 'days1_30', '31-60': 'days31_60',
  '61-90': 'days61_90', '91-120': 'days91_120', '180+': 'days180Plus',
};

function getBucket(daysOverdue) {
  if (daysOverdue <= 0)   return 'current';
  if (daysOverdue <= 30)  return '1-30';
  if (daysOverdue <= 60)  return '31-60';
  if (daysOverdue <= 90)  return '61-90';
  if (daysOverdue <= 120) return '91-120';
  return '180+';
}

async function buildAgingMap(asOf) {
  const invoices = await CustomerInvoice.find({
    isDeleted: false,
    status: { $in: ['approved', 'partially_paid', 'overdue'] },
    outstandingAmount: { $gt: 0 },
  }).populate('customer', 'name').lean();

  const customerMap = {};

  for (const inv of invoices) {
    const dueDate    = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
    const daysOverdue = Math.floor((asOf - dueDate) / 86400000);
    const bucket     = getBucket(daysOverdue);
    const cid        = inv.customer?._id?.toString() || inv.customer?.toString();

    if (!customerMap[cid]) {
      customerMap[cid] = {
        customer:    inv.customer?._id || inv.customer,
        customerName: inv.customer?.name || inv.customerName,
        aging: { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days91_120: 0, days180Plus: 0, total: 0 },
        outstandingInvoices: [],
        totalOutstanding: 0,
        totalOverdue: 0,
      };
    }

    const entry = customerMap[cid];
    const outstanding = inv.outstandingAmount;
    entry.aging[BUCKET_MAP[bucket]] += outstanding;
    entry.aging.total               += outstanding;
    entry.totalOutstanding          += outstanding;
    if (daysOverdue > 0) entry.totalOverdue += outstanding;

    entry.outstandingInvoices.push({
      customerInvoice: inv._id,
      invoiceNumber:   inv.invoiceNumber,
      invoiceDate:     inv.invoiceDate,
      dueDate:         inv.dueDate,
      totalAmount:     inv.totalAmount,
      paidAmount:      inv.paidAmount,
      outstanding,
      daysOverdue,
      agingBucket:     bucket,
    });
  }
  return customerMap;
}

// ── Live aging report ─────────────────────────────────────────────────────────

exports.getAgingReport = async (req, res) => {
  try {
    const asOf = req.query.asOfDate ? new Date(req.query.asOfDate) : new Date();
    const customerMap = await buildAgingMap(asOf);
    const customers = Object.values(customerMap);

    const summary = customers.reduce((acc, c) => {
      acc.current     += c.aging.current;
      acc.days1_30    += c.aging.days1_30;
      acc.days31_60   += c.aging.days31_60;
      acc.days61_90   += c.aging.days61_90;
      acc.days91_120  += c.aging.days91_120;
      acc.days180Plus += c.aging.days180Plus;
      acc.total       += c.aging.total;
      return acc;
    }, { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days91_120: 0, days180Plus: 0, total: 0 });

    return ok(res, { asOfDate: asOf, summary, customers });
  } catch (e) { return serverError(res, e); }
};

// ── Save aging snapshot ───────────────────────────────────────────────────────

exports.saveAgingSnapshot = async (req, res) => {
  try {
    const asOf = req.body.asOfDate ? new Date(req.body.asOfDate) : new Date();
    const customerMap = await buildAgingMap(asOf);

    const snapshots = await Promise.all(Object.values(customerMap).map(c =>
      CustomerAging.create({
        customer: c.customer, customerName: c.customerName, asOfDate: asOf,
        aging: c.aging, outstandingInvoices: c.outstandingInvoices,
        totalOutstanding: c.totalOutstanding, totalOverdue: c.totalOverdue,
      })
    ));

    const io = req.app.locals.io;
    if (io) io.emit('finance:aging_updated', { asOfDate: asOf, customerCount: snapshots.length, module: 'AR' });

    return created(res, { count: snapshots.length, asOfDate: asOf }, 'AR aging snapshot saved');
  } catch (e) { return serverError(res, e); }
};

// ── Get saved snapshots ───────────────────────────────────────────────────────

exports.getAgingSnapshots = async (req, res) => {
  try {
    const { page = 1, limit = 20, customer } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    const [data, total] = await Promise.all([
      CustomerAging.find(q).sort({ asOfDate: -1 }).populate('customer', 'name').skip((page - 1) * limit).limit(Number(limit)).lean(),
      CustomerAging.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getAgingSnapshot = async (req, res) => {
  try {
    const doc = await CustomerAging.findOne({ _id: req.params.id, isDeleted: false }).populate('customer', 'name');
    if (!doc) return notFound(res, 'Aging Snapshot');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};
