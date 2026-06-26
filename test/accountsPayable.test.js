'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_ap';

beforeAll(async () => {
  await mongoose.connect(DB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const col of collections) await col.deleteMany({});
});

// ── 1. VendorBill ─────────────────────────────────────────────────────────────
describe('VendorBill', () => {
  const VendorBill = require('../models/VendorBill');
  const vendorId   = new mongoose.Types.ObjectId();

  it('creates with required fields', async () => {
    const b = await VendorBill.create({ vendor: vendorId, billDate: new Date(), totalAmount: 5000 });
    expect(b.billNumber.startsWith('VB-')).toBeTruthy();
    expect(b.status).toBe('draft');
    expect(b.isDeleted).toBe(false);
  });
  it('auto-generates billNumber', async () => {
    const b = await VendorBill.create({ vendor: vendorId, billDate: new Date(), totalAmount: 1000 });
    expect(b.billNumber).toMatch(/^VB-\d{4}-\d{5}$/);
  });
  it('rejects missing vendor', async () => {
    await expect(VendorBill.create({ billDate: new Date(), totalAmount: 100 })).rejects.toThrow();
  });
});

// ── 2. VendorPayment ──────────────────────────────────────────────────────────
describe('VendorPayment', () => {
  const VendorPayment = require('../models/VendorPayment');
  const vendorId      = new mongoose.Types.ObjectId();

  it('creates with required fields', async () => {
    const p = await VendorPayment.create({ vendor: vendorId, paymentDate: new Date(), amount: 10000 });
    expect(p.paymentNumber.startsWith('VP-')).toBeTruthy();
    expect(p.status).toBe('draft');
  });
  it('auto-generates paymentNumber', async () => {
    const p = await VendorPayment.create({ vendor: vendorId, paymentDate: new Date(), amount: 5000 });
    expect(p.paymentNumber).toMatch(/^VP-\d{4}-\d{5}$/);
  });
  it('rejects missing amount', async () => {
    await expect(VendorPayment.create({ vendor: vendorId, paymentDate: new Date() })).rejects.toThrow();
  });
});

// ── 3. VendorAdvance ──────────────────────────────────────────────────────────
describe('VendorAdvance', () => {
  const VendorAdvance = require('../models/VendorAdvance');
  const vendorId      = new mongoose.Types.ObjectId();

  it('creates advance', async () => {
    const a = await VendorAdvance.create({ vendor: vendorId, requestedAmount: 20000 });
    expect(a.advanceNumber.startsWith('VA-')).toBeTruthy();
    expect(a.status).toBe('draft');
  });
  it('auto-generates advanceNumber', async () => {
    const a = await VendorAdvance.create({ vendor: vendorId, requestedAmount: 5000 });
    expect(a.advanceNumber).toMatch(/^VA-\d{4}-\d{5}$/);
  });
  it('rejects missing vendor', async () => {
    await expect(VendorAdvance.create({ requestedAmount: 1000 })).rejects.toThrow();
  });
});

// ── 4. VendorLedger ───────────────────────────────────────────────────────────
describe('VendorLedger', () => {
  const VendorLedger = require('../models/VendorLedger');
  const vendorId     = new mongoose.Types.ObjectId();

  it('creates ledger entry', async () => {
    const e = await VendorLedger.create({ vendor: vendorId, entryDate: new Date(), entryType: 'bill', debit: 5000 });
    expect(e._id).toBeDefined();
    expect(e.runningBalance).toBe(0);
  });
  it('defaults debit/credit to 0', async () => {
    const e = await VendorLedger.create({ vendor: vendorId, entryDate: new Date(), entryType: 'payment' });
    expect(e.debit).toBe(0);
    expect(e.credit).toBe(0);
  });
  it('rejects invalid entryType', async () => {
    await expect(VendorLedger.create({ vendor: vendorId, entryDate: new Date(), entryType: 'invalid' })).rejects.toThrow();
  });
});

