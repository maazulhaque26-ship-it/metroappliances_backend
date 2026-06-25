'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_hrms';

// ── Lifecycle ────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(DB_URI);
  await mongoose.connection.db.dropDatabase();

  require('../models/Department');
  require('../models/Designation');
  require('../models/BusinessUnit');
  require('../models/Location');
  require('../models/Employee');
  require('../models/EmployeeBankAccount');
  require('../models/EmergencyContact');
  require('../models/EmployeeSkill');
  require('../models/EmployeeCertification');
  require('../models/EmployeeNote');
  require('../models/EmploymentHistory');
  require('../models/EmployeeDocument');
  require('../models/EmployeeTransfer');
  require('../models/EmployeePromotion');
  require('../models/EmployeeProbation');
  require('../models/EmployeeExit');
  require('../models/ReportingRelationship');
  require('../models/OrganizationNode');
  require('../models/OrganizationChart');
  require('../models/HRSetting');
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
}, 10000);

// ── Model shortcuts ──────────────────────────────────────────────────────────
const Department          = () => mongoose.model('Department');
const Designation         = () => mongoose.model('Designation');
const BusinessUnit        = () => mongoose.model('BusinessUnit');
const Location            = () => mongoose.model('Location');
const Employee            = () => mongoose.model('Employee');
const BankAccount         = () => mongoose.model('EmployeeBankAccount');
const EmergencyContact    = () => mongoose.model('EmergencyContact');
const Skill               = () => mongoose.model('EmployeeSkill');
const Certification       = () => mongoose.model('EmployeeCertification');
const Note                = () => mongoose.model('EmployeeNote');
const History             = () => mongoose.model('EmploymentHistory');
const Document            = () => mongoose.model('EmployeeDocument');
const Transfer            = () => mongoose.model('EmployeeTransfer');
const Promotion           = () => mongoose.model('EmployeePromotion');
const Probation           = () => mongoose.model('EmployeeProbation');
const Exit                = () => mongoose.model('EmployeeExit');
const Reporting           = () => mongoose.model('ReportingRelationship');
const OrgNode             = () => mongoose.model('OrganizationNode');
const OrgChart            = () => mongoose.model('OrganizationChart');
const HRSetting           = () => mongoose.model('HRSetting');

// ============================================================================
describe('Department model', () => {
  let dept;

  test('creates with auto-code', async () => {
    dept = await Department().create({ name: 'Engineering', description: 'Core engineering', budget: 5000000 });
    expect(dept.deptCode).toMatch(/^DEPT-\d{4}$/);
    expect(dept.isActive).toBe(true);
    expect(dept.isDeleted).toBe(false);
  });

  test('requires name', async () => {
    await expect(Department().create({})).rejects.toThrow();
  });

  test('auto-increments code for second dept', async () => {
    const d2 = await Department().create({ name: 'Finance' });
    expect(d2.deptCode).not.toBe(dept.deptCode);
  });

  test('soft delete works', async () => {
    await Department().findByIdAndUpdate(dept._id, { isDeleted: true });
    const found = await Department().findOne({ _id: dept._id, isDeleted: false });
    expect(found).toBeNull();
  });

  test('can query active departments', async () => {
    const list = await Department().find({ isDeleted: false, isActive: true });
    expect(Array.isArray(list)).toBe(true);
  });
});

