'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_ar';

beforeAll(async () => {
  await mongoose.connect(DB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const col of collections) await col.deleteMany({});
});

// ── 1. CustomerInvoice ────────────────────────────────────────────────────────
describe('CustomerInvoice', () => {
  const CustomerInvoice = require('../models/CustomerInvoice');
  const customerId = new mongoose.Types.ObjectId();

  it('creates with required fields', async () => {
    const inv = await CustomerInvoice.create({ customer: customerId, customerName: 'Test Co', invoiceDate: new Date(), totalAmount: 50000 });
    expect(inv.invoiceNumber.startsWith('CI-')).toBeTruthy();
    expect(inv.status).toBe('draft');
    expect(inv.isDeleted).toBe(false);
  });
  it('auto-generates invoiceNumber with CI-YYYY- prefix', async () => {
    const inv = await CustomerInvoice.create({ customer: customerId, customerName: 'Test Co', invoiceDate: new Date(), totalAmount: 10000 });
    expect(inv.invoiceNumber).toMatch(/^CI-\d{4}-\d{5}$/);
  });
  it('rejects missing customer', async () => {
    await expect(CustomerInvoice.create({ customerName: 'Test Co', invoiceDate: new Date(), totalAmount: 1000 })).rejects.toThrow();
  });
});

// ── 2. CustomerReceipt ────────────────────────────────────────────────────────
describe('CustomerReceipt', () => {
  const CustomerReceipt = require('../models/CustomerReceipt');
  const customerId = new mongoose.Types.ObjectId();

  it('creates with required fields', async () => {
    const r = await CustomerReceipt.create({ customer: customerId, customerName: 'Test Co', receiptDate: new Date(), amount: 25000 });
    expect(r.receiptNumber.startsWith('CR-')).toBeTruthy();
    expect(r.status).toBe('draft');
  });
  it('auto-generates receiptNumber', async () => {
    const r = await CustomerReceipt.create({ customer: customerId, customerName: 'Test Co', receiptDate: new Date(), amount: 5000 });
    expect(r.receiptNumber).toMatch(/^CR-\d{4}-\d{5}$/);
  });
  it('rejects missing amount', async () => {
    await expect(CustomerReceipt.create({ customer: customerId, customerName: 'Test Co', receiptDate: new Date() })).rejects.toThrow();
  });
});

// ── 3. CustomerAdvance ────────────────────────────────────────────────────────
describe('CustomerAdvance', () => {
  const CustomerAdvance = require('../models/CustomerAdvance');
  const customerId = new mongoose.Types.ObjectId();

  it('creates advance', async () => {
    const a = await CustomerAdvance.create({ customer: customerId, customerName: 'Test Co', advanceAmount: 15000 });
    expect(a.advanceNumber.startsWith('CADV-')).toBeTruthy();
    expect(a.status).toBe('received');
  });
  it('auto-generates advanceNumber', async () => {
    const a = await CustomerAdvance.create({ customer: customerId, customerName: 'Test Co', advanceAmount: 8000 });
    expect(a.advanceNumber).toMatch(/^CADV-\d{4}-\d{5}$/);
  });
  it('rejects missing advanceAmount', async () => {
    await expect(CustomerAdvance.create({ customer: customerId, customerName: 'Test Co' })).rejects.toThrow();
  });
});

// ── 4. ReceiptAllocation ──────────────────────────────────────────────────────
describe('ReceiptAllocation', () => {
  const ReceiptAllocation = require('../models/ReceiptAllocation');
  const receiptId  = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();

  it('creates with required fields', async () => {
    const ra = await ReceiptAllocation.create({ customerReceipt: receiptId, customer: customerId, customerName: 'Co', totalAllocated: 5000 });
    expect(ra.allocationNumber.startsWith('RALLOC-')).toBeTruthy();
  });
  it('auto-generates allocationNumber', async () => {
    const ra = await ReceiptAllocation.create({ customerReceipt: receiptId, customer: customerId, customerName: 'Co', totalAllocated: 1000 });
    expect(ra.allocationNumber).toMatch(/^RALLOC-\d{4}-\d{5}$/);
  });
  it('rejects missing customerReceipt', async () => {
    await expect(ReceiptAllocation.create({ customer: customerId, customerName: 'Co', totalAllocated: 1000 })).rejects.toThrow();
  });
});