// ── 5. VendorAging ────────────────────────────────────────────────────────────
describe('VendorAging', () => {
  const VendorAging = require('../models/VendorAging');
  const vendorId    = new mongoose.Types.ObjectId();

  it('creates aging snapshot', async () => {
    const a = await VendorAging.create({ vendor: vendorId, asOfDate: new Date() });
    expect(a._id).toBeDefined();
    expect(a.isDeleted).toBe(false);
  });
  it('defaults aging buckets to 0', async () => {
    const a = await VendorAging.create({ vendor: vendorId, asOfDate: new Date() });
    expect(a.aging.current).toBe(0);
    expect(a.aging.days1_30).toBe(0);
    expect(a.aging.total).toBe(0);
  });
  it('rejects missing vendor', async () => {
    await expect(VendorAging.create({ asOfDate: new Date() })).rejects.toThrow();
  });
});

// ── 6. DebitNote ──────────────────────────────────────────────────────────────
describe('DebitNote', () => {
  const DebitNote = require('../models/DebitNote');
  const vendorId  = new mongoose.Types.ObjectId();

  it('creates debit note', async () => {
    const d = await DebitNote.create({ vendor: vendorId, debitNoteDate: new Date(), totalAmount: 500 });
    expect(d.debitNoteNumber.startsWith('DN-')).toBeTruthy();
    expect(d.status).toBe('draft');
  });
  it('auto-generates debitNoteNumber', async () => {
    const d = await DebitNote.create({ vendor: vendorId, debitNoteDate: new Date(), totalAmount: 100 });
    expect(d.debitNoteNumber).toMatch(/^DN-\d{4}-\d{5}$/);
  });
  it('rejects missing vendor', async () => {
    await expect(DebitNote.create({ debitNoteDate: new Date() })).rejects.toThrow();
  });
});

// ── 7. APCreditNote ───────────────────────────────────────────────────────────
describe('APCreditNote', () => {
  const APCreditNote = require('../models/APCreditNote');
  const vendorId     = new mongoose.Types.ObjectId();

  it('creates credit note', async () => {
    const c = await APCreditNote.create({ vendor: vendorId, creditNoteDate: new Date(), totalAmount: 300 });
    expect(c.creditNoteNumber.startsWith('CN-AP-')).toBeTruthy();
    expect(c.status).toBe('draft');
  });
  it('auto-generates creditNoteNumber', async () => {
    const c = await APCreditNote.create({ vendor: vendorId, creditNoteDate: new Date(), totalAmount: 200 });
    expect(c.creditNoteNumber).toMatch(/^CN-AP-\d{4}-\d{5}$/);
  });
  it('rejects missing vendor', async () => {
    await expect(APCreditNote.create({ creditNoteDate: new Date() })).rejects.toThrow();
  });
});

// ── 8. InvoiceMatch ───────────────────────────────────────────────────────────
describe('InvoiceMatch', () => {
  const InvoiceMatch = require('../models/InvoiceMatch');
  const vendorId     = new mongoose.Types.ObjectId();
  const billId       = new mongoose.Types.ObjectId();

  it('creates invoice match', async () => {
    const m = await InvoiceMatch.create({ vendor: vendorId, vendorBill: billId });
    expect(m.matchNumber.startsWith('IM-')).toBeTruthy();
    expect(m.matchStatus).toBe('matched');
  });
  it('defaults tolerancePct to 2', async () => {
    const m = await InvoiceMatch.create({ vendor: vendorId, vendorBill: billId });
    expect(m.tolerancePct).toBe(2);
  });
  it('rejects missing vendorBill', async () => {
    await expect(InvoiceMatch.create({ vendor: vendorId })).rejects.toThrow();
  });
});

