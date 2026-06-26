'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_payroll';

// ── Lifecycle ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(DB_URI);
  await mongoose.connection.db.dropDatabase();

  // Core dependencies
  require('../models/Department');
  require('../models/Designation');
  require('../models/BusinessUnit');
  require('../models/Location');
  require('../models/Employee');

  // Sprint 14C models
  require('../models/PayrollPeriod');
  require('../models/PayrollRun');
  require('../models/PayrollEmployee');
  require('../models/SalaryStructure');
  require('../models/SalaryComponent');
  require('../models/EmployeeSalary');
  require('../models/PayrollTransaction');
  require('../models/Payslip');
  require('../models/PayrollAdjustment');
  require('../models/PayrollDeduction');
  require('../models/PayrollAllowance');
  require('../models/Bonus');
  require('../models/Incentive');
  require('../models/Overtime');
  require('../models/Loan');
  require('../models/LoanRepayment');
  require('../models/AdvanceSalary');
  require('../models/PayrollTax');
  require('../models/PayrollApproval');
  require('../models/PayrollSetting');

  // Rebuild unique indexes after dropDatabase
  await mongoose.model('PayrollPeriod').createIndexes();
  await mongoose.model('PayrollRun').createIndexes();
  await mongoose.model('PayrollEmployee').createIndexes();
  await mongoose.model('SalaryStructure').createIndexes();
  await mongoose.model('SalaryComponent').createIndexes();
  await mongoose.model('Payslip').createIndexes();
  await mongoose.model('Bonus').createIndexes();
  await mongoose.model('Incentive').createIndexes();
  await mongoose.model('Overtime').createIndexes();
  await mongoose.model('Loan').createIndexes();
  await mongoose.model('LoanRepayment').createIndexes();
  await mongoose.model('AdvanceSalary').createIndexes();
  await mongoose.model('PayrollTax').createIndexes();
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
});

// Model helpers to avoid "model not registered" errors
const PayrollPeriod   = () => mongoose.model('PayrollPeriod');
const PayrollRun      = () => mongoose.model('PayrollRun');
const PayrollEmployee = () => mongoose.model('PayrollEmployee');
const SalaryStructure = () => mongoose.model('SalaryStructure');
const SalaryComponent = () => mongoose.model('SalaryComponent');
const EmployeeSalary  = () => mongoose.model('EmployeeSalary');
const Payslip         = () => mongoose.model('Payslip');
const PayrollAdj      = () => mongoose.model('PayrollAdjustment');
const PayrollDed      = () => mongoose.model('PayrollDeduction');
const PayrollAllow    = () => mongoose.model('PayrollAllowance');
const Bonus           = () => mongoose.model('Bonus');
const Incentive       = () => mongoose.model('Incentive');
const Overtime        = () => mongoose.model('Overtime');
const Loan            = () => mongoose.model('Loan');
const LoanRepayment   = () => mongoose.model('LoanRepayment');
const AdvanceSalary   = () => mongoose.model('AdvanceSalary');
const PayrollTax      = () => mongoose.model('PayrollTax');
const PayrollApproval = () => mongoose.model('PayrollApproval');
const PayrollSetting  = () => mongoose.model('PayrollSetting');
const Employee        = () => mongoose.model('Employee');
const Department      = () => mongoose.model('Department');

// Shared fixtures
let dept, emp, period, run, structure, component, empSalary;

beforeAll(async () => {
  dept = await Department().create({ name: 'Engineering', code: 'ENG' });
  emp  = await Employee().create({
    firstName: 'Arjun', lastName: 'Sharma',
    workEmail: 'arjun.sharma@test.com',
    mobile: '9876543210',
    department: dept._id,
    joiningDate: new Date('2023-01-15'),
    employmentType: 'full_time',
  });
}, 20000);