// ── 5. CustomerLedger ─────────────────────────────────────────────────────────
describe('CustomerLedger', () => {
  const CustomerLedger = require('../models/CustomerLedger');
  const customerId = new mongoose.Types.ObjectId();

  it('creates ledger entry', async () => {
    const entry = await CustomerLedger.create({ customer: customerId, customerName: 'Co', entryType: 'invoice', debit: 10000, credit: 0, runningBalance: 10000, entryDate: new Date() });
    expect(entry.entryType).toBe('invoice');
    expect(entry.debit).toBe(10000);
  });
  it('defaults runningBalance to 0', async () => {
    const entry = await CustomerLedger.create({ customer: customerId, customerName: 'Co', entryType: 'receipt', debit: 0, credit: 5000, entryDate: new Date() });
    expect(entry.runningBalance).toBeDefined();
  });
  it('rejects invalid entryType', async () => {
    await expect(CustomerLedger.create({ customer: customerId, customerName: 'Co', entryType: 'invalid_type', entryDate: new Date() })).rejects.toThrow();
  });
});

// ── 6. CustomerStatement ──────────────────────────────────────────────────────
describe('CustomerStatement', () => {
  const CustomerStatement = require('../models/CustomerStatement');
  const customerId = new mongoose.Types.ObjectId();

  it('creates statement', async () => {
    const s = await CustomerStatement.create({ customer: customerId, customerName: 'Co', fromDate: new Date('2026-01-01'), toDate: new Date('2026-01-31'), closingBalance: 50000 });
    expect(s.statementNumber.startsWith('CSTMT-')).toBeTruthy();
  });
  it('auto-generates statementNumber', async () => {
    const s = await CustomerStatement.create({ customer: customerId, customerName: 'Co', fromDate: new Date('2026-02-01'), toDate: new Date('2026-02-28'), closingBalance: 20000 });
    expect(s.statementNumber).toMatch(/^CSTMT-\d{4}-\d{5}$/);
  });
  it('defaults reconciliationStatus to pending', async () => {
    const s = await CustomerStatement.create({ customer: customerId, customerName: 'Co', fromDate: new Date(), toDate: new Date(), closingBalance: 0 });
    expect(s.reconciliationStatus).toBe('pending');
  });
});

// ── 7. CustomerAging ──────────────────────────────────────────────────────────
describe('CustomerAging', () => {
  const CustomerAging = require('../models/CustomerAging');
  const customerId = new mongoose.Types.ObjectId();

  it('creates aging snapshot', async () => {
    const a = await CustomerAging.create({ customer: customerId, customerName: 'Co', asOfDate: new Date(), aging: { current: 10000, days1_30: 5000, days180Plus: 2000, total: 17000 } });
    expect(a.aging.current).toBe(10000);
    expect(a.aging.days180Plus).toBe(2000);
  });
  it('defaults all buckets to 0', async () => {
    const a = await CustomerAging.create({ customer: customerId, customerName: 'Co', asOfDate: new Date() });
    expect(a.aging.days1_30).toBe(0);
    expect(a.aging.days31_60).toBe(0);
    expect(a.aging.days61_90).toBe(0);
    expect(a.aging.days91_120).toBe(0);
    expect(a.aging.days180Plus).toBe(0);
  });
  it('rejects missing customer', async () => {
    await expect(CustomerAging.create({ asOfDate: new Date() })).rejects.toThrow();
  });
});