// ── 9. PaymentRun ─────────────────────────────────────────────────────────────
describe('PaymentRun', () => {
  const PaymentRun = require('../models/PaymentRun');

  it('creates payment run', async () => {
    const r = await PaymentRun.create({ runDate: new Date() });
    expect(r.runNumber.startsWith('PR-')).toBeTruthy();
    expect(r.status).toBe('draft');
  });
  it('auto-generates runNumber', async () => {
    const r = await PaymentRun.create({ runDate: new Date() });
    expect(r.runNumber).toMatch(/^PR-\d{4}-\d{5}$/);
  });
  it('defaults status to draft', async () => {
    const r = await PaymentRun.create({ runDate: new Date() });
    expect(r.status).toBe('draft');
  });
});

// ── 10. PaymentBatch ──────────────────────────────────────────────────────────
describe('PaymentBatch', () => {
  const PaymentBatch = require('../models/PaymentBatch');

  it('creates payment batch', async () => {
    const b = await PaymentBatch.create({ batchDate: new Date() });
    expect(b.batchNumber.startsWith('PB-')).toBeTruthy();
    expect(b.status).toBe('draft');
  });
  it('auto-generates batchNumber', async () => {
    const b = await PaymentBatch.create({ batchDate: new Date() });
    expect(b.batchNumber).toMatch(/^PB-\d{4}-\d{5}$/);
  });
  it('defaults totalAmount to 0', async () => {
    const b = await PaymentBatch.create({ batchDate: new Date() });
    expect(b.totalAmount).toBe(0);
  });
});

// ── 11. PaymentAdvice ─────────────────────────────────────────────────────────
describe('PaymentAdvice', () => {
  const PaymentAdvice = require('../models/PaymentAdvice');
  const vendorId      = new mongoose.Types.ObjectId();

  it('creates payment advice', async () => {
    const a = await PaymentAdvice.create({ vendor: vendorId });
    expect(a.adviceNumber.startsWith('PA-')).toBeTruthy();
    expect(a.status).toBe('draft');
  });
  it('auto-generates adviceNumber', async () => {
    const a = await PaymentAdvice.create({ vendor: vendorId });
    expect(a.adviceNumber).toMatch(/^PA-\d{4}-\d{5}$/);
  });
  it('rejects missing vendor', async () => {
    await expect(PaymentAdvice.create({})).rejects.toThrow();
  });
});

// ── 12. VendorStatement ───────────────────────────────────────────────────────
describe('VendorStatement', () => {
  const VendorStatement = require('../models/VendorStatement');
  const vendorId        = new mongoose.Types.ObjectId();

  it('creates vendor statement', async () => {
    const s = await VendorStatement.create({ vendor: vendorId, fromDate: new Date('2026-04-01'), toDate: new Date('2026-06-30') });
    expect(s.statementNumber.startsWith('VSTMT-')).toBeTruthy();
    expect(s.reconciliationStatus).toBe('pending');
  });
  it('auto-generates statementNumber', async () => {
    const s = await VendorStatement.create({ vendor: vendorId, fromDate: new Date('2026-01-01'), toDate: new Date('2026-03-31') });
    expect(s.statementNumber).toMatch(/^VSTMT-\d{4}-\d{5}$/);
  });
  it('rejects missing fromDate', async () => {
    await expect(VendorStatement.create({ vendor: vendorId, toDate: new Date() })).rejects.toThrow();
  });
});

// ── 13. PaymentSchedule ───────────────────────────────────────────────────────
describe('PaymentSchedule', () => {
  const PaymentSchedule = require('../models/PaymentSchedule');
  const vendorId        = new mongoose.Types.ObjectId();
  const billId          = new mongoose.Types.ObjectId();

  it('creates payment schedule', async () => {
    const s = await PaymentSchedule.create({ vendor: vendorId, vendorBill: billId, scheduledDate: new Date(), scheduledAmount: 5000 });
    expect(s.scheduleNumber.startsWith('PS-')).toBeTruthy();
    expect(s.status).toBe('scheduled');
  });
  it('auto-generates scheduleNumber', async () => {
    const s = await PaymentSchedule.create({ vendor: vendorId, vendorBill: billId, scheduledDate: new Date(), scheduledAmount: 1000 });
    expect(s.scheduleNumber).toMatch(/^PS-\d{4}-\d{5}$/);
  });
  it('rejects missing scheduledAmount', async () => {
    await expect(PaymentSchedule.create({ vendor: vendorId, vendorBill: billId, scheduledDate: new Date() })).rejects.toThrow();
  });
});

