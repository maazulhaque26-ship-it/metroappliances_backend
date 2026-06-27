'use strict';
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/metro_test_pmo';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
  // Register all PMO models
  require('../models/PMOGovernanceBoard');
  require('../models/PMODecisionLog');
  require('../models/PMOSteeringCommittee');
  require('../models/PMOComplianceItem');
  require('../models/PMOBusinessCase');
  require('../models/PMOInvestmentRequest');
  require('../models/PMOProjectCharter');
  require('../models/PMOLessonsLearned');
  require('../models/PMOTemplate');
  require('../models/PMODocument');
  require('../models/PMOProjectAudit');
  require('../models/PMOProjectScorecard');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const Board       = () => mongoose.model('PMOGovernanceBoard');
const Decision    = () => mongoose.model('PMODecisionLog');
const Committee   = () => mongoose.model('PMOSteeringCommittee');
const Compliance  = () => mongoose.model('PMOComplianceItem');
const BizCase     = () => mongoose.model('PMOBusinessCase');
const InvRequest  = () => mongoose.model('PMOInvestmentRequest');
const Charter     = () => mongoose.model('PMOProjectCharter');
const Lesson      = () => mongoose.model('PMOLessonsLearned');
const Template    = () => mongoose.model('PMOTemplate');
const Document    = () => mongoose.model('PMODocument');
const Audit       = () => mongoose.model('PMOProjectAudit');
const Scorecard   = () => mongoose.model('PMOProjectScorecard');

// ── PMOGovernanceBoard ────────────────────────────────────────────────────────
describe('PMOGovernanceBoard', () => {
  it('creates a board with auto-generated boardCode', async () => {
    const board = await Board().create({ name: 'Portfolio Review Board', boardType: 'portfolio_review' });
    expect(board.boardCode).toMatch(/^GB-\d{4}-\d{5}$/);
    expect(board.status).toBe('active');
  });

  it('increments boardCode sequentially', async () => {
    const b1 = await Board().create({ name: 'Board 1' });
    const b2 = await Board().create({ name: 'Board 2' });
    const seq1 = parseInt(b1.boardCode.split('-')[2], 10);
    const seq2 = parseInt(b2.boardCode.split('-')[2], 10);
    expect(seq2).toBe(seq1 + 1);
  });

  it('requires name', async () => {
    await expect(Board().create({ boardType: 'portfolio_review' })).rejects.toThrow();
  });

  it('soft-deletes board', async () => {
    const board = await Board().create({ name: 'Board to Delete' });
    await Board().findByIdAndUpdate(board._id, { isDeleted: true });
    const found = await Board().findOne({ _id: board._id, isDeleted: false });
    expect(found).toBeNull();
  });

  it('validates meetingFrequency enum', async () => {
    await expect(Board().create({ name: 'Bad Board', meetingFrequency: 'invalid' })).rejects.toThrow();
  });
});

// ── PMODecisionLog ────────────────────────────────────────────────────────────
describe('PMODecisionLog', () => {
  it('creates decision with auto code', async () => {
    const d = await Decision().create({ title: 'Approve Phase 1 Budget', decisionType: 'budget', status: 'proposed' });
    expect(d.decisionCode).toMatch(/^DL-\d{4}-\d{5}$/);
  });

  it('defaults status to proposed', async () => {
    const d = await Decision().create({ title: 'Some Decision' });
    expect(d.status).toBe('proposed');
  });

  it('validates status enum', async () => {
    await expect(Decision().create({ title: 'Bad', status: 'invalid_status' })).rejects.toThrow();
  });

  it('validates decisionType enum', async () => {
    await expect(Decision().create({ title: 'Bad', decisionType: 'unknown' })).rejects.toThrow();
  });

  it('stores rationale and impact', async () => {
    const d = await Decision().create({ title: 'D1', rationale: 'Cost savings', impact: 'High impact' });
    expect(d.rationale).toBe('Cost savings');
    expect(d.impact).toBe('High impact');
  });
});

