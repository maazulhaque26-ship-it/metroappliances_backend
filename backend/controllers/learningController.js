'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const LearningPath           = () => mongoose.model('LearningPath');
const SkillGapAnalysis       = () => mongoose.model('SkillGapAnalysis');
const CareerDevelopmentPlan  = () => mongoose.model('CareerDevelopmentPlan');

function _audit(req, action, entity, id, label, before, after) {
  setImmediate(async () => {
    try {
      await AuditLog.create({
        admin: req.user._id, adminName: req.user.name,
        adminEmail: req.user.email, adminRole: req.user.role,
        action, entity, entityId: id,
        entityLabel: String(label || '').slice(0, 200),
        changes: { before, after },
        ip: (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
        userAgent: (req.get('User-Agent') || '').slice(0, 300),
      });
    } catch (_) {}
  });
}

// ── Learning Paths ────────────────────────────────────────────────────────────

exports.createLearningPath = async (req, res) => {
  try {
    const lp = await LearningPath().create(req.body);
    _audit(req, 'CREATE', 'LearningPath', lp._id, lp.pathCode, null, req.body);
    return created(res, lp, 'Learning path created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getLearningPaths = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { isActive, search } = req.query;
    const filter = { isDeleted: false };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      LearningPath().find(filter)
        .populate('targetRole', 'name')
        .populate('courses.course', 'courseCode title duration')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LearningPath().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getLearningPath = async (req, res) => {
  try {
    const lp = await LearningPath().findOne({ _id: req.params.id, isDeleted: false })
      .populate('targetRole', 'name')
      .populate('courses.course', 'courseCode title duration mode level')
      .lean();
    if (!lp) return notFound(res, 'Learning path');
    return ok(res, lp);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateLearningPath = async (req, res) => {
  try {
    const lp = await LearningPath().findOne({ _id: req.params.id, isDeleted: false });
    if (!lp) return notFound(res, 'Learning path');
    const before = lp.toObject();
    Object.assign(lp, req.body);
    await lp.save();
    _audit(req, 'UPDATE', 'LearningPath', lp._id, lp.pathCode, before, req.body);
    return ok(res, lp, 'Learning path updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteLearningPath = async (req, res) => {
  try {
    const lp = await LearningPath().findOne({ _id: req.params.id, isDeleted: false });
    if (!lp) return notFound(res, 'Learning path');
    lp.isDeleted = true;
    await lp.save();
    _audit(req, 'DELETE', 'LearningPath', lp._id, lp.pathCode, lp.toObject(), null);
    return ok(res, null, 'Learning path deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.assignLearningPath = async (req, res) => {
  try {
    const { employee, learningPath } = req.body;
    if (!employee || !learningPath) return fail(res, 'employee and learningPath are required');

    const lp = await LearningPath().findOne({ _id: learningPath, isDeleted: false }).lean();
    if (!lp) return notFound(res, 'Learning path');

    _audit(req, 'ASSIGN', 'LearningPath', lp._id, lp.pathCode, null, { employee, learningPath });
    return ok(res, { employee, learningPath, pathCode: lp.pathCode }, 'Learning path assigned');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Skill Gap Analysis ────────────────────────────────────────────────────────

exports.createSkillGapAnalysis = async (req, res) => {
  try {
    const { employee, targetDesignation, requiredSkills, recommendedTrainings, assessmentDate } = req.body;
    if (!employee) return fail(res, 'employee is required');

    const skills = Array.isArray(requiredSkills) ? requiredSkills : [];
    const processedSkills = skills.map(s => ({
      skill: s.skill,
      requiredLevel: s.requiredLevel,
      currentLevel: s.currentLevel || 0,
      gap: Math.max(0, (s.requiredLevel || 0) - (s.currentLevel || 0)),
    }));

    const overallGapScore = processedSkills.reduce((sum, s) => sum + (s.gap || 0), 0);

    const analysis = await SkillGapAnalysis().create({
      employee,
      targetDesignation,
      assessmentDate: assessmentDate || new Date(),
      requiredSkills: processedSkills,
      overallGapScore,
      recommendedTrainings,
      status: 'completed',
      assessedBy: req.user._id,
    });

    _audit(req, 'CREATE', 'SkillGapAnalysis', analysis._id, analysis._id.toString(), null, req.body);
    return created(res, analysis, 'Skill gap analysis created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getSkillGapAnalysis = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { employee, status } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (status)   filter.status   = status;

    const [data, total] = await Promise.all([
      SkillGapAnalysis().find(filter)
        .populate('employee', 'firstName lastName employeeCode')
        .populate('targetDesignation', 'name')
        .populate('recommendedTrainings', 'courseCode title')
        .populate('assessedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SkillGapAnalysis().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Career Development Plans ──────────────────────────────────────────────────

exports.createCareerPlan = async (req, res) => {
  try {
    const plan = await CareerDevelopmentPlan().create({ ...req.body, createdBy: req.user._id });
    _audit(req, 'CREATE', 'CareerDevelopmentPlan', plan._id, plan.planNumber, null, req.body);
    return created(res, plan, 'Career development plan created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getCareerPlans = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { employee, status } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (status)   filter.status   = status;

    const [data, total] = await Promise.all([
      CareerDevelopmentPlan().find(filter)
        .populate('employee', 'firstName lastName employeeCode')
        .populate('targetDesignation', 'name')
        .populate('targetDepartment', 'name')
        .populate('mentors', 'firstName lastName employeeCode')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CareerDevelopmentPlan().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateCareerPlan = async (req, res) => {
  try {
    const plan = await CareerDevelopmentPlan().findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return notFound(res, 'Career development plan');
    const before = plan.toObject();
    Object.assign(plan, req.body);
    await plan.save();
    _audit(req, 'UPDATE', 'CareerDevelopmentPlan', plan._id, plan.planNumber, before, req.body);
    return ok(res, plan, 'Career plan updated');
  } catch (err) {
    return serverError(res, err);
  }
};