// ── 14. WithholdingTax ────────────────────────────────────────────────────────
describe('WithholdingTax', () => {
  const WithholdingTax = require('../models/WithholdingTax');

  it('creates withholding tax', async () => {
    const t = await WithholdingTax.create({ rate: 10, section: '194C' });
    expect(t.taxCode.startsWith('WHT-')).toBeTruthy();
    expect(t.taxType).toBe('TDS');
  });
  it('auto-generates taxCode', async () => {
    const t = await WithholdingTax.create({ rate: 5, section: '194J' });
    expect(t.taxCode).toMatch(/^WHT-\d{4}$/);
  });
  it('rejects missing rate', async () => {
    await expect(WithholdingTax.create({ section: '194I' })).rejects.toThrow();
  });
});

// ── 15. GSTInputCredit ────────────────────────────────────────────────────────
describe('GSTInputCredit', () => {
  const GSTInputCredit = require('../models/GSTInputCredit');
  const vendorId       = new mongoose.Types.ObjectId();
  const billId         = new mongoose.Types.ObjectId();

  it('creates GST input credit', async () => {
    const g = await GSTInputCredit.create({ vendor: vendorId, vendorBill: billId, billDate: new Date(), igstAmount: 1800, totalTax: 1800, eligibleCredit: 1800 });
    expect(g.creditNumber.startsWith('GSTIC-')).toBeTruthy();
    expect(g.reconciliationStatus).toBe('pending');
  });
  it('auto-generates creditNumber', async () => {
    const g = await GSTInputCredit.create({ vendor: vendorId, vendorBill: billId, billDate: new Date(), totalTax: 900, eligibleCredit: 900 });
    expect(g.creditNumber).toMatch(/^GSTIC-\d{4}-\d{5}$/);
  });
  it('rejects missing vendorBill', async () => {
    await expect(GSTInputCredit.create({ vendor: vendorId, billDate: new Date() })).rejects.toThrow();
  });
});

// ── 16. PaymentApproval ───────────────────────────────────────────────────────
describe('PaymentApproval', () => {
  const PaymentApproval = require('../models/PaymentApproval');
  const userId          = new mongoose.Types.ObjectId();

  it('creates payment approval', async () => {
    const a = await PaymentApproval.create({ sourceType: 'vendor_payment', sourceId: new mongoose.Types.ObjectId(), requestedBy: userId, amount: 10000 });
    expect(a.approvalNumber.startsWith('PAP-')).toBeTruthy();
    expect(a.status).toBe('pending');
  });
  it('auto-generates approvalNumber', async () => {
    const a = await PaymentApproval.create({ sourceType: 'vendor_bill', sourceId: new mongoose.Types.ObjectId(), requestedBy: userId });
    expect(a.approvalNumber).toMatch(/^PAP-\d{4}-\d{5}$/);
  });
  it('rejects missing requestedBy', async () => {
    await expect(PaymentApproval.create({ sourceType: 'vendor_payment', sourceId: new mongoose.Types.ObjectId() })).rejects.toThrow();
  });
});

// ── 17. VendorSettlement ──────────────────────────────────────────────────────
describe('VendorSettlement', () => {
  const VendorSettlement = require('../models/VendorSettlement');
  const vendorId         = new mongoose.Types.ObjectId();

  it('creates vendor settlement', async () => {
    const s = await VendorSettlement.create({ vendor: vendorId, settlementDate: new Date(), totalDebits: 5000, totalCredits: 1000, netPayable: 4000 });
    expect(s.settlementNumber.startsWith('VS-')).toBeTruthy();
    expect(s.status).toBe('draft');
  });
  it('auto-generates settlementNumber', async () => {
    const s = await VendorSettlement.create({ vendor: vendorId, settlementDate: new Date() });
    expect(s.settlementNumber).toMatch(/^VS-\d{4}-\d{5}$/);
  });
  it('rejects missing vendor', async () => {
    await expect(VendorSettlement.create({ settlementDate: new Date() })).rejects.toThrow();
  });
});