// ── PMOSteeringCommittee ──────────────────────────────────────────────────────
describe('PMOSteeringCommittee', () => {
  it('creates committee with auto code', async () => {
    const c = await Committee().create({ name: 'Executive Steering Committee' });
    expect(c.committeeCode).toMatch(/^SC-\d{4}-\d{5}$/);
    expect(c.status).toBe('active');
  });

  it('allows adding meetings as subdocuments', async () => {
    const c = await Committee().create({ name: 'SC-1', meetings: [{ date: new Date(), agenda: 'Q1 Review', status: 'scheduled' }] });
    expect(c.meetings).toHaveLength(1);
    expect(c.meetings[0].agenda).toBe('Q1 Review');
  });

  it('validates meeting status enum', async () => {
    await expect(Committee().create({ name: 'SC', meetings: [{ date: new Date(), status: 'invalid' }] })).rejects.toThrow();
  });
});

// ── PMOComplianceItem ─────────────────────────────────────────────────────────
describe('PMOComplianceItem', () => {
  it('creates compliance item with auto code', async () => {
    const c = await Compliance().create({ title: 'GDPR Compliance', category: 'regulatory', status: 'under_review', severity: 'high' });
    expect(c.complianceCode).toMatch(/^CI-\d{4}-\d{5}$/);
  });

  it('validates severity enum', async () => {
    await expect(Compliance().create({ title: 'Bad', severity: 'extreme' })).rejects.toThrow();
  });

  it('validates status enum', async () => {
    await expect(Compliance().create({ title: 'Bad', status: 'unknown' })).rejects.toThrow();
  });

  it('stores remediation plan', async () => {
    const c = await Compliance().create({ title: 'C1', remediationPlan: 'Update policies by Q3' });
    expect(c.remediationPlan).toBe('Update policies by Q3');
  });
});

// ── PMOBusinessCase ───────────────────────────────────────────────────────────
describe('PMOBusinessCase', () => {
  it('creates business case with auto code', async () => {
    const bc = await BizCase().create({ title: 'Digital Transformation Initiative', status: 'draft', estimatedCost: 5000000, estimatedBenefit: 15000000 });
    expect(bc.caseCode).toMatch(/^BC-\d{4}-\d{5}$/);
    expect(bc.estimatedCost).toBe(5000000);
  });

  it('validates status enum', async () => {
    await expect(BizCase().create({ title: 'Bad', status: 'pending' })).rejects.toThrow();
  });

  it('stores ROI and payback period', async () => {
    const bc = await BizCase().create({ title: 'BC1', roi: 200, paybackPeriod: 18 });
    expect(bc.roi).toBe(200);
    expect(bc.paybackPeriod).toBe(18);
  });

  it('defaults priority to medium', async () => {
    const bc = await BizCase().create({ title: 'BC2' });
    expect(bc.priority).toBe('medium');
  });
});

// ── PMOInvestmentRequest ──────────────────────────────────────────────────────
describe('PMOInvestmentRequest', () => {
  it('creates investment request with auto code', async () => {
    const ir = await InvRequest().create({ title: 'New ERP System', requestType: 'technology', requestedAmount: 2500000 });
    expect(ir.requestCode).toMatch(/^IR-\d{4}-\d{5}$/);
    expect(ir.requestedAmount).toBe(2500000);
  });

  it('sets current fiscal year by default', async () => {
    const ir = await InvRequest().create({ title: 'IR1', requestedAmount: 100000 });
    expect(ir.fiscalYear).toBe(new Date().getFullYear());
  });

  it('validates requestType enum', async () => {
    await expect(InvRequest().create({ title: 'Bad', requestedAmount: 0, requestType: 'invalid' })).rejects.toThrow();
  });

  it('allows approval with approvedAmount', async () => {
    const ir = await InvRequest().create({ title: 'IR2', requestedAmount: 500000, status: 'submitted' });
    const updated = await InvRequest().findByIdAndUpdate(ir._id, { status: 'approved', approvedAmount: 450000 }, { new: true });
    expect(updated.status).toBe('approved');
    expect(updated.approvedAmount).toBe(450000);
  });
});

