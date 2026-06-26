'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const BackgroundVerification = () => mongoose.model('BackgroundVerification');
const OnboardingChecklist    = () => mongoose.model('OnboardingChecklist');

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

exports.getBGVs = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { status, candidate } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (candidate) filter.candidate = candidate;

    const [data, total] = await Promise.all([
      BackgroundVerification().find(filter)
        .populate('candidate',   'firstName lastName email')
        .populate('application', 'status currentStage')
        .populate('initiatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BackgroundVerification().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getBGV = async (req, res) => {
  try {
    const bgv = await BackgroundVerification().findOne({ _id: req.params.id, isDeleted: false })
      .populate('candidate',   'firstName lastName email phone')
      .populate('application', 'status currentStage job')
      .populate('initiatedBy', 'name email')
      .lean();
    if (!bgv) return notFound(res, 'BackgroundVerification');
    return ok(res, bgv);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.initiateBGV = async (req, res) => {
  try {
    const { candidate, application, vendor, checks } = req.body;
    if (!candidate) return fail(res, 'candidate is required');

    const checkDocs = Array.isArray(checks)
      ? checks.map(c => ({ checkType: c.checkType || c, status: 'pending' }))
      : [];

    const bgv = await BackgroundVerification().create({
      candidate,
      application: application || null,
      vendor:      vendor || null,
      checks:      checkDocs,
      status:      'initiated',
      initiatedBy: req.user._id,
      initiatedAt: new Date(),
    });

    _audit(req, 'BGV_INITIATED', 'BackgroundVerification', bgv._id, `BGV #${bgv._id}`, null, bgv.toObject());
    return created(res, bgv, 'Background verification initiated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateBGVCheck = async (req, res) => {
  try {
    const bgv = await BackgroundVerification().findOne({ _id: req.params.id, isDeleted: false });
    if (!bgv) return notFound(res, 'BackgroundVerification');
    const before = bgv.toObject();

    const { checkType, status, result, remarks, completedAt } = req.body;
    if (!checkType) return fail(res, 'checkType is required');

    const checkIndex = bgv.checks.findIndex(c => c.checkType === checkType);
    if (checkIndex === -1) return fail(res, `Check type "${checkType}" not found`);

    if (status)      bgv.checks[checkIndex].status      = status;
    if (result)      bgv.checks[checkIndex].result      = result;
    if (remarks)     bgv.checks[checkIndex].remarks     = remarks;
    if (completedAt) bgv.checks[checkIndex].completedAt = new Date(completedAt);

    bgv.markModified('checks');
    bgv.status = 'in_progress';
    await bgv.save();

    _audit(req, 'BGV_CHECK_UPDATED', 'BackgroundVerification', bgv._id, checkType, before, bgv.toObject());
    return ok(res, bgv, 'BGV check updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.completeBGV = async (req, res) => {
  try {
    const bgv = await BackgroundVerification().findOne({ _id: req.params.id, isDeleted: false });
    if (!bgv) return notFound(res, 'BackgroundVerification');
    const before = bgv.toObject();

    // Compute overall result: if any check is adverse → adverse, else clear
    let overallResult = 'clear';
    for (const check of bgv.checks) {
      if (check.result === 'adverse' || check.result === 'discrepancy') {
        overallResult = 'adverse';
        break;
      }
    }

    bgv.overallResult = overallResult;
    bgv.status        = 'completed';
    bgv.completedAt   = new Date();
    await bgv.save();

    _audit(req, 'BGV_COMPLETED', 'BackgroundVerification', bgv._id, `BGV #${bgv._id}`, before, bgv.toObject());
    return ok(res, bgv, `Background verification completed — overall result: ${overallResult}`);
  } catch (err) {
    return serverError(res, err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────

exports.getOnboardings = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { status, candidate } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (candidate) filter.candidate = candidate;

    const [data, total] = await Promise.all([
      OnboardingChecklist().find(filter)
        .populate('candidate', 'firstName lastName email')
        .populate('employee',  'employeeCode displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OnboardingChecklist().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getOnboarding = async (req, res) => {
  try {
    const checklist = await OnboardingChecklist().findOne({ _id: req.params.id, isDeleted: false })
      .populate('candidate',         'firstName lastName email phone')
      .populate('employee',          'employeeCode displayName department designation')
      .populate('tasks.assignedTo',  'name email')
      .lean();
    if (!checklist) return notFound(res, 'OnboardingChecklist');
    return ok(res, checklist);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createOnboarding = async (req, res) => {
  try {
    const { tasks = [], ...rest } = req.body;
    const checklist = await OnboardingChecklist().create({
      ...rest,
      tasks,
      completionPercentage: 0,
      status: 'not_started',
      createdBy: req.user._id,
    });
    _audit(req, 'ONBOARDING_CREATED', 'OnboardingChecklist', checklist._id, `Onboarding #${checklist._id}`, null, checklist.toObject());
    return created(res, checklist, 'Onboarding checklist created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateTask = async (req, res) => {
  try {
    const checklist = await OnboardingChecklist().findOne({ _id: req.params.id, isDeleted: false });
    if (!checklist) return notFound(res, 'OnboardingChecklist');
    const before = checklist.toObject();

    const { taskIndex, isCompleted, notes } = req.body;
    if (taskIndex === undefined) return fail(res, 'taskIndex is required');
    if (!checklist.tasks || !checklist.tasks[taskIndex]) {
      return fail(res, `Task at index ${taskIndex} not found`);
    }

    if (isCompleted !== undefined) {
      checklist.tasks[taskIndex].isCompleted   = isCompleted;
      checklist.tasks[taskIndex].completedAt   = isCompleted ? new Date() : null;
      checklist.tasks[taskIndex].completedBy   = isCompleted ? req.user._id : null;
    }
    if (notes !== undefined) checklist.tasks[taskIndex].notes = notes;

    checklist.markModified('tasks');

    // Recalculate completion percentage
    const total     = checklist.tasks.length;
    const completed = checklist.tasks.filter(t => t.isCompleted).length;
    checklist.completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update status
    if (checklist.completionPercentage === 0) {
      checklist.status = 'not_started';
    } else if (checklist.completionPercentage === 100) {
      checklist.status = 'completed';
    } else {
      checklist.status = 'in_progress';
    }

    await checklist.save();

    _audit(req, 'ONBOARDING_TASK_UPDATED', 'OnboardingChecklist', checklist._id, `Task index ${taskIndex}`, before, checklist.toObject());
    return ok(res, checklist, 'Task updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.completeOnboarding = async (req, res) => {
  try {
    const checklist = await OnboardingChecklist().findOne({ _id: req.params.id, isDeleted: false });
    if (!checklist) return notFound(res, 'OnboardingChecklist');
    const before = checklist.toObject();

    // Mark all tasks complete
    if (checklist.tasks && checklist.tasks.length) {
      for (const task of checklist.tasks) {
        if (!task.isCompleted) {
          task.isCompleted  = true;
          task.completedAt  = new Date();
          task.completedBy  = req.user._id;
        }
      }
      checklist.markModified('tasks');
    }

    checklist.status               = 'completed';
    checklist.completionPercentage = 100;
    checklist.completedAt          = new Date();
    await checklist.save();

    _audit(req, 'ONBOARDING_COMPLETED', 'OnboardingChecklist', checklist._id, `Onboarding #${checklist._id}`, before, checklist.toObject());
    return ok(res, checklist, 'Onboarding completed');
  } catch (err) {
    return serverError(res, err);
  }
};
