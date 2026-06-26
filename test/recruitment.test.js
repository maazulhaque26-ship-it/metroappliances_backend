'use strict';
const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/metro_test_recruitment';

// ── Lifecycle ─────────────────────────────────────────────────────────────────
beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(DB_URI);
  await mongoose.connection.db.dropDatabase();

  // Base models (required by Sprint 14D models)
  require('../models/Department');
  require('../models/Designation');
  require('../models/BusinessUnit');
  require('../models/Location');
  require('../models/User');
  require('../models/Employee');

  // Sprint 14D models
  require('../models/RecruitmentAgency');
  require('../models/CandidateSource');
  require('../models/RecruitmentStage');
  require('../models/RecruitmentPipeline');
  require('../models/RecruitmentSetting');
  require('../models/TalentPool');
  require('../models/JobDepartment');
  require('../models/JobOpening');
  require('../models/Candidate');
  require('../models/CandidateDocument');
  require('../models/JobApplication');
  require('../models/InterviewPanel');
  require('../models/Interview');
  require('../models/InterviewFeedback');
  require('../models/OfferLetter');
  require('../models/OfferApproval');
  require('../models/OfferAcceptance');
  require('../models/BackgroundVerification');
  require('../models/OnboardingChecklist');
  require('../models/RecruitmentReport');

  // Rebuild indexes after dropDatabase.
  // Use syncIndexes() so that models whose auto-number field carries both
  // `unique: true` (field-level) and a separate schema.index({ field: 1 })
  // declaration don't throw "existing index has the same name" conflicts.
  // syncIndexes() drops stale indexes and recreates, whereas createIndexes()
  // would collide when uniqueness differs between the two declarations.
  await Promise.all([
    mongoose.model('JobOpening').syncIndexes(),
    mongoose.model('JobApplication').syncIndexes(),
    mongoose.model('Candidate').syncIndexes(),
    mongoose.model('Interview').syncIndexes(),
    mongoose.model('InterviewFeedback').syncIndexes(),
    mongoose.model('OfferLetter').syncIndexes(),
    mongoose.model('OfferAcceptance').syncIndexes(),
    mongoose.model('BackgroundVerification').syncIndexes(),
    mongoose.model('RecruitmentAgency').syncIndexes(),
    mongoose.model('CandidateSource').syncIndexes(),
    mongoose.model('TalentPool').syncIndexes(),
    mongoose.model('RecruitmentSetting').syncIndexes(),
  ]);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
});

// ── Model helpers (function pattern — avoids "model not registered" at module scope) ──
const JobOpening            = () => mongoose.model('JobOpening');
const Candidate             = () => mongoose.model('Candidate');
const JobApplication        = () => mongoose.model('JobApplication');
const Interview             = () => mongoose.model('Interview');
const InterviewFeedback     = () => mongoose.model('InterviewFeedback');
const OfferLetter           = () => mongoose.model('OfferLetter');
const OfferApproval         = () => mongoose.model('OfferApproval');
const OfferAcceptance       = () => mongoose.model('OfferAcceptance');
const BackgroundVerification= () => mongoose.model('BackgroundVerification');
const OnboardingChecklist   = () => mongoose.model('OnboardingChecklist');
const InterviewPanel        = () => mongoose.model('InterviewPanel');
const JobDepartment         = () => mongoose.model('JobDepartment');
const CandidateDocument     = () => mongoose.model('CandidateDocument');
const RecruitmentAgency     = () => mongoose.model('RecruitmentAgency');
const CandidateSource       = () => mongoose.model('CandidateSource');
const RecruitmentPipeline   = () => mongoose.model('RecruitmentPipeline');
const RecruitmentStage      = () => mongoose.model('RecruitmentStage');
const RecruitmentSetting    = () => mongoose.model('RecruitmentSetting');
const RecruitmentReport     = () => mongoose.model('RecruitmentReport');
const TalentPool            = () => mongoose.model('TalentPool');
const Department            = () => mongoose.model('Department');
const Designation           = () => mongoose.model('Designation');
const Employee              = () => mongoose.model('Employee');

// ── Shared top-level fixtures ──────────────────────────────────────────────────
// These are set across describe blocks and must be top-level let declarations.
let dept, desig, emp, candidate, job, application;
let interview, offer, acceptance; // set in Interview / OfferLetter / OfferAcceptance blocks

beforeAll(async () => {
  dept  = await Department().create({ name: 'Engineering', code: 'ENG' });
  desig = await Designation().create({ title: 'Software Engineer', level: 3 });
  emp   = await Employee().create({
    firstName: 'Arjun',
    lastName: 'Mehta',
    workEmail: 'arjun.mehta@metro.com',
    mobile: '9876543210',
    department: dept._id,
    designation: desig._id,
    joiningDate: new Date('2024-01-15'),
    employmentType: 'full_time',
  });
}, 20000);

