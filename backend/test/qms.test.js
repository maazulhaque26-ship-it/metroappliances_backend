'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_qms';

beforeAll(async () => {
  await mongoose.connect(DB_URI);
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const col of collections) await col.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// ── 1. InspectionPlan ─────────────────────────────────────────────────────────
describe('InspectionPlan', () => {
  const InspectionPlan = require('../models/InspectionPlan');

  it('auto-generates planNumber', async () => {
    const plan = await InspectionPlan.create({ name: 'Final Inspection', inspectionType: 'final' });
    expect(plan.planNumber).toMatch(/^IP-\d{4}-\d{5}$/);
  });

  it('defaults status to draft', async () => {
    const plan = await InspectionPlan.create({ name: 'Incoming QC', inspectionType: 'incoming' });
    expect(plan.status).toBe('draft');
  });

  it('rejects missing name', async () => {
    await expect(InspectionPlan.create({ inspectionType: 'final' })).rejects.toThrow();
  });
});

// ── 2. InspectionCharacteristic ───────────────────────────────────────────────
describe('InspectionCharacteristic', () => {
  const InspectionPlan           = require('../models/InspectionPlan');
  const InspectionCharacteristic = require('../models/InspectionCharacteristic');

  it('creates characteristic linked to plan', async () => {
    const plan = await InspectionPlan.create({ name: 'Plan A', inspectionType: 'final' });
    const char = await InspectionCharacteristic.create({ inspectionPlan: plan._id, characteristicName: 'Diameter', characteristicType: 'measurement' });
    expect(char.characteristicName).toBe('Diameter');
    expect(char.inspectionPlan.toString()).toBe(plan._id.toString());
  });

  it('defaults isCritical to false', async () => {
    const plan = await InspectionPlan.create({ name: 'Plan B', inspectionType: 'in_process' });
    const char = await InspectionCharacteristic.create({ inspectionPlan: plan._id, characteristicName: 'Surface Finish' });
    expect(char.isCritical).toBe(false);
  });

  it('rejects missing characteristicName', async () => {
    const plan = await InspectionPlan.create({ name: 'Plan C', inspectionType: 'final' });
    await expect(InspectionCharacteristic.create({ inspectionPlan: plan._id })).rejects.toThrow();
  });
});

// ── 3. InspectionMethod ───────────────────────────────────────────────────────
describe('InspectionMethod', () => {
  const InspectionMethod = require('../models/InspectionMethod');

  it('auto-generates code', async () => {
    const method = await InspectionMethod.create({ name: 'Visual Check', methodType: 'visual' });
    expect(method.code).toMatch(/^IM-\d{4}$/);
  });

  it('rejects missing name', async () => {
    await expect(InspectionMethod.create({ methodType: 'visual' })).rejects.toThrow();
  });
});

// ── 4. InspectionLot ─────────────────────────────────────────────────────────
describe('InspectionLot', () => {
  const InspectionLot = require('../models/InspectionLot');

  it('auto-generates lotNumber', async () => {
    const lot = await InspectionLot.create({ lotSize: 100, inspectionType: 'incoming', source: 'purchase' });
    expect(lot.lotNumber).toMatch(/^IL-\d{4}-\d{5}$/);
  });

  it('defaults status to pending', async () => {
    const lot = await InspectionLot.create({ lotSize: 50, inspectionType: 'final', source: 'production' });
    expect(lot.status).toBe('pending');
  });

  it('rejects lotSize less than 1', async () => {
    await expect(InspectionLot.create({ lotSize: 0, inspectionType: 'incoming', source: 'purchase' })).rejects.toThrow();
  });
});

// ── 5. InspectionResult ───────────────────────────────────────────────────────
describe('InspectionResult', () => {
  const InspectionLot    = require('../models/InspectionLot');
  const InspectionResult = require('../models/InspectionResult');

  it('auto-generates resultNumber', async () => {
    const lot = await InspectionLot.create({ lotSize: 100, inspectionType: 'final', source: 'production' });
    const result = await InspectionResult.create({ inspectionLot: lot._id, measuredValue: 10.5 });
    expect(result.resultNumber).toMatch(/^IR-\d{4}-\d{5}$/);
  });

  it('defaults result to pending', async () => {
    const lot = await InspectionLot.create({ lotSize: 50, inspectionType: 'in_process', source: 'production' });
    const result = await InspectionResult.create({ inspectionLot: lot._id });
    expect(result.result).toBe('pending');
  });

  it('rejects missing inspectionLot', async () => {
    await expect(InspectionResult.create({ measuredValue: 5 })).rejects.toThrow();
  });
});

// ── 6. QualityCertificate ─────────────────────────────────────────────────────
describe('QualityCertificate', () => {
  const QualityCertificate = require('../models/QualityCertificate');

  it('auto-generates certificateNumber', async () => {
    const cert = await QualityCertificate.create({ certificateType: 'coa', title: 'COA for Batch 001' });
    expect(cert.certificateNumber).toMatch(/^QC-\d{4}-\d{5}$/);
  });

  it('defaults status to draft', async () => {
    const cert = await QualityCertificate.create({ certificateType: 'conformance', title: 'Conformance Cert' });
    expect(cert.status).toBe('draft');
  });

  it('rejects missing title', async () => {
    await expect(QualityCertificate.create({ certificateType: 'coa' })).rejects.toThrow();
  });
});

// ── 7. CAPA ──────────────────────────────────────────────────────────────────
describe('CAPA', () => {
  const CAPA = require('../models/CAPA');

  it('auto-generates capaNumber', async () => {
    const capa = await CAPA.create({ capaType: 'corrective', title: 'Fix process deviation' });
    expect(capa.capaNumber).toMatch(/^CAPA-\d{4}-\d{5}$/);
  });

  it('defaults status to open', async () => {
    const capa = await CAPA.create({ capaType: 'preventive', title: 'Prevent future issues' });
    expect(capa.status).toBe('open');
  });

  it('defaults severity to medium', async () => {
    const capa = await CAPA.create({ capaType: 'both', title: 'Combined action' });
    expect(capa.severity).toBe('medium');
  });

  it('rejects missing capaType', async () => {
    await expect(CAPA.create({ title: 'No type' })).rejects.toThrow();
  });
});

// ── 8. NCReport ──────────────────────────────────────────────────────────────
describe('NCReport', () => {
  const NCReport = require('../models/NCReport');

  it('auto-generates ncNumber', async () => {
    const ncr = await NCReport.create({ ncType: 'major', title: 'Surface defect', quantity: 10 });
    expect(ncr.ncNumber).toMatch(/^NCR-\d{4}-\d{5}$/);
  });

  it('defaults status to open', async () => {
    const ncr = await NCReport.create({ ncType: 'minor', title: 'Minor cosmetic', quantity: 5 });
    expect(ncr.status).toBe('open');
  });

  it('rejects missing quantity', async () => {
    await expect(NCReport.create({ ncType: 'major', title: 'No qty' })).rejects.toThrow();
  });
});

// ── 9. RootCauseAnalysis ─────────────────────────────────────────────────────
describe('RootCauseAnalysis', () => {
  const CAPA              = require('../models/CAPA');
  const RootCauseAnalysis = require('../models/RootCauseAnalysis');

  it('auto-generates rcaNumber', async () => {
    const capa = await CAPA.create({ capaType: 'corrective', title: 'Test CAPA' });
    const rca  = await RootCauseAnalysis.create({ capa: capa._id, method: '5why', problemStatement: 'Machine jams' });
    expect(rca.rcaNumber).toMatch(/^RCA-\d{4}-\d{5}$/);
  });

  it('defaults status to open', async () => {
    const rca = await RootCauseAnalysis.create({ method: 'fishbone', problemStatement: 'Quality drop' });
    expect(rca.status).toBe('open');
  });

  it('rejects missing method', async () => {
    await expect(RootCauseAnalysis.create({ problemStatement: 'Some problem' })).rejects.toThrow();
  });
});

// ── 10. CorrectiveAction ─────────────────────────────────────────────────────
describe('CorrectiveAction', () => {
  const CAPA             = require('../models/CAPA');
  const CorrectiveAction = require('../models/CorrectiveAction');

  it('auto-generates actionNumber', async () => {
    const capa = await CAPA.create({ capaType: 'corrective', title: 'Test CAPA' });
    const ca   = await CorrectiveAction.create({ capa: capa._id, title: 'Retrain operators' });
    expect(ca.actionNumber).toMatch(/^CA-\d{4}-\d{5}$/);
  });

  it('defaults status to open', async () => {
    const capa = await CAPA.create({ capaType: 'preventive', title: 'PA CAPA' });
    const ca   = await CorrectiveAction.create({ capa: capa._id, title: 'Update SOP' });
    expect(ca.status).toBe('open');
  });

  it('rejects missing capa reference', async () => {
    await expect(CorrectiveAction.create({ title: 'No CAPA' })).rejects.toThrow();
  });
});

// ── 11. PreventiveAction ─────────────────────────────────────────────────────
describe('PreventiveAction', () => {
  const PreventiveAction = require('../models/PreventiveAction');

  it('auto-generates paNumber', async () => {
    const pa = await PreventiveAction.create({ title: 'Implement poka-yoke' });
    expect(pa.paNumber).toMatch(/^PA-\d{4}-\d{5}$/);
  });

  it('defaults riskArea to process', async () => {
    const pa = await PreventiveAction.create({ title: 'Risk mitigation' });
    expect(pa.riskArea).toBe('process');
  });

  it('rejects missing title', async () => {
    await expect(PreventiveAction.create({ riskArea: 'equipment' })).rejects.toThrow();
  });
});

// ── 12. AuditProgram ─────────────────────────────────────────────────────────
describe('AuditProgram', () => {
  const AuditProgram = require('../models/AuditProgram');

  it('auto-generates programNumber', async () => {
    const program = await AuditProgram.create({ name: 'Annual Audit 2026', year: 2026 });
    expect(program.programNumber).toMatch(/^AP-\d{4}-\d{4}$/);
  });

  it('defaults status to planning', async () => {
    const program = await AuditProgram.create({ name: 'ISO Audit', year: 2026 });
    expect(program.status).toBe('planning');
  });

  it('rejects missing year', async () => {
    await expect(AuditProgram.create({ name: 'No Year Program' })).rejects.toThrow();
  });
});

// ── 13. QualityAudit ─────────────────────────────────────────────────────────
describe('QualityAudit', () => {
  const QualityAudit = require('../models/QualityAudit');

  it('auto-generates auditNumber', async () => {
    const audit = await QualityAudit.create({ auditType: 'internal', title: 'Q1 Audit', plannedDate: new Date() });
    expect(audit.auditNumber).toMatch(/^QA-\d{4}-\d{5}$/);
  });

  it('defaults status to planned', async () => {
    const audit = await QualityAudit.create({ auditType: 'supplier', title: 'Vendor Audit', plannedDate: new Date() });
    expect(audit.status).toBe('planned');
  });

  it('rejects missing plannedDate', async () => {
    await expect(QualityAudit.create({ auditType: 'internal', title: 'No Date' })).rejects.toThrow();
  });
});

// ── 14. AuditFinding ─────────────────────────────────────────────────────────
describe('AuditFinding', () => {
  const QualityAudit = require('../models/QualityAudit');
  const AuditFinding = require('../models/AuditFinding');

  it('auto-generates findingNumber', async () => {
    const audit   = await QualityAudit.create({ auditType: 'internal', title: 'Audit X', plannedDate: new Date() });
    const finding = await AuditFinding.create({ qualityAudit: audit._id, findingType: 'major_nc', title: 'No procedure' });
    expect(finding.findingNumber).toMatch(/^AF-\d{4}-\d{5}$/);
  });

  it('defaults status to open', async () => {
    const audit   = await QualityAudit.create({ auditType: 'internal', title: 'Audit Y', plannedDate: new Date() });
    const finding = await AuditFinding.create({ qualityAudit: audit._id, findingType: 'observation', title: 'Risk area' });
    expect(finding.status).toBe('open');
  });

  it('rejects missing qualityAudit', async () => {
    await expect(AuditFinding.create({ findingType: 'minor_nc', title: 'Orphan finding' })).rejects.toThrow();
  });
});

// ── 15. SupplierQualityRecord ─────────────────────────────────────────────────
describe('SupplierQualityRecord', () => {
  const mongoose             = require('mongoose');
  const SupplierQualityRecord = require('../models/SupplierQualityRecord');
  const fakeVendor           = new mongoose.Types.ObjectId();

  it('auto-generates recordNumber', async () => {
    const rec = await SupplierQualityRecord.create({ vendor: fakeVendor, recordType: 'evaluation' });
    expect(rec.recordNumber).toMatch(/^SQR-\d{4}-\d{5}$/);
  });

  it('defaults supplierStatus to under_evaluation', async () => {
    const rec = await SupplierQualityRecord.create({ vendor: fakeVendor, recordType: 'audit' });
    expect(rec.supplierStatus).toBe('under_evaluation');
  });

  it('rejects missing vendor', async () => {
    await expect(SupplierQualityRecord.create({ recordType: 'evaluation' })).rejects.toThrow();
  });
});

// ── 16. Gauge ────────────────────────────────────────────────────────────────
describe('Gauge', () => {
  const Gauge = require('../models/Gauge');

  it('auto-generates gaugeNumber', async () => {
    const gauge = await Gauge.create({ name: 'Vernier Caliper 150mm', gaugeType: 'caliper' });
    expect(gauge.gaugeNumber).toMatch(/^GG-\d{4}-\d{5}$/);
  });

  it('defaults calibrationStatus to calibrated', async () => {
    const gauge = await Gauge.create({ name: 'Micrometer 0-25mm', gaugeType: 'micrometer' });
    expect(gauge.calibrationStatus).toBe('calibrated');
  });

  it('defaults status to in_service', async () => {
    const gauge = await Gauge.create({ name: 'Dial Indicator', gaugeType: 'dial_indicator' });
    expect(gauge.status).toBe('in_service');
  });

  it('rejects missing gaugeType', async () => {
    await expect(Gauge.create({ name: 'Unknown Gauge' })).rejects.toThrow();
  });
});

// ── 17. GaugeHistory ─────────────────────────────────────────────────────────
describe('GaugeHistory', () => {
  const Gauge        = require('../models/Gauge');
  const GaugeHistory = require('../models/GaugeHistory');

  it('creates gauge history entry', async () => {
    const gauge = await Gauge.create({ name: 'Test Gauge', gaugeType: 'caliper' });
    const hist  = await GaugeHistory.create({ gauge: gauge._id, gaugeNumber: gauge.gaugeNumber, eventType: 'calibration', calibrationResult: 'pass' });
    expect(hist.eventType).toBe('calibration');
    expect(hist.calibrationResult).toBe('pass');
  });

  it('rejects missing gauge reference', async () => {
    await expect(GaugeHistory.create({ eventType: 'calibration' })).rejects.toThrow();
  });
});

// ── 18. CalibrationRecord ─────────────────────────────────────────────────────
describe('CalibrationRecord', () => {
  const Gauge             = require('../models/Gauge');
  const CalibrationRecord = require('../models/CalibrationRecord');

  it('auto-generates recordNumber', async () => {
    const gauge  = await Gauge.create({ name: 'Caliper 1', gaugeType: 'caliper' });
    const record = await CalibrationRecord.create({ gauge: gauge._id, gaugeName: gauge.name, gaugeNumber: gauge.gaugeNumber, calibrationDate: new Date(), overallResult: 'pass' });
    expect(record.recordNumber).toMatch(/^CR-\d{4}-\d{5}$/);
  });

  it('rejects missing overallResult', async () => {
    const gauge = await Gauge.create({ name: 'Caliper 2', gaugeType: 'caliper' });
    await expect(CalibrationRecord.create({ gauge: gauge._id, calibrationDate: new Date() })).rejects.toThrow();
  });

  it('rejects missing gauge', async () => {
    await expect(CalibrationRecord.create({ calibrationDate: new Date(), overallResult: 'pass' })).rejects.toThrow();
  });
});

// ── 19. CalibrationSchedule ───────────────────────────────────────────────────
describe('CalibrationSchedule', () => {
  const Gauge               = require('../models/Gauge');
  const CalibrationSchedule = require('../models/CalibrationSchedule');

  it('auto-generates scheduleNumber', async () => {
    const gauge    = await Gauge.create({ name: 'Gauge A', gaugeType: 'micrometer' });
    const schedule = await CalibrationSchedule.create({ gauge: gauge._id, scheduledDate: new Date(), dueDate: new Date() });
    expect(schedule.scheduleNumber).toMatch(/^CS-\d{4}-\d{5}$/);
  });

  it('defaults status to scheduled', async () => {
    const gauge    = await Gauge.create({ name: 'Gauge B', gaugeType: 'caliper' });
    const schedule = await CalibrationSchedule.create({ gauge: gauge._id, scheduledDate: new Date(), dueDate: new Date() });
    expect(schedule.status).toBe('scheduled');
  });

  it('rejects missing dueDate', async () => {
    const gauge = await Gauge.create({ name: 'Gauge C', gaugeType: 'caliper' });
    await expect(CalibrationSchedule.create({ gauge: gauge._id, scheduledDate: new Date() })).rejects.toThrow();
  });
});

// ── 20. QualityAlert ─────────────────────────────────────────────────────────
describe('QualityAlert', () => {
  const QualityAlert = require('../models/QualityAlert');

  it('auto-generates alertNumber', async () => {
    const alert = await QualityAlert.create({ alertType: 'defect_spike', severity: 'critical', title: 'Spike detected' });
    expect(alert.alertNumber).toMatch(/^QALT-\d{4}-\d{5}$/);
  });

  it('defaults status to open', async () => {
    const alert = await QualityAlert.create({ alertType: 'ncr_rate', severity: 'warning', title: 'NCR rate high' });
    expect(alert.status).toBe('open');
  });

  it('rejects missing severity', async () => {
    await expect(QualityAlert.create({ alertType: 'defect_spike', title: 'No severity' })).rejects.toThrow();
  });
});

// ── 21. DocumentControl ───────────────────────────────────────────────────────
describe('DocumentControl', () => {
  const DocumentControl = require('../models/DocumentControl');

  it('auto-generates documentNumber', async () => {
    const doc = await DocumentControl.create({ title: 'Quality Manual', documentType: 'manual' });
    expect(doc.documentNumber).toMatch(/^DOC-\d{4}-\d{5}$/);
  });

  it('defaults status to draft', async () => {
    const doc = await DocumentControl.create({ title: 'SOP 001', documentType: 'procedure' });
    expect(doc.status).toBe('draft');
  });

  it('rejects missing documentType', async () => {
    await expect(DocumentControl.create({ title: 'No type doc' })).rejects.toThrow();
  });
});

// ── 22. RevisionHistory ───────────────────────────────────────────────────────
describe('RevisionHistory', () => {
  const DocumentControl  = require('../models/DocumentControl');
  const RevisionHistory  = require('../models/RevisionHistory');

  it('creates revision history for a document', async () => {
    const doc = await DocumentControl.create({ title: 'Work Instruction 001', documentType: 'work_instruction' });
    const rev = await RevisionHistory.create({ document: doc._id, documentNumber: doc.documentNumber, revision: 'B', changeDescription: 'Added safety steps', revisionType: 'major' });
    expect(rev.revision).toBe('B');
    expect(rev.revisionType).toBe('major');
  });

  it('rejects missing document reference', async () => {
    await expect(RevisionHistory.create({ revision: 'A', changeDescription: 'Initial' })).rejects.toThrow();
  });

  it('rejects missing changeDescription', async () => {
    const doc = await DocumentControl.create({ title: 'SOP X', documentType: 'procedure' });
    await expect(RevisionHistory.create({ document: doc._id, revision: 'A' })).rejects.toThrow();
  });
});