// ── PMOProjectCharter ─────────────────────────────────────────────────────────
describe('PMOProjectCharter', () => {
  it('requires project reference', async () => {
    await expect(Charter().create({ version: '1.0' })).rejects.toThrow();
  });

  it('creates charter with auto code when project is given', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    const c = await Charter().create({ project: fakeProjectId, version: '1.0', status: 'draft' });
    expect(c.charterCode).toMatch(/^PC-\d{4}-\d{5}$/);
  });

  it('stores stakeholders as subdocuments', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    const c = await Charter().create({
      project: fakeProjectId,
      stakeholders: [{ name: 'Jane Doe', role: 'Sponsor', interest: 'High' }],
    });
    expect(c.stakeholders[0].name).toBe('Jane Doe');
  });

  it('validates status enum', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    await expect(Charter().create({ project: fakeProjectId, status: 'invalid' })).rejects.toThrow();
  });
});

// ── PMOLessonsLearned ─────────────────────────────────────────────────────────
describe('PMOLessonsLearned', () => {
  it('creates lesson with auto code', async () => {
    const l = await Lesson().create({ title: 'Communication improved delivery', type: 'success', category: 'communication' });
    expect(l.lessonCode).toMatch(/^LL-\d{4}-\d{5}$/);
    expect(l.isApproved).toBe(false);
  });

  it('defaults to not approved', async () => {
    const l = await Lesson().create({ title: 'L1' });
    expect(l.isApproved).toBe(false);
  });

  it('can be approved', async () => {
    const l = await Lesson().create({ title: 'L2' });
    const updated = await Lesson().findByIdAndUpdate(l._id, { isApproved: true }, { new: true });
    expect(updated.isApproved).toBe(true);
  });

  it('validates type enum', async () => {
    await expect(Lesson().create({ title: 'Bad', type: 'unknown' })).rejects.toThrow();
  });

  it('validates impact enum', async () => {
    await expect(Lesson().create({ title: 'Bad', impact: 'extreme' })).rejects.toThrow();
  });
});

// ── PMOTemplate ───────────────────────────────────────────────────────────────
describe('PMOTemplate', () => {
  it('creates template with auto code', async () => {
    const t = await Template().create({ name: 'Project Charter Template', category: 'project_charter', methodology: 'pmbok' });
    expect(t.templateCode).toMatch(/^TPL-\d{4}-\d{5}$/);
    expect(t.usageCount).toBe(0);
  });

  it('validates methodology enum', async () => {
    await expect(Template().create({ name: 'Bad', methodology: 'scrum' })).rejects.toThrow();
  });

  it('defaults status to active', async () => {
    const t = await Template().create({ name: 'T1' });
    expect(t.status).toBe('active');
  });

  it('stores sections as subdocuments', async () => {
    const t = await Template().create({ name: 'T2', sections: [{ title: 'Intro', content: 'Hello', order: 1 }] });
    expect(t.sections[0].title).toBe('Intro');
  });
});

// ── PMODocument ───────────────────────────────────────────────────────────────
describe('PMODocument', () => {
  it('creates document with auto code', async () => {
    const d = await Document().create({ title: 'Charter v1.0', documentType: 'charter', status: 'draft' });
    expect(d.documentCode).toMatch(/^DOC-\d{4}-\d{5}$/);
  });

  it('defaults accessLevel to internal', async () => {
    const d = await Document().create({ title: 'D1' });
    expect(d.accessLevel).toBe('internal');
  });

  it('validates status enum', async () => {
    await expect(Document().create({ title: 'Bad', status: 'pending' })).rejects.toThrow();
  });

  it('validates accessLevel enum', async () => {
    await expect(Document().create({ title: 'Bad', accessLevel: 'top_secret' })).rejects.toThrow();
  });
});