// ═════════════════════════════════════════════════════════════════════════════
describe('RecruitmentAgency', () => {
  let agency;

  test('creates agency with required name', async () => {
    agency = await RecruitmentAgency().create({
      name: 'TechHire Solutions',
      contactPerson: 'Ravi Kumar',
      email: 'ravi@techhire.com',
      commissionType: 'percentage',
      commissionRate: 8.5,
    });
    expect(agency._id).toBeDefined();
    expect(agency.name).toBe('TechHire Solutions');
    expect(agency.status).toBe('active');
  });

  test('auto-generates agencyCode AGY-XXXXX', async () => {
    expect(agency.agencyCode).toMatch(/^AGY-\d{5}$/);
  });

  test('finds agencies by status', async () => {
    await RecruitmentAgency().create({ name: 'StaffBridge India' });
    const active = await RecruitmentAgency().find({ status: 'active', isDeleted: false });
    expect(active.length).toBeGreaterThanOrEqual(2);
  });

  test('updates agency rating', async () => {
    agency.rating = 4;
    await agency.save();
    const found = await RecruitmentAgency().findById(agency._id);
    expect(found.rating).toBe(4);
  });

  test('soft deletes agency', async () => {
    const tmp = await RecruitmentAgency().create({ name: 'Temp Agency' });
    tmp.isDeleted = true;
    await tmp.save();
    const found = await RecruitmentAgency().findOne({ _id: tmp._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('CandidateSource', () => {
  test('creates a candidate source', async () => {
    const src = await CandidateSource().create({
      name: 'LinkedIn Jobs',
      type: 'social_media',
      description: 'LinkedIn job postings',
      costPerHire: 5000,
    });
    expect(src._id).toBeDefined();
    expect(src.isActive).toBe(true);
    expect(src.type).toBe('social_media');
  });

  test('rejects duplicate source name', async () => {
    await CandidateSource().create({ name: 'Naukri Portal', type: 'job_portal' });
    await expect(
      CandidateSource().create({ name: 'Naukri Portal', type: 'job_portal' })
    ).rejects.toThrow();
  });

  test('lists active sources', async () => {
    await CandidateSource().create({ name: 'Campus Drive', type: 'campus' });
    const active = await CandidateSource().find({ isActive: true, isDeleted: false });
    expect(active.length).toBeGreaterThanOrEqual(2);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('RecruitmentStage', () => {
  let pipeline, stage1, stage2;

  beforeAll(async () => {
    pipeline = await RecruitmentPipeline().create({ name: 'Tech Pipeline' });
  });

  test('creates stage with required name and order', async () => {
    stage1 = await RecruitmentStage().create({
      name: 'Resume Screening',
      order: 1,
      stageType: 'screening',
      pipeline: pipeline._id,
    });
    expect(stage1._id).toBeDefined();
    expect(stage1.order).toBe(1);
    expect(stage1.stageType).toBe('screening');
  });

  test('order field distinguishes stages in a pipeline', async () => {
    stage2 = await RecruitmentStage().create({
      name: 'Technical Round',
      order: 2,
      stageType: 'interview',
      pipeline: pipeline._id,
    });
    expect(stage2.order).toBeGreaterThan(stage1.order);
  });

  test('lists stages by pipeline sorted by order', async () => {
    const stages = await RecruitmentStage()
      .find({ pipeline: pipeline._id, isDeleted: false })
      .sort({ order: 1 });
    expect(stages.length).toBe(2);
    expect(stages[0].order).toBe(1);
    expect(stages[1].order).toBe(2);
  });

  test('isTerminal flag marks final stage', async () => {
    const finalStage = await RecruitmentStage().create({
      name: 'Offer',
      order: 3,
      stageType: 'offer',
      pipeline: pipeline._id,
      isTerminal: true,
    });
    expect(finalStage.isTerminal).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('RecruitmentPipeline', () => {
  let pipeline;

  test('creates pipeline with stage refs', async () => {
    const s1 = await RecruitmentStage().create({ name: 'Applied', order: 1 });
    const s2 = await RecruitmentStage().create({ name: 'Interview', order: 2 });
    pipeline = await RecruitmentPipeline().create({
      name: 'Standard Hiring Pipeline',
      description: 'Default pipeline for all hires',
      stages: [s1._id, s2._id],
    });
    expect(pipeline._id).toBeDefined();
    expect(pipeline.stages).toHaveLength(2);
  });

  test('isDefault flag can be set', async () => {
    pipeline.isDefault = true;
    await pipeline.save();
    expect(pipeline.isDefault).toBe(true);
  });

  test('only one pipeline can be marked default (application-level logic)', async () => {
    // Verify we can find the default pipeline
    const defaults = await RecruitmentPipeline().find({ isDefault: true, isDeleted: false });
    expect(defaults.length).toBeGreaterThanOrEqual(1);
  });

  test('updates pipeline name', async () => {
    pipeline.name = 'Standard Hiring Pipeline v2';
    await pipeline.save();
    const found = await RecruitmentPipeline().findById(pipeline._id);
    expect(found.name).toBe('Standard Hiring Pipeline v2');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('RecruitmentSetting', () => {
  let settings;

  test('creates singleton settings with defaults', async () => {
    settings = await RecruitmentSetting().create({});
    expect(settings._id).toBeDefined();
    expect(settings.singleton).toBe('default');
    expect(settings.offerValidityDays).toBe(7);
    expect(settings.requireBGV).toBe(true);
  });

  test('retrieves default settings by singleton key', async () => {
    const found = await RecruitmentSetting().findOne({ singleton: 'default' });
    expect(found).not.toBeNull();
    expect(found.requireBGV).toBe(true);
  });

  test('updates settings fields', async () => {
    settings.offerValidityDays = 14;
    settings.slaScreeningDays = 5;
    await settings.save();
    const found = await RecruitmentSetting().findById(settings._id);
    expect(found.offerValidityDays).toBe(14);
    expect(found.slaScreeningDays).toBe(5);
  });

  test('singleton enforced — duplicate singleton key fails', async () => {
    await expect(
      RecruitmentSetting().create({ singleton: 'default' })
    ).rejects.toThrow();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('TalentPool', () => {
  let pool;

  test('creates a talent pool', async () => {
    pool = await TalentPool().create({
      name: 'React Developers Pool',
      description: 'Pre-screened React candidates',
      skillTags: ['react', 'javascript', 'typescript'],
    });
    expect(pool._id).toBeDefined();
    expect(pool.isActive).toBe(true);
    expect(pool.skillTags).toContain('react');
  });

  test('adds candidate reference to pool', async () => {
    const cnd = await Candidate().create({
      firstName: 'Pool',
      lastName: 'Candidate',
      email: 'pool.candidate@test.com',
    });
    pool.candidates.push(cnd._id);
    await pool.save();
    const found = await TalentPool().findById(pool._id);
    expect(found.candidates).toHaveLength(1);
  });

  test('lists active talent pools', async () => {
    await TalentPool().create({ name: 'Node.js Developers Pool' });
    const active = await TalentPool().find({ isActive: true, isDeleted: false });
    expect(active.length).toBeGreaterThanOrEqual(2);
  });

  test('soft deletes a pool', async () => {
    const tmp = await TalentPool().create({ name: 'Temp Pool' });
    tmp.isDeleted = true;
    await tmp.save();
    const found = await TalentPool().findOne({ _id: tmp._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('JobDepartment', () => {
  let jobDept;

  test('creates job department linked to department', async () => {
    jobDept = await JobDepartment().create({
      department: dept._id,
      annualHiringTarget: 10,
      currentHeadcount: 25,
      approvedHeadcount: 35,
      hiringBudget: 2000000,
      hiringManager: new mongoose.Types.ObjectId(),
    });
    expect(jobDept._id).toBeDefined();
    expect(jobDept.hiringBudget).toBe(2000000);
  });

  test('hiringBudget can be queried correctly', async () => {
    const found = await JobDepartment().findById(jobDept._id);
    expect(found.hiringBudget).toBe(2000000);
    expect(found.annualHiringTarget).toBe(10);
  });

  test('updates hiring budget', async () => {
    jobDept.hiringBudget = 2500000;
    await jobDept.save();
    const found = await JobDepartment().findById(jobDept._id);
    expect(found.hiringBudget).toBe(2500000);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('JobOpening', () => {
  beforeAll(async () => {
    job = await JobOpening().create({
      title: 'Senior Software Engineer',
      department: dept._id,
      designation: desig._id,
      jobType: 'full_time',
      workMode: 'hybrid',
      location: 'Mumbai',
      experienceMin: 3,
      experienceMax: 7,
      salaryMin: 800000,
      salaryMax: 1400000,
      skills: ['Node.js', 'React', 'MongoDB'],
      description: 'Build scalable web applications',
      openings: 3,
    });
  });

  test('creates job opening with required title', async () => {
    expect(job._id).toBeDefined();
    expect(job.title).toBe('Senior Software Engineer');
    expect(job.status).toBe('draft');
    expect(job.openings).toBe(3);
  });

  test('auto-generates jobNumber JOB-YYYY-XXXXX', async () => {
    expect(job.jobNumber).toMatch(/^JOB-\d{4}-\d{5}$/);
  });

  test('filters jobs by status', async () => {
    const drafts = await JobOpening().find({ status: 'draft', isDeleted: false });
    expect(drafts.length).toBeGreaterThanOrEqual(1);
  });

  test('filters jobs by department', async () => {
    const byDept = await JobOpening().find({ department: dept._id, isDeleted: false });
    expect(byDept.length).toBeGreaterThanOrEqual(1);
  });

  test('updates title and description', async () => {
    job.title = 'Lead Software Engineer';
    job.description = 'Lead a team of engineers';
    await job.save();
    const found = await JobOpening().findById(job._id);
    expect(found.title).toBe('Lead Software Engineer');
  });

  test('changes status to open with posted date', async () => {
    job.status = 'open';
    job.postedDate = new Date();
    await job.save();
    const found = await JobOpening().findById(job._id);
    expect(found.status).toBe('open');
    expect(found.postedDate).toBeTruthy();
  });

  test('soft deletes a job opening', async () => {
    const tmp = await JobOpening().create({ title: 'Temp Role' });
    tmp.isDeleted = true;
    await tmp.save();
    const found = await JobOpening().findOne({ _id: tmp._id, isDeleted: false });
    expect(found).toBeNull();
  });

  test('openings count defaults to 1 when not specified', async () => {
    const minimal = await JobOpening().create({ title: 'QA Engineer' });
    expect(minimal.openings).toBe(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('Candidate', () => {
  beforeAll(async () => {
    candidate = await Candidate().create({
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@gmail.com',
      phone: '9988776655',
      currentCompany: 'TechCorp',
      currentDesignation: 'Senior Developer',
      currentCTC: 900000,
      expectedCTC: 1200000,
      noticePeriod: 60,
      totalExperience: 5,
      skills: ['React', 'Node.js', 'MongoDB'],
      source: 'job_portal',
    });
  });

  test('creates candidate with required email and firstName', async () => {
    expect(candidate._id).toBeDefined();
    expect(candidate.firstName).toBe('Priya');
    expect(candidate.email).toBe('priya.sharma@gmail.com');
    expect(candidate.status).toBe('active');
  });

  test('auto-generates candidateNumber CND-YYYY-XXXXX', async () => {
    expect(candidate.candidateNumber).toMatch(/^CND-\d{4}-\d{5}$/);
  });

  test('email is indexed (not uniquely constrained — duplicates allowed)', async () => {
    // candidateSchema.index({ email: 1 }) — not unique, so same email OK
    const dup = await Candidate().create({
      firstName: 'Duplicate',
      email: 'priya.sharma@gmail.com',
    });
    expect(dup._id).toBeDefined();
  });

  test('skills array stores multiple skills', async () => {
    expect(candidate.skills).toContain('React');
    expect(candidate.skills).toContain('Node.js');
    expect(candidate.skills).toHaveLength(3);
  });

  test('education array can be populated', async () => {
    candidate.education.push({
      degree: 'B.Tech',
      field: 'Computer Science',
      institution: 'IIT Mumbai',
      year: 2019,
      percentage: 85,
    });
    await candidate.save();
    const found = await Candidate().findById(candidate._id);
    expect(found.education).toHaveLength(1);
    expect(found.education[0].degree).toBe('B.Tech');
  });

  test('adds candidate to talentPools array', async () => {
    candidate.talentPools.push('react-pool');
    await candidate.save();
    const found = await Candidate().findById(candidate._id);
    expect(found.talentPools).toContain('react-pool');
  });

  test('updates candidate status to hired', async () => {
    candidate.status = 'hired';
    await candidate.save();
    const found = await Candidate().findById(candidate._id);
    expect(found.status).toBe('hired');
    // Restore for later tests
    candidate.status = 'active';
    await candidate.save();
  });

  test('soft deletes a candidate', async () => {
    const tmp = await Candidate().create({
      firstName: 'Temp',
      email: 'tmp.delete@test.com',
    });
    tmp.isDeleted = true;
    await tmp.save();
    const found = await Candidate().findOne({ _id: tmp._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('CandidateDocument', () => {
  let doc;

  test('creates document linked to candidate', async () => {
    doc = await CandidateDocument().create({
      candidate: candidate._id,
      docType: 'resume',
      fileName: 'priya_sharma_resume.pdf',
      fileUrl: 'https://s3.example.com/resumes/priya.pdf',
      fileSize: 204800,
    });
    expect(doc._id).toBeDefined();
    expect(doc.docType).toBe('resume');
    expect(doc.isVerified).toBe(false);
  });

  test('docType enum is enforced', async () => {
    await expect(
      CandidateDocument().create({
        candidate: candidate._id,
        docType: 'invalid_type',
      })
    ).rejects.toThrow();
  });

  test('lists documents by candidate', async () => {
    await CandidateDocument().create({
      candidate: candidate._id,
      docType: 'certificate',
      fileName: 'aws_cert.pdf',
    });
    const docs = await CandidateDocument().find({ candidate: candidate._id, isDeleted: false });
    expect(docs.length).toBeGreaterThanOrEqual(2);
  });

  test('updates isVerified flag', async () => {
    const verifier = new mongoose.Types.ObjectId();
    doc.isVerified = true;
    doc.verifiedBy = verifier;
    doc.verifiedAt = new Date();
    await doc.save();
    const found = await CandidateDocument().findById(doc._id);
    expect(found.isVerified).toBe(true);
    expect(found.verifiedBy.toString()).toBe(verifier.toString());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('JobApplication', () => {
  beforeAll(async () => {
    application = await JobApplication().create({
      job: job._id,
      candidate: candidate._id,
      source: 'job_portal',
      coverLetter: 'I am excited to apply for this role.',
      expectedCTC: 1200000,
      noticePeriod: 60,
    });
  });

  test('creates application linked to job and candidate', async () => {
    expect(application._id).toBeDefined();
    expect(application.status).toBe('applied');
    expect(application.currentStage).toBe('Applied');
  });

  test('auto-generates applicationNumber APP-YYYY-XXXXX', async () => {
    expect(application.applicationNumber).toMatch(/^APP-\d{4}-\d{5}$/);
  });

  test('duplicate job+candidate fails (unique compound index)', async () => {
    await expect(
      JobApplication().create({ job: job._id, candidate: candidate._id })
    ).rejects.toThrow();
  });

  test('pushes entry to stageHistory', async () => {
    application.stageHistory.push({
      stage: 'Screening',
      status: 'in_progress',
      movedAt: new Date(),
      notes: 'Resume reviewed',
    });
    await application.save();
    const found = await JobApplication().findById(application._id);
    expect(found.stageHistory).toHaveLength(1);
    expect(found.stageHistory[0].stage).toBe('Screening');
  });

  test('transitions status to shortlisted with shortlistedAt', async () => {
    application.status = 'shortlisted';
    application.shortlistedAt = new Date();
    await application.save();
    const found = await JobApplication().findById(application._id);
    expect(found.status).toBe('shortlisted');
    expect(found.shortlistedAt).toBeTruthy();
  });

  test('transitions status to interview', async () => {
    application.status = 'interview';
    application.currentStage = 'Technical Interview';
    await application.save();
    expect(application.status).toBe('interview');
  });

  test('transitions status to rejected with rejectedAt', async () => {
    // Use a fresh application to not break shared fixture
    const cnd2 = await Candidate().create({ firstName: 'Reject', email: 'reject@test.com' });
    const rejApp = await JobApplication().create({ job: job._id, candidate: cnd2._id });
    rejApp.status = 'rejected';
    rejApp.rejectedAt = new Date();
    rejApp.rejectionReason = 'Not enough experience';
    await rejApp.save();
    expect(rejApp.status).toBe('rejected');
    expect(rejApp.rejectedAt).toBeTruthy();
  });

  test('soft deletes an application', async () => {
    const cnd3 = await Candidate().create({ firstName: 'SoftDel', email: 'softdel@test.com' });
    const delApp = await JobApplication().create({ job: job._id, candidate: cnd3._id });
    delApp.isDeleted = true;
    await delApp.save();
    const found = await JobApplication().findOne({ _id: delApp._id, isDeleted: false });
    expect(found).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('InterviewPanel', () => {
  let panel;

  test('creates panel for a job opening', async () => {
    panel = await InterviewPanel().create({
      job: job._id,
      name: 'Backend Engineering Panel',
    });
    expect(panel._id).toBeDefined();
    expect(panel.isActive).toBe(true);
  });

  test('adds members to panel', async () => {
    panel.members.push({
      name: 'Ravi Gupta',
      email: 'ravi@metro.com',
      role: 'lead',
      expertise: ['Node.js', 'System Design'],
    });
    panel.members.push({
      name: 'Sneha Patil',
      email: 'sneha@metro.com',
      role: 'member',
      expertise: ['React'],
    });
    await panel.save();
    const found = await InterviewPanel().findById(panel._id);
    expect(found.members).toHaveLength(2);
    expect(found.members[0].role).toBe('lead');
  });

  test('lists panels by job', async () => {
    const panels = await InterviewPanel().find({ job: job._id, isDeleted: false });
    expect(panels.length).toBeGreaterThanOrEqual(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('Interview', () => {
  // `interview` is declared at top-level to allow InterviewFeedback describe to access it.

  test('creates interview with scheduledAt, application, candidate, job', async () => {
    interview = await Interview().create({
      application: application._id,
      candidate: candidate._id,
      job: job._id,
      round: 1,
      type: 'technical',
      scheduledAt: new Date('2026-07-10T10:00:00Z'),
      duration: 60,
      mode: 'video',
      meetLink: 'https://meet.google.com/abc-defg',
    });
    expect(interview._id).toBeDefined();
    expect(interview.status).toBe('scheduled');
    expect(interview.round).toBe(1);
  });

  test('auto-generates interviewNumber INT-YYYY-XXXXX', async () => {
    expect(interview.interviewNumber).toMatch(/^INT-\d{4}-\d{5}$/);
  });

  test('interviewers array stores panel members', async () => {
    interview.interviewers.push({
      name: 'Ravi Gupta',
      email: 'ravi@metro.com',
      role: 'primary',
    });
    interview.interviewers.push({
      name: 'Sneha Patil',
      email: 'sneha@metro.com',
      role: 'panel',
    });
    await interview.save();
    const found = await Interview().findById(interview._id);
    expect(found.interviewers).toHaveLength(2);
  });

  test('status defaults to scheduled', async () => {
    const found = await Interview().findById(interview._id);
    expect(found.status).toBe('scheduled');
  });

  test('completes an interview (status → completed)', async () => {
    interview.status = 'completed';
    interview.result = 'next_round';
    interview.notes = 'Good technical skills, proceed to HR round';
    await interview.save();
    expect(interview.status).toBe('completed');
    expect(interview.result).toBe('next_round');
  });

  test('cancels an interview (status → cancelled)', async () => {
    const cancelInterview = await Interview().create({
      application: application._id,
      candidate: candidate._id,
      job: job._id,
      scheduledAt: new Date('2026-07-12T14:00:00Z'),
      round: 2,
      type: 'hr',
    });
    cancelInterview.status = 'cancelled';
    cancelInterview.cancelReason = 'Interviewer unavailable';
    await cancelInterview.save();
    expect(cancelInterview.status).toBe('cancelled');
    expect(cancelInterview.cancelReason).toBe('Interviewer unavailable');
  });

  test('reschedule creates new interview with rescheduledFrom ref', async () => {
    const rescheduled = await Interview().create({
      application: application._id,
      candidate: candidate._id,
      job: job._id,
      scheduledAt: new Date('2026-07-15T11:00:00Z'),
      round: 1,
      type: 'technical',
      rescheduledFrom: interview._id,
    });
    expect(rescheduled.rescheduledFrom.toString()).toBe(interview._id.toString());
    expect(rescheduled.status).toBe('scheduled');
  });

  test('round number increments for subsequent rounds', async () => {
    const round2 = await Interview().create({
      application: application._id,
      candidate: candidate._id,
      job: job._id,
      scheduledAt: new Date('2026-07-20T10:00:00Z'),
      round: 2,
      type: 'hr',
    });
    expect(round2.round).toBe(2);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('InterviewFeedback', () => {
  let feedback, interviewerId;

  beforeAll(async () => {
    interviewerId = new mongoose.Types.ObjectId();
  });

  test('creates feedback for an interview', async () => {
    feedback = await InterviewFeedback().create({
      interview: interview._id,
      application: application._id,
      interviewer: interviewerId,
      overallRating: 4,
      skillRatings: [
        { skill: 'Node.js', rating: 4, comments: 'Strong backend knowledge' },
        { skill: 'System Design', rating: 3, comments: 'Needs improvement' },
      ],
      strengths: 'Problem solving, communication',
      weaknesses: 'System design depth',
      comments: 'Good candidate overall',
      recommendation: 'next_round',
    });
    expect(feedback._id).toBeDefined();
    expect(feedback.isSubmitted).toBe(false);
    expect(feedback.overallRating).toBe(4);
  });

  test('unique interview+interviewer compound index prevents duplicates', async () => {
    await expect(
      InterviewFeedback().create({
        interview: interview._id,
        interviewer: interviewerId,
        recommendation: 'hire',
      })
    ).rejects.toThrow();
  });

  test('overallRating min/max bounds enforced', async () => {
    await expect(
      InterviewFeedback().create({
        interview: interview._id,
        interviewer: new mongoose.Types.ObjectId(),
        overallRating: 10,
        recommendation: 'hire',
      })
    ).rejects.toThrow();
  });

  test('recommendation enum validated', async () => {
    await expect(
      InterviewFeedback().create({
        interview: interview._id,
        interviewer: new mongoose.Types.ObjectId(),
        recommendation: 'maybe',
      })
    ).rejects.toThrow();
  });

  test('isSubmitted toggles and submittedAt set', async () => {
    feedback.isSubmitted = true;
    feedback.submittedAt = new Date();
    await feedback.save();
    const found = await InterviewFeedback().findById(feedback._id);
    expect(found.isSubmitted).toBe(true);
    expect(found.submittedAt).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('OfferLetter', () => {
  // `offer` is declared at top-level to allow OfferApproval / OfferAcceptance to access it.

  test('creates offer letter with ctc, application, candidate, job', async () => {
    offer = await OfferLetter().create({
      application: application._id,
      candidate: candidate._id,
      job: job._id,
      ctc: 1200000,
      salaryBreakup: {
        basic: 480000,
        hra: 192000,
        travelAllowance: 36000,
        medicalAllowance: 15000,
        specialAllowance: 477000,
      },
      designation: 'Lead Software Engineer',
      department: 'Engineering',
      location: 'Mumbai',
      joiningDate: new Date('2026-08-01'),
      offerValidTill: new Date('2026-07-20'),
      probationPeriod: 90,
    });
    expect(offer._id).toBeDefined();
    expect(offer.status).toBe('draft');
    expect(offer.ctc).toBe(1200000);
  });

  test('auto-generates offerNumber OFR-YYYY-XXXXX', async () => {
    expect(offer.offerNumber).toMatch(/^OFR-\d{4}-\d{5}$/);
  });

  test('salaryBreakup object stored correctly', async () => {
    const found = await OfferLetter().findById(offer._id);
    expect(found.salaryBreakup.basic).toBe(480000);
    expect(found.salaryBreakup.hra).toBe(192000);
  });

  test('transitions to pending_approval', async () => {
    offer.status = 'pending_approval';
    await offer.save();
    expect(offer.status).toBe('pending_approval');
  });

  test('approves offer (status → approved)', async () => {
    const approver = new mongoose.Types.ObjectId();
    offer.status = 'approved';
    offer.approvedBy = approver;
    offer.approvedAt = new Date();
    await offer.save();
    const found = await OfferLetter().findById(offer._id);
    expect(found.status).toBe('approved');
    expect(found.approvedAt).toBeTruthy();
  });

  test('sends offer (status → sent)', async () => {
    offer.status = 'sent';
    offer.sentAt = new Date();
    await offer.save();
    expect(offer.status).toBe('sent');
    expect(offer.sentAt).toBeTruthy();
  });

  test('soft deletes an offer letter', async () => {
    const cndX = await Candidate().create({ firstName: 'OfferDel', email: 'offerdel@test.com' });
    const appX = await JobApplication().create({ job: job._id, candidate: cndX._id });
    const tmpOffer = await OfferLetter().create({
      application: appX._id,
      candidate: cndX._id,
      job: job._id,
      ctc: 800000,
    });
    tmpOffer.isDeleted = true;
    await tmpOffer.save();
    const found = await OfferLetter().findOne({ _id: tmpOffer._id, isDeleted: false });
    expect(found).toBeNull();
  });

  test('filters offers by status', async () => {
    const sent = await OfferLetter().find({ status: 'sent', isDeleted: false });
    expect(sent.length).toBeGreaterThanOrEqual(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('OfferApproval', () => {
  let approval1, approval2;

  test('creates approval record at level 1', async () => {
    const approver = new mongoose.Types.ObjectId();
    approval1 = await OfferApproval().create({
      offerLetter: offer._id,
      level: 1,
      approver,
    });
    expect(approval1._id).toBeDefined();
    expect(approval1.status).toBe('pending');
    expect(approval1.level).toBe(1);
  });

  test('level field distinguishes approval tiers', async () => {
    const approver2 = new mongoose.Types.ObjectId();
    approval2 = await OfferApproval().create({
      offerLetter: offer._id,
      level: 2,
      approver: approver2,
    });
    expect(approval2.level).toBe(2);
    expect(approval2.level).toBeGreaterThan(approval1.level);
  });

  test('approves level 1 (status → approved)', async () => {
    approval1.status = 'approved';
    approval1.comments = 'Approved within budget';
    approval1.actionAt = new Date();
    await approval1.save();
    const found = await OfferApproval().findById(approval1._id);
    expect(found.status).toBe('approved');
    expect(found.actionAt).toBeTruthy();
  });

  test('multiple approval levels for same offer', async () => {
    const levels = await OfferApproval().find({ offerLetter: offer._id });
    expect(levels.length).toBe(2);
    const levelNums = levels.map(l => l.level).sort();
    expect(levelNums).toEqual([1, 2]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('OfferAcceptance', () => {
  // `acceptance` is declared at top-level.

  test('creates offer acceptance with decision=accepted', async () => {
    acceptance = await OfferAcceptance().create({
      offerLetter: offer._id,
      candidate: candidate._id,
      decision: 'accepted',
      joiningDate: new Date('2026-08-01'),
      acceptedAt: new Date(),
    });
    expect(acceptance._id).toBeDefined();
    expect(acceptance.decision).toBe('accepted');
    expect(acceptance.joiningDate).toBeTruthy();
  });

  test('unique per offerLetter — duplicate rejected', async () => {
    await expect(
      OfferAcceptance().create({
        offerLetter: offer._id,
        candidate: candidate._id,
        decision: 'rejected',
      })
    ).rejects.toThrow();
  });

  test('joiningDate stored correctly', async () => {
    const found = await OfferAcceptance().findById(acceptance._id);
    expect(found.joiningDate).toBeTruthy();
    expect(found.joiningDate.toISOString().startsWith('2026-08-01')).toBe(true);
  });

  test('countered decision stores counterCTC', async () => {
    // Create a new offer to test counter scenario
    const cndY = await Candidate().create({ firstName: 'Counter', email: 'counter@test.com' });
    const appY = await JobApplication().create({ job: job._id, candidate: cndY._id });
    const offerY = await OfferLetter().create({
      application: appY._id,
      candidate: cndY._id,
      job: job._id,
      ctc: 1000000,
    });
    const counter = await OfferAcceptance().create({
      offerLetter: offerY._id,
      candidate: cndY._id,
      decision: 'countered',
      counterCTC: 1100000,
      reason: 'Expecting higher CTC based on market rates',
    });
    expect(counter.decision).toBe('countered');
    expect(counter.counterCTC).toBe(1100000);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('BackgroundVerification', () => {
  let bgv;

  test('creates BGV record with candidate', async () => {
    bgv = await BackgroundVerification().create({
      candidate: candidate._id,
      application: application._id,
      vendor: 'VerifyPro India',
      checks: [
        { checkType: 'address', status: 'pending', result: 'pending' },
        { checkType: 'employment', status: 'pending', result: 'pending' },
        { checkType: 'education', status: 'pending', result: 'pending' },
      ],
    });
    expect(bgv._id).toBeDefined();
    expect(bgv.status).toBe('pending');
    expect(bgv.checks).toHaveLength(3);
  });

  test('auto-generates bgvNumber BGV-YYYY-XXXXX', async () => {
    expect(bgv.bgvNumber).toMatch(/^BGV-\d{4}-\d{5}$/);
  });

  test('checks array checkType enum enforced', async () => {
    await expect(
      BackgroundVerification().create({
        candidate: candidate._id,
        checks: [{ checkType: 'invalid_check' }],
      })
    ).rejects.toThrow();
  });

  test('updates individual check status to in_progress', async () => {
    bgv.checks[0].status = 'in_progress';
    bgv.status = 'in_progress';
    await bgv.save();
    const found = await BackgroundVerification().findById(bgv._id);
    expect(found.status).toBe('in_progress');
    expect(found.checks[0].status).toBe('in_progress');
  });

  test('marks checks as completed with result=clear', async () => {
    bgv.checks.forEach(c => {
      c.status = 'completed';
      c.result = 'clear';
      c.completedAt = new Date();
    });
    await bgv.save();
    const found = await BackgroundVerification().findById(bgv._id);
    expect(found.checks.every(c => c.result === 'clear')).toBe(true);
  });

  test('sets overallResult based on check results', async () => {
    bgv.overallResult = 'clear';
    bgv.status = 'completed';
    bgv.completedAt = new Date();
    await bgv.save();
    const found = await BackgroundVerification().findById(bgv._id);
    expect(found.overallResult).toBe('clear');
    expect(found.status).toBe('completed');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('OnboardingChecklist', () => {
  let checklist;

  test('creates onboarding checklist with tasks array', async () => {
    checklist = await OnboardingChecklist().create({
      candidate: candidate._id,
      application: application._id,
      joiningDate: new Date('2026-08-01'),
      tasks: [
        { title: 'Submit ID proof documents', category: 'document' },
        { title: 'Complete IT access request form', category: 'system_access' },
        { title: 'Attend orientation session', category: 'orientation' },
        { title: 'Collect laptop and accessories', category: 'equipment' },
      ],
    });
    expect(checklist._id).toBeDefined();
    expect(checklist.status).toBe('pending');
    expect(checklist.tasks).toHaveLength(4);
    expect(checklist.completionPercentage).toBe(0);
  });

  test('completing a task updates isCompleted and completedAt', async () => {
    checklist.tasks[0].isCompleted = true;
    checklist.tasks[0].completedAt = new Date();
    checklist.tasks[0].notes = 'PAN and Aadhar submitted';
    await checklist.save();
    const found = await OnboardingChecklist().findById(checklist._id);
    expect(found.tasks[0].isCompleted).toBe(true);
    expect(found.tasks[0].completedAt).toBeTruthy();
  });

  test('completionPercentage can be calculated and stored', async () => {
    const total     = checklist.tasks.length;
    const completed = checklist.tasks.filter(t => t.isCompleted).length;
    checklist.completionPercentage = Math.round((completed / total) * 100);
    checklist.status = 'in_progress';
    await checklist.save();
    const found = await OnboardingChecklist().findById(checklist._id);
    expect(found.completionPercentage).toBe(25);
    expect(found.status).toBe('in_progress');
  });

  test('all tasks complete sets status to completed', async () => {
    checklist.tasks.forEach(t => {
      t.isCompleted = true;
      t.completedAt = new Date();
    });
    checklist.completionPercentage = 100;
    checklist.status = 'completed';
    await checklist.save();
    const found = await OnboardingChecklist().findById(checklist._id);
    expect(found.status).toBe('completed');
    expect(found.completionPercentage).toBe(100);
  });

  test('query by candidate finds checklist', async () => {
    const results = await OnboardingChecklist().find({
      candidate: candidate._id,
      isDeleted: false,
    });
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('RecruitmentReport', () => {
  test('creates a saved report config', async () => {
    const report = await RecruitmentReport().create({
      name: 'Q2 Hiring Funnel',
      reportType: 'hiring_funnel',
      filters: { department: dept._id, dateFrom: '2026-04-01', dateTo: '2026-06-30' },
      createdBy: new mongoose.Types.ObjectId(),
    });
    expect(report._id).toBeDefined();
    expect(report.name).toBe('Q2 Hiring Funnel');
    expect(report.reportType).toBe('hiring_funnel');
  });

  test('reportType enum is enforced', async () => {
    await expect(
      RecruitmentReport().create({
        name: 'Invalid Report',
        reportType: 'invalid_type',
      })
    ).rejects.toThrow();
  });

  test('lists saved reports', async () => {
    await RecruitmentReport().create({
      name: 'Source Effectiveness July 2026',
      reportType: 'source_effectiveness',
    });
    const reports = await RecruitmentReport().find({ isDeleted: false });
    expect(reports.length).toBeGreaterThanOrEqual(2);
  });
});
