'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_performance';

// ── Lifecycle ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(DB_URI);
  await mongoose.connection.db.dropDatabase();

  // Base models (dependencies)
  require('../models/Department');
  require('../models/Designation');
  require('../models/BusinessUnit');
  require('../models/Location');
  require('../models/User');
  require('../models/Employee');
  require('../models/LeaveType');
  require('../models/LeaveBalance');
  require('../models/LeaveRequest');
  require('../models/LeaveApproval');

  // Sprint 14E models — load in dependency order
  require('../models/EmployeeUser');
  require('../models/PerformanceCycle');
  require('../models/GoalCategory');
  require('../models/Goal');
  require('../models/GoalProgress');
  require('../models/Competency');
  require('../models/CompetencyAssessment');
  require('../models/KPI');
  require('../models/KPIReview');
  require('../models/PerformanceReview');
  require('../models/PerformanceRating');
  require('../models/Appraisal');
  require('../models/PromotionRecommendation');
  require('../models/TrainingCourse');
  require('../models/TrainingSession');
  require('../models/TrainingEnrollment');
  require('../models/LearningPath');
  require('../models/CertificationTracking');
  require('../models/EmployeeFeedback');
  require('../models/OneOnOneMeeting');
  require('../models/SuccessionPlan');
  require('../models/CareerDevelopmentPlan');
  require('../models/SkillGapAnalysis');
  require('../models/EmployeeRecognition');
  require('../models/EmployeeSelfServiceSetting');
  require('../models/EmployeeAnnouncement');

  // Rebuild compound unique indexes after dropDatabase
  await Promise.all([
    mongoose.model('EmployeeUser').createIndexes(),
    mongoose.model('Goal').createIndexes(),
    mongoose.model('GoalCategory').createIndexes(),
    mongoose.model('Competency').createIndexes(),
    mongoose.model('CompetencyAssessment').createIndexes(),
    mongoose.model('KPI').createIndexes(),
    mongoose.model('KPIReview').createIndexes(),
    mongoose.model('PerformanceReview').createIndexes(),
    mongoose.model('PerformanceRating').createIndexes(),
    mongoose.model('Appraisal').createIndexes(),
    mongoose.model('TrainingCourse').createIndexes(),
    mongoose.model('TrainingSession').createIndexes(),
    mongoose.model('TrainingEnrollment').createIndexes(),
    mongoose.model('LearningPath').createIndexes(),
    mongoose.model('PromotionRecommendation').createIndexes(),
    mongoose.model('EmployeeFeedback').createIndexes(),
    mongoose.model('OneOnOneMeeting').createIndexes(),
    mongoose.model('EmployeeRecognition').createIndexes(),
    mongoose.model('EmployeeSelfServiceSetting').createIndexes(),
    mongoose.model('EmployeeAnnouncement').createIndexes(),
    mongoose.model('CareerDevelopmentPlan').createIndexes(),
  ]);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
});

// ── Model helpers (function pattern — avoids "model not registered" at module scope) ──
const EmployeeUser            = () => mongoose.model('EmployeeUser');
const PerformanceCycle        = () => mongoose.model('PerformanceCycle');
const GoalCategory            = () => mongoose.model('GoalCategory');
const Goal                    = () => mongoose.model('Goal');
const GoalProgress            = () => mongoose.model('GoalProgress');
const Competency              = () => mongoose.model('Competency');
const CompetencyAssessment    = () => mongoose.model('CompetencyAssessment');
const KPI                     = () => mongoose.model('KPI');
const KPIReview               = () => mongoose.model('KPIReview');
const PerformanceReview       = () => mongoose.model('PerformanceReview');
const PerformanceRating       = () => mongoose.model('PerformanceRating');
const Appraisal               = () => mongoose.model('Appraisal');
const PromotionRecommendation = () => mongoose.model('PromotionRecommendation');
const TrainingCourse          = () => mongoose.model('TrainingCourse');
const TrainingSession         = () => mongoose.model('TrainingSession');
const TrainingEnrollment      = () => mongoose.model('TrainingEnrollment');
const LearningPath            = () => mongoose.model('LearningPath');
const CertificationTracking   = () => mongoose.model('CertificationTracking');
const EmployeeFeedback        = () => mongoose.model('EmployeeFeedback');
const OneOnOneMeeting         = () => mongoose.model('OneOnOneMeeting');
const SuccessionPlan          = () => mongoose.model('SuccessionPlan');
const CareerDevelopmentPlan   = () => mongoose.model('CareerDevelopmentPlan');
const SkillGapAnalysis        = () => mongoose.model('SkillGapAnalysis');
const EmployeeRecognition     = () => mongoose.model('EmployeeRecognition');
const EmployeeSelfServiceSetting = () => mongoose.model('EmployeeSelfServiceSetting');
const EmployeeAnnouncement    = () => mongoose.model('EmployeeAnnouncement');
const Department              = () => mongoose.model('Department');
const Designation             = () => mongoose.model('Designation');
const Employee                = () => mongoose.model('Employee');

// ── Shared top-level fixtures ──────────────────────────────────────────────────
let dept, desig, user, employee, cycle;

beforeAll(async () => {
  dept = await Department().create({ name: 'Engineering', code: 'ENG' });
  desig = await Designation().create({ title: 'Software Engineer', level: 3 });
  user = { _id: new mongoose.Types.ObjectId() }; // synthetic user ref
  employee = await Employee().create({
    firstName: 'Arjun',
    lastName: 'Mehta',
    workEmail: 'arjun.mehta@metro.com',
    mobile: '9876543210',
    department: dept._id,
    designation: desig._id,
    joiningDate: new Date('2024-01-15'),
    employmentType: 'full_time',
  });
  cycle = await PerformanceCycle().create({
    name: 'FY 2026-27',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2027-03-31'),
    year: 2026,
    status: 'active',
  });
}, 20000);