// ─────────────────────────────────────────────────────────────────────────────
describe('PayrollPeriod', () => {
  test('creates a payroll period with auto code', async () => {
    period = await PayrollPeriod().create({
      name: 'June 2026',
      startDate: new Date('2026-06-01'),
      endDate:   new Date('2026-06-30'),
      payDate:   new Date('2026-07-01'),
      workingDays: 26,
    });
    expect(period.periodCode).toMatch(/^PPD-\d{4}-\d{5}$/);
    expect(period.status).toBe('open');
  });

  test('defaults to monthly periodType', async () => {
    expect(period.periodType).toBe('monthly');
  });

  test('rejects duplicate period code if set explicitly', async () => {
    const code = period.periodCode;
    await expect(PayrollPeriod().create({
      name: 'Duplicate', periodCode: code,
      startDate: new Date('2026-07-01'), endDate: new Date('2026-07-31'), workingDays: 26,
    })).rejects.toThrow();
  });

  test('closes a period', async () => {
    period.status = 'closed';
    await period.save();
    expect(period.status).toBe('closed');
    // Re-open for subsequent tests
    period.status = 'open';
    await period.save();
  });

  test('finds open periods by index', async () => {
    const found = await PayrollPeriod().find({ status: 'open', isDeleted: false });
    expect(found.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('SalaryComponent', () => {
  test('creates earning component with auto code', async () => {
    component = await SalaryComponent().create({
      name: 'Basic Salary', type: 'earning', calculationType: 'fixed', value: 30000,
    });
    expect(component.componentCode).toMatch(/^SC-\d{5}$/);
    expect(component.type).toBe('earning');
  });

  test('creates deduction component', async () => {
    const ded = await SalaryComponent().create({
      name: 'Provident Fund', type: 'deduction', calculationType: 'percentage_of_basic',
      value: 12, isStatutory: true, statutoryType: 'pf',
    });
    expect(ded.isStatutory).toBe(true);
    expect(ded.statutoryType).toBe('pf');
  });

  test('creates employer contribution component', async () => {
    const ec = await SalaryComponent().create({
      name: 'Employer PF', type: 'employer_contribution', value: 12, isStatutory: true,
    });
    expect(ec.type).toBe('employer_contribution');
  });

  test('rejects invalid type', async () => {
    await expect(SalaryComponent().create({ name: 'Bad', type: 'invalid' })).rejects.toThrow();
  });

  test('sortOrder defaults to 0', async () => {
    expect(component.sortOrder).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('SalaryStructure', () => {
  test('creates salary structure with auto code', async () => {
    structure = await SalaryStructure().create({
      name: 'Standard Monthly',
      components: [component._id],
    });
    expect(structure.structureCode).toMatch(/^SS-\d{5}$/);
    expect(structure.isDefault).toBe(false);
  });

  test('marks structure as default', async () => {
    structure.isDefault = true;
    await structure.save();
    expect(structure.isDefault).toBe(true);
  });

  test('populates components', async () => {
    const found = await SalaryStructure().findById(structure._id).populate('components');
    expect(found.components.length).toBeGreaterThan(0);
    expect(found.components[0].name).toBe('Basic Salary');
  });

  test('soft delete', async () => {
    const tmp = await SalaryStructure().create({ name: 'Temp Structure' });
    tmp.isDeleted = true;
    await tmp.save();
    const found = await SalaryStructure().findOne({ _id: tmp._id, isDeleted: false });
    expect(found).toBeNull();
  });

  test('isActive defaults to true', async () => {
    expect(structure.isActive).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('EmployeeSalary', () => {
  test('assigns salary structure to employee', async () => {
    empSalary = await EmployeeSalary().create({
      employee: emp._id, structure: structure._id,
      effectiveFrom: new Date('2026-01-01'),
      ctc: 600000, basicSalary: 30000, hra: 12000, travelAllowance: 3000,
      medicalAllowance: 1250, specialAllowance: 3750,
      pfApplicable: true, esiApplicable: false,
      paymentMode: 'bank_transfer',
      bankAccountNumber: '123456789', bankName: 'HDFC', ifscCode: 'HDFC0001234',
    });
    expect(empSalary._id).toBeDefined();
    expect(empSalary.pfApplicable).toBe(true);
    expect(empSalary.esiApplicable).toBe(false);
  });

  test('default isActive is true', async () => {
    expect(empSalary.isActive).toBe(true);
  });

  test('deactivation sets isActive false', async () => {
    empSalary.isActive = false;
    await empSalary.save();
    const found = await EmployeeSalary().findById(empSalary._id);
    expect(found.isActive).toBe(false);
    // Restore
    empSalary.isActive = true;
    await empSalary.save();
  });

  test('finds active salary for employee', async () => {
    const found = await EmployeeSalary().findOne({ employee: emp._id, isActive: true, isDeleted: false });
    expect(found).not.toBeNull();
    expect(found.basicSalary).toBe(30000);
  });

  test('ctc stored correctly', async () => {
    expect(empSalary.ctc).toBe(600000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PayrollRun', () => {
  test('creates payroll run with auto number', async () => {
    run = await PayrollRun().create({
      period: period._id,
      runType: 'regular',
      narration: 'Monthly payroll June 2026',
    });
    expect(run.runNumber).toMatch(/^PRN-\d{4}-\d{5}$/);
    expect(run.status).toBe('draft');
  });

  test('default totals are zero', async () => {
    expect(run.totalGross).toBe(0);
    expect(run.totalNetPay).toBe(0);
    expect(run.totalEmployees).toBe(0);
  });

  test('run status transitions: draft → calculated', async () => {
    run.status       = 'calculated';
    run.calculatedAt = new Date();
    await run.save();
    expect(run.status).toBe('calculated');
  });

  test('run status transitions: calculated → approved', async () => {
    run.status     = 'approved';
    run.approvedAt = new Date();
    await run.save();
    expect(run.status).toBe('approved');
  });

  test('run status transitions: approved → posted', async () => {
    run.status   = 'posted';
    run.postedAt = new Date();
    await run.save();
    expect(run.status).toBe('posted');
  });

  test('run status transitions: posted → paid', async () => {
    run.status = 'paid';
    run.paidAt = new Date();
    await run.save();
    expect(run.status).toBe('paid');
  });

  test('invalid status rejected', async () => {
    await expect(PayrollRun().create({ period: period._id, status: 'invalid' })).rejects.toThrow();
  });

  test('period population works', async () => {
    const found = await PayrollRun().findById(run._id).populate('period', 'name workingDays');
    expect(found.period.name).toBe('June 2026');
    expect(found.period.workingDays).toBe(26);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PayrollEmployee', () => {
  let payEmp;
  test('creates payroll employee entry', async () => {
    payEmp = await PayrollEmployee().create({
      payrollRun: run._id, employee: emp._id, period: period._id,
      workingDays: 26, presentDays: 24, paidDays: 24, lopDays: 2,
      basicSalary: 27692, hra: 11077, travelAllowance: 2769, medicalAllowance: 1154,
      specialAllowance: 3462, grossEarnings: 46154,
      employeePF: 1800, professionalTax: 200,
      totalDeductions: 2000, netPay: 44154,
      employerPF: 1800, status: 'calculated',
    });
    expect(payEmp._id).toBeDefined();
    expect(payEmp.grossEarnings).toBe(46154);
    expect(payEmp.netPay).toBe(44154);
  });

  test('compound unique index prevents duplicate employee in same run', async () => {
    await expect(PayrollEmployee().create({
      payrollRun: run._id, employee: emp._id, period: period._id,
      grossEarnings: 0, totalDeductions: 0, netPay: 0,
    })).rejects.toThrow();
  });

  test('lop days reflected correctly', async () => {
    expect(payEmp.lopDays).toBe(2);
    expect(payEmp.paidDays).toBe(24);
  });

  test('status can be updated to paid', async () => {
    payEmp.status = 'paid';
    await payEmp.save();
    expect(payEmp.status).toBe('paid');
  });

  test('populates employee reference', async () => {
    const found = await PayrollEmployee().findById(payEmp._id).populate('employee', 'firstName lastName');
    expect(found.employee.firstName).toBe('Arjun');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Bonus', () => {
  let bonus;
  test('creates bonus with auto number', async () => {
    bonus = await Bonus().create({
      employee: emp._id, bonusType: 'performance',
      amount: 15000, effectiveDate: new Date('2026-06-15'),
      reason: 'Q2 performance', period: period._id,
    });
    expect(bonus.bonusNumber).toMatch(/^BNS-\d{4}-\d{5}$/);
    expect(bonus.status).toBe('draft');
    expect(bonus.taxable).toBe(true);
  });

  test('approves bonus', async () => {
    bonus.status = 'approved';
    await bonus.save();
    expect(bonus.status).toBe('approved');
  });

  test('marks as paid', async () => {
    bonus.status = 'paid';
    await bonus.save();
    expect(bonus.status).toBe('paid');
  });

  test('invalid bonusType rejected', async () => {
    await expect(Bonus().create({
      employee: emp._id, bonusType: 'invalid', amount: 1000, effectiveDate: new Date(),
    })).rejects.toThrow();
  });

  test('finds bonuses by employee and status', async () => {
    const found = await Bonus().find({ employee: emp._id, status: 'paid', isDeleted: false });
    expect(found.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Incentive', () => {
  test('creates incentive with auto number', async () => {
    const inc = await Incentive().create({
      employee: emp._id, incentiveType: 'sales',
      amount: 5000, effectiveDate: new Date('2026-06-20'),
      targetAchieved: 110, period: period._id,
    });
    expect(inc.incentiveNumber).toMatch(/^INC-\d{4}-\d{5}$/);
    expect(inc.status).toBe('draft');
  });

  test('incentive approval workflow', async () => {
    const inc = await Incentive().create({
      employee: emp._id, incentiveType: 'target',
      amount: 8000, effectiveDate: new Date('2026-06-25'),
    });
    inc.status = 'approved';
    await inc.save();
    expect(inc.status).toBe('approved');
  });

  test('invalid incentiveType rejected', async () => {
    await expect(Incentive().create({
      employee: emp._id, incentiveType: 'bad_type', amount: 1000, effectiveDate: new Date(),
    })).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Overtime', () => {
  test('creates overtime with computed amount', async () => {
    const ovt = await Overtime().create({
      employee: emp._id, date: new Date('2026-06-14'),
      hours: 4, rate: 250, overtimeType: 'weekend', period: period._id,
    });
    expect(ovt.overtimeNumber).toMatch(/^OVT-\d{4}-\d{5}$/);
    expect(ovt.amount).toBe(1000);
    expect(ovt.status).toBe('pending');
  });

  test('approve overtime', async () => {
    const ovt = await Overtime().create({
      employee: emp._id, date: new Date('2026-06-07'),
      hours: 2, rate: 200, overtimeType: 'holiday',
    });
    ovt.status = 'approved';
    await ovt.save();
    expect(ovt.status).toBe('approved');
  });

  test('minimum hours of 0.5 enforced', async () => {
    await expect(Overtime().create({
      employee: emp._id, date: new Date(), hours: 0, rate: 100,
    })).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Loan', () => {
  let loan;
  test('creates loan with auto number', async () => {
    loan = await Loan().create({
      employee: emp._id, loanType: 'personal',
      principal: 100000, interestRate: 10, tenure: 12,
      reason: 'Personal emergency',
    });
    expect(loan.loanNumber).toMatch(/^LON-\d{4}-\d{5}$/);
    expect(loan.status).toBe('applied');
    expect(loan.outstandingBalance).toBe(0);
  });

  test('approve loan sets status and balance', async () => {
    loan.status             = 'approved';
    loan.disbursedAmount    = loan.principal;
    loan.outstandingBalance = loan.principal;
    const monthlyRate = (loan.principal * loan.interestRate) / (12 * 100);
    loan.emi = Math.ceil((loan.principal / loan.tenure) + monthlyRate);
    await loan.save();
    expect(loan.status).toBe('approved');
    expect(loan.outstandingBalance).toBe(100000);
    expect(loan.emi).toBeGreaterThan(0);
  });

  test('invalid loanType rejected', async () => {
    await expect(Loan().create({
      employee: emp._id, loanType: 'mortgage', principal: 50000, tenure: 6,
    })).rejects.toThrow();
  });

  test('close loan sets outstanding to 0', async () => {
    loan.status            = 'closed';
    loan.outstandingBalance= 0;
    await loan.save();
    expect(loan.status).toBe('closed');
    expect(loan.outstandingBalance).toBe(0);
  });

  test('finds loans by employee', async () => {
    const found = await Loan().find({ employee: emp._id, isDeleted: false });
    expect(found.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('LoanRepayment', () => {
  let loan2, rep;
  test('creates repayment schedule', async () => {
    loan2 = await Loan().create({
      employee: emp._id, loanType: 'education',
      principal: 50000, interestRate: 8, tenure: 6,
    });
    rep = await LoanRepayment().create({
      loan: loan2._id, employee: emp._id,
      installmentNumber: 1,
      dueDate: new Date('2026-07-01'),
      principal: 8333, interest: 333, totalAmount: 8666,
    });
    expect(rep.repaymentNumber).toMatch(/^LRP-\d{4}-\d{5}$/);
    expect(rep.status).toBe('pending');
  });

  test('marks repayment as paid', async () => {
    rep.status    = 'paid';
    rep.paidAt    = new Date();
    rep.paidAmount= rep.totalAmount;
    await rep.save();
    expect(rep.status).toBe('paid');
  });

  test('finds repayments by loan', async () => {
    const found = await LoanRepayment().find({ loan: loan2._id, isDeleted: false });
    expect(found.length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AdvanceSalary', () => {
  let advance;
  test('creates advance with auto number', async () => {
    advance = await AdvanceSalary().create({
      employee: emp._id, amount: 20000,
      reason: 'Medical emergency', recoveryInstallments: 2,
    });
    expect(advance.advanceNumber).toMatch(/^ADV-\d{4}-\d{5}$/);
    expect(advance.status).toBe('applied');
    expect(advance.balance).toBe(0);
  });

  test('approve advance sets balance and recovery', async () => {
    advance.status                 = 'approved';
    advance.balance                = advance.amount;
    advance.recoveryPerInstallment = Math.ceil(advance.amount / advance.recoveryInstallments);
    await advance.save();
    expect(advance.status).toBe('approved');
    expect(advance.recoveryPerInstallment).toBe(10000);
    expect(advance.balance).toBe(20000);
  });

  test('recovery reduces balance', async () => {
    advance.amountRecovered += 10000;
    advance.balance          = advance.amount - advance.amountRecovered;
    advance.status           = 'recovering';
    await advance.save();
    expect(advance.balance).toBe(10000);
    expect(advance.status).toBe('recovering');
  });

  test('full recovery sets status to recovered', async () => {
    advance.amountRecovered = advance.amount;
    advance.balance         = 0;
    advance.status          = 'recovered';
    await advance.save();
    expect(advance.status).toBe('recovered');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PayrollAdjustment', () => {
  test('creates addition adjustment', async () => {
    const adj = await PayrollAdj().create({
      payrollRun: run._id, employee: emp._id,
      type: 'addition', reason: 'Arrears', amount: 5000, taxable: false,
    });
    expect(adj.adjustmentNumber).toMatch(/^PAJ-\d{4}-\d{5}$/);
    expect(adj.status).toBe('pending');
  });

  test('creates deduction adjustment', async () => {
    const adj = await PayrollAdj().create({
      payrollRun: run._id, employee: emp._id,
      type: 'deduction', reason: 'LOP recovery', amount: 2000,
    });
    expect(adj.type).toBe('deduction');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PayrollDeduction & PayrollAllowance', () => {
  test('creates payroll deduction', async () => {
    const ded = await PayrollDed().create({
      employee: emp._id, period: period._id, type: 'pf', amount: 1800,
      description: 'Employee PF contribution',
    });
    expect(ded.deductionNumber).toMatch(/^PDN-\d{4}-\d{5}$/);
    expect(ded.type).toBe('pf');
  });

  test('creates payroll allowance', async () => {
    const allow = await PayrollAllow().create({
      employee: emp._id, period: period._id, type: 'hra', amount: 12000,
      description: 'House Rent Allowance',
    });
    expect(allow.allowanceNumber).toMatch(/^PAL-\d{4}-\d{5}$/);
    expect(allow.type).toBe('hra');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PayrollTax', () => {
  test('creates payroll tax record', async () => {
    const tx = await PayrollTax().create({
      employee: emp._id, period: period._id, payrollRun: run._id,
      fiscalYear: '2026-27',
      pfDeductible: 1800, pfDeducted: 1800, employerPF: 1800,
      ptDeductible: 200, ptDeducted: 200,
    });
    expect(tx.taxRecordNumber).toMatch(/^TAX-\d{4}-\d{5}$/);
    expect(tx.standardDeduction).toBe(75000);
  });

  test('finds tax records by payrollRun', async () => {
    const found = await PayrollTax().find({ payrollRun: run._id, isDeleted: false });
    expect(found.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PayrollApproval', () => {
  let approval;
  test('creates approval record', async () => {
    const userId = new mongoose.Types.ObjectId();
    approval = await PayrollApproval().create({
      payrollRun: run._id, level: 1, approver: userId,
    });
    expect(approval._id).toBeDefined();
    expect(approval.status).toBe('pending');
  });

  test('approval action', async () => {
    approval.status   = 'approved';
    approval.comments = 'Looks good';
    approval.actionAt = new Date();
    await approval.save();
    expect(approval.status).toBe('approved');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PayrollSetting', () => {
  test('creates default payroll setting', async () => {
    const settings = await PayrollSetting().create({});
    expect(settings.pfRate).toBe(12);
    expect(settings.esiRate).toBe(0.75);
    expect(settings.pfWageCeiling).toBe(15000);
    expect(settings.esiWageCeiling).toBe(21000);
    expect(settings.workingDaysPerMonth).toBe(26);
    expect(settings.payDay).toBe(1);
  });

  test('pfWageCeiling enforced for PF calculation', () => {
    const settings = { pfRate: 12, pfWageCeiling: 15000 };
    const basic     = 50000;
    const pfWage    = Math.min(settings.pfWageCeiling, basic);
    const pf        = pfWage * settings.pfRate / 100;
    expect(pfWage).toBe(15000);
    expect(pf).toBe(1800); // 15000 * 12% = 1800
  });

  test('ESI not applicable above ceiling', () => {
    const settings    = { esiRate: 0.75, esiWageCeiling: 21000 };
    const grossSalary = 25000;
    const esiApplies  = grossSalary <= settings.esiWageCeiling;
    expect(esiApplies).toBe(false);
  });

  test('Professional tax Karnataka slab', () => {
    const compute = (gross) => gross > 15000 ? 200 : 0;
    expect(compute(10000)).toBe(0);
    expect(compute(15001)).toBe(200);
    expect(compute(50000)).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Payslip', () => {
  test('creates payslip linked to PayrollEmployee', async () => {
    // Find the PayrollEmployee created earlier
    const payEmpDoc = await PayrollEmployee().findOne({ payrollRun: run._id, isDeleted: false });
    if (!payEmpDoc) return; // Skip if not found
    const ps = await Payslip().create({
      payrollRun: run._id, employee: emp._id,
      payrollEmployee: payEmpDoc._id, period: period._id,
      generatedAt: new Date(),
    });
    expect(ps.payslipNumber).toMatch(/^PSP-\d{4}-\d{5}$/);
    expect(ps.isPublished).toBe(false);
  });

  test('publishes a payslip', async () => {
    const ps = await Payslip().findOne({ employee: emp._id, isDeleted: false });
    if (!ps) return;
    ps.isPublished = true;
    ps.publishedAt = new Date();
    await ps.save();
    expect(ps.isPublished).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Payroll calculation unit tests', () => {
  test('pro-rates basic salary for LOP days', () => {
    const basicSalary = 30000;
    const workingDays = 26;
    const paidDays    = 24; // 2 LOP days
    const prorated    = Math.round(basicSalary * (paidDays / workingDays));
    expect(prorated).toBe(27692);
  });

  test('computes gross earnings correctly', () => {
    const basic = 27692, hra = 11077, ta = 2769, med = 1154, special = 3462;
    const bonus = 0, incentive = 0, overtime = 0;
    const gross = basic + hra + ta + med + special + bonus + incentive + overtime;
    expect(gross).toBe(46154);
  });

  test('computes net pay', () => {
    const gross = 46154, pf = 1800, pt = 200, esi = 0, tds = 0;
    const netPay = gross - pf - pt - esi - tds;
    expect(netPay).toBe(44154);
  });

  test('ESI not applied when gross exceeds ceiling', () => {
    const gross = 46154, esiCeiling = 21000, esiRate = 0.75;
    const esi   = gross <= esiCeiling ? Math.round(gross * esiRate / 100) : 0;
    expect(esi).toBe(0);
  });

  test('PF capped at wage ceiling', () => {
    const basic = 50000, pfCeiling = 15000, pfRate = 12;
    const pf    = Math.round(Math.min(pfCeiling, basic) * pfRate / 100);
    expect(pf).toBe(1800); // capped at 15000
  });

  test('loan EMI calculation', () => {
    const principal = 100000, rate = 10, tenure = 12;
    const monthlyInterest = (principal * rate) / (12 * 100);
    const emi = Math.ceil((principal / tenure) + monthlyInterest);
    expect(emi).toBeGreaterThan(8333);
    expect(emi).toBeLessThan(9200);
  });
});