// ============================================================================
describe('Designation model', () => {
  let desig;

  test('creates with auto-code', async () => {
    desig = await Designation().create({ title: 'Software Engineer', level: 3, grade: 'G3', minSalary: 600000, maxSalary: 1200000 });
    expect(desig.designationCode).toMatch(/^DESG-\d{4}$/);
  });

  test('requires title', async () => {
    await expect(Designation().create({})).rejects.toThrow();
  });

  test('second designation has different code', async () => {
    const d2 = await Designation().create({ title: 'Senior Engineer', level: 4 });
    expect(d2.designationCode).not.toBe(desig.designationCode);
  });

  test('list all designations', async () => {
    const list = await Designation().find({ isDeleted: false });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
describe('BusinessUnit model', () => {
  let bu;

  test('creates with auto-code', async () => {
    bu = await BusinessUnit().create({ name: 'Technology', country: 'India', currency: 'INR' });
    expect(bu.buCode).toMatch(/^BU-\d{4}$/);
  });

  test('requires name', async () => {
    await expect(BusinessUnit().create({})).rejects.toThrow();
  });

  test('update name', async () => {
    bu.name = 'Technology & Innovation';
    await bu.save();
    const fetched = await BusinessUnit().findById(bu._id);
    expect(fetched.name).toBe('Technology & Innovation');
  });
});

// ============================================================================
describe('Location model', () => {
  let loc;

  test('creates with auto-code', async () => {
    loc = await Location().create({ name: 'Mumbai HQ', locationType: 'head_office', city: 'Mumbai', state: 'Maharashtra', country: 'India' });
    expect(loc.locationCode).toMatch(/^LOC-\d{4}$/);
  });

  test('requires name', async () => {
    await expect(Location().create({})).rejects.toThrow();
  });

  test('locationType default branch', async () => {
    const l2 = await Location().create({ name: 'Delhi Office' });
    expect(['head_office','branch','factory','warehouse','site','remote']).toContain(l2.locationType);
  });
});

// ============================================================================
describe('Employee model — core', () => {
  let emp;

  test('creates with auto-code and probation status', async () => {
    emp = await Employee().create({
      firstName: 'Rahul', lastName: 'Sharma',
      workEmail: 'rahul.sharma@metro.com',
      mobile: '9876543210',
      joiningDate: new Date('2026-01-15'),
      employmentType: 'full_time',
      ctc: 800000, basicSalary: 400000,
    });
    expect(emp.employeeCode).toMatch(/^EMP-\d{4}-\d{5}$/);
    expect(emp.status).toBe('probation');
  });

  test('requires mobile', async () => {
    await expect(Employee().create({ firstName:'A', lastName:'B', workEmail:'a@b.com', joiningDate: new Date() })).rejects.toThrow();
  });

  test('requires joiningDate', async () => {
    await expect(Employee().create({ firstName:'A', lastName:'B', mobile:'1234567890' })).rejects.toThrow();
  });

  test('search by name', async () => {
    const results = await Employee().find({ firstName: 'Rahul', isDeleted: false });
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  test('filter by status', async () => {
    const results = await Employee().find({ status: 'probation', isDeleted: false });
    expect(results.every(e => e.status === 'probation')).toBe(true);
  });

  test('confirm employee changes status to active', async () => {
    emp.status = 'active';
    emp.confirmationDate = new Date();
    await emp.save();
    const fetched = await Employee().findById(emp._id);
    expect(fetched.status).toBe('active');
    expect(fetched.confirmationDate).toBeTruthy();
  });

  test('update employee fields', async () => {
    await Employee().findByIdAndUpdate(emp._id, { phone: '9876543211', city: 'Mumbai' });
    const fetched = await Employee().findById(emp._id);
    expect(fetched.phone).toBe('9876543211');
    expect(fetched.city).toBe('Mumbai');
  });

  test('soft delete', async () => {
    const tempEmp = await Employee().create({ firstName:'Temp', lastName:'Del', workEmail:'tmp.del@metro.com', mobile:'9988001122', joiningDate: new Date() });
    await Employee().findByIdAndUpdate(tempEmp._id, { isDeleted: true });
    const found = await Employee().findOne({ _id: tempEmp._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ============================================================================
describe('EmployeeBankAccount model', () => {
  let empId, bank;

  beforeAll(async () => {
    const e = await Employee().create({ firstName:'Priya', lastName:'Patel', workEmail:'priya@metro.com', mobile:'8765432100', joiningDate: new Date() });
    empId = e._id;
  });

  test('creates bank account', async () => {
    bank = await BankAccount().create({
      employee: empId, accountHolder: 'Priya Patel', bankName: 'HDFC Bank',
      accountNumber: '12345678901234', ifscCode: 'HDFC0001234',
      accountType: 'savings', branchName: 'Andheri', isPrimary: true,
    });
    expect(bank._id).toBeTruthy();
    expect(bank.ifscCode).toBe('HDFC0001234');
  });

  test('requires employee', async () => {
    await expect(BankAccount().create({ bankName:'SBI', accountNumber:'99' })).rejects.toThrow();
  });

  test('fetch accounts by employee', async () => {
    const list = await BankAccount().find({ employee: empId, isDeleted: false });
    expect(list.length).toBe(1);
  });

  test('soft delete account', async () => {
    await BankAccount().findByIdAndUpdate(bank._id, { isDeleted: true });
    const list = await BankAccount().find({ employee: empId, isDeleted: false });
    expect(list.length).toBe(0);
  });
});

// ============================================================================
describe('EmergencyContact model', () => {
  let empId;

  beforeAll(async () => {
    const e = await Employee().create({ firstName:'Ram', lastName:'Kumar', workEmail:'ram@metro.com', mobile:'7654321000', joiningDate: new Date() });
    empId = e._id;
  });

  test('creates emergency contact', async () => {
    const c = await EmergencyContact().create({ employee: empId, name: 'Sita Kumar', relationship: 'spouse', phone: '9000000001', isPrimary: true });
    expect(c._id).toBeTruthy();
    expect(c.relationship).toBe('spouse');
  });

  test('requires employee + name', async () => {
    await expect(EmergencyContact().create({ phone:'1234' })).rejects.toThrow();
  });

  test('list contacts for employee', async () => {
    const list = await EmergencyContact().find({ employee: empId, isDeleted: false });
    expect(list.length).toBe(1);
  });
});

// ============================================================================
describe('EmployeeSkill model', () => {
  let empId;

  beforeAll(async () => {
    const e = await Employee().create({ firstName:'Dev', lastName:'Skill', workEmail:'dev.skill@metro.com', mobile:'6543210987', joiningDate: new Date() });
    empId = e._id;
  });

  test('creates skill', async () => {
    const sk = await Skill().create({ employee: empId, skillName: 'React', skillCategory: 'technical', proficiency: 'advanced', yearsExperience: 3 });
    expect(sk._id).toBeTruthy();
    expect(sk.proficiency).toBe('advanced');
  });

  test('requires skillName', async () => {
    await expect(Skill().create({ employee: empId })).rejects.toThrow();
  });

  test('list skills', async () => {
    const list = await Skill().find({ employee: empId, isDeleted: false });
    expect(list.length).toBe(1);
  });
});

// ============================================================================
describe('EmployeeCertification model', () => {
  let empId;

  beforeAll(async () => {
    const e = await Employee().create({ firstName:'Cert', lastName:'Person', workEmail:'cert@metro.com', mobile:'5432109000', joiningDate: new Date() });
    empId = e._id;
  });

  test('creates certification', async () => {
    const c = await Certification().create({ employee: empId, certName: 'AWS SAA', issuingOrg: 'Amazon', issueDate: new Date('2025-01-01'), expiryDate: new Date('2027-01-01') });
    expect(c._id).toBeTruthy();
  });

  test('requires certName and issuingOrg', async () => {
    await expect(Certification().create({ employee: empId })).rejects.toThrow();
  });
});

// ============================================================================
describe('EmployeeNote model', () => {
  let empId, adminId;

  beforeAll(async () => {
    const e = await Employee().create({ firstName:'Note', lastName:'Holder', workEmail:'note@metro.com', mobile:'4321098000', joiningDate: new Date() });
    empId = e._id;
    adminId = new mongoose.Types.ObjectId();
  });

  test('creates note', async () => {
    const n = await Note().create({ employee: empId, noteType: 'performance', title: 'Q1 Review', content: 'Good performance', createdBy: adminId });
    expect(n._id).toBeTruthy();
    expect(n.isConfidential).toBe(false);
  });

  test('requires title, content, createdBy', async () => {
    await expect(Note().create({ employee: empId, noteType: 'general' })).rejects.toThrow();
  });
});

// ============================================================================
describe('EmploymentHistory model', () => {
  let empId;

  beforeAll(async () => {
    const e = await Employee().create({ firstName:'Hist', lastName:'Worker', workEmail:'hist@metro.com', mobile:'3210987000', joiningDate: new Date() });
    empId = e._id;
  });

  test('creates history record', async () => {
    const h = await History().create({ employee: empId, company: 'TechCorp', designation: 'Developer', startDate: new Date('2022-01-01'), endDate: new Date('2025-12-31'), ctc: 600000 });
    expect(h._id).toBeTruthy();
    expect(h.company).toBe('TechCorp');
  });

  test('requires startDate', async () => {
    await expect(History().create({ employee: empId, company: 'OldCo' })).rejects.toThrow();
  });
});

// ============================================================================
describe('EmployeeDocument model', () => {
  let empId, doc;

  beforeAll(async () => {
    const e = await Employee().create({ firstName:'Doc', lastName:'Owner', workEmail:'docowner@metro.com', mobile:'2109876000', joiningDate: new Date() });
    empId = e._id;
  });

  test('creates document', async () => {
    doc = await Document().create({ employee: empId, docType: 'pan', docName: 'PAN Card', fileUrl: 'https://example.com/pan.pdf' });
    expect(doc._id).toBeTruthy();
    expect(doc.isVerified).toBe(false);
  });

  test('requires employee', async () => {
    await expect(Document().create({ docType: 'aadhar' })).rejects.toThrow();
  });

  test('verify document', async () => {
    const adminId = new mongoose.Types.ObjectId();
    await Document().findByIdAndUpdate(doc._id, { isVerified: true, verifiedBy: adminId, verifiedAt: new Date() });
    const fetched = await Document().findById(doc._id);
    expect(fetched.isVerified).toBe(true);
  });

  test('expiring docs query', async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);
    await Document().create({ employee: empId, docType: 'passport', docName: 'Passport', expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) });
    const expiring = await Document().find({ isDeleted: false, expiryDate: { $gte: new Date(), $lte: cutoff } });
    expect(expiring.length).toBeGreaterThanOrEqual(1);
  });

  test('soft delete', async () => {
    await Document().findByIdAndUpdate(doc._id, { isDeleted: true });
    const found = await Document().findOne({ _id: doc._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ============================================================================
describe('EmployeeTransfer model', () => {
  let empId, dept1, dept2, transfer;

  beforeAll(async () => {
    const e  = await Employee().create({ firstName:'Trf', lastName:'Emp', workEmail:'trf@metro.com', mobile:'1098765000', joiningDate: new Date() });
    const d1 = await Department().create({ name: 'Ops' });
    const d2 = await Department().create({ name: 'Sales' });
    empId = e._id; dept1 = d1._id; dept2 = d2._id;
  });

  test('creates transfer with auto-number', async () => {
    transfer = await Transfer().create({ employee: empId, transferType: 'department', effectiveDate: new Date('2026-07-01'), fromDepartment: dept1, toDepartment: dept2, reason: 'Business need' });
    expect(transfer.transferNumber).toMatch(/^TRF-\d{4}-\d{5}$/);
    expect(transfer.status).toBe('pending');
  });

  test('requires employee + effectiveDate', async () => {
    await expect(Transfer().create({ transferType: 'location' })).rejects.toThrow();
  });

  test('approve transfer', async () => {
    const adminId = new mongoose.Types.ObjectId();
    await Transfer().findByIdAndUpdate(transfer._id, { status: 'approved', approvedBy: adminId, approvedAt: new Date() });
    const fetched = await Transfer().findById(transfer._id);
    expect(fetched.status).toBe('approved');
  });

  test('reject transfer', async () => {
    const t2 = await Transfer().create({ employee: empId, transferType: 'location', effectiveDate: new Date() });
    await Transfer().findByIdAndUpdate(t2._id, { status: 'rejected' });
    const fetched = await Transfer().findById(t2._id);
    expect(fetched.status).toBe('rejected');
  });

  test('list transfers', async () => {
    const list = await Transfer().find({ isDeleted: false });
    expect(list.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
describe('EmployeePromotion model', () => {
  let empId, desig1, desig2, promo;

  beforeAll(async () => {
    const e  = await Employee().create({ firstName:'Pro', lastName:'Emp', workEmail:'pro@metro.com', mobile:'0987654321', joiningDate: new Date('2024-01-01') });
    const d1 = await Designation().create({ title: 'Jr Analyst' });
    const d2 = await Designation().create({ title: 'Sr Analyst' });
    empId = e._id; desig1 = d1._id; desig2 = d2._id;
  });

  test('creates promotion with auto-number', async () => {
    promo = await Promotion().create({ employee: empId, effectiveDate: new Date('2026-07-01'), fromDesignation: desig1, toDesignation: desig2, fromCtc: 600000, toCtc: 800000, incrementPct: 33.33, promotionType: 'merit', reason: 'Outstanding' });
    expect(promo.promotionNumber).toMatch(/^PRO-\d{4}-\d{5}$/);
    expect(promo.status).toBe('pending');
    expect(promo.incrementPct).toBeGreaterThan(0);
  });

  test('requires employee + effectiveDate', async () => {
    await expect(Promotion().create({ promotionType: 'merit' })).rejects.toThrow();
  });

  test('approve promotion', async () => {
    const adminId = new mongoose.Types.ObjectId();
    await Promotion().findByIdAndUpdate(promo._id, { status: 'approved', approvedBy: adminId, approvedAt: new Date() });
    const fetched = await Promotion().findById(promo._id);
    expect(fetched.status).toBe('approved');
  });

  test('reject promotion', async () => {
    const p2 = await Promotion().create({ employee: empId, effectiveDate: new Date(), promotionType: 'spot' });
    await Promotion().findByIdAndUpdate(p2._id, { status: 'rejected' });
    const fetched = await Promotion().findById(p2._id);
    expect(fetched.status).toBe('rejected');
  });
});

// ============================================================================
describe('EmployeeProbation model', () => {
  let empId, prob;

  beforeAll(async () => {
    const e = await Employee().create({ firstName:'Prob', lastName:'Worker', workEmail:'prob@metro.com', mobile:'9876500011', joiningDate: new Date('2026-03-01') });
    empId = e._id;
  });

  test('creates probation with auto-number', async () => {
    prob = await Probation().create({ employee: empId, startDate: new Date('2026-03-01'), endDate: new Date('2026-06-01'), durationMonths: 3 });
    expect(prob.probationNumber).toMatch(/^PROB-\d{4}-\d{5}$/);
    expect(prob.status).toBe('active');
    expect(prob.durationMonths).toBe(3);
  });

  test('requires employee, startDate, endDate', async () => {
    await expect(Probation().create({ durationMonths: 3 })).rejects.toThrow();
  });

  test('extend probation', async () => {
    await Probation().findByIdAndUpdate(prob._id, { status: 'extended', extensionMonths: 1, extensionReason: 'Needs more time' });
    const fetched = await Probation().findById(prob._id);
    expect(fetched.status).toBe('extended');
    expect(fetched.extensionMonths).toBe(1);
  });

  test('confirm probation', async () => {
    const adminId = new mongoose.Types.ObjectId();
    await Probation().findByIdAndUpdate(prob._id, { status: 'confirmed', confirmedBy: adminId, confirmedAt: new Date() });
    const fetched = await Probation().findById(prob._id);
    expect(fetched.status).toBe('confirmed');
  });
});

// ============================================================================
describe('EmployeeExit model', () => {
  let empId, exitRec;

  beforeAll(async () => {
    const e = await Employee().create({ firstName:'Exit', lastName:'Person', workEmail:'exit@metro.com', mobile:'8765400011', joiningDate: new Date('2023-01-01') });
    empId = e._id;
  });

  test('creates exit with auto-number', async () => {
    exitRec = await Exit().create({ employee: empId, exitType: 'resignation', resignationDate: new Date('2026-06-01'), lastWorkingDay: new Date('2026-06-30'), noticePeriodDays: 30, exitReason: 'Better opportunity', settlementAmount: 50000 });
    expect(exitRec.exitNumber).toMatch(/^EXIT-\d{4}-\d{5}$/);
    expect(exitRec.status).toBe('initiated');
  });

  test('requires employee + lastWorkingDay', async () => {
    await expect(Exit().create({ exitType: 'resignation' })).rejects.toThrow();
  });

  test('update clearances', async () => {
    await Exit().findByIdAndUpdate(exitRec._id, { itClearance: true, adminClearance: true, financeClearance: true, hrClearance: true, status: 'completed' });
    const fetched = await Exit().findById(exitRec._id);
    expect(fetched.itClearance).toBe(true);
    expect(fetched.hrClearance).toBe(true);
    expect(fetched.status).toBe('completed');
  });

  test('settlement status update', async () => {
    await Exit().findByIdAndUpdate(exitRec._id, { settlementStatus: 'paid', settlementDate: new Date() });
    const fetched = await Exit().findById(exitRec._id);
    expect(fetched.settlementStatus).toBe('paid');
  });
});

// ============================================================================
describe('ReportingRelationship model', () => {
  let mgr1Id, mgr2Id, empId;

  beforeAll(async () => {
    const m1 = await Employee().create({ firstName:'Mgr', lastName:'One', workEmail:'mgr1@hr.com', mobile:'7654300001', joiningDate: new Date() });
    const m2 = await Employee().create({ firstName:'Mgr', lastName:'Two', workEmail:'mgr2@hr.com', mobile:'7654300002', joiningDate: new Date() });
    const e  = await Employee().create({ firstName:'Rep', lastName:'To', workEmail:'report@hr.com', mobile:'7654300003', joiningDate: new Date() });
    mgr1Id = m1._id; mgr2Id = m2._id; empId = e._id;
  });

  test('creates primary relationship', async () => {
    const rel = await Reporting().create({ employee: empId, manager: mgr1Id, relationshipType: 'primary', effectiveFrom: new Date('2026-01-01') });
    expect(rel._id).toBeTruthy();
    expect(rel.isActive).toBe(true);
  });

  test('requires employee + manager + effectiveFrom', async () => {
    await expect(Reporting().create({ relationshipType: 'primary' })).rejects.toThrow();
  });

  test('terminate relationship', async () => {
    const rel = await Reporting().findOne({ employee: empId, isActive: true });
    await Reporting().findByIdAndUpdate(rel._id, { isActive: false, effectiveTo: new Date() });
    const fetched = await Reporting().findById(rel._id);
    expect(fetched.isActive).toBe(false);
  });

  test('create secondary relationship', async () => {
    const rel = await Reporting().create({ employee: empId, manager: mgr2Id, relationshipType: 'dotted_line', effectiveFrom: new Date() });
    expect(rel.relationshipType).toBe('dotted_line');
  });
});

// ============================================================================
describe('OrganizationNode model', () => {
  let rootNode;

  test('creates root node level 0', async () => {
    rootNode = await OrgNode().create({ nodeType: 'company', name: 'Metro Appliances Ltd', code: 'METRO-HQ' });
    expect(rootNode.level).toBe(0);
  });

  test('creates child node', async () => {
    const child = await OrgNode().create({ nodeType: 'business_unit', name: 'Technology BU', parent: rootNode._id });
    expect(child._id).toBeTruthy();
  });

  test('requires nodeType + name', async () => {
    await expect(OrgNode().create({})).rejects.toThrow();
  });

  test('list nodes', async () => {
    const list = await OrgNode().find({ isActive: true });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
describe('OrganizationChart model', () => {
  let chartId;

  test('creates chart in draft status', async () => {
    const chart = await OrgChart().create({ chartName: '2026 Org Chart', effectiveDate: new Date('2026-01-01'), description: 'Annual chart' });
    expect(chart.status).toBe('draft');
    expect(chart.chartVersion).toBe('1.0');
    chartId = chart._id;
  });

  test('requires chartName + effectiveDate', async () => {
    await expect(OrgChart().create({})).rejects.toThrow();
  });

  test('activate chart', async () => {
    await OrgChart().findByIdAndUpdate(chartId, { status: 'active' });
    const fetched = await OrgChart().findById(chartId);
    expect(fetched.status).toBe('active');
  });

  test('archive old charts', async () => {
    await OrgChart().updateMany({ _id: { $ne: chartId }, status: 'active' }, { status: 'archived' });
    const activeCharts = await OrgChart().find({ status: 'active' });
    const archivedCharts = await OrgChart().find({ status: 'archived' });
    expect(activeCharts.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(archivedCharts)).toBe(true);
  });
});

// ============================================================================
describe('HRSetting model', () => {
  test('creates setting', async () => {
    const s = await HRSetting().create({ key: 'probation_months', value: 3, category: 'probation', description: 'Default probation duration' });
    expect(s._id).toBeTruthy();
    expect(s.isActive).toBe(true);
  });

  test('key must be unique', async () => {
    await expect(HRSetting().create({ key: 'probation_months', value: 6 })).rejects.toThrow();
  });

  test('upsert setting', async () => {
    await HRSetting().findOneAndUpdate({ key: 'exit_notice_days' }, { key: 'exit_notice_days', value: 30, category: 'exit' }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const s = await HRSetting().findOne({ key: 'exit_notice_days' });
    expect(s.value).toBe(30);
  });

  test('list all settings', async () => {
    const list = await HRSetting().find({ isActive: true });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
});