// ── 8. CollectionActivity ─────────────────────────────────────────────────────
describe('CollectionActivity', () => {
  const CollectionActivity = require('../models/CollectionActivity');
  const customerId = new mongoose.Types.ObjectId();
  const adminId    = new mongoose.Types.ObjectId();

  it('creates activity', async () => {
    const a = await CollectionActivity.create({ customer: customerId, customerName: 'Co', activityType: 'call', activityDate: new Date(), outcome: 'contacted', performedBy: adminId, notes: 'Called' });
    expect(a.activityNumber.startsWith('CACT-')).toBeTruthy();
    expect(a.activityType).toBe('call');
  });
  it('auto-generates activityNumber', async () => {
    const a = await CollectionActivity.create({ customer: customerId, customerName: 'Co', activityType: 'email', activityDate: new Date(), outcome: 'contacted', performedBy: adminId, notes: 'Sent email' });
    expect(a.activityNumber).toMatch(/^CACT-\d{4}-\d{5}$/);
  });
  it('rejects missing performedBy', async () => {
    await expect(CollectionActivity.create({ customer: customerId, customerName: 'Co', activityType: 'call', activityDate: new Date(), outcome: 'contacted', notes: 'x' })).rejects.toThrow();
  });
});

// ── 9. CollectionReminder ─────────────────────────────────────────────────────
describe('CollectionReminder', () => {
  const CollectionReminder = require('../models/CollectionReminder');
  const customerId = new mongoose.Types.ObjectId();

  it('creates reminder', async () => {
    const r = await CollectionReminder.create({ customer: customerId, customerName: 'Co', reminderLevel: 1, reminderType: 'email', reminderDate: new Date(), dueAmount: 10000 });
    expect(r.reminderNumber.startsWith('CREM-')).toBeTruthy();
    expect(r.reminderLevel).toBe(1);
  });
  it('auto-generates reminderNumber', async () => {
    const r = await CollectionReminder.create({ customer: customerId, customerName: 'Co', reminderLevel: 2, reminderType: 'sms', reminderDate: new Date(), dueAmount: 5000 });
    expect(r.reminderNumber).toMatch(/^CREM-\d{4}-\d{5}$/);
  });
  it('rejects invalid reminderLevel', async () => {
    await expect(CollectionReminder.create({ customer: customerId, customerName: 'Co', reminderLevel: 9, reminderType: 'email', reminderDate: new Date(), dueAmount: 1000 })).rejects.toThrow();
  });
});

// ── 10. PromiseToPay ──────────────────────────────────────────────────────────
describe('PromiseToPay', () => {
  const PromiseToPay = require('../models/PromiseToPay');
  const customerId   = new mongoose.Types.ObjectId();

  it('creates promise', async () => {
    const p = await PromiseToPay.create({ customer: customerId, customerName: 'Co', promisedAmount: 30000, promisedDate: new Date() });
    expect(p.ptpNumber.startsWith('PTP-')).toBeTruthy();
    expect(p.status).toBe('active');
  });
  it('auto-generates ptpNumber', async () => {
    const p = await PromiseToPay.create({ customer: customerId, customerName: 'Co', promisedAmount: 10000, promisedDate: new Date() });
    expect(p.ptpNumber).toMatch(/^PTP-\d{4}-\d{5}$/);
  });
  it('rejects missing promisedAmount', async () => {
    await expect(PromiseToPay.create({ customer: customerId, customerName: 'Co', promisedDate: new Date() })).rejects.toThrow();
  });
});

// ── 11. BadDebt ───────────────────────────────────────────────────────────────
describe('BadDebt', () => {
  const BadDebt   = require('../models/BadDebt');
  const invoiceId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();

  it('creates bad debt record', async () => {
    const b = await BadDebt.create({ customerInvoice: invoiceId, customer: customerId, customerName: 'Co', originalAmount: 20000, badDebtAmount: 20000, reason: 'uncollectable' });
    expect(b.badDebtNumber.startsWith('BD-')).toBeTruthy();
    expect(b.status).toBe('pending_approval');
  });
  it('auto-generates badDebtNumber', async () => {
    const b = await BadDebt.create({ customerInvoice: invoiceId, customer: customerId, customerName: 'Co', originalAmount: 5000, badDebtAmount: 5000, reason: 'bankruptcy' });
    expect(b.badDebtNumber).toMatch(/^BD-\d{4}-\d{5}$/);
  });
  it('rejects missing customerInvoice', async () => {
    await expect(BadDebt.create({ customer: customerId, customerName: 'Co', badDebtAmount: 1000, reason: 'fraud' })).rejects.toThrow();
  });
});