// ── PMOProjectAudit ───────────────────────────────────────────────────────────
describe('PMOProjectAudit', () => {
  it('requires project reference', async () => {
    await expect(Audit().create({ title: 'Health Check' })).rejects.toThrow();
  });

  it('creates audit with auto code', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    const a = await Audit().create({ title: 'Q1 Audit', project: fakeProjectId, auditType: 'health_check' });
    expect(a.auditCode).toMatch(/^AUD-\d{4}-\d{5}$/);
    expect(a.status).toBe('planned');
  });

  it('stores findings as subdocuments', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    const a = await Audit().create({
      title: 'Audit 1', project: fakeProjectId,
      findings: [{ area: 'Schedule', finding: 'Delay in Phase 1', severity: 'high', status: 'open' }],
    });
    expect(a.findings).toHaveLength(1);
    expect(a.findings[0].severity).toBe('high');
  });

  it('validates overallRating enum', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    await expect(Audit().create({ title: 'A', project: fakeProjectId, overallRating: 'perfect' })).rejects.toThrow();
  });
});

// ── PMOProjectScorecard ───────────────────────────────────────────────────────
describe('PMOProjectScorecard', () => {
  it('requires project reference', async () => {
    await expect(Scorecard().create({ period: '2026-06' })).rejects.toThrow();
  });

  it('requires period', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    await expect(Scorecard().create({ project: fakeProjectId })).rejects.toThrow();
  });

  it('creates scorecard with auto code', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    const sc = await Scorecard().create({ project: fakeProjectId, period: '2026-06', spi: 1.1, cpi: 0.95 });
    expect(sc.scorecardCode).toMatch(/^PSC-\d{4}-\d{5}$/);
  });

  it('auto-computes overallHealth from weighted dimensions', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    const sc = await Scorecard().create({
      project: fakeProjectId, period: '2026-06',
      dimensions: [
        { name: 'Schedule', weight: 3, score: 80 },
        { name: 'Cost', weight: 2, score: 70 },
        { name: 'Scope', weight: 1, score: 90 },
      ],
    });
    expect(sc.overallScore).toBeGreaterThan(0);
    expect(['green', 'amber', 'red']).toContain(sc.overallHealth);
  });

  it('marks health green when score >= 75', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    const sc = await Scorecard().create({
      project: fakeProjectId, period: '2026-07',
      dimensions: [{ name: 'All', weight: 1, score: 90 }],
    });
    expect(sc.overallHealth).toBe('green');
  });

  it('marks health red when score < 50', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    const sc = await Scorecard().create({
      project: fakeProjectId, period: '2026-08',
      dimensions: [{ name: 'All', weight: 1, score: 30 }],
    });
    expect(sc.overallHealth).toBe('red');
  });

  it('stores EV metrics correctly', async () => {
    const fakeProjectId = new mongoose.Types.ObjectId();
    const sc = await Scorecard().create({
      project: fakeProjectId, period: '2026-09',
      ev: 500000, pv: 600000, ac: 520000, bac: 1000000, spi: 0.83, cpi: 0.96,
    });
    expect(sc.ev).toBe(500000);
    expect(sc.spi).toBe(0.83);
    expect(sc.cpi).toBe(0.96);
  });
});

// ── Cross-model: compliance aggregation ──────────────────────────────────────
describe('Compliance Aggregation', () => {
  it('counts non-compliant items correctly', async () => {
    await Compliance().create({ title: 'C1', status: 'non_compliant', severity: 'high' });
    await Compliance().create({ title: 'C2', status: 'compliant', severity: 'medium' });
    await Compliance().create({ title: 'C3', status: 'non_compliant', severity: 'critical' });

    const nonCompliant = await Compliance().countDocuments({ isDeleted: false, status: 'non_compliant' });
    expect(nonCompliant).toBe(2);
  });

  it('groups by severity correctly', async () => {
    await Compliance().create({ title: 'C1', severity: 'critical' });
    await Compliance().create({ title: 'C2', severity: 'critical' });
    await Compliance().create({ title: 'C3', severity: 'high' });

    const bySeverity = await Compliance().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    const critical = bySeverity.find(s => s._id === 'critical');
    expect(critical?.count).toBe(2);
  });
});

