const mongoose = require('mongoose');
let mongoServer;

beforeAll(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/metro_test_bi', { serverSelectionTimeoutMS: 3000 });
  } catch {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }
  require('../models/BIDashboard');
  require('../models/BIKPITarget');
  require('../models/BIReport');
  require('../models/BIAlert');
  require('../models/BIBookmark');
});

afterEach(async () => {
  const cols = Object.keys(mongoose.connection.collections);
  for (const c of cols) await mongoose.connection.collections[c].deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

const M = (name) => mongoose.model(name);
const BIDashboard  = () => M('BIDashboard');
const BIKPITarget  = () => M('BIKPITarget');
const BIReport     = () => M('BIReport');
const BIAlert      = () => M('BIAlert');
const BIBookmark   = () => M('BIBookmark');
const fakeUser     = new mongoose.Types.ObjectId();

// ─────────────────────────────────────────────────────────────────────────────
describe('BIDashboard', () => {
  it('auto-generates dashboardCode with BID- prefix', async () => {
    const d = await BIDashboard().create({ name: 'Test Dashboard' });
    expect(d.dashboardCode).toMatch(/^BID-\d{4}-\d{5}$/);
  });

  it('requires name', async () => {
    await expect(BIDashboard().create({})).rejects.toThrow();
  });

  it('defaults dashboardType to custom', async () => {
    const d = await BIDashboard().create({ name: 'D1' });
    expect(d.dashboardType).toBe('custom');
  });

  it('accepts all dashboardType enum values', async () => {
    const types = ['ceo','coo','cfo','chro','operations','manufacturing','supply_chain','sales','customer','projects','enterprise'];
    for (const t of types) {
      const d = await BIDashboard().create({ name: `D-${t}`, dashboardType: t });
      expect(d.dashboardType).toBe(t);
      await BIDashboard().deleteOne({ _id: d._id });
    }
  });

  it('defaults isDefault to false', async () => {
    const d = await BIDashboard().create({ name: 'D1' });
    expect(d.isDefault).toBe(false);
  });

  it('defaults isShared to false', async () => {
    const d = await BIDashboard().create({ name: 'D1' });
    expect(d.isShared).toBe(false);
  });

  it('defaults refreshInterval to 15', async () => {
    const d = await BIDashboard().create({ name: 'D1' });
    expect(d.refreshInterval).toBe(15);
  });

  it('defaults viewCount to 0', async () => {
    const d = await BIDashboard().create({ name: 'D1' });
    expect(d.viewCount).toBe(0);
  });

  it('saves widgets array', async () => {
    const d = await BIDashboard().create({ name: 'D1', widgets: [{ widgetId: 'w1', widgetType: 'metric_card', title: 'Revenue' }] });
    expect(d.widgets).toHaveLength(1);
    expect(d.widgets[0].widgetId).toBe('w1');
  });

  it('saves filters as Mixed', async () => {
    const d = await BIDashboard().create({ name: 'D1', filters: { module: 'sales', period: 'ytd' } });
    expect(d.filters.module).toBe('sales');
    expect(d.filters.period).toBe('ytd');
  });

  it('saves sharedWith array of user refs', async () => {
    const d = await BIDashboard().create({ name: 'D1', isShared: true, sharedWith: [fakeUser] });
    expect(d.sharedWith).toHaveLength(1);
  });

  it('generates unique codes for multiple dashboards', async () => {
    const a = await BIDashboard().create({ name: 'A' });
    const b = await BIDashboard().create({ name: 'B' });
    expect(a.dashboardCode).not.toBe(b.dashboardCode);
  });

  it('rejects invalid dashboardType', async () => {
    await expect(BIDashboard().create({ name: 'D1', dashboardType: 'invalid_type' })).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BIKPITarget', () => {
  it('auto-generates targetCode with BIT- prefix', async () => {
    const t = await BIKPITarget().create({ kpiName: 'revenue', period: '2026-06', targetValue: 5000000 });
    expect(t.targetCode).toMatch(/^BIT-\d{4}-\d{5}$/);
  });

  it('requires kpiName', async () => {
    await expect(BIKPITarget().create({ period: '2026-06', targetValue: 100 })).rejects.toThrow();
  });

  it('requires period', async () => {
    await expect(BIKPITarget().create({ kpiName: 'revenue', targetValue: 100 })).rejects.toThrow();
  });

  it('requires targetValue', async () => {
    await expect(BIKPITarget().create({ kpiName: 'revenue', period: '2026-06' })).rejects.toThrow();
  });

  it('defaults periodType to monthly', async () => {
    const t = await BIKPITarget().create({ kpiName: 'revenue', period: '2026-06', targetValue: 100 });
    expect(t.periodType).toBe('monthly');
  });

  it('accepts quarterly periodType', async () => {
    const t = await BIKPITarget().create({ kpiName: 'otif', period: '2026-Q2', targetValue: 95, periodType: 'quarterly' });
    expect(t.periodType).toBe('quarterly');
  });

  it('accepts annual periodType', async () => {
    const t = await BIKPITarget().create({ kpiName: 'revenue', period: '2026', targetValue: 50000000, periodType: 'annual' });
    expect(t.periodType).toBe('annual');
  });

  it('accepts stretchTarget and minimumTarget', async () => {
    const t = await BIKPITarget().create({ kpiName: 'revenue', period: '2026-06', targetValue: 5000000, stretchTarget: 6000000, minimumTarget: 4000000 });
    expect(t.stretchTarget).toBe(6000000);
    expect(t.minimumTarget).toBe(4000000);
  });

  it('defaults isActive to true', async () => {
    const t = await BIKPITarget().create({ kpiName: 'headcount', period: '2026-06', targetValue: 500 });
    expect(t.isActive).toBe(true);
  });

  it('enforces unique constraint kpiName+period+module', async () => {
    await BIKPITarget().create({ kpiName: 'revenue', period: '2026-06', targetValue: 1000, module: 'enterprise' });
    await expect(BIKPITarget().create({ kpiName: 'revenue', period: '2026-06', targetValue: 2000, module: 'enterprise' })).rejects.toThrow();
  });

  it('accepts different modules for same kpiName+period', async () => {
    await BIKPITarget().create({ kpiName: 'revenue', period: '2026-06', targetValue: 1000, module: 'sales' });
    const t2 = await BIKPITarget().create({ kpiName: 'revenue', period: '2026-06', targetValue: 500, module: 'dealer' });
    expect(t2.module).toBe('dealer');
  });

  it('saves department field', async () => {
    const t = await BIKPITarget().create({ kpiName: 'headcount', period: '2026-06', targetValue: 100, department: 'Engineering' });
    expect(t.department).toBe('Engineering');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BIReport', () => {
  it('auto-generates reportCode with BIR- prefix', async () => {
    const r = await BIReport().create({ name: 'Monthly Board Pack' });
    expect(r.reportCode).toMatch(/^BIR-\d{4}-\d{5}$/);
  });

  it('requires name', async () => {
    await expect(BIReport().create({})).rejects.toThrow();
  });

  it('defaults reportType to custom', async () => {
    const r = await BIReport().create({ name: 'R1' });
    expect(r.reportType).toBe('custom');
  });

  it('accepts board_pack reportType', async () => {
    const r = await BIReport().create({ name: 'Board Pack Q2', reportType: 'board_pack' });
    expect(r.reportType).toBe('board_pack');
  });

  it('defaults generatedCount to 0', async () => {
    const r = await BIReport().create({ name: 'R1' });
    expect(r.generatedCount).toBe(0);
  });

  it('defaults isActive to true', async () => {
    const r = await BIReport().create({ name: 'R1' });
    expect(r.isActive).toBe(true);
  });

  it('defaults isPublic to false', async () => {
    const r = await BIReport().create({ name: 'R1' });
    expect(r.isPublic).toBe(false);
  });

  it('saves modules array', async () => {
    const r = await BIReport().create({ name: 'R1', modules: ['sales','hr','finance'] });
    expect(r.modules).toHaveLength(3);
    expect(r.modules).toContain('hr');
  });

  it('saves schedule configuration', async () => {
    const r = await BIReport().create({ name: 'R1', schedule: { enabled: true, frequency: 'monthly', dayOfMonth: 1, emailTo: ['ceo@example.com'] } });
    expect(r.schedule.enabled).toBe(true);
    expect(r.schedule.frequency).toBe('monthly');
    expect(r.schedule.emailTo).toContain('ceo@example.com');
  });

  it('accepts all reportType enum values', async () => {
    const types = ['board_pack','management_summary','department_scorecard','kpi_report','trend_report','operational','financial'];
    for (const t of types) {
      const r = await BIReport().create({ name: `R-${t}`, reportType: t });
      expect(r.reportType).toBe(t);
      await BIReport().deleteOne({ _id: r._id });
    }
  });

  it('saves config Mixed field', async () => {
    const r = await BIReport().create({ name: 'R1', config: { includeCharts: true, pageSize: 'A4' } });
    expect(r.config.includeCharts).toBe(true);
  });

  it('increments generatedCount', async () => {
    const r = await BIReport().create({ name: 'R1' });
    await BIReport().findByIdAndUpdate(r._id, { $inc: { generatedCount: 1 } });
    const updated = await BIReport().findById(r._id);
    expect(updated.generatedCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BIAlert', () => {
  it('auto-generates alertCode with BIA- prefix', async () => {
    const a = await BIAlert().create({ name: 'Low Revenue Alert', kpiName: 'revenue', condition: 'below', threshold: 1000000 });
    expect(a.alertCode).toMatch(/^BIA-\d{4}-\d{5}$/);
  });

  it('requires name', async () => {
    await expect(BIAlert().create({ kpiName: 'revenue', condition: 'below', threshold: 100 })).rejects.toThrow();
  });

  it('requires kpiName', async () => {
    await expect(BIAlert().create({ name: 'A1', condition: 'below', threshold: 100 })).rejects.toThrow();
  });

  it('requires condition', async () => {
    await expect(BIAlert().create({ name: 'A1', kpiName: 'revenue', threshold: 100 })).rejects.toThrow();
  });

  it('requires threshold', async () => {
    await expect(BIAlert().create({ name: 'A1', kpiName: 'revenue', condition: 'below' })).rejects.toThrow();
  });

  it('defaults severity to warning', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'revenue', condition: 'below', threshold: 100 });
    expect(a.severity).toBe('warning');
  });

  it('accepts critical severity', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'revenue', condition: 'below', threshold: 100, severity: 'critical' });
    expect(a.severity).toBe('critical');
  });

  it('accepts info severity', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'headcount', condition: 'above', threshold: 1000, severity: 'info' });
    expect(a.severity).toBe('info');
  });

  it('defaults isActive to true', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'revenue', condition: 'below', threshold: 100 });
    expect(a.isActive).toBe(true);
  });

  it('defaults triggerCount to 0', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'revenue', condition: 'below', threshold: 100 });
    expect(a.triggerCount).toBe(0);
  });

  it('accepts notifyVia array', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'revenue', condition: 'below', threshold: 100, notifyVia: ['email','socket'] });
    expect(a.notifyVia).toContain('email');
    expect(a.notifyVia).toContain('socket');
  });

  it('accepts emailTo array', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'revenue', condition: 'below', threshold: 100, emailTo: ['cfo@company.com'] });
    expect(a.emailTo).toContain('cfo@company.com');
  });

  it('accepts all condition enum values', async () => {
    const conditions = ['above','below','equals','change_pct_up','change_pct_down'];
    for (const c of conditions) {
      const a = await BIAlert().create({ name: `A-${c}`, kpiName: 'revenue', condition: c, threshold: 100 });
      expect(a.condition).toBe(c);
      await BIAlert().deleteOne({ _id: a._id });
    }
  });

  it('increments triggerCount', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'revenue', condition: 'below', threshold: 100 });
    await BIAlert().findByIdAndUpdate(a._id, { $inc: { triggerCount: 1 }, lastTriggered: new Date() });
    const updated = await BIAlert().findById(a._id);
    expect(updated.triggerCount).toBe(1);
    expect(updated.lastTriggered).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BIBookmark', () => {
  it('auto-generates bookmarkCode with BIB- prefix', async () => {
    const b = await BIBookmark().create({ user: fakeUser, name: 'CEO View', path: '/admin/bi/executive/ceo' });
    expect(b.bookmarkCode).toMatch(/^BIB-\d{4}-\d{5}$/);
  });

  it('requires user', async () => {
    await expect(BIBookmark().create({ name: 'B1', path: '/admin/bi' })).rejects.toThrow();
  });

  it('requires name', async () => {
    await expect(BIBookmark().create({ user: fakeUser, path: '/admin/bi' })).rejects.toThrow();
  });

  it('requires path', async () => {
    await expect(BIBookmark().create({ user: fakeUser, name: 'B1' })).rejects.toThrow();
  });

  it('defaults isDefault to false', async () => {
    const b = await BIBookmark().create({ user: fakeUser, name: 'B1', path: '/admin/bi' });
    expect(b.isDefault).toBe(false);
  });

  it('saves filters as Mixed', async () => {
    const b = await BIBookmark().create({ user: fakeUser, name: 'B1', path: '/admin/bi', filters: { period: 'ytd', module: 'sales' } });
    expect(b.filters.period).toBe('ytd');
  });

  it('saves icon field', async () => {
    const b = await BIBookmark().create({ user: fakeUser, name: 'B1', path: '/admin/bi', icon: 'FiPieChart' });
    expect(b.icon).toBe('FiPieChart');
  });

  it('allows multiple bookmarks per user', async () => {
    await BIBookmark().create({ user: fakeUser, name: 'B1', path: '/admin/bi/executive/ceo' });
    await BIBookmark().create({ user: fakeUser, name: 'B2', path: '/admin/bi/executive/coo' });
    const count = await BIBookmark().countDocuments({ user: fakeUser });
    expect(count).toBe(2);
  });

  it('supports marking a bookmark as default', async () => {
    const b = await BIBookmark().create({ user: fakeUser, name: 'B1', path: '/admin/bi', isDefault: true });
    expect(b.isDefault).toBe(true);
  });

  it('has timestamps', async () => {
    const b = await BIBookmark().create({ user: fakeUser, name: 'B1', path: '/admin/bi' });
    expect(b.createdAt).toBeTruthy();
    expect(b.updatedAt).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Cross-model: BI Configuration Suite', () => {
  it('creates a full BI config set: dashboard + alert + bookmark + target', async () => {
    const [d, a, b, t] = await Promise.all([
      BIDashboard().create({ name: 'CEO Dashboard', dashboardType: 'ceo' }),
      BIAlert().create({ name: 'Revenue Alert', kpiName: 'revenue', condition: 'below', threshold: 1000000, severity: 'critical' }),
      BIBookmark().create({ user: fakeUser, name: 'CEO Quick Link', path: '/admin/bi/executive/ceo' }),
      BIKPITarget().create({ kpiName: 'revenue', period: '2026-06', targetValue: 5000000 }),
    ]);
    expect(d.dashboardCode).toMatch(/^BID-/);
    expect(a.alertCode).toMatch(/^BIA-/);
    expect(b.bookmarkCode).toMatch(/^BIB-/);
    expect(t.targetCode).toMatch(/^BIT-/);
  });

  it('BIDashboard supports widget position + size', async () => {
    const d = await BIDashboard().create({
      name: 'D1',
      widgets: [
        { widgetId: 'w1', widgetType: 'bar_chart', title: 'Revenue Trend', position: { x: 0, y: 0 }, size: { w: 6, h: 3 } },
        { widgetId: 'w2', widgetType: 'metric_card', title: 'Headcount', position: { x: 6, y: 0 }, size: { w: 2, h: 1 } },
      ]
    });
    expect(d.widgets[0].position.x).toBe(0);
    expect(d.widgets[0].size.w).toBe(6);
    expect(d.widgets[1].position.x).toBe(6);
  });

  it('BIKPITarget with all period types', async () => {
    const m = await BIKPITarget().create({ kpiName: 'oee', period: '2026-06', targetValue: 85, periodType: 'monthly', module: 'manufacturing' });
    const q = await BIKPITarget().create({ kpiName: 'oee', period: '2026-Q2', targetValue: 83, periodType: 'quarterly', module: 'manufacturing' });
    const a = await BIKPITarget().create({ kpiName: 'oee', period: '2026', targetValue: 80, periodType: 'annual', module: 'manufacturing' });
    expect(m.periodType).toBe('monthly');
    expect(q.periodType).toBe('quarterly');
    expect(a.periodType).toBe('annual');
  });

  it('BIReport with board_pack and schedule', async () => {
    const r = await BIReport().create({
      name: 'Q2 Board Pack',
      reportType: 'board_pack',
      modules: ['sales','finance','hr','manufacturing'],
      periodType: 'quarterly',
      period: '2026-Q2',
      schedule: { enabled: true, frequency: 'quarterly', emailTo: ['board@company.com','ceo@company.com'] },
    });
    expect(r.reportType).toBe('board_pack');
    expect(r.schedule.emailTo).toHaveLength(2);
    expect(r.modules).toHaveLength(4);
  });

  it('BIAlert with all severity levels and notifyVia', async () => {
    const levels = [
      { name: 'Info Alert',     severity: 'info',     condition: 'above', threshold: 1000 },
      { name: 'Warning Alert',  severity: 'warning',  condition: 'below', threshold: 500 },
      { name: 'Critical Alert', severity: 'critical', condition: 'below', threshold: 100 },
    ];
    for (const l of levels) {
      const a = await BIAlert().create({ ...l, kpiName: 'revenue', notifyVia: ['email','socket','notification'] });
      expect(a.severity).toBe(l.severity);
      expect(a.notifyVia).toHaveLength(3);
    }
  });

  it('BIDashboard shared dashboard with multiple users', async () => {
    const users = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
    const d = await BIDashboard().create({ name: 'Shared Executive', isShared: true, sharedWith: users, dashboardType: 'enterprise' });
    expect(d.sharedWith).toHaveLength(3);
    expect(d.isShared).toBe(true);
  });

  it('BIKPITarget stretch target must be >= target, minimum <= target (business rule)', async () => {
    const t = await BIKPITarget().create({ kpiName: 'otif', period: '2026-06', targetValue: 90, stretchTarget: 95, minimumTarget: 80, unit: '%' });
    expect(t.stretchTarget).toBeGreaterThanOrEqual(t.targetValue);
    expect(t.minimumTarget).toBeLessThanOrEqual(t.targetValue);
  });

  it('BIBookmark default management: only one default per user', async () => {
    const u = new mongoose.Types.ObjectId();
    await BIBookmark().create({ user: u, name: 'B1', path: '/a', isDefault: true });
    await BIBookmark().create({ user: u, name: 'B2', path: '/b', isDefault: false });
    const count = await BIBookmark().countDocuments({ user: u, isDefault: true });
    expect(count).toBe(1);
  });

  it('BIReport generatedCount increments correctly', async () => {
    const r = await BIReport().create({ name: 'Monthly KPI', reportType: 'kpi_report' });
    await BIReport().findByIdAndUpdate(r._id, { $inc: { generatedCount: 1 }, lastGenerated: new Date() });
    await BIReport().findByIdAndUpdate(r._id, { $inc: { generatedCount: 1 }, lastGenerated: new Date() });
    const updated = await BIReport().findById(r._id);
    expect(updated.generatedCount).toBe(2);
    expect(updated.lastGenerated).toBeTruthy();
  });

  it('BIAlert trigger history is tracked', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'otif', condition: 'below', threshold: 85 });
    await BIAlert().findByIdAndUpdate(a._id, {
      lastTriggered: new Date(),
      lastValue: 82,
      $inc: { triggerCount: 1 }
    });
    const updated = await BIAlert().findById(a._id);
    expect(updated.lastValue).toBe(82);
    expect(updated.triggerCount).toBe(1);
  });

  it('multiple KPI targets for same KPI across different modules', async () => {
    const modules = ['sales','manufacturing','hr','finance','supply_chain'];
    for (let i = 0; i < modules.length; i++) {
      await BIKPITarget().create({ kpiName: 'efficiency', period: '2026-06', targetValue: 80 + i, module: modules[i] });
    }
    const count = await BIKPITarget().countDocuments({ kpiName: 'efficiency' });
    expect(count).toBe(5);
  });

  it('BIDashboard all widget types', async () => {
    const widgetTypes = ['metric_card','bar_chart','line_chart','pie_chart','table','heatmap','gauge','trend','kpi_band'];
    const widgets = widgetTypes.map((t, i) => ({ widgetId: `w${i}`, widgetType: t, title: `Widget ${t}` }));
    const d = await BIDashboard().create({ name: 'Full Dashboard', widgets });
    expect(d.widgets).toHaveLength(9);
    const types = d.widgets.map(w => w.widgetType);
    expect(types).toContain('heatmap');
    expect(types).toContain('kpi_band');
  });

  it('BIReport department_scorecard with department config', async () => {
    const r = await BIReport().create({
      name: 'HR Scorecard',
      reportType: 'department_scorecard',
      modules: ['hr'],
      config: { department: 'hr', metrics: ['headcount','attrition','attendance'] },
    });
    expect(r.config.department).toBe('hr');
    expect(r.config.metrics).toHaveLength(3);
  });

  it('BIAlert can be disabled (isActive=false)', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'revenue', condition: 'below', threshold: 100 });
    await BIAlert().findByIdAndUpdate(a._id, { isActive: false });
    const updated = await BIAlert().findById(a._id);
    expect(updated.isActive).toBe(false);
  });

  it('BIKPITarget supports setBy user ref', async () => {
    const t = await BIKPITarget().create({ kpiName: 'revenue', period: '2026-07', targetValue: 6000000, setBy: fakeUser });
    expect(t.setBy.toString()).toBe(fakeUser.toString());
  });

  it('BIDashboard with owner ref and custom refreshInterval', async () => {
    const d = await BIDashboard().create({ name: 'D1', owner: fakeUser, refreshInterval: 30 });
    expect(d.owner.toString()).toBe(fakeUser.toString());
    expect(d.refreshInterval).toBe(30);
  });

  it('BIBookmark for different paths', async () => {
    const paths = ['/admin/bi/executive/ceo', '/admin/bi/kpis', '/admin/bi/analytics/trends', '/admin/bi/board-pack'];
    for (const p of paths) {
      const b = await BIBookmark().create({ user: fakeUser, name: p, path: p });
      expect(b.path).toBe(p);
    }
    const count = await BIBookmark().countDocuments({ user: fakeUser });
    expect(count).toBe(4);
  });

  it('BIReport management_summary type', async () => {
    const r = await BIReport().create({ name: 'Weekly Summary', reportType: 'management_summary', periodType: 'monthly' });
    expect(r.reportType).toBe('management_summary');
  });

  it('BIAlert comparisonPeriod defaults to current', async () => {
    const a = await BIAlert().create({ name: 'A1', kpiName: 'revenue', condition: 'above', threshold: 10000000 });
    expect(a.comparisonPeriod).toBe('current');
  });
});
