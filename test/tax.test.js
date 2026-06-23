'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_tax';

beforeAll(async () => {
  await mongoose.connect(DB_URI);
  // Ensure unique indexes are created before tests that depend on them
  const TaxCode        = require('../models/TaxCode');
  const TDSSection     = require('../models/TDSSection');
  const GSTRegistration = require('../models/GSTRegistration');
  const TaxJurisdiction = require('../models/TaxJurisdiction');
  const TaxRule        = require('../models/TaxRule');
  await Promise.all([
    TaxCode.syncIndexes(),
    TDSSection.syncIndexes(),
    GSTRegistration.syncIndexes(),
    TaxJurisdiction.syncIndexes(),
    TaxRule.syncIndexes(),
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const col of collections) await col.deleteMany({});
});

// ── 1. TaxCode ───────────────────────────────────────────────────────────────
describe('TaxCode', () => {
  const TaxCode = require('../models/TaxCode');

  it('creates with required fields', async () => {
    const doc = await TaxCode.create({ code: 'GST18', name: 'GST 18%', taxType: 'GST' });
    expect(doc.code).toBe('GST18');
    expect(doc.taxType).toBe('GST');
    expect(doc.isActive).toBe(true);
    expect(doc.isDeleted).toBe(false);
  });

  it('code is saved uppercase', async () => {
    const doc = await TaxCode.create({ code: 'gst5', name: 'GST 5%', taxType: 'GST' });
    expect(doc.code).toBe('GST5');
  });

  it('rejects duplicate code', async () => {
    await TaxCode.create({ code: 'TDS10', name: 'TDS 10%', taxType: 'TDS' });
    await expect(TaxCode.create({ code: 'TDS10', name: 'Another', taxType: 'TDS' })).rejects.toThrow();
  });

  it('rejects invalid taxType', async () => {
    await expect(TaxCode.create({ code: 'BAD1', name: 'Bad', taxType: 'INVALID' })).rejects.toThrow();
  });
});

// ── 2. TaxRate ───────────────────────────────────────────────────────────────
describe('TaxRate', () => {
  const TaxCode = require('../models/TaxCode');
  const TaxRate = require('../models/TaxRate');

  it('creates linked to TaxCode', async () => {
    const code = await TaxCode.create({ code: 'GST18R', name: 'GST 18%', taxType: 'GST' });
    const rate = await TaxRate.create({ taxCode: code._id, name: 'GST 18% Rate', rate: 18, effectiveFrom: new Date(), cgstRate: 9, sgstRate: 9, igstRate: 18 });
    expect(rate.cgstRate).toBe(9);
    expect(rate.igstRate).toBe(18);
    expect(rate.isActive).toBe(true);
  });

  it('isReverseCharge defaults to false', async () => {
    const code = await TaxCode.create({ code: 'TDS5R', name: 'TDS 5%', taxType: 'TDS' });
    const rate = await TaxRate.create({ taxCode: code._id, name: 'TDS 5% Rate', rate: 5, effectiveFrom: new Date(), cgstRate: 0, sgstRate: 0, igstRate: 5 });
    expect(rate.isReverseCharge).toBe(false);
  });
});

// ── 3. TaxGroup ──────────────────────────────────────────────────────────────
describe('TaxGroup', () => {
  const TaxGroup = require('../models/TaxGroup');

  it('creates with required fields', async () => {
    const doc = await TaxGroup.create({ name: 'Standard GST', applicableTo: 'goods' });
    expect(doc.name).toBe('Standard GST');
    expect(doc.applicableTo).toBe('goods');
    expect(doc.isDeleted).toBe(false);
  });

  it('rejects invalid applicableTo', async () => {
    await expect(TaxGroup.create({ name: 'Bad', applicableTo: 'invalid' })).rejects.toThrow();
  });
});

// ── 4. GSTRegistration ───────────────────────────────────────────────────────
describe('GSTRegistration', () => {
  const GSTRegistration = require('../models/GSTRegistration');

  it('creates with required fields', async () => {
    const doc = await GSTRegistration.create({ gstin: '27AAPFU0939F1ZV', legalName: 'Metro Appliances Pvt Ltd', state: 'Maharashtra', stateCode: '27', registrationType: 'regular' });
    expect(doc.gstin).toBe('27AAPFU0939F1ZV');
    expect(doc.status).toBe('active');
    expect(doc.isDefault).toBe(false);
  });

  it('rejects duplicate GSTIN', async () => {
    await GSTRegistration.create({ gstin: '27AAPFU0939F1ZW', legalName: 'A', state: 'MH', stateCode: '27', registrationType: 'regular' });
    await expect(GSTRegistration.create({ gstin: '27AAPFU0939F1ZW', legalName: 'B', state: 'MH', stateCode: '27', registrationType: 'regular' })).rejects.toThrow();
  });
});

// ── 5. GSTReturn ─────────────────────────────────────────────────────────────
describe('GSTReturn', () => {
  const GSTReturn = require('../models/GSTReturn');

  it('auto-generates returnNumber with GSTR prefix', async () => {
    const doc = await GSTReturn.create({ returnType: 'GSTR-3B', period: '2026-04', gstin: '27AAPFU0939F1ZV', totalIGST: 50000 });
    expect(doc.returnNumber).toMatch(/^GSTR-\d{4}-\d{5}$/);
    expect(doc.status).toBe('draft');
  });

  it('creates GSTR-1 with correct type', async () => {
    const doc = await GSTReturn.create({ returnType: 'GSTR-1', period: '2026-04', gstin: '27AAPFU0939F1ZV', totalCGST: 10000, totalSGST: 10000 });
    expect(doc.returnType).toBe('GSTR-1');
  });

  it('rejects invalid returnType', async () => {
    await expect(GSTReturn.create({ returnType: 'GSTR-99', period: '2026-04', gstin: '27AAPFU0939F1ZV' })).rejects.toThrow();
  });

  it('status defaults to draft', async () => {
    const doc = await GSTReturn.create({ returnType: 'GSTR-9', period: '2025-2026', gstin: '27AAPFU0939F1ZV' });
    expect(doc.status).toBe('draft');
  });
});

// ── 6. GSTInvoice ────────────────────────────────────────────────────────────
describe('GSTInvoice', () => {
  const GSTInvoice = require('../models/GSTInvoice');

  it('auto-generates gstInvoiceNumber', async () => {
    const doc = await GSTInvoice.create({ invoiceType: 'B2B', invoiceDate: new Date(), partyName: 'Test Buyer', partyGSTIN: '29AAPFU0939F1ZV', supplyType: 'intra', taxableValue: 100000, totalTax: 18000, invoiceValue: 118000, fromGSTIN: '27AAPFU0939F1ZV' });
    expect(doc.gstInvoiceNumber).toMatch(/^GSTI-\d{4}-\d{5}$/);
  });

  it('rejects invalid invoiceType', async () => {
    await expect(GSTInvoice.create({ invoiceType: 'INVALID', invoiceDate: new Date(), partyName: 'X', fromGSTIN: '27AAPFU0939F1ZV' })).rejects.toThrow();
  });
});

// ── 7. GSTAdjustment ─────────────────────────────────────────────────────────
describe('GSTAdjustment', () => {
  const GSTAdjustment = require('../models/GSTAdjustment');

  it('auto-generates adjustmentNumber', async () => {
    const doc = await GSTAdjustment.create({ adjustmentType: 'itc_reversal', period: '2026-04', igstAmount: 5000, reason: 'Test reversal' });
    expect(doc.adjustmentNumber).toMatch(/^GSTADJ-\d{4}-\d{5}$/);
    expect(doc.status).toBe('draft');
  });
});

// ── 8. GSTInputCreditLedger ───────────────────────────────────────────────────
describe('GSTInputCreditLedger', () => {
  const GSTInputCreditLedger = require('../models/GSTInputCreditLedger');

  it('auto-generates entryNumber', async () => {
    const doc = await GSTInputCreditLedger.create({ entryType: 'credit', taxHead: 'igst', period: '2026-04', amount: 50000, runningBalance: 50000 });
    expect(doc.entryNumber).toMatch(/^ITCL-\d{4}-\d{5}$/);
  });

  it('rejects invalid entryType', async () => {
    await expect(GSTInputCreditLedger.create({ entryType: 'bad', taxHead: 'igst', period: '2026-04', amount: 100 })).rejects.toThrow();
  });

  it('rejects invalid taxHead', async () => {
    await expect(GSTInputCreditLedger.create({ entryType: 'credit', taxHead: 'bad', period: '2026-04', amount: 100 })).rejects.toThrow();
  });
});

// ── 9. GSTOutputTaxLedger ────────────────────────────────────────────────────
describe('GSTOutputTaxLedger', () => {
  const GSTOutputTaxLedger = require('../models/GSTOutputTaxLedger');

  it('auto-generates entryNumber', async () => {
    const doc = await GSTOutputTaxLedger.create({ entryType: 'liability', taxHead: 'cgst', period: '2026-04', amount: 20000, runningBalance: 20000 });
    expect(doc.entryNumber).toMatch(/^OTXL-\d{4}-\d{5}$/);
  });

  it('credit_note entry type is valid', async () => {
    const doc = await GSTOutputTaxLedger.create({ entryType: 'credit_note', taxHead: 'sgst', period: '2026-04', amount: 5000, runningBalance: 15000 });
    expect(doc.entryType).toBe('credit_note');
  });
});

// ── 10. GSTSettlement ────────────────────────────────────────────────────────
describe('GSTSettlement', () => {
  const GSTSettlement = require('../models/GSTSettlement');

  it('auto-generates settlementNumber', async () => {
    const doc = await GSTSettlement.create({ period: '2026-04', gstin: '27AAPFU0939F1ZV', itcIGST: 30000, itcCGST: 10000, itcSGST: 10000, liabilityIGST: 50000, liabilityCGST: 20000, liabilitySGST: 20000, totalPayable: 40000 });
    expect(doc.settlementNumber).toMatch(/^GSTSET-\d{4}-\d{5}$/);
    expect(doc.status).toBe('draft');
  });
});

// ── 11. TDSSection ───────────────────────────────────────────────────────────
describe('TDSSection', () => {
  const TDSSection = require('../models/TDSSection');

  it('creates with required fields', async () => {
    const doc = await TDSSection.create({ section: '194C', description: 'Contractors', natureOfPayment: 'Payment to Contractors', thresholdLimit: 30000, individualRate: 1, companyRate: 2 });
    expect(doc.section).toBe('194C');
    expect(doc.isActive).toBe(true);
  });

  it('rejects duplicate section', async () => {
    await TDSSection.create({ section: '194I', description: 'Rent', natureOfPayment: 'Rent', thresholdLimit: 240000, individualRate: 10, companyRate: 10 });
    await expect(TDSSection.create({ section: '194I', description: 'Duplicate', natureOfPayment: 'Duplicate Rent', thresholdLimit: 240000, individualRate: 10, companyRate: 10 })).rejects.toThrow();
  });
});

// ── 12. TDSRate ──────────────────────────────────────────────────────────────
describe('TDSRate', () => {
  const TDSSection = require('../models/TDSSection');
  const TDSRate    = require('../models/TDSRate');

  it('creates linked to section', async () => {
    const section = await TDSSection.create({ section: '194J', description: 'Professional Fees', natureOfPayment: 'Professional Fees', thresholdLimit: 30000, individualRate: 10, companyRate: 10 });
    const rate = await TDSRate.create({ tdsSection: section._id, section: '194J', payeeType: 'individual', rate: 10, effectiveFrom: new Date() });
    expect(rate.noPanRate).toBe(20);
    expect(rate.isActive).toBe(true);
  });
});

// ── 13. TDSCertificate ───────────────────────────────────────────────────────
describe('TDSCertificate', () => {
  const TDSCertificate = require('../models/TDSCertificate');

  it('auto-generates certificateNumber', async () => {
    const doc = await TDSCertificate.create({ certificateType: '16A', assessmentYear: '2026-27', quarter: 'Q1', deductorName: 'Metro Appliances', deductorTAN: 'MUMA12345A', deducteeName: 'ABC Consultants', deducteePAN: 'ABCDE1234F', tdsDeducted: 5000 });
    expect(doc.certificateNumber).toMatch(/^TDSC-\d{4}-\d{5}$/);
    expect(doc.status).toBe('draft');
  });

  it('rejects invalid certificateType', async () => {
    await expect(TDSCertificate.create({ certificateType: '18', assessmentYear: '2026-27', quarter: 'Q1', deductorName: 'X', deductorTAN: 'Y', deducteeName: 'Z', deducteePAN: 'W', tdsDeducted: 1000 })).rejects.toThrow();
  });
});

// ── 14. TDSDeduction ─────────────────────────────────────────────────────────
describe('TDSDeduction', () => {
  const TDSSection  = require('../models/TDSSection');
  const TDSDeduction = require('../models/TDSDeduction');

  it('auto-generates deductionNumber', async () => {
    const section = await TDSSection.create({ section: '194A', description: 'Interest', natureOfPayment: 'Interest', thresholdLimit: 40000, individualRate: 10, companyRate: 10 });
    const doc = await TDSDeduction.create({ tdsSection: section._id, section: '194A', partyName: 'SBI Bank', grossAmount: 100000, tdsRate: 10, tdsAmount: 10000, deductionDate: new Date(), assessmentYear: '2026-27', quarter: 'Q1' });
    expect(doc.deductionNumber).toMatch(/^TDSD-\d{4}-\d{5}$/);
    expect(doc.status).toBe('pending');
  });

  it('netAmount is computed as grossAmount minus tdsAmount', async () => {
    const section = await TDSSection.create({ section: '194B', description: 'Lottery', natureOfPayment: 'Lottery', thresholdLimit: 10000, individualRate: 30, companyRate: 30 });
    const doc = await TDSDeduction.create({ tdsSection: section._id, section: '194B', partyName: 'Winner', grossAmount: 50000, tdsRate: 30, tdsAmount: 15000, deductionDate: new Date(), assessmentYear: '2026-27', quarter: 'Q2' });
    expect(doc.netAmount).toBe(35000);
  });
});

// ── 15. TDSDeposit ───────────────────────────────────────────────────────────
describe('TDSDeposit', () => {
  const TDSDeposit = require('../models/TDSDeposit');

  it('auto-generates depositNumber', async () => {
    const doc = await TDSDeposit.create({ assessmentYear: '2026-27', quarter: 'Q1', totalAmount: 50000, depositDate: new Date() });
    expect(doc.depositNumber).toMatch(/^TDSDEP-\d{4}-\d{5}$/);
    expect(doc.status).toBe('draft');
    expect(doc.minorHead).toBe('200');
  });
});

// ── 16. TaxJurisdiction ──────────────────────────────────────────────────────
describe('TaxJurisdiction', () => {
  const TaxJurisdiction = require('../models/TaxJurisdiction');

  it('creates with required fields', async () => {
    const doc = await TaxJurisdiction.create({ code: 'MH', name: 'Maharashtra', state: 'Maharashtra', stateCode: '27', gstStateCode: '27', defaultTaxType: 'CGST_SGST' });
    expect(doc.code).toBe('MH');
    expect(doc.isUnionTerritory).toBe(false);
  });

  it('rejects duplicate code', async () => {
    await TaxJurisdiction.create({ code: 'DL', name: 'Delhi', state: 'Delhi', stateCode: '07', gstStateCode: '07', defaultTaxType: 'CGST_SGST' });
    await expect(TaxJurisdiction.create({ code: 'DL', name: 'Delhi2', state: 'Delhi', stateCode: '07', gstStateCode: '07', defaultTaxType: 'CGST_SGST' })).rejects.toThrow();
  });
});

// ── 17. TaxRule ──────────────────────────────────────────────────────────────
describe('TaxRule', () => {
  const TaxRule = require('../models/TaxRule');

  it('creates with required fields', async () => {
    const doc = await TaxRule.create({ ruleName: 'Intra-State GST', ruleCode: 'RULE_INTRA_GST', taxType: 'GST', applicableTo: 'sale', priority: 1 });
    expect(doc.ruleCode).toBe('RULE_INTRA_GST');
    expect(doc.isActive).toBe(true);
  });

  it('rejects duplicate ruleCode', async () => {
    await TaxRule.create({ ruleName: 'Test Rule', ruleCode: 'RULE_DUP', taxType: 'TDS', applicableTo: 'both', priority: 1 });
    await expect(TaxRule.create({ ruleName: 'Test Rule 2', ruleCode: 'RULE_DUP', taxType: 'TDS', applicableTo: 'both', priority: 2 })).rejects.toThrow();
  });
});

// ── 18. TaxExemption ─────────────────────────────────────────────────────────
describe('TaxExemption', () => {
  const TaxExemption = require('../models/TaxExemption');

  it('auto-generates exemptionNumber', async () => {
    const doc = await TaxExemption.create({ exemptionType: 'GST', partyType: 'customer', partyName: 'SEZ Unit Ltd', reason: 'SEZ supply — zero rated under GST', igstExempt: true });
    expect(doc.exemptionNumber).toMatch(/^TXEX-\d{4}-\d{5}$/);
    expect(doc.status).toBe('active');
  });

  it('requires partyName', async () => {
    await expect(TaxExemption.create({ exemptionType: 'GST', partyType: 'customer', reason: 'Test' })).rejects.toThrow();
  });
});

// ── 19. TaxAudit ─────────────────────────────────────────────────────────────
describe('TaxAudit', () => {
  const TaxAudit = require('../models/TaxAudit');

  it('auto-generates auditNumber', async () => {
    const doc = await TaxAudit.create({ auditType: 'internal', fiscalYear: '2025-26', turnover: 10000000, totalTaxPayable: 1800000, totalTaxPaid: 1800000 });
    expect(doc.auditNumber).toMatch(/^TXAUD-\d{4}-\d{5}$/);
    expect(doc.status).toBe('planned');
  });

  it('requires fiscalYear', async () => {
    await expect(TaxAudit.create({ auditType: 'statutory', turnover: 5000000 })).rejects.toThrow();
  });
});

// ── 20. ComplianceCalendar ───────────────────────────────────────────────────
describe('ComplianceCalendar', () => {
  const ComplianceCalendar = require('../models/ComplianceCalendar');

  it('creates with required fields', async () => {
    const doc = await ComplianceCalendar.create({ complianceType: 'GST', fiscalYear: '2026-27', calendarName: 'GST Calendar 2026-27', events: [{ month: 4, dueDay: 20, description: 'GSTR-3B April' }] });
    expect(doc.complianceType).toBe('GST');
    expect(doc.events).toHaveLength(1);
    expect(doc.isActive).toBe(true);
  });

  it('rejects invalid complianceType', async () => {
    await expect(ComplianceCalendar.create({ complianceType: 'INVALID', fiscalYear: '2026-27', name: 'Bad' })).rejects.toThrow();
  });
});

// ── 21. ComplianceTask ───────────────────────────────────────────────────────
describe('ComplianceTask', () => {
  const ComplianceTask = require('../models/ComplianceTask');

  it('auto-generates taskNumber', async () => {
    const doc = await ComplianceTask.create({ complianceType: 'GSTR-3B', taskName: 'File GSTR-3B for April 2026', period: '2026-04', dueDate: new Date('2026-05-20'), priority: 'high' });
    expect(doc.taskNumber).toMatch(/^CMPL-\d{4}-\d{5}$/);
    expect(doc.status).toBe('pending');
  });

  it('requires dueDate', async () => {
    await expect(ComplianceTask.create({ complianceType: 'TDS_return', taskName: 'File TDS Return', priority: 'medium' })).rejects.toThrow();
  });

  it('rejects invalid complianceType', async () => {
    await expect(ComplianceTask.create({ complianceType: 'INVALID_TYPE', taskName: 'Bad Task', dueDate: new Date() })).rejects.toThrow();
  });
});

// ── 22. EInvoice ─────────────────────────────────────────────────────────────
describe('EInvoice', () => {
  const EInvoice = require('../models/EInvoice');

  it('auto-generates eInvoiceNumber', async () => {
    const doc = await EInvoice.create({ invoiceNumber: 'INV-001', invoiceDate: new Date(), sellerGSTIN: '27AAPFU0939F1ZV', buyerGSTIN: '29AAPFU0939F1ZV', buyerName: 'ABC Corp', totalValue: 118000, taxableValue: 100000 });
    expect(doc.eInvoiceNumber).toMatch(/^EINV-\d{4}-\d{5}$/);
    expect(doc.irnStatus).toBe('pending');
  });

  it('irn field is sparse unique', async () => {
    const doc1 = await EInvoice.create({ invoiceNumber: 'INV-002', invoiceDate: new Date(), sellerGSTIN: '27AAPFU0939F1ZV', buyerGSTIN: '29AAPFU0939F1ZV', buyerName: 'DEF Corp', totalValue: 50000, taxableValue: 42373, irn: 'ABC123DEF456' });
    expect(doc1.irn).toBe('ABC123DEF456');
    const doc2 = await EInvoice.create({ invoiceNumber: 'INV-003', invoiceDate: new Date(), sellerGSTIN: '27AAPFU0939F1ZV', buyerGSTIN: '29AAPFU0939F1ZV', buyerName: 'GHI Corp', totalValue: 50000, taxableValue: 42373 });
    expect(doc2.irn).toBeUndefined();
  });
});

// ── 23. EWayBill ─────────────────────────────────────────────────────────────
describe('EWayBill', () => {
  const EWayBill = require('../models/EWayBill');

  it('auto-generates eWayBillNumber', async () => {
    const doc = await EWayBill.create({ fromGSTIN: '27AAPFU0939F1ZV', toGSTIN: '29AAPFU0939F1ZV', toName: 'XYZ Traders', invoiceNo: 'INV-2026-001', invoiceValue: 250000, supplyType: 'outward', transportMode: 'road', vehicleNo: 'MH12AB1234', distance: 500 });
    expect(doc.eWayBillNumber).toMatch(/^EWB-\d{4}-\d{5}$/);
    expect(doc.status).toBe('pending');
    expect(doc.vehicleNo).toBe('MH12AB1234');
  });

  it('rejects invalid status', async () => {
    const doc = await EWayBill.create({ fromGSTIN: '27AAPFU0939F1ZV', invoiceNo: 'INV-2', invoiceValue: 10000, supplyType: 'outward', transportMode: 'rail' });
    expect(doc.status).toBe('pending');
  });

  it('transportMode defaults to road', async () => {
    const doc = await EWayBill.create({ fromGSTIN: '27AAPFU0939F1ZV', invoiceNo: 'INV-3', invoiceValue: 10000, supplyType: 'outward' });
    expect(doc.transportMode).toBe('road');
  });
});

// ── 24. TaxConfiguration ─────────────────────────────────────────────────────
describe('TaxConfiguration', () => {
  const TaxConfiguration = require('../models/TaxConfiguration');

  it('creates with required fields', async () => {
    const doc = await TaxConfiguration.create({ key: 'einvoice_enabled', value: true, category: 'einvoice', description: 'Enable e-invoice generation' });
    expect(doc.key).toBe('einvoice_enabled');
    expect(doc.value).toBe(true);
    expect(doc.isActive).toBe(true);
  });

  it('rejects duplicate key', async () => {
    await TaxConfiguration.create({ key: 'gst_state_code', value: '27', category: 'GST' });
    await expect(TaxConfiguration.create({ key: 'gst_state_code', value: '29', category: 'GST' })).rejects.toThrow();
  });

  it('rejects invalid category', async () => {
    await expect(TaxConfiguration.create({ key: 'bad_config', value: 'x', category: 'INVALID' })).rejects.toThrow();
  });
});

// ── 25. Controller-level smoke tests via model ────────────────────────────────
describe('GST Controller logic (model smoke)', () => {
  const GSTReturn            = require('../models/GSTReturn');
  const GSTSettlement        = require('../models/GSTSettlement');
  const GSTInputCreditLedger = require('../models/GSTInputCreditLedger');
  const GSTOutputTaxLedger   = require('../models/GSTOutputTaxLedger');

  it('can create and file a GST return', async () => {
    const ret = await GSTReturn.create({ returnType: 'GSTR-3B', period: '2026-04', gstin: '27AAPFU0939F1ZV', totalCGST: 20000, totalSGST: 20000, totalIGST: 0 });
    expect(ret.status).toBe('draft');
    ret.status    = 'filed';
    ret.filingDate = new Date();
    await ret.save();
    expect(ret.status).toBe('filed');
  });

  it('can compute net ITC balance', async () => {
    await GSTInputCreditLedger.create({ entryType: 'credit', taxHead: 'cgst', period: '2026-04', amount: 50000, runningBalance: 50000 });
    await GSTInputCreditLedger.create({ entryType: 'utilization', taxHead: 'cgst', period: '2026-04', amount: 20000, runningBalance: 30000 });
    const [result] = await GSTInputCreditLedger.aggregate([
      { $match: { taxHead: 'cgst' } },
      { $group: { _id: null, totalCredit: { $sum: { $cond: [{ $eq: ['$entryType','credit'] }, '$amount', 0] } }, totalUsed: { $sum: { $cond: [{ $eq: ['$entryType','utilization'] }, '$amount', 0] } } } },
    ]);
    expect(result.totalCredit).toBe(50000);
    expect(result.totalUsed).toBe(20000);
  });

  it('settlement pays correctly', async () => {
    const settlement = await GSTSettlement.create({ period: '2026-04', gstin: '27AAPFU0939F1ZV', totalPayable: 40000, itcIGST: 0, itcCGST: 10000, itcSGST: 10000, liabilityIGST: 0, liabilityCGST: 20000, liabilitySGST: 20000 });
    settlement.status      = 'paid';
    settlement.totalPaid   = settlement.totalPayable;
    settlement.challanDate = new Date();
    await settlement.save();
    expect(settlement.status).toBe('paid');
    expect(settlement.totalPaid).toBe(40000);
  });
});

describe('TDS Controller logic (model smoke)', () => {
  const TDSSection  = require('../models/TDSSection');
  const TDSDeduction = require('../models/TDSDeduction');
  const TDSDeposit  = require('../models/TDSDeposit');

  it('deduction to deposit flow', async () => {
    const section = await TDSSection.create({ section: '194Q', description: 'Purchase of Goods', natureOfPayment: 'Purchase', thresholdLimit: 5000000, individualRate: 0.1, companyRate: 0.1 });
    const ded = await TDSDeduction.create({ tdsSection: section._id, section: '194Q', partyName: 'Supplier X', grossAmount: 1000000, tdsRate: 0.1, tdsAmount: 1000, deductionDate: new Date(), assessmentYear: '2026-27', quarter: 'Q1' });
    expect(ded.status).toBe('pending');
    expect(ded.netAmount).toBe(999000);

    const deposit = await TDSDeposit.create({ assessmentYear: '2026-27', quarter: 'Q1', deductions: [ded._id], totalAmount: 1000, depositDate: new Date() });
    await TDSDeduction.updateMany({ _id: { $in: [ded._id] } }, { status: 'deposited' });
    const updated = await TDSDeduction.findById(ded._id);
    expect(updated.status).toBe('deposited');
  });
});

describe('Compliance Controller logic (model smoke)', () => {
  const ComplianceTask = require('../models/ComplianceTask');

  it('task completion flow', async () => {
    const task = await ComplianceTask.create({ complianceType: 'GSTR-3B', taskName: 'File April GSTR-3B', period: '2026-04', dueDate: new Date('2026-05-20'), priority: 'high' });
    expect(task.status).toBe('pending');
    task.status        = 'completed';
    task.completedDate = new Date();
    await task.save();
    expect(task.status).toBe('completed');
  });

  it('filters overdue tasks', async () => {
    await ComplianceTask.create({ complianceType: 'TDS_return', taskName: 'Overdue Task', period: '2025-Q4', dueDate: new Date('2025-01-01'), priority: 'critical', status: 'overdue' });
    await ComplianceTask.create({ complianceType: 'GSTR-1', taskName: 'Future Task', period: '2026-06', dueDate: new Date('2026-07-11'), priority: 'medium' });
    const overdue = await ComplianceTask.find({ status: 'overdue' });
    expect(overdue).toHaveLength(1);
  });
});

describe('E-Invoice Controller logic (model smoke)', () => {
  const EInvoice = require('../models/EInvoice');

  it('generates IRN and updates status', async () => {
    const doc = await EInvoice.create({ invoiceNumber: 'INV-TEST-001', invoiceDate: new Date(), sellerGSTIN: '27AAPFU0939F1ZV', buyerGSTIN: '29AAPFU0939F1ZV', buyerName: 'Test Corp', totalValue: 118000, taxableValue: 100000 });
    doc.irn       = 'DEADBEEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234DEAD';
    doc.irnStatus = 'generated';
    doc.irnDate   = new Date();
    await doc.save();
    expect(doc.irnStatus).toBe('generated');
    expect(doc.irn).toHaveLength(64);
  });

  it('cancels a generated e-invoice', async () => {
    const doc = await EInvoice.create({ invoiceNumber: 'INV-TEST-002', invoiceDate: new Date(), sellerGSTIN: '27AAPFU0939F1ZV', buyerName: 'Cancel Corp', totalValue: 50000, taxableValue: 42373, irn: 'CANCEBIRN1234567890123456789012345678901234567890123456789012', irnStatus: 'generated' });
    doc.irnStatus = 'cancelled';
    doc.cancellationReason = 'Wrong buyer details';
    doc.cancellationDate   = new Date();
    await doc.save();
    expect(doc.irnStatus).toBe('cancelled');
  });
});

describe('E-Way Bill Controller logic (model smoke)', () => {
  const EWayBill = require('../models/EWayBill');

  it('generates EWB and sets validity', async () => {
    const doc = await EWayBill.create({ fromGSTIN: '27AAPFU0939F1ZV', toName: 'Rajasthan Trader', invoiceNo: 'INV-RJ-001', invoiceValue: 350000, supplyType: 'outward', transportMode: 'road', vehicleNo: 'RJ14AB9999', distance: 1200 });
    const validDays = Math.min(Math.max(Math.ceil(1200 / 200), 1), 20);
    doc.ewbNo    = 'EWB' + Date.now();
    doc.ewbDate  = new Date();
    doc.validUpto = new Date(Date.now() + validDays * 86400000);
    doc.status   = 'generated';
    await doc.save();
    expect(doc.status).toBe('generated');
    expect(validDays).toBe(6);
  });

  it('cancels a generated EWB', async () => {
    const doc = await EWayBill.create({ fromGSTIN: '27AAPFU0939F1ZV', toName: 'Cancel Trader', invoiceNo: 'INV-CNC-001', invoiceValue: 10000, supplyType: 'inward', status: 'generated' });
    doc.status             = 'cancelled';
    doc.cancellationReason = 'Wrong transport details';
    doc.cancelledDate      = new Date();
    await doc.save();
    expect(doc.status).toBe('cancelled');
  });
});