// ── 18. PaymentAllocation ─────────────────────────────────────────────────────
describe('PaymentAllocation', () => {
  const PaymentAllocation = require('../models/PaymentAllocation');
  const vendorId          = new mongoose.Types.ObjectId();
  const paymentId         = new mongoose.Types.ObjectId();

  it('creates payment allocation', async () => {
    const a = await PaymentAllocation.create({ vendorPayment: paymentId, vendor: vendorId, allocationDate: new Date() });
    expect(a.allocationNumber.startsWith('ALLOC-')).toBeTruthy();
    expect(a.status).toBe('draft');
  });
  it('auto-generates allocationNumber', async () => {
    const a = await PaymentAllocation.create({ vendorPayment: paymentId, vendor: vendorId, allocationDate: new Date() });
    expect(a.allocationNumber).toMatch(/^ALLOC-\d{4}-\d{5}$/);
  });
  it('rejects missing vendorPayment', async () => {
    await expect(PaymentAllocation.create({ vendor: vendorId, allocationDate: new Date() })).rejects.toThrow();
  });
});

// ── 19. PaymentTerm ───────────────────────────────────────────────────────────
describe('PaymentTerm', () => {
  const PaymentTerm = require('../models/PaymentTerm');

  it('creates payment term', async () => {
    const t = await PaymentTerm.create({ termCode: 'NET30', name: 'Net 30 Days', netDays: 30 });
    expect(t.termCode).toBe('NET30');
    expect(t.isActive).toBe(true);
  });
  it('enforces unique termCode', async () => {
    await PaymentTerm.create({ termCode: 'NET60', name: 'Net 60', netDays: 60 });
    await expect(PaymentTerm.create({ termCode: 'NET60', name: 'Dupe', netDays: 60 })).rejects.toThrow();
  });
  it('rejects missing name', async () => {
    await expect(PaymentTerm.create({ termCode: 'NET90' })).rejects.toThrow();
  });
});

// ── 20. VendorInvoice ─────────────────────────────────────────────────────────
describe('VendorInvoice', () => {
  const VendorInvoice = require('../models/VendorInvoice');
  const vendorId      = new mongoose.Types.ObjectId();

  it('creates vendor invoice', async () => {
    const i = await VendorInvoice.create({ vendor: vendorId, vendorInvoiceNo: 'INV-001', invoiceDate: new Date(), totalAmount: 8000 });
    expect(i.invoiceNumber.startsWith('VI-')).toBeTruthy();
    expect(i.status).toBe('received');
  });
  it('auto-generates invoiceNumber', async () => {
    const i = await VendorInvoice.create({ vendor: vendorId, vendorInvoiceNo: 'INV-002', invoiceDate: new Date(), totalAmount: 4000 });
    expect(i.invoiceNumber).toMatch(/^VI-\d{4}-\d{5}$/);
  });
  it('rejects missing vendorInvoiceNo', async () => {
    await expect(VendorInvoice.create({ vendor: vendorId, invoiceDate: new Date(), totalAmount: 1000 })).rejects.toThrow();
  });
});