// ── 12. WriteOff ──────────────────────────────────────────────────────────────
describe('WriteOff', () => {
  const WriteOff   = require('../models/WriteOff');
  const invoiceId  = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();

  it('creates write-off', async () => {
    const w = await WriteOff.create({ customerInvoice: invoiceId, customer: customerId, customerName: 'Co', writeOffAmount: 5000, writeOffType: 'discount', reason: 'Settlement discount' });
    expect(w.writeOffNumber.startsWith('WO-')).toBeTruthy();
    expect(w.status).toBe('draft');
  });
  it('auto-generates writeOffNumber', async () => {
    const w = await WriteOff.create({ customerInvoice: invoiceId, customer: customerId, customerName: 'Co', writeOffAmount: 1000, writeOffType: 'rounding', reason: 'Rounding' });
    expect(w.writeOffNumber).toMatch(/^WO-\d{4}-\d{5}$/);
  });
  it('rejects missing reason', async () => {
    await expect(WriteOff.create({ customerInvoice: invoiceId, customer: customerId, customerName: 'Co', writeOffAmount: 100, writeOffType: 'rounding' })).rejects.toThrow();
  });
});

// ── 13. CustomerCreditLimit ───────────────────────────────────────────────────
describe('CustomerCreditLimit', () => {
  const CustomerCreditLimit = require('../models/CustomerCreditLimit');
  const customerId = new mongoose.Types.ObjectId();

  it('creates credit limit', async () => {
    const c = await CustomerCreditLimit.create({ customer: customerId, customerName: 'Co', creditLimit: 500000, riskRating: 'medium' });
    expect(c.riskRating).toBe('medium');
    expect(c.isBlocked).toBe(false);
    expect(c.autoHold).toBe(false);
  });
  it('defaults creditTerms to net30', async () => {
    const c = await CustomerCreditLimit.create({ customer: customerId, customerName: 'Co', creditLimit: 100000, riskRating: 'low' });
    expect(c.creditTerms).toBe('net30');
  });
  it('rejects invalid riskRating', async () => {
    await expect(CustomerCreditLimit.create({ customer: customerId, customerName: 'Co', creditLimit: 100000, riskRating: 'unknown' })).rejects.toThrow();
  });
});

// ── 14. CustomerCreditReview ──────────────────────────────────────────────────
describe('CustomerCreditReview', () => {
  const CustomerCreditReview = require('../models/CustomerCreditReview');
  const customerId   = new mongoose.Types.ObjectId();
  const requestedBy  = new mongoose.Types.ObjectId();

  it('creates credit review', async () => {
    const r = await CustomerCreditReview.create({ customer: customerId, customerName: 'Co', previousLimit: 100000, proposedLimit: 200000, reviewType: 'upgrade', requestedBy });
    expect(r.reviewNumber.startsWith('CREV-')).toBeTruthy();
    expect(r.status).toBe('pending');
  });
  it('auto-generates reviewNumber', async () => {
    const r = await CustomerCreditReview.create({ customer: customerId, customerName: 'Co', previousLimit: 50000, proposedLimit: 100000, reviewType: 'initial', requestedBy });
    expect(r.reviewNumber).toMatch(/^CREV-\d{4}-\d{5}$/);
  });
  it('rejects missing requestedBy', async () => {
    await expect(CustomerCreditReview.create({ customer: customerId, customerName: 'Co', previousLimit: 50000, proposedLimit: 100000, reviewType: 'periodic' })).rejects.toThrow();
  });
});

