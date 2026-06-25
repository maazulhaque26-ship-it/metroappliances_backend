const InvoiceMatch   = require('../models/InvoiceMatch');
const VendorBill     = require('../models/VendorBill');
const VendorInvoice  = require('../models/VendorInvoice');
const AuditLog       = require('../models/AuditLog');
const { paginated, created, ok, notFound, serverError, noContent, fail } = require('../utils/response');

// ── List & Get ────────────────────────────────────────────────────────────────

exports.getMatches = async (req, res) => {
  try {
    const { page = 1, limit = 20, matchStatus, vendor } = req.query;
    const q = { isDeleted: false };
    if (matchStatus) q.matchStatus = matchStatus;
    if (vendor)      q.vendor      = vendor;
    const [data, total] = await Promise.all([
      InvoiceMatch.find(q).sort({ createdAt: -1 })
        .populate('vendor', 'name')
        .populate('vendorBill', 'billNumber totalAmount')
        .populate('purchaseOrder', 'poNumber')
        .populate('grn', 'grnNumber')
        .skip((page - 1) * limit).limit(Number(limit)).lean(),
      InvoiceMatch.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getMatch = async (req, res) => {
  try {
    const doc = await InvoiceMatch.findOne({ _id: req.params.id, isDeleted: false })
      .populate('vendor', 'name email')
      .populate('vendorBill')
      .populate('purchaseOrder')
      .populate('grn')
      .populate('resolvedBy', 'name');
    if (!doc) return notFound(res, 'Invoice Match');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

// ── Auto 3-way match ──────────────────────────────────────────────────────────

exports.performMatch = async (req, res) => {
  try {
    const { vendorBillId, tolerancePct = 2 } = req.body;
    if (!vendorBillId) return fail(res, 'vendorBillId is required');

    const bill = await VendorBill.findOne({ _id: vendorBillId, isDeleted: false })
      .populate('purchaseOrder').populate('grn');
    if (!bill) return notFound(res, 'Vendor Bill');

    const po  = bill.purchaseOrder;
    const grn = bill.grn;

    const discrepancies = [];
    const itemMatches   = [];
    let overallMatch    = true;

    const tol = tolerancePct / 100;

    // Helper: check variance
    function checkVariance(field, poVal, grnVal, billVal) {
      const base = poVal || billVal || 1;
      const variance = Math.abs(billVal - (poVal || 0));
      const variancePct = poVal ? (variance / poVal) * 100 : 100;
      const withinTol = variancePct <= tolerancePct;
      if (!withinTol) overallMatch = false;
      discrepancies.push({ field, poValue: poVal, grnValue: grnVal, billValue: billVal, variance, variancePct, isWithinTolerance: withinTol });
    }

    if (po) {
      // Total amount check
      const poPct = Math.abs(bill.totalAmount - (po.totalAmount || 0)) / ((po.totalAmount || 1)) * 100;
      if (poPct > tolerancePct) overallMatch = false;
      discrepancies.push({ field: 'totalAmount', poValue: po.totalAmount, grnValue: null, billValue: bill.totalAmount, variance: Math.abs(bill.totalAmount - po.totalAmount), variancePct: poPct, isWithinTolerance: poPct <= tolerancePct });

      // Per-item match if PO has items
      if (po.items && po.items.length > 0 && bill.items && bill.items.length > 0) {
        for (const billItem of bill.items) {
          const poItem = po.items.find(i => i.product?.toString() === billItem.product?.toString());
          const grnItem = grn?.items?.find(i => i.product?.toString() === billItem.product?.toString());

          const poQty    = poItem?.quantity || null;
          const grnQty   = grnItem?.receivedQuantity || null;
          const billQty  = billItem.quantity;
          const poPrice  = poItem?.unitPrice || null;
          const billPrice = billItem.unitPrice;

          const qtyMatch   = poQty !== null ? Math.abs(billQty - poQty) / (poQty || 1) * 100 <= tolerancePct : true;
          const priceMatch = poPrice !== null ? Math.abs(billPrice - poPrice) / (poPrice || 1) * 100 <= tolerancePct : true;
          let status = 'matched';
          if (!qtyMatch)   status = 'quantity_mismatch';
          if (!priceMatch) status = 'price_mismatch';
          if (!qtyMatch || !priceMatch) overallMatch = false;

          itemMatches.push({ productName: billItem.description, poQty, grnQty, billQty, poPrice, grnPrice: grnItem?.unitPrice || null, billPrice, qtyMatch, priceMatch, status });
        }
      }
    } else {
      // No PO — 2-way match against GRN only
      overallMatch = false;
      discrepancies.push({ field: 'purchaseOrder', poValue: null, grnValue: null, billValue: null, variance: 0, variancePct: 0, isWithinTolerance: false });
    }

    let matchStatus = 'matched';
    if (!overallMatch && discrepancies.some(d => !d.isWithinTolerance)) {
      matchStatus = po ? 'mismatch' : 'exception';
    }

    // Check if a match already exists for this bill
    let match = await InvoiceMatch.findOne({ vendorBill: bill._id, isDeleted: false });
    if (match) {
      match.matchStatus   = matchStatus;
      match.tolerancePct  = tolerancePct;
      match.discrepancies = discrepancies;
      match.itemMatches   = itemMatches;
      match.overallMatch  = overallMatch;
      match.autoApproved  = overallMatch;
      match.matchDate     = new Date();
      await match.save();
    } else {
      match = await InvoiceMatch.create({
        vendorBill:    bill._id,
        purchaseOrder: bill.purchaseOrder?._id || bill.purchaseOrder,
        grn:           bill.grn?._id || bill.grn,
        vendor:        bill.vendor,
        matchStatus,
        tolerancePct,
        discrepancies,
        itemMatches,
        overallMatch,
        autoApproved:  overallMatch,
        createdBy:     req.admin._id,
      });
    }

    return ok(res, match, `3-way match ${overallMatch ? 'passed' : 'has discrepancies'}`);
  } catch (e) { return serverError(res, e); }
};

// ── Manual resolve ────────────────────────────────────────────────────────────

exports.resolveMatch = async (req, res) => {
  try {
    const doc = await InvoiceMatch.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Invoice Match');
    if (doc.matchStatus === 'matched') return fail(res, 'Match is already resolved');

    doc.matchStatus      = req.body.override ? 'manual_override' : doc.matchStatus;
    doc.resolvedBy       = req.admin._id;
    doc.resolvedAt       = new Date();
    doc.resolutionNotes  = req.body.notes || '';
    await doc.save();

    await AuditLog.create({
      admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email,
      adminRole: req.admin.role, action: 'UPDATE', entity: 'InvoiceMatch',
      entityId: doc._id, entityLabel: doc.matchNumber,
      changes: { before: { matchStatus: doc.matchStatus }, after: { matchStatus: doc.matchStatus, resolvedBy: req.admin._id } },
      ip: req.ip, userAgent: req.headers['user-agent'],
    });

    return ok(res, doc, 'Match resolved');
  } catch (e) { return serverError(res, e); }
};

// ── Delete ────────────────────────────────────────────────────────────────────

exports.deleteMatch = async (req, res) => {
  try {
    const doc = await InvoiceMatch.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Invoice Match');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Match deleted');
  } catch (e) { return serverError(res, e); }
};

// ── Vendor Invoices ───────────────────────────────────────────────────────────

exports.getVendorInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor, status } = req.query;
    const q = { isDeleted: false };
    if (vendor) q.vendor = vendor;
    if (status) q.status = status;
    const [data, total] = await Promise.all([
      VendorInvoice.find(q).sort({ receivedDate: -1 }).populate('vendor', 'name').skip((page - 1) * limit).limit(Number(limit)).lean(),
      VendorInvoice.countDocuments(q),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (e) { return serverError(res, e); }
};

exports.getVendorInvoice = async (req, res) => {
  try {
    const doc = await VendorInvoice.findOne({ _id: req.params.id, isDeleted: false })
      .populate('vendor', 'name email').populate('vendorBill', 'billNumber status');
    if (!doc) return notFound(res, 'Vendor Invoice');
    return ok(res, doc);
  } catch (e) { return serverError(res, e); }
};

exports.createVendorInvoice = async (req, res) => {
  try {
    const doc = await VendorInvoice.create({ ...req.body, createdBy: req.admin._id });
    return created(res, doc, 'Vendor invoice received');
  } catch (e) { return serverError(res, e); }
};

exports.convertInvoiceToBill = async (req, res) => {
  try {
    const inv = await VendorInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!inv) return notFound(res, 'Vendor Invoice');
    if (inv.status === 'converted') return fail(res, 'Invoice already converted to a bill');

    const bill = await VendorBill.create({
      vendor:            inv.vendor,
      vendorName:        inv.vendorName,
      vendorGST:         inv.vendorGST,
      vendorInvoiceNo:   inv.vendorInvoiceNo,
      vendorInvoiceDate: inv.invoiceDate,
      billDate:          inv.invoiceDate,
      dueDate:           inv.dueDate,
      items:             inv.items,
      subtotal:          inv.subtotal,
      gstTotal:          inv.gstTotal,
      totalAmount:       inv.totalAmount,
      outstandingAmount: inv.totalAmount,
      purchaseOrder:     inv.purchaseOrder,
      grn:               inv.grn,
      notes:             inv.notes,
      createdBy:         req.admin._id,
    });

    inv.status      = 'converted';
    inv.vendorBill  = bill._id;
    inv.convertedAt = new Date();
    inv.convertedBy = req.admin._id;
    await inv.save();

    return created(res, { invoice: inv, bill }, 'Vendor invoice converted to bill');
  } catch (e) { return serverError(res, e); }
};

exports.updateVendorInvoice = async (req, res) => {
  try {
    const doc = await VendorInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Invoice');
    if (!['received','verified'].includes(doc.status)) return fail(res, 'Cannot edit a converted or rejected invoice');
    Object.assign(doc, req.body);
    await doc.save();
    return ok(res, doc, 'Vendor invoice updated');
  } catch (e) { return serverError(res, e); }
};

exports.deleteVendorInvoice = async (req, res) => {
  try {
    const doc = await VendorInvoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return notFound(res, 'Vendor Invoice');
    if (doc.status === 'converted') return fail(res, 'Cannot delete a converted invoice');
    doc.isDeleted = true;
    await doc.save();
    return noContent(res, 'Vendor invoice deleted');
  } catch (e) { return serverError(res, e); }
};