// ── 21. AP Aging invariant ────────────────────────────────────────────────────
describe('AP Aging bucket invariant', () => {
  const VendorBill = require('../models/VendorBill');
  const vendorId   = new mongoose.Types.ObjectId();

  it('assigns bills to correct aging buckets', async () => {
    const now = new Date();
    const dueDate35daysAgo = new Date(now - 35 * 24 * 60 * 60 * 1000);
    const b = await VendorBill.create({ vendor: vendorId, billDate: new Date(now - 40 * 24 * 60 * 60 * 1000), dueDate: dueDate35daysAgo, totalAmount: 10000, outstandingAmount: 10000, status: 'overdue' });
    const daysOverdue = Math.floor((now - b.dueDate) / 86400000);
    expect(daysOverdue).toBeGreaterThan(30);
    expect(daysOverdue).toBeLessThanOrEqual(60);
  });

  it('overdue bill status is correctly set', async () => {
    const b = await VendorBill.create({ vendor: vendorId, billDate: new Date(), totalAmount: 5000, outstandingAmount: 5000, status: 'overdue' });
    expect(b.status).toBe('overdue');
    expect(b.outstandingAmount).toBe(5000);
  });

  it('paid bill has outstandingAmount 0', async () => {
    const b = await VendorBill.create({ vendor: vendorId, billDate: new Date(), totalAmount: 3000, paidAmount: 3000, outstandingAmount: 0, status: 'paid' });
    expect(b.outstandingAmount).toBe(0);
    expect(b.status).toBe('paid');
  });
});

// ── 22. VendorPayment allocation invariant ─────────────────────────────────────
describe('VendorPayment allocation invariant', () => {
  const VendorPayment = require('../models/VendorPayment');
  const vendorId      = new mongoose.Types.ObjectId();
  const billId1       = new mongoose.Types.ObjectId();
  const billId2       = new mongoose.Types.ObjectId();

  it('stores multiple allocations', async () => {
    const p = await VendorPayment.create({
      vendor: vendorId,
      paymentDate: new Date(),
      amount: 15000,
      netAmount: 15000,
      allocations: [
        { vendorBill: billId1, allocatedAmount: 10000, billNumber: 'VB-2026-00001' },
        { vendorBill: billId2, allocatedAmount: 5000,  billNumber: 'VB-2026-00002' },
      ],
    });
    expect(p.allocations).toHaveLength(2);
    const total = p.allocations.reduce((s, a) => s + a.allocatedAmount, 0);
    expect(total).toBe(15000);
  });

  it('netAmount = amount - tds - withholding', async () => {
    const p = await VendorPayment.create({ vendor: vendorId, paymentDate: new Date(), amount: 100000, tdsAmount: 10000, withholdingTax: 2000 });
    expect(p.netAmount).toBe(88000);
  });

  it('isAdvance flag defaults to false', async () => {
    const p = await VendorPayment.create({ vendor: vendorId, paymentDate: new Date(), amount: 5000 });
    expect(p.isAdvance).toBe(false);
  });
});

// ── 23. InvoiceMatch 3-way fields ─────────────────────────────────────────────
describe('InvoiceMatch 3-way fields', () => {
  const InvoiceMatch = require('../models/InvoiceMatch');
  const vendorId     = new mongoose.Types.ObjectId();
  const billId       = new mongoose.Types.ObjectId();
  const poId         = new mongoose.Types.ObjectId();
  const grnId        = new mongoose.Types.ObjectId();

  it('stores all 3 source references', async () => {
    const m = await InvoiceMatch.create({ vendor: vendorId, vendorBill: billId, purchaseOrder: poId, grn: grnId, matchStatus: 'matched', overallMatch: true });
    expect(m.vendorBill.toString()).toBe(billId.toString());
    expect(m.purchaseOrder.toString()).toBe(poId.toString());
    expect(m.grn.toString()).toBe(grnId.toString());
  });

  it('stores discrepancies', async () => {
    const m = await InvoiceMatch.create({
      vendor: vendorId,
      vendorBill: billId,
      matchStatus: 'mismatch',
      discrepancies: [{ field: 'totalAmount', poValue: 10000, billValue: 10500, variance: 500, variancePct: 5, isWithinTolerance: false }],
    });
    expect(m.discrepancies).toHaveLength(1);
    expect(m.discrepancies[0].field).toBe('totalAmount');
  });

  it('autoApproved true when overallMatch true', async () => {
    const m = await InvoiceMatch.create({ vendor: vendorId, vendorBill: billId, overallMatch: true, autoApproved: true });
    expect(m.autoApproved).toBe(true);
    expect(m.overallMatch).toBe(true);
  });
});