// ── 15. ReceiptBatch ──────────────────────────────────────────────────────────
describe('ReceiptBatch', () => {
  const ReceiptBatch = require('../models/ReceiptBatch');
  const createdBy    = new mongoose.Types.ObjectId();

  it('creates receipt batch', async () => {
    const b = await ReceiptBatch.create({ batchDate: new Date(), totalAmount: 100000, createdBy });
    expect(b.batchNumber.startsWith('RB-')).toBeTruthy();
    expect(b.status).toBe('draft');
  });
  it('auto-generates batchNumber', async () => {
    const b = await ReceiptBatch.create({ batchDate: new Date(), totalAmount: 50000, createdBy });
    expect(b.batchNumber).toMatch(/^RB-\d{4}-\d{5}$/);
  });
  it('has totalAmount defaulting to 0', async () => {
    const b = await ReceiptBatch.create({ batchDate: new Date() });
    expect(b.totalAmount).toBe(0);
  });
});

// ── 16. ReceiptVoucher ────────────────────────────────────────────────────────
describe('ReceiptVoucher', () => {
  const ReceiptVoucher = require('../models/ReceiptVoucher');
  const receiptId     = new mongoose.Types.ObjectId();
  const debitAccount  = new mongoose.Types.ObjectId();
  const creditAccount = new mongoose.Types.ObjectId();

  const customerId2 = new mongoose.Types.ObjectId();

  it('creates receipt voucher', async () => {
    const v = await ReceiptVoucher.create({ customer: customerId2, customerReceipt: receiptId, voucherDate: new Date(), amount: 25000, debitAccount, creditAccount, narration: 'Test' });
    expect(v.voucherNumber.startsWith('RV-')).toBeTruthy();
  });
  it('auto-generates voucherNumber', async () => {
    const v = await ReceiptVoucher.create({ customer: customerId2, customerReceipt: receiptId, voucherDate: new Date(), amount: 10000, debitAccount, creditAccount, narration: 'Test2' });
    expect(v.voucherNumber).toMatch(/^RV-\d{4}-\d{5}$/);
  });
  it('rejects missing customer', async () => {
    await expect(ReceiptVoucher.create({ voucherDate: new Date(), amount: 1000, debitAccount, creditAccount, narration: 'x' })).rejects.toThrow();
  });
});

// ── 17. SalesRegister ─────────────────────────────────────────────────────────
describe('SalesRegister', () => {
  const SalesRegister = require('../models/SalesRegister');
  const invoiceId     = new mongoose.Types.ObjectId();
  const customerId    = new mongoose.Types.ObjectId();

  it('creates sales register entry', async () => {
    const sr = await SalesRegister.create({ customerInvoice: invoiceId, customer: customerId, customerName: 'Co', invoiceDate: new Date(), invoiceNumber: 'CI-2026-00001', totalAmount: 50000 });
    expect(sr.registerNumber.startsWith('SR-')).toBeTruthy();
    expect(sr.gstCategory).toBe('B2B');
  });
  it('auto-generates registerNumber', async () => {
    const sr = await SalesRegister.create({ customerInvoice: invoiceId, customer: customerId, customerName: 'Co', invoiceDate: new Date(), invoiceNumber: 'CI-2026-00002', totalAmount: 30000 });
    expect(sr.registerNumber).toMatch(/^SR-\d{4}-\d{5}$/);
  });
  it('rejects missing customerInvoice', async () => {
    await expect(SalesRegister.create({ customer: customerId, customerName: 'Co', invoiceDate: new Date(), invoiceNumber: 'x', totalAmount: 1000 })).rejects.toThrow();
  });
});

// ── 18. ReceiptRegister ───────────────────────────────────────────────────────
describe('ReceiptRegister', () => {
  const ReceiptRegister = require('../models/ReceiptRegister');
  const receiptId       = new mongoose.Types.ObjectId();
  const customerId      = new mongoose.Types.ObjectId();

  it('creates receipt register entry', async () => {
    const rr = await ReceiptRegister.create({ customerReceipt: receiptId, customer: customerId, customerName: 'Co', receiptDate: new Date(), receiptNumber: 'CR-2026-00001', receiptMode: 'bank_transfer', amount: 25000 });
    expect(rr.registerNumber.startsWith('RR-')).toBeTruthy();
  });
  it('auto-generates registerNumber', async () => {
    const rr = await ReceiptRegister.create({ customerReceipt: receiptId, customer: customerId, customerName: 'Co', receiptDate: new Date(), receiptNumber: 'CR-2026-00002', receiptMode: 'upi', amount: 10000 });
    expect(rr.registerNumber).toMatch(/^RR-\d{4}-\d{5}$/);
  });
  it('rejects missing customerReceipt', async () => {
    await expect(ReceiptRegister.create({ customer: customerId, customerName: 'Co', receiptDate: new Date(), receiptNumber: 'x', receiptMode: 'cash', amount: 1000 })).rejects.toThrow();
  });
});

