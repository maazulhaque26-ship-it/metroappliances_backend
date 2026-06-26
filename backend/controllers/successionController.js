'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const SuccessionPlan          = () => mongoose.model('SuccessionPlan');
const PromotionRecommendation = () => mongoose.model('PromotionRecommendation');
const EmployeeRecognition     = () => mongoose.model('EmployeeRecognition');
const EmployeeFeedback        = () => mongoose.model('EmployeeFeedback');
const OneOnOneMeeting         = () => mongoose.model('OneOnOneMeeting');

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

// ── Succession Plans ──────────────────────────────────────────────────────────

exports.createSuccessionPlan = async (req, res) => {
  try {
    const plan = await SuccessionPlan().create(req.body);
    _audit(req, 'CREATE', 'SuccessionPlan', plan._id, plan._id.toString(), null, req.body);
    return created(res, plan, 'Succession plan created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getSuccessionPlans = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { department, criticality, isActive } = req.query;
    const filter = { isDeleted: false };
    if (department)  filter.department  = department;
    if (criticality) filter.criticality = criticality;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [data, total] = await Promise.all([
      SuccessionPlan().find(filter)
        .populate('position', 'name')
        .populate('department', 'name')
        .populate('currentHolder', 'firstName lastName employeeCode')
        .populate('successors.employee', 'firstName lastName employeeCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SuccessionPlan().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getSuccessionPlan = async (req, res) => {
  try {
    const plan = await SuccessionPlan().findOne({ _id: req.params.id, isDeleted: false })
      .populate('position', 'name')
      .populate('department', 'name')
      .populate('currentHolder', 'firstName lastName employeeCode designation')
      .populate('successors.employee', 'firstName lastName employeeCode designation')
      .lean();
    if (!plan) return notFound(res, 'Succession plan');
    return ok(res, plan);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateSuccessionPlan = async (req, res) => {
  try {
    const plan = await SuccessionPlan().findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return notFound(res, 'Succession plan');
    const before = plan.toObject();
    Object.assign(plan, req.body);
    await plan.save();
    _audit(req, 'UPDATE', 'SuccessionPlan', plan._id, plan._id.toString(), before, req.body);
    return ok(res, plan, 'Succession plan updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.addSuccessor = async (req, res) => {
  try {
    const plan = await SuccessionPlan().findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return notFound(res, 'Succession plan');

    const { employee, readinessLevel, developmentNeeds, strengths, rank } = req.body;
    if (!employee) return fail(res, 'employee is required');

    const exists = plan.successors.some(s => s.employee?.toString() === employee);
    if (exists) return fail(res, 'Employee is already a successor for this plan');

    plan.successors.push({ employee, readinessLevel, developmentNeeds, strengths, rank });
    await plan.save();
    _audit(req, 'ADD_SUCCESSOR', 'SuccessionPlan', plan._id, plan._id.toString(), null, { employee });
    return ok(res, plan, 'Successor added');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.removeSuccessor = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const plan = await SuccessionPlan().findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return notFound(res, 'Succession plan');

    const before = plan.toObject();
    plan.successors = plan.successors.filter(s => s.employee?.toString() !== employeeId);
    await plan.save();
    _audit(req, 'REMOVE_SUCCESSOR', 'SuccessionPlan', plan._id, plan._id.toString(), before, { employeeId });
    return ok(res, plan, 'Successor removed');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Promotion Recommendations ─────────────────────────────────────────────────

exports.getPromotionRecommendations = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { employee, cycle, status } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (cycle)    filter.cycle    = cycle;
    if (status)   filter.status   = status;

    const [data, total] = await Promise.all([
      PromotionRecommendation().find(filter)
        .populate('employee', 'firstName lastName employeeCode')
        .populate('cycle', 'name cycleCode')
        .populate('currentDesignation', 'name')
        .populate('recommendedDesignation', 'name')
        .populate('currentDepartment', 'name')
        .populate('targetDepartment', 'name')
        .populate('recommendedBy', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PromotionRecommendation().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createPromotionRecommendation = async (req, res) => {
  try {
    const promo = await PromotionRecommendation().create({ ...req.body, recommendedBy: req.user._id });
    _audit(req, 'CREATE', 'PromotionRecommendation', promo._id, promo.promoNumber, null, req.body);
    return created(res, promo, 'Promotion recommendation created');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Recognitions ──────────────────────────────────────────────────────────────

exports.createRecognition = async (req, res) => {
  try {
    const rec = await EmployeeRecognition().create({ ...req.body, givenBy: req.user._id });
    _audit(req, 'CREATE', 'EmployeeRecognition', rec._id, rec.recognitionNumber, null, req.body);
    req.io?.emit('hr:recognition_given', { recognitionId: rec._id, recipient: rec.recipient });
    return created(res, rec, 'Recognition created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getRecognitions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { recipient, type, cycle, isPublic } = req.query;
    const filter = { isDeleted: false };
    if (recipient) filter.recipient = recipient;
    if (type)      filter.type      = type;
    if (cycle)     filter.cycle     = cycle;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';

    const [data, total] = await Promise.all([
      EmployeeRecognition().find(filter)
        .populate('recipient', 'firstName lastName employeeCode')
        .populate('giver', 'firstName lastName employeeCode')
        .populate('givenBy', 'name')
        .populate('cycle', 'name cycleCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmployeeRecognition().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getRecognition = async (req, res) => {
  try {
    const rec = await EmployeeRecognition().findOne({ _id: req.params.id, isDeleted: false })
      .populate('recipient', 'firstName lastName employeeCode')
      .populate('giver', 'firstName lastName employeeCode')
      .populate('givenBy', 'name')
      .lean();
    if (!rec) return notFound(res, 'Recognition');
    return ok(res, rec);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Feedback ──────────────────────────────────────────────────────────────────

exports.createFeedback = async (req, res) => {
  try {
    const fb = await EmployeeFeedback().create(req.body);
    _audit(req, 'CREATE', 'EmployeeFeedback', fb._id, fb.feedbackNumber, null, req.body);
    return created(res, fb, 'Feedback submitted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getFeedbacks = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { toEmployee, fromEmployee, type, status } = req.query;
    const filter = { isDeleted: false };
    if (toEmployee)   filter.toEmployee   = toEmployee;
    if (fromEmployee) filter.fromEmployee = fromEmployee;
    if (type)         filter.type         = type;
    if (status)       filter.status       = status;

    const [data, total] = await Promise.all([
      EmployeeFeedback().find(filter)
        .populate('toEmployee', 'firstName lastName employeeCode')
        .populate({
          path: 'fromEmployee',
          select: 'firstName lastName employeeCode',
          match: { isAnonymous: false },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmployeeFeedback().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── 1:1 Meetings ──────────────────────────────────────────────────────────────

exports.createOneOnOne = async (req, res) => {
  try {
    const meeting = await OneOnOneMeeting().create({ ...req.body, manager: req.user._id });
    _audit(req, 'CREATE', 'OneOnOneMeeting', meeting._id, meeting.meetingNumber, null, req.body);
    return created(res, meeting, '1:1 meeting created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getOneOnOnes = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { employee, manager, status } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (manager)  filter.manager  = manager;
    if (status)   filter.status   = status;

    const [data, total] = await Promise.all([
      OneOnOneMeeting().find(filter)
        .populate('employee', 'firstName lastName employeeCode')
        .populate('manager', 'name email')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OneOnOneMeeting().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};