// ── Cross-model: investment pipeline ─────────────────────────────────────────
describe('Investment Pipeline', () => {
  it('calculates total investment by status', async () => {
    await InvRequest().create({ title: 'IR1', requestedAmount: 1000000, status: 'approved', approvedAmount: 900000 });
    await InvRequest().create({ title: 'IR2', requestedAmount: 500000, status: 'submitted' });
    await InvRequest().create({ title: 'IR3', requestedAmount: 250000, status: 'rejected' });

    const pipeline = await InvRequest().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', total: { $sum: '$requestedAmount' }, count: { $sum: 1 } } },
    ]);

    const approved = pipeline.find(p => p._id === 'approved');
    expect(approved?.total).toBe(1000000);
    expect(pipeline.length).toBe(3);
  });

  it('calculates approved vs requested variance', async () => {
    await InvRequest().create({ title: 'IR1', requestedAmount: 1000000, approvedAmount: 800000, status: 'approved' });
    const ir = await InvRequest().findOne({ title: 'IR1' }).lean();
    expect(ir.requestedAmount - ir.approvedAmount).toBe(200000);
  });
});

// ── Cross-model: lessons learned report ──────────────────────────────────────
describe('Lessons Learned Report', () => {
  it('aggregates lessons by type', async () => {
    await Lesson().create({ title: 'L1', type: 'success' });
    await Lesson().create({ title: 'L2', type: 'success' });
    await Lesson().create({ title: 'L3', type: 'failure' });
    await Lesson().create({ title: 'L4', type: 'improvement' });

    const byType = await Lesson().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const successes = byType.find(b => b._id === 'success');
    expect(successes?.count).toBe(2);
  });

  it('filters by approved status', async () => {
    await Lesson().create({ title: 'L1', isApproved: true });
    await Lesson().create({ title: 'L2', isApproved: false });
    await Lesson().create({ title: 'L3', isApproved: true });

    const approved = await Lesson().countDocuments({ isApproved: true });
    expect(approved).toBe(2);
  });
});

// ── Cross-model: audit findings severity ─────────────────────────────────────
describe('Audit Findings Severity', () => {
  it('counts open critical findings across audits', async () => {
    const pid = new mongoose.Types.ObjectId();
    await Audit().create({
      title: 'A1', project: pid,
      findings: [
        { area: 'Budget', finding: 'Over budget', severity: 'critical', status: 'open' },
        { area: 'Schedule', finding: 'Delay', severity: 'high', status: 'open' },
      ],
    });
    await Audit().create({
      title: 'A2', project: pid,
      findings: [
        { area: 'Quality', finding: 'Defects', severity: 'critical', status: 'resolved' },
      ],
    });

    const openCritical = await Audit().aggregate([
      { $match: { isDeleted: false } },
      { $unwind: '$findings' },
      { $match: { 'findings.severity': 'critical', 'findings.status': 'open' } },
      { $count: 'count' },
    ]);
    expect(openCritical[0]?.count).toBe(1);
  });
});

// ── Cross-model: scorecard EVM aggregation ────────────────────────────────────
describe('Scorecard EVM Aggregation', () => {
  it('computes average SPI / CPI across projects', async () => {
    const p1 = new mongoose.Types.ObjectId();
    const p2 = new mongoose.Types.ObjectId();
    await Scorecard().create({ project: p1, period: '2026-06', spi: 1.1, cpi: 0.9 });
    await Scorecard().create({ project: p2, period: '2026-06', spi: 0.85, cpi: 1.1 });

    const result = await Scorecard().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, avgSPI: { $avg: '$spi' }, avgCPI: { $avg: '$cpi' } } },
    ]);
    expect(Number(result[0].avgSPI.toFixed(2))).toBe(0.98);
    expect(Number(result[0].avgCPI.toFixed(2))).toBe(1.00);
  });

  it('groups latest scorecard per project', async () => {
    const p1 = new mongoose.Types.ObjectId();
    await Scorecard().create({ project: p1, period: '2026-05', spi: 0.9, cpi: 0.95 });
    await new Promise(r => setTimeout(r, 10));
    await Scorecard().create({ project: p1, period: '2026-06', spi: 1.05, cpi: 1.02 });

    const latest = await Scorecard().aggregate([
      { $match: { isDeleted: false } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$project', spi: { $first: '$spi' }, period: { $first: '$period' } } },
    ]);
    expect(latest[0].period).toBe('2026-06');
    expect(latest[0].spi).toBe(1.05);
  });
});