// ── 19. ARSetting ─────────────────────────────────────────────────────────────
describe('ARSetting', () => {
  const ARSetting = require('../models/ARSetting');

  it('creates AR setting', async () => {
    const s = await ARSetting.create({ key: 'default_payment_terms', value: 'net30', category: 'invoice' });
    expect(s.key).toBe('default_payment_terms');
    expect(s.category).toBe('invoice');
  });
  it('rejects missing key', async () => {
    await expect(ARSetting.create({ value: 'test', category: 'general' })).rejects.toThrow();
  });
  it('rejects duplicate key', async () => {
    await ARSetting.create({ key: 'unique_setting', value: 'v1', category: 'general' });
    await expect(ARSetting.create({ key: 'unique_setting', value: 'v2', category: 'general' })).rejects.toThrow();
  });
});

// ── 20. CollectionRule ────────────────────────────────────────────────────────
describe('CollectionRule', () => {
  const CollectionRule = require('../models/CollectionRule');

  it('creates collection rule', async () => {
    const r = await CollectionRule.create({ ruleName: 'Overdue 30 Days', trigger: 'overdue_days', triggerValue: 30, action: 'send_reminder', isActive: true, priority: 1 });
    expect(r.ruleName).toBe('Overdue 30 Days');
    expect(r.trigger).toBe('overdue_days');
    expect(r.isActive).toBe(true);
  });
  it('defaults isActive to true', async () => {
    const r = await CollectionRule.create({ ruleName: 'Test Rule', trigger: 'amount_threshold', triggerValue: 100000, action: 'escalate', priority: 2 });
    expect(r.isActive).toBe(true);
  });
  it('rejects missing action', async () => {
    await expect(CollectionRule.create({ ruleName: 'Bad Rule', trigger: 'overdue_days', triggerValue: 60, priority: 1 })).rejects.toThrow();
  });
});

// ── Integration: CustomerInvoice lifecycle ────────────────────────────────────
describe('CustomerInvoice lifecycle', () => {
  const CustomerInvoice = require('../models/CustomerInvoice');
  const customerId = new mongoose.Types.ObjectId();

  it('transitions status from draft to submitted', async () => {
    const inv = await CustomerInvoice.create({ customer: customerId, customerName: 'Integ Co', invoiceDate: new Date(), totalAmount: 75000 });
    expect(inv.status).toBe('draft');
    inv.status = 'submitted';
    await inv.save();
    expect(inv.status).toBe('submitted');
  });

  it('transitions status from submitted to approved', async () => {
    const inv = await CustomerInvoice.create({ customer: customerId, customerName: 'Integ Co', invoiceDate: new Date(), totalAmount: 60000 });
    inv.status = 'approved';
    inv.outstandingAmount = 60000;
    await inv.save();
    expect(inv.status).toBe('approved');
    expect(inv.outstandingAmount).toBe(60000);
  });

  it('sets paid status when paidAmount equals totalAmount', async () => {
    const inv = await CustomerInvoice.create({ customer: customerId, customerName: 'Integ Co', invoiceDate: new Date(), totalAmount: 10000 });
    inv.paidAmount = 10000;
    inv.outstandingAmount = 0;
    inv.status = 'paid';
    await inv.save();
    expect(inv.status).toBe('paid');
    expect(inv.outstandingAmount).toBe(0);
  });
});