// ═════════════════════════════════════════════════════════════════════════════
describe('EmployeeUser', () => {
  let empUser;

  test('creates EmployeeUser with employee ref + email + passwordHash', async () => {
    empUser = await EmployeeUser().create({
      employee: employee._id,
      email: 'arjun.mehta@ess.com',
      passwordHash: '$2b$10$hashedpassword',
    });
    expect(empUser._id).toBeDefined();
    expect(empUser.email).toBe('arjun.mehta@ess.com');
    expect(empUser.passwordHash).toBeDefined();
  });

  test('email must be unique — duplicate fails', async () => {
    const emp2 = await Employee().create({
      firstName: 'Riya', lastName: 'Singh',
      mobile: '9876543211', joiningDate: new Date('2024-02-01'),
    });
    await expect(
      EmployeeUser().create({ employee: emp2._id, email: 'arjun.mehta@ess.com' })
    ).rejects.toThrow();
  });

  test('employee ref must be unique — duplicate fails', async () => {
    await expect(
      EmployeeUser().create({ employee: employee._id, email: 'arjun2@ess.com' })
    ).rejects.toThrow();
  });

  test('isActive defaults to true', async () => {
    expect(empUser.isActive).toBe(true);
  });

  test('find by email works', async () => {
    const found = await EmployeeUser().findOne({ email: 'arjun.mehta@ess.com', isDeleted: false });
    expect(found).not.toBeNull();
    expect(found.employee.toString()).toBe(employee._id.toString());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('PerformanceCycle', () => {
  test('creates cycle with required name+startDate+endDate', async () => {
    const c = await PerformanceCycle().create({
      name: 'Q1 FY 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
      cycleType: 'quarterly',
      quarter: 1,
      year: 2026,
    });
    expect(c._id).toBeDefined();
    expect(c.name).toBe('Q1 FY 2026');
  });

  test('auto-generates cycleCode PC-YYYY-XXXXX', async () => {
    const c = await PerformanceCycle().create({
      name: 'Q2 FY 2026',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-09-30'),
    });
    expect(c.cycleCode).toMatch(/^PC-\d{4}-\d{5}$/);
  });

  test('status defaults to draft', async () => {
    const c = await PerformanceCycle().create({
      name: 'H1 FY 2027',
      startDate: new Date('2027-04-01'),
      endDate: new Date('2027-09-30'),
    });
    expect(c.status).toBe('draft');
  });

  test('filter by status=active returns the shared cycle', async () => {
    const active = await PerformanceCycle().find({ status: 'active', isDeleted: false });
    expect(active.length).toBeGreaterThanOrEqual(1);
    expect(active.map(c => c._id.toString())).toContain(cycle._id.toString());
  });

  test('filter by year returns matching cycles', async () => {
    const byYear = await PerformanceCycle().find({ year: 2026, isDeleted: false });
    expect(byYear.length).toBeGreaterThanOrEqual(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('GoalCategory', () => {
  let cat;

  test('creates category with unique name', async () => {
    cat = await GoalCategory().create({ name: 'Sales Targets', description: 'Revenue goals' });
    expect(cat._id).toBeDefined();
    expect(cat.name).toBe('Sales Targets');
  });

  test('duplicate name fails', async () => {
    await expect(
      GoalCategory().create({ name: 'Sales Targets' })
    ).rejects.toThrow();
  });

  test('isActive defaults to true', async () => {
    expect(cat.isActive).toBe(true);
  });

  test('lists active categories', async () => {
    await GoalCategory().create({ name: 'Learning & Development' });
    const active = await GoalCategory().find({ isActive: true, isDeleted: false });
    expect(active.length).toBeGreaterThanOrEqual(2);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('Goal', () => {
  let goal, cat2;

  beforeAll(async () => {
    cat2 = await GoalCategory().create({ name: 'Operational Excellence' });
  });

  test('creates goal with employee+title', async () => {
    goal = await Goal().create({
      employee: employee._id,
      cycle: cycle._id,
      category: cat2._id,
      title: 'Deliver Project Alpha on time',
      description: 'Complete all milestones by Q2 end',
      targetDate: new Date('2026-09-30'),
      weightage: 25,
    });
    expect(goal._id).toBeDefined();
    expect(goal.title).toBe('Deliver Project Alpha on time');
  });

  test('auto-generates goalNumber GOL-YYYY-XXXXX', async () => {
    expect(goal.goalNumber).toMatch(/^GOL-\d{4}-\d{5}$/);
  });

  test('status defaults to draft', async () => {
    expect(goal.status).toBe('draft');
  });

  test('progress defaults to 0', async () => {
    expect(goal.progress).toBe(0);
  });

  test('filter by employee', async () => {
    const byEmp = await Goal().find({ employee: employee._id, isDeleted: false });
    expect(byEmp.length).toBeGreaterThanOrEqual(1);
  });

  test('filter by cycle+status', async () => {
    await Goal().create({
      employee: employee._id, cycle: cycle._id,
      title: 'Active Goal', status: 'active',
    });
    const filtered = await Goal().find({ cycle: cycle._id, status: 'active', isDeleted: false });
    expect(filtered.length).toBeGreaterThanOrEqual(1);
  });

  test('update progress to 100 — achieved status can be applied', async () => {
    goal.progress = 100;
    goal.status = 'achieved';
    goal.completedDate = new Date();
    await goal.save();
    const found = await Goal().findById(goal._id);
    expect(found.progress).toBe(100);
    expect(found.status).toBe('achieved');
    expect(found.completedDate).toBeTruthy();
  });

  test('soft delete a goal', async () => {
    const tmp = await Goal().create({
      employee: employee._id, title: 'Temp Goal',
    });
    tmp.isDeleted = true;
    await tmp.save();
    const found = await Goal().findOne({ _id: tmp._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('GoalProgress', () => {
  let goalForProgress;

  beforeAll(async () => {
    goalForProgress = await Goal().create({
      employee: employee._id, cycle: cycle._id,
      title: 'Revenue Growth Target', status: 'active',
    });
  });

  test('creates GoalProgress with goal+employee+progressPercent', async () => {
    const gp = await GoalProgress().create({
      goal: goalForProgress._id,
      employee: employee._id,
      progressPercent: 40,
      notes: 'Completed first two milestones',
    });
    expect(gp._id).toBeDefined();
    expect(gp.progressPercent).toBe(40);
  });

  test('progressPercent enforces min 0 and max 100', async () => {
    await expect(
      GoalProgress().create({
        goal: goalForProgress._id,
        employee: employee._id,
        progressPercent: 110,
      })
    ).rejects.toThrow();
  });

  test('list progress entries by goal', async () => {
    await GoalProgress().create({
      goal: goalForProgress._id,
      employee: employee._id,
      progressPercent: 70,
      notes: 'Milestone 3 done',
    });
    const entries = await GoalProgress().find({ goal: goalForProgress._id, isDeleted: false });
    expect(entries.length).toBeGreaterThanOrEqual(2);
  });

  test('multiple progress entries allowed for same goal', async () => {
    await GoalProgress().create({
      goal: goalForProgress._id,
      employee: employee._id,
      progressPercent: 90,
    });
    const count = await GoalProgress().countDocuments({ goal: goalForProgress._id, isDeleted: false });
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('Competency', () => {
  let comp;

  test('creates competency with name', async () => {
    comp = await Competency().create({
      name: 'Problem Solving',
      description: 'Ability to analyse and resolve complex issues',
      competencyType: 'behavioral',
    });
    expect(comp._id).toBeDefined();
    expect(comp.name).toBe('Problem Solving');
  });

  test('auto-generates code CM-XXXXX (no year)', async () => {
    expect(comp.code).toMatch(/^CM-\d{5}$/);
  });

  test('competencyType enum enforced — invalid value fails', async () => {
    await expect(
      Competency().create({ name: 'Bad Comp', competencyType: 'invalid_type' })
    ).rejects.toThrow();
  });

  test('levels embedded array stores level definitions', async () => {
    comp.levels.push({ level: 1, title: 'Basic', description: 'Entry-level proficiency', indicators: ['Asks questions', 'Needs guidance'] });
    comp.levels.push({ level: 2, title: 'Intermediate', description: 'Applies independently', indicators: ['Solves routine problems'] });
    await comp.save();
    const found = await Competency().findById(comp._id);
    expect(found.levels).toHaveLength(2);
    expect(found.levels[0].level).toBe(1);
    expect(found.levels[1].title).toBe('Intermediate');
  });

  test('filter by competencyType', async () => {
    await Competency().create({ name: 'Node.js Expertise', competencyType: 'technical' });
    const technical = await Competency().find({ competencyType: 'technical', isDeleted: false });
    expect(technical.length).toBeGreaterThanOrEqual(1);
    expect(technical[0].competencyType).toBe('technical');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('CompetencyAssessment', () => {
  let comp2, assessment;

  beforeAll(async () => {
    comp2 = await Competency().create({ name: 'Leadership', competencyType: 'leadership' });
  });

  test('creates assessment with cycle+employee+competency', async () => {
    assessment = await CompetencyAssessment().create({
      cycle: cycle._id,
      employee: employee._id,
      competency: comp2._id,
      selfRating: 3,
      managerRating: 4,
      selfComments: 'I managed a small team this quarter.',
      managerComments: 'Shows strong leadership potential.',
    });
    expect(assessment._id).toBeDefined();
    expect(assessment.selfRating).toBe(3);
    expect(assessment.managerRating).toBe(4);
  });

  test('unique compound {cycle+employee+competency} enforced', async () => {
    await expect(
      CompetencyAssessment().create({
        cycle: cycle._id,
        employee: employee._id,
        competency: comp2._id,
      })
    ).rejects.toThrow();
  });

  test('duplicate with different competency succeeds', async () => {
    const comp3 = await Competency().create({ name: 'Communication', competencyType: 'behavioral' });
    const a2 = await CompetencyAssessment().create({
      cycle: cycle._id,
      employee: employee._id,
      competency: comp3._id,
      selfRating: 4,
    });
    expect(a2._id).toBeDefined();
  });

  test('selfRating and managerRating min 1 max 5 enforced', async () => {
    const comp4 = await Competency().create({ name: 'Teamwork', competencyType: 'behavioral' });
    await expect(
      CompetencyAssessment().create({
        cycle: cycle._id,
        employee: employee._id,
        competency: comp4._id,
        selfRating: 6,
      })
    ).rejects.toThrow();
  });

  test('finalRating can be updated after calibration', async () => {
    assessment.finalRating = 4;
    await assessment.save();
    const found = await CompetencyAssessment().findById(assessment._id);
    expect(found.finalRating).toBe(4);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('KPI', () => {
  let kpi;

  test('creates KPI with name', async () => {
    kpi = await KPI().create({
      name: 'Monthly Revenue',
      description: 'Total revenue generated per month',
      unit: 'INR',
      targetValue: 1000000,
      kpiType: 'quantitative',
      department: dept._id,
      weightage: 30,
    });
    expect(kpi._id).toBeDefined();
    expect(kpi.name).toBe('Monthly Revenue');
  });

  test('auto-generates kpiCode KPI-XXXXX (no year)', async () => {
    expect(kpi.kpiCode).toMatch(/^KPI-\d{5}$/);
  });

  test('kpiType enum enforced — invalid value fails', async () => {
    await expect(
      KPI().create({ name: 'Bad KPI', kpiType: 'invalid_type' })
    ).rejects.toThrow();
  });

  test('filter by department', async () => {
    await KPI().create({ name: 'Defect Rate', department: dept._id, kpiType: 'quantitative' });
    const byDept = await KPI().find({ department: dept._id, isDeleted: false });
    expect(byDept.length).toBeGreaterThanOrEqual(2);
  });

  test('isActive toggle — deactivating a KPI', async () => {
    kpi.isActive = false;
    await kpi.save();
    const found = await KPI().findById(kpi._id);
    expect(found.isActive).toBe(false);
    // restore
    kpi.isActive = true;
    await kpi.save();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('KPIReview', () => {
  let kpiForReview, kpiReview;

  beforeAll(async () => {
    kpiForReview = await KPI().create({
      name: 'Customer Satisfaction Score',
      kpiType: 'qualitative',
      targetValue: 90,
    });
  });

  test('creates KPIReview with kpi+cycle+employee+actualValue+targetValue', async () => {
    kpiReview = await KPIReview().create({
      kpi: kpiForReview._id,
      cycle: cycle._id,
      employee: employee._id,
      targetValue: 90,
      actualValue: 85,
      achievementPercent: 94.4,
      comments: 'Close to target, minor gaps in after-sales.',
    });
    expect(kpiReview._id).toBeDefined();
    expect(kpiReview.actualValue).toBe(85);
    expect(kpiReview.achievementPercent).toBe(94.4);
  });

  test('unique compound {kpi+cycle+employee} enforced', async () => {
    await expect(
      KPIReview().create({
        kpi: kpiForReview._id,
        cycle: cycle._id,
        employee: employee._id,
        actualValue: 80,
      })
    ).rejects.toThrow();
  });

  test('duplicate with different KPI succeeds', async () => {
    const kpi2 = await KPI().create({ name: 'Support Tickets Resolved' });
    const r2 = await KPIReview().create({
      kpi: kpi2._id,
      cycle: cycle._id,
      employee: employee._id,
      actualValue: 200,
      targetValue: 180,
    });
    expect(r2._id).toBeDefined();
  });

  test('achievementPercent field stores computed value', async () => {
    const found = await KPIReview().findById(kpiReview._id);
    expect(found.achievementPercent).toBeCloseTo(94.4);
  });

  test('rating field accepts 1-5 range', async () => {
    kpiReview.rating = 4;
    await kpiReview.save();
    const found = await KPIReview().findById(kpiReview._id);
    expect(found.rating).toBe(4);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('PerformanceReview', () => {
  let review;

  test('creates PerformanceReview with cycle+employee', async () => {
    review = await PerformanceReview().create({
      cycle: cycle._id,
      employee: employee._id,
      reviewer: user._id,
      reviewType: 'manager',
    });
    expect(review._id).toBeDefined();
    expect(review.cycle.toString()).toBe(cycle._id.toString());
    expect(review.employee.toString()).toBe(employee._id.toString());
  });

  test('auto-generates reviewNumber PRV-YYYY-XXXXX', async () => {
    expect(review.reviewNumber).toMatch(/^PRV-\d{4}-\d{5}$/);
  });

  test('status defaults to draft', async () => {
    expect(review.status).toBe('draft');
  });

  test('reviewType enum validated', async () => {
    await expect(
      PerformanceReview().create({
        cycle: cycle._id,
        employee: employee._id,
        reviewType: 'invalid_type',
      })
    ).rejects.toThrow();
  });

  test('selfScore+managerScore+finalScore fields stored correctly', async () => {
    review.selfScore = 78;
    review.managerScore = 82;
    review.finalScore = 80;
    review.status = 'manager_review';
    await review.save();
    const found = await PerformanceReview().findById(review._id);
    expect(found.selfScore).toBe(78);
    expect(found.managerScore).toBe(82);
    expect(found.finalScore).toBe(80);
  });

  test('overallRating enum can be set', async () => {
    review.overallRating = 'meets_expectations';
    review.status = 'completed';
    review.completedAt = new Date();
    await review.save();
    const found = await PerformanceReview().findById(review._id);
    expect(found.overallRating).toBe('meets_expectations');
    expect(found.status).toBe('completed');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('PerformanceRating', () => {
  let review2, rating;

  beforeAll(async () => {
    review2 = await PerformanceReview().create({
      cycle: cycle._id,
      employee: employee._id,
      reviewType: 'self',
    });
  });

  test('creates PerformanceRating with review+rater', async () => {
    rating = await PerformanceRating().create({
      review: review2._id,
      rater: user._id,
      raterType: 'manager',
      overallScore: 82,
      recommendation: 'Eligible for promotion',
    });
    expect(rating._id).toBeDefined();
    expect(rating.overallScore).toBe(82);
    expect(rating.isSubmitted).toBe(false);
  });

  test('unique {review+rater} enforced — duplicate fails', async () => {
    await expect(
      PerformanceRating().create({
        review: review2._id,
        rater: user._id,
        raterType: 'manager',
      })
    ).rejects.toThrow();
  });

  test('duplicate with different rater succeeds', async () => {
    const rater2 = new mongoose.Types.ObjectId();
    const r2 = await PerformanceRating().create({
      review: review2._id,
      rater: rater2,
      raterType: 'hr',
      overallScore: 79,
    });
    expect(r2._id).toBeDefined();
  });

  test('scores embedded array stores category breakdowns', async () => {
    rating.scores.push({ category: 'Goals', weight: 40, score: 85, comments: 'Achieved all goals' });
    rating.scores.push({ category: 'Competency', weight: 60, score: 80, comments: 'Strong behavioral skills' });
    await rating.save();
    const found = await PerformanceRating().findById(rating._id);
    expect(found.scores).toHaveLength(2);
    expect(found.scores[0].category).toBe('Goals');
  });

  test('isSubmitted toggle with submittedAt', async () => {
    rating.isSubmitted = true;
    rating.submittedAt = new Date();
    await rating.save();
    const found = await PerformanceRating().findById(rating._id);
    expect(found.isSubmitted).toBe(true);
    expect(found.submittedAt).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('Appraisal', () => {
  let appraisal;

  test('creates Appraisal with employee+cycle', async () => {
    appraisal = await Appraisal().create({
      employee: employee._id,
      cycle: cycle._id,
      finalScore: 80,
      remarks: 'Consistent performer',
    });
    expect(appraisal._id).toBeDefined();
    expect(appraisal.employee.toString()).toBe(employee._id.toString());
  });

  test('auto-generates appraisalNumber APR-YYYY-XXXXX', async () => {
    expect(appraisal.appraisalNumber).toMatch(/^APR-\d{4}-\d{5}$/);
  });

  test('finalRating enum accepted', async () => {
    appraisal.finalRating = 'meets_expectations';
    await appraisal.save();
    const found = await Appraisal().findById(appraisal._id);
    expect(found.finalRating).toBe('meets_expectations');
  });

  test('increment and incrementType stored', async () => {
    appraisal.increment = 8;
    appraisal.incrementType = 'percentage';
    appraisal.newCTC = 648000;
    appraisal.effectiveDate = new Date('2026-07-01');
    await appraisal.save();
    const found = await Appraisal().findById(appraisal._id);
    expect(found.increment).toBe(8);
    expect(found.incrementType).toBe('percentage');
    expect(found.newCTC).toBe(648000);
  });

  test('status transitions draft → approved', async () => {
    appraisal.status = 'approved';
    appraisal.approvedBy = user._id;
    appraisal.approvedAt = new Date();
    await appraisal.save();
    const found = await Appraisal().findById(appraisal._id);
    expect(found.status).toBe('approved');
    expect(found.approvedAt).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('PromotionRecommendation', () => {
  let promo;

  test('creates PromotionRecommendation with employee ref', async () => {
    promo = await PromotionRecommendation().create({
      employee: employee._id,
      cycle: cycle._id,
      currentDesignation: desig._id,
      currentDepartment: dept._id,
      rationale: 'Consistently exceeded targets for 2 years.',
      currentCTC: 600000,
      proposedCTC: 750000,
    });
    expect(promo._id).toBeDefined();
    expect(promo.employee.toString()).toBe(employee._id.toString());
  });

  test('auto-generates promoNumber PRM-YYYY-XXXXX', async () => {
    expect(promo.promoNumber).toMatch(/^PRM-\d{4}-\d{5}$/);
  });

  test('status enum accepted and transitions', async () => {
    promo.status = 'pending_approval';
    await promo.save();
    expect(promo.status).toBe('pending_approval');
    promo.status = 'approved';
    promo.approvedBy = user._id;
    promo.effectiveDate = new Date('2026-07-01');
    await promo.save();
    expect(promo.status).toBe('approved');
  });

  test('currentDesignation+recommendedDesignation refs stored', async () => {
    const newDesig = await Designation().create({ title: 'Tech Lead', level: 5 });
    promo.recommendedDesignation = newDesig._id;
    await promo.save();
    const found = await PromotionRecommendation().findById(promo._id);
    expect(found.currentDesignation.toString()).toBe(desig._id.toString());
    expect(found.recommendedDesignation.toString()).toBe(newDesig._id.toString());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('TrainingCourse', () => {
  let course;

  test('creates TrainingCourse with title', async () => {
    course = await TrainingCourse().create({
      title: 'Advanced Node.js Development',
      description: 'Deep dive into Node.js internals and patterns',
      category: 'Technical',
      duration: 24,
      mode: 'online',
      level: 'advanced',
      skills: ['Node.js', 'Event Loop', 'Streams'],
      instructor: 'Prashant Verma',
      maxCapacity: 30,
    });
    expect(course._id).toBeDefined();
    expect(course.title).toBe('Advanced Node.js Development');
  });

  test('auto-generates courseCode CRS-XXXXX (no year)', async () => {
    expect(course.courseCode).toMatch(/^CRS-\d{5}$/);
  });

  test('mode enum accepted', async () => {
    const blended = await TrainingCourse().create({
      title: 'Leadership Essentials', mode: 'blended', level: 'intermediate',
    });
    expect(blended.mode).toBe('blended');
  });

  test('level enum accepted', async () => {
    const beginner = await TrainingCourse().create({
      title: 'Excel for HR', level: 'beginner', mode: 'offline',
    });
    expect(beginner.level).toBe('beginner');
  });

  test('skills array stores multiple entries', async () => {
    const found = await TrainingCourse().findById(course._id);
    expect(found.skills).toContain('Node.js');
    expect(found.skills).toContain('Streams');
    expect(found.skills).toHaveLength(3);
  });

  test('isMandatory and certificateOnCompletion flags', async () => {
    course.isMandatory = true;
    course.certificateOnCompletion = true;
    await course.save();
    const found = await TrainingCourse().findById(course._id);
    expect(found.isMandatory).toBe(true);
    expect(found.certificateOnCompletion).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('TrainingSession', () => {
  let course2, session;

  beforeAll(async () => {
    course2 = await TrainingCourse().create({
      title: 'Agile & Scrum Fundamentals', mode: 'online', level: 'beginner',
    });
  });

  test('creates TrainingSession with course+startDate', async () => {
    session = await TrainingSession().create({
      course: course2._id,
      title: 'Agile Batch June 2026',
      startDate: new Date('2026-06-10'),
      endDate: new Date('2026-06-12'),
      location: 'Online',
      meetLink: 'https://meet.google.com/agile-june',
      instructor: 'Neeraj Sharma',
      maxCapacity: 20,
    });
    expect(session._id).toBeDefined();
    expect(session.course.toString()).toBe(course2._id.toString());
  });

  test('auto-generates sessionCode TSS-YYYY-XXXXX', async () => {
    expect(session.sessionCode).toMatch(/^TSS-\d{4}-\d{5}$/);
  });

  test('enrolledCount defaults to 0', async () => {
    expect(session.enrolledCount).toBe(0);
  });

  test('status defaults to scheduled', async () => {
    expect(session.status).toBe('scheduled');
  });

  test('cancel session — status transitions to cancelled', async () => {
    const session2 = await TrainingSession().create({
      course: course2._id,
      title: 'Agile Batch July 2026',
      startDate: new Date('2026-07-15'),
    });
    session2.status = 'cancelled';
    await session2.save();
    const found = await TrainingSession().findById(session2._id);
    expect(found.status).toBe('cancelled');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('TrainingEnrollment', () => {
  let enrollCourse, enrollSession, enrollment;

  beforeAll(async () => {
    enrollCourse = await TrainingCourse().create({
      title: 'Python for Data Analysis', mode: 'online', level: 'intermediate',
    });
    enrollSession = await TrainingSession().create({
      course: enrollCourse._id,
      title: 'Python Batch Aug 2026',
      startDate: new Date('2026-08-01'),
    });
  });

  test('creates enrollment with session+employee', async () => {
    enrollment = await TrainingEnrollment().create({
      session: enrollSession._id,
      employee: employee._id,
      course: enrollCourse._id,
    });
    expect(enrollment._id).toBeDefined();
    expect(enrollment.session.toString()).toBe(enrollSession._id.toString());
    expect(enrollment.employee.toString()).toBe(employee._id.toString());
  });

  test('unique {session+employee} enforced — duplicate fails', async () => {
    await expect(
      TrainingEnrollment().create({
        session: enrollSession._id,
        employee: employee._id,
      })
    ).rejects.toThrow();
  });

  test('duplicate with different employee succeeds', async () => {
    const emp2 = await Employee().create({
      firstName: 'Meera', lastName: 'Iyer',
      mobile: '9876543212', joiningDate: new Date('2024-03-01'),
    });
    const e2 = await TrainingEnrollment().create({
      session: enrollSession._id,
      employee: emp2._id,
      course: enrollCourse._id,
    });
    expect(e2._id).toBeDefined();
  });

  test('status defaults to enrolled', async () => {
    expect(enrollment.status).toBe('enrolled');
  });

  test('complete enrollment — status transitions to completed', async () => {
    enrollment.status = 'completed';
    enrollment.completionDate = new Date();
    enrollment.score = 88;
    enrollment.certificateIssued = true;
    await enrollment.save();
    const found = await TrainingEnrollment().findById(enrollment._id);
    expect(found.status).toBe('completed');
    expect(found.score).toBe(88);
    expect(found.certificateIssued).toBe(true);
  });

  test('attendancePercent field stored', async () => {
    enrollment.attendancePercent = 95;
    await enrollment.save();
    const found = await TrainingEnrollment().findById(enrollment._id);
    expect(found.attendancePercent).toBe(95);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('LearningPath', () => {
  let pathCourse1, pathCourse2, learningPath;

  beforeAll(async () => {
    pathCourse1 = await TrainingCourse().create({ title: 'Git Fundamentals', mode: 'online', level: 'beginner' });
    pathCourse2 = await TrainingCourse().create({ title: 'CI/CD Pipelines', mode: 'online', level: 'intermediate' });
  });

  test('creates LearningPath with name', async () => {
    learningPath = await LearningPath().create({
      name: 'DevOps Engineer Track',
      description: 'End-to-end path for DevOps engineers',
      targetRole: desig._id,
      estimatedDuration: 40,
      skills: ['Git', 'Docker', 'Jenkins'],
    });
    expect(learningPath._id).toBeDefined();
    expect(learningPath.name).toBe('DevOps Engineer Track');
  });

  test('auto-generates pathCode LP-XXXXX (no year)', async () => {
    expect(learningPath.pathCode).toMatch(/^LP-\d{5}$/);
  });

  test('courses embedded with order', async () => {
    learningPath.courses.push({ course: pathCourse1._id, order: 1, isMandatory: true });
    learningPath.courses.push({ course: pathCourse2._id, order: 2, isMandatory: true });
    await learningPath.save();
    const found = await LearningPath().findById(learningPath._id);
    expect(found.courses).toHaveLength(2);
    expect(found.courses[0].order).toBe(1);
    expect(found.courses[1].order).toBe(2);
  });

  test('targetRole ref stored correctly', async () => {
    const found = await LearningPath().findById(learningPath._id);
    expect(found.targetRole.toString()).toBe(desig._id.toString());
  });

  test('estimatedDuration stored correctly', async () => {
    expect(learningPath.estimatedDuration).toBe(40);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('CertificationTracking', () => {
  let cert;

  test('creates CertificationTracking with employee+certificationName', async () => {
    cert = await CertificationTracking().create({
      employee: employee._id,
      certificationName: 'AWS Certified Developer Associate',
      issuingAuthority: 'Amazon Web Services',
      certificationNumber: 'AWS-DEV-2026-001',
      issueDate: new Date('2026-01-15'),
      expiryDate: new Date('2029-01-15'),
      documentUrl: 'https://s3.example.com/certs/aws-dev.pdf',
    });
    expect(cert._id).toBeDefined();
    expect(cert.certificationName).toBe('AWS Certified Developer Associate');
  });

  test('status defaults to active', async () => {
    expect(cert.status).toBe('active');
  });

  test('expiryDate stored as future date', async () => {
    const found = await CertificationTracking().findById(cert._id);
    expect(found.expiryDate).toBeTruthy();
    expect(found.expiryDate > new Date()).toBe(true);
  });

  test('status can be set to expiring_soon', async () => {
    cert.status = 'expiring_soon';
    await cert.save();
    const found = await CertificationTracking().findById(cert._id);
    expect(found.status).toBe('expiring_soon');
  });

  test('reminderSent toggle', async () => {
    cert.reminderSent = true;
    await cert.save();
    const found = await CertificationTracking().findById(cert._id);
    expect(found.reminderSent).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('EmployeeFeedback', () => {
  let feedback;

  test('creates EmployeeFeedback with fromEmployee+message', async () => {
    feedback = await EmployeeFeedback().create({
      fromEmployee: employee._id,
      toEmployee: employee._id,
      message: 'Great collaboration on Project Alpha deliverables.',
      type: 'appreciation',
      subject: 'Q2 Collaboration',
      rating: 5,
    });
    expect(feedback._id).toBeDefined();
    expect(feedback.message).toBe('Great collaboration on Project Alpha deliverables.');
    expect(feedback.status).toBe('submitted');
  });

  test('auto-generates feedbackNumber FBK-YYYY-XXXXX', async () => {
    expect(feedback.feedbackNumber).toMatch(/^FBK-\d{4}-\d{5}$/);
  });

  test('type enum validated', async () => {
    await expect(
      EmployeeFeedback().create({
        fromEmployee: employee._id,
        message: 'Test',
        type: 'invalid_type',
      })
    ).rejects.toThrow();
  });

  test('isAnonymous flag stored', async () => {
    const anon = await EmployeeFeedback().create({
      fromEmployee: employee._id,
      message: 'Anonymous feedback about team communication.',
      type: 'improvement',
      isAnonymous: true,
    });
    expect(anon.isAnonymous).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('OneOnOneMeeting', () => {
  let meeting;

  test('creates OneOnOneMeeting with employee+manager+scheduledAt', async () => {
    meeting = await OneOnOneMeeting().create({
      employee: employee._id,
      manager: user._id,
      scheduledAt: new Date('2026-07-05T10:00:00Z'),
      duration: 30,
      agenda: 'Q2 performance review discussion and career goals',
    });
    expect(meeting._id).toBeDefined();
    expect(meeting.employee.toString()).toBe(employee._id.toString());
    expect(meeting.manager.toString()).toBe(user._id.toString());
  });

  test('auto-generates meetingNumber OOM-YYYY-XXXXX', async () => {
    expect(meeting.meetingNumber).toMatch(/^OOM-\d{4}-\d{5}$/);
  });

  test('actionItems embedded array stored', async () => {
    meeting.actionItems.push({ item: 'Share updated career development plan', dueDate: new Date('2026-07-15') });
    meeting.actionItems.push({ item: 'Enroll in leadership training', dueDate: new Date('2026-07-20') });
    await meeting.save();
    const found = await OneOnOneMeeting().findById(meeting._id);
    expect(found.actionItems).toHaveLength(2);
    expect(found.actionItems[0].item).toBe('Share updated career development plan');
    expect(found.actionItems[0].completed).toBe(false);
  });

  test('status defaults to scheduled', async () => {
    expect(meeting.status).toBe('scheduled');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('SuccessionPlan', () => {
  let plan;

  test('creates SuccessionPlan with position ref', async () => {
    plan = await SuccessionPlan().create({
      position: desig._id,
      department: dept._id,
      currentHolder: employee._id,
      criticality: 'high',
      planningDate: new Date('2026-04-01'),
      reviewDate: new Date('2027-04-01'),
    });
    expect(plan._id).toBeDefined();
    expect(plan.position.toString()).toBe(desig._id.toString());
  });

  test('criticality enum accepted', async () => {
    const found = await SuccessionPlan().findById(plan._id);
    expect(found.criticality).toBe('high');
  });

  test('successors embedded array with readinessLevel', async () => {
    plan.successors.push({
      employee: employee._id,
      readinessLevel: 'ready_1_2_years',
      developmentNeeds: 'Leadership skills enhancement',
      strengths: 'Strong technical background',
      rank: 1,
    });
    await plan.save();
    const found = await SuccessionPlan().findById(plan._id);
    expect(found.successors).toHaveLength(1);
    expect(found.successors[0].readinessLevel).toBe('ready_1_2_years');
    expect(found.successors[0].rank).toBe(1);
  });

  test('isActive defaults to true', async () => {
    expect(plan.isActive).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('CareerDevelopmentPlan', () => {
  let cdp;

  test('creates CareerDevelopmentPlan with employee', async () => {
    cdp = await CareerDevelopmentPlan().create({
      employee: employee._id,
      targetDesignation: desig._id,
      targetDepartment: dept._id,
      timelineYears: 3,
      currentSkills: ['JavaScript', 'Node.js', 'MongoDB'],
      targetSkills: ['System Design', 'Cloud Architecture', 'Team Leadership'],
    });
    expect(cdp._id).toBeDefined();
    expect(cdp.employee.toString()).toBe(employee._id.toString());
    expect(cdp.status).toBe('active');
  });

  test('auto-generates planNumber CDP-YYYY-XXXXX', async () => {
    expect(cdp.planNumber).toMatch(/^CDP-\d{4}-\d{5}$/);
  });

  test('developmentAreas embedded array stored', async () => {
    cdp.developmentAreas.push({
      area: 'System Design',
      actions: 'Complete distributed systems course and lead architecture decisions',
      timeline: '6 months',
      status: 'in_progress',
    });
    cdp.developmentAreas.push({
      area: 'Leadership',
      actions: 'Attend leadership workshops and mentor juniors',
      timeline: '12 months',
      status: 'pending',
    });
    await cdp.save();
    const found = await CareerDevelopmentPlan().findById(cdp._id);
    expect(found.developmentAreas).toHaveLength(2);
    expect(found.developmentAreas[0].area).toBe('System Design');
    expect(found.developmentAreas[1].status).toBe('pending');
  });

  test('mentors array stores employee refs', async () => {
    const mentor = await Employee().create({
      firstName: 'Vikram', lastName: 'Patel',
      mobile: '9876543213', joiningDate: new Date('2022-01-01'),
    });
    cdp.mentors.push(mentor._id);
    await cdp.save();
    const found = await CareerDevelopmentPlan().findById(cdp._id);
    expect(found.mentors).toHaveLength(1);
    expect(found.mentors[0].toString()).toBe(mentor._id.toString());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('SkillGapAnalysis', () => {
  let sga, course3;

  beforeAll(async () => {
    course3 = await TrainingCourse().create({ title: 'Cloud Architecture Fundamentals', mode: 'online', level: 'advanced' });
  });

  test('creates SkillGapAnalysis with employee+targetDesignation', async () => {
    sga = await SkillGapAnalysis().create({
      employee: employee._id,
      targetDesignation: desig._id,
      assessmentDate: new Date('2026-06-01'),
      overallGapScore: 35,
      status: 'draft',
    });
    expect(sga._id).toBeDefined();
    expect(sga.employee.toString()).toBe(employee._id.toString());
  });

  test('requiredSkills embedded array with gap field', async () => {
    sga.requiredSkills.push({
      skill: 'System Design',
      requiredLevel: 4,
      currentLevel: 2,
      gap: 2,
    });
    sga.requiredSkills.push({
      skill: 'Cloud Architecture',
      requiredLevel: 3,
      currentLevel: 1,
      gap: 2,
    });
    await sga.save();
    const found = await SkillGapAnalysis().findById(sga._id);
    expect(found.requiredSkills).toHaveLength(2);
    expect(found.requiredSkills[0].gap).toBe(2);
    expect(found.requiredSkills[1].skill).toBe('Cloud Architecture');
  });

  test('overallGapScore stored correctly', async () => {
    const found = await SkillGapAnalysis().findById(sga._id);
    expect(found.overallGapScore).toBe(35);
  });

  test('recommendedTrainings array links to TrainingCourse', async () => {
    sga.recommendedTrainings.push(course3._id);
    sga.status = 'completed';
    await sga.save();
    const found = await SkillGapAnalysis().findById(sga._id);
    expect(found.recommendedTrainings).toHaveLength(1);
    expect(found.recommendedTrainings[0].toString()).toBe(course3._id.toString());
    expect(found.status).toBe('completed');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('EmployeeRecognition', () => {
  let recognition;

  test('creates EmployeeRecognition with recipient+title', async () => {
    recognition = await EmployeeRecognition().create({
      recipient: employee._id,
      giver: employee._id,
      givenBy: user._id,
      title: 'Star Performer Q1',
      description: 'Exceptional delivery of Project Alpha ahead of schedule.',
      type: 'spot_award',
      points: 500,
      isPublic: true,
      cycle: cycle._id,
    });
    expect(recognition._id).toBeDefined();
    expect(recognition.title).toBe('Star Performer Q1');
    expect(recognition.recipient.toString()).toBe(employee._id.toString());
  });

  test('auto-generates recognitionNumber RCG-YYYY-XXXXX', async () => {
    expect(recognition.recognitionNumber).toMatch(/^RCG-\d{4}-\d{5}$/);
  });

  test('type enum validated', async () => {
    await expect(
      EmployeeRecognition().create({
        recipient: employee._id,
        title: 'Invalid Award',
        type: 'invalid_type',
      })
    ).rejects.toThrow();
  });

  test('points field stored correctly', async () => {
    const found = await EmployeeRecognition().findById(recognition._id);
    expect(found.points).toBe(500);
    expect(found.type).toBe('spot_award');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('EmployeeSelfServiceSetting', () => {
  let settings;

  test('creates singleton with defaults', async () => {
    settings = await EmployeeSelfServiceSetting().create({});
    expect(settings._id).toBeDefined();
    expect(settings.singleton).toBe('default');
    expect(settings.allowLeaveApplication).toBe(true);
    expect(settings.allowProfileUpdate).toBe(true);
    expect(settings.allowDocumentUpload).toBe(true);
    expect(settings.allowFeedbackSubmission).toBe(true);
    expect(settings.recognitionPointsEnabled).toBe(true);
    expect(settings.goalsVisibleToEmployee).toBe(true);
  });

  test('singleton unique — second create with same key fails', async () => {
    await expect(
      EmployeeSelfServiceSetting().create({ singleton: 'default' })
    ).rejects.toThrow();
  });

  test('update settings fields', async () => {
    settings.payslipAccessMonths = 24;
    settings.announcementCategories = ['HR', 'IT', 'Finance'];
    await settings.save();
    const found = await EmployeeSelfServiceSetting().findById(settings._id);
    expect(found.payslipAccessMonths).toBe(24);
    expect(found.announcementCategories).toContain('HR');
    expect(found.announcementCategories).toHaveLength(3);
  });

  test('verify boolean defaults are correct', async () => {
    const found = await EmployeeSelfServiceSetting().findOne({ singleton: 'default' });
    expect(found.allowLeaveApplication).toBe(true);
    expect(found.allowProfileUpdate).toBe(true);
    expect(found.allowDocumentUpload).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('EmployeeAnnouncement', () => {
  let announcement;

  test('creates EmployeeAnnouncement with title+content', async () => {
    announcement = await EmployeeAnnouncement().create({
      title: 'Office Closure — Independence Day',
      content: 'The office will remain closed on August 15th for Independence Day.',
      category: 'Holiday',
      priority: 'high',
      targetAudience: 'all',
      expiresAt: new Date('2026-08-16'),
    });
    expect(announcement._id).toBeDefined();
    expect(announcement.title).toBe('Office Closure — Independence Day');
    expect(announcement.content).toBeDefined();
  });

  test('auto-generates announcementNumber ANN-YYYY-XXXXX', async () => {
    expect(announcement.announcementNumber).toMatch(/^ANN-\d{4}-\d{5}$/);
  });

  test('priority enum accepted', async () => {
    const urgent = await EmployeeAnnouncement().create({
      title: 'System Maintenance Tonight',
      content: 'All systems will be down from 11 PM to 2 AM for maintenance.',
      priority: 'urgent',
    });
    expect(urgent.priority).toBe('urgent');
  });

  test('isPublished defaults to false, can be toggled to true', async () => {
    expect(announcement.isPublished).toBe(false);
    announcement.isPublished = true;
    announcement.publishedBy = user._id;
    announcement.publishAt = new Date();
    await announcement.save();
    const found = await EmployeeAnnouncement().findById(announcement._id);
    expect(found.isPublished).toBe(true);
    expect(found.publishedBy.toString()).toBe(user._id.toString());
  });
});