// ── Integration: Partial receipt allocation ───────────────────────────────────
describe('Partial receipt allocation', () => {
  const CustomerInvoice = require('../models/CustomerInvoice');
  const CustomerReceipt = require('../models/CustomerReceipt');
  const ReceiptAllocation = require('../models/ReceiptAllocation');
  const customerId = new mongoose.Types.ObjectId();

  it('allocates partial receipt to invoice', async () => {
    const inv = await CustomerInvoice.create({ customer: customerId, customerName: 'Part Co', invoiceDate: new Date(), totalAmount: 100000, outstandingAmount: 100000, status: 'approved' });
    const rec = await CustomerReceipt.create({ customer: customerId, customerName: 'Part Co', receiptDate: new Date(), amount: 60000 });
    const alloc = await ReceiptAllocation.create({
      customerReceipt: rec._id, customer: customerId, customerName: 'Part Co', totalAllocated: 60000,
      lines: [{ customerInvoice: inv._id, allocatedAmount: 60000, discount: 0, writeOff: 0, netAllocated: 60000 }]
    });
    inv.paidAmount = 60000;
    inv.outstandingAmount = 40000;
    inv.status = 'partially_paid';
    await inv.save();
    expect(alloc.totalAllocated).toBe(60000);
    expect(inv.status).toBe('partially_paid');
    expect(inv.outstandingAmount).toBe(40000);
  });
});

// ── Integration: Advance receipt ──────────────────────────────────────────────
describe('Advance receipt', () => {
  const CustomerReceipt = require('../models/CustomerReceipt');
  const CustomerAdvance = require('../models/CustomerAdvance');
  const customerId = new mongoose.Types.ObjectId();

  it('advance receipt creates CustomerAdvance record', async () => {
    const rec = await CustomerReceipt.create({ customer: customerId, customerName: 'Adv Co', receiptDate: new Date(), amount: 50000, isAdvance: true, receiptType: 'advance' });
    const adv = await CustomerAdvance.create({ customer: customerId, customerName: 'Adv Co', advanceAmount: 50000, availableAmount: 50000, customerReceipt: rec._id });
    expect(adv.availableAmount).toBe(50000);
    expect(rec.isAdvance).toBe(true);
  });
});

// ── Integration: CustomerLedger running balance ────────────────────────────────
describe('CustomerLedger running balance', () => {
  const CustomerLedger = require('../models/CustomerLedger');
  const customerId = new mongoose.Types.ObjectId();

  it('records debit on invoice', async () => {
    const entry = await CustomerLedger.create({ customer: customerId, customerName: 'Ledger Co', entryType: 'invoice', debit: 50000, credit: 0, runningBalance: 50000, entryDate: new Date() });
    expect(entry.debit).toBe(50000);
    expect(entry.runningBalance).toBe(50000);
  });

  it('records credit on receipt', async () => {
    const e1 = await CustomerLedger.create({ customer: customerId, customerName: 'Ledger Co', entryType: 'invoice', debit: 50000, credit: 0, runningBalance: 50000, entryDate: new Date() });
    const e2 = await CustomerLedger.create({ customer: customerId, customerName: 'Ledger Co', entryType: 'receipt', debit: 0, credit: 30000, runningBalance: 20000, entryDate: new Date() });
    expect(e2.credit).toBe(30000);
    expect(e2.runningBalance).toBe(20000);
  });
});

// ── Integration: Aging bucket assignment ──────────────────────────────────────
describe('Aging bucket assignment', () => {
  const CustomerAging = require('../models/CustomerAging');
  const customerId = new mongoose.Types.ObjectId();

  it('correctly stores days180Plus bucket', async () => {
    const a = await CustomerAging.create({ customer: customerId, customerName: 'Old Co', asOfDate: new Date(), aging: { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days91_120: 0, days180Plus: 75000, total: 75000 } });
    expect(a.aging.days180Plus).toBe(75000);
  });

  it('stores all 6 buckets correctly', async () => {
    const a = await CustomerAging.create({ customer: customerId, customerName: 'All Co', asOfDate: new Date(), aging: { current: 10000, days1_30: 8000, days31_60: 6000, days61_90: 4000, days91_120: 2000, days180Plus: 1000, total: 31000 } });
    expect(a.aging.current).toBe(10000);
    expect(a.aging.days1_30).toBe(8000);
    expect(a.aging.days31_60).toBe(6000);
    expect(a.aging.days61_90).toBe(4000);
    expect(a.aging.days91_120).toBe(2000);
    expect(a.aging.days180Plus).toBe(1000);
    expect(a.aging.total).toBe(31000);
  });
});

// ── Integration: Credit limit utilization ─────────────────────────────────────
describe('Credit limit utilization', () => {
  const CustomerCreditLimit = require('../models/CustomerCreditLimit');
  const customerId = new mongoose.Types.ObjectId();

  it('computes availableCredit on creation', async () => {
    const cl = await CustomerCreditLimit.create({ customer: customerId, customerName: 'Credit Co', creditLimit: 200000, usedCredit: 50000, availableCredit: 150000, riskRating: 'low' });
    expect(cl.availableCredit).toBe(150000);
  });

  it('blocks customer credit', async () => {
    const cl = await CustomerCreditLimit.create({ customer: customerId, customerName: 'Credit Co', creditLimit: 100000, riskRating: 'high', isBlocked: true, blockReason: 'Non-payment' });
    expect(cl.isBlocked).toBe(true);
    expect(cl.blockReason).toBe('Non-payment');
  });
});

// ── Integration: Write-off approval workflow ──────────────────────────────────
describe('Write-off approval workflow', () => {
  const WriteOff   = require('../models/WriteOff');
  const invoiceId  = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();
  const approvedBy = new mongoose.Types.ObjectId();

  it('draft → approved → gl posted', async () => {
    const w = await WriteOff.create({ customerInvoice: invoiceId, customer: customerId, customerName: 'WO Co', writeOffAmount: 5000, writeOffType: 'bad_debt', reason: 'Uncollectable' });
    expect(w.status).toBe('draft');
    w.status = 'approved';
    w.approvedBy = approvedBy;
    w.approvedAt = new Date();
    await w.save();
    expect(w.status).toBe('approved');
    w.glPosted = true;
    w.status = 'posted';
    await w.save();
    expect(w.glPosted).toBe(true);
    expect(w.status).toBe('posted');
  });
});

// ── Integration: Collection rule priority ─────────────────────────────────────
describe('Collection rule priority', () => {
  const CollectionRule = require('../models/CollectionRule');

  it('creates multiple rules with different priorities', async () => {
    const r1 = await CollectionRule.create({ ruleName: 'Rule 1', trigger: 'overdue_days', triggerValue: 30, action: 'send_reminder', priority: 1 });
    const r2 = await CollectionRule.create({ ruleName: 'Rule 2', trigger: 'overdue_days', triggerValue: 60, action: 'escalate', priority: 2 });
    const r3 = await CollectionRule.create({ ruleName: 'Rule 3', trigger: 'overdue_days', triggerValue: 90, action: 'legal_notice', priority: 3 });
    const rules = await CollectionRule.find().sort({ priority: 1 });
    expect(rules[0].priority).toBe(1);
    expect(rules[1].priority).toBe(2);
    expect(rules[2].priority).toBe(3);
  });
});

// ── Integration: Bad debt provisioning ───────────────────────────────────────
describe('Bad debt provisioning workflow', () => {
  const BadDebt    = require('../models/BadDebt');
  const CustomerLedger = require('../models/CustomerLedger');
  const invoiceId  = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();

  it('provisions bad debt and records ledger entry', async () => {
    const bd = await BadDebt.create({ customerInvoice: invoiceId, customer: customerId, customerName: 'BD Co', originalAmount: 15000, badDebtAmount: 15000, reason: 'bankruptcy' });
    expect(bd.status).toBe('pending_approval');
    bd.status = 'approved';
    // status transitions: pending_approval → approved
    await bd.save();
    const ledgerEntry = await CustomerLedger.create({ customer: customerId, customerName: 'BD Co', entryType: 'bad_debt', debit: 15000, credit: 0, runningBalance: 15000, entryDate: new Date(), narration: `Bad Debt - ${bd.badDebtNumber}` });
    expect(ledgerEntry.entryType).toBe('bad_debt');
    expect(ledgerEntry.debit).toBe(15000);
  });
});
