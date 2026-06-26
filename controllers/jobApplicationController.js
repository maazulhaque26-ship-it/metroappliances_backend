'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const JobApplication = () => mongoose.model('JobApplication');
const JobOpening     = () => mongoose.model('JobOpening');
const Candidate      = () => mongoose.model('Candidate');

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

// ── List ──────────────────────────────────────────────────────────────────────

exports.getApplications = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { status, job, candidate, department, search } = req.query;
    const filter = { isDeleted: false };

    if (status)    filter.status    = status;
    if (job)       filter.job       = job;
    if (candidate) filter.candidate = candidate;

    // Filter by department via job lookup
    if (department) {
      const jobIds = await JobOpening().find({ department, isDeleted: false }).distinct('_id');
      filter.job = { $in: jobIds };
    }

    // Search by candidate name/email
    if (search) {
      const candidateIds = await Candidate().find({
        isDeleted: false,
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName:  { $regex: search, $options: 'i' } },
          { email:     { $regex: search, $options: 'i' } },
        ],
      }).distinct('_id');
      filter.candidate = { $in: candidateIds };
    }

    const [data, total] = await Promise.all([
      JobApplication().find(filter)
        .populate('job',       'title department jobType')
        .populate('candidate', 'firstName lastName email phone source')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobApplication().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Get Single ────────────────────────────────────────────────────────────────

exports.getApplication = async (req, res) => {
  try {
    const app = await JobApplication().findOne({ _id: req.params.id, isDeleted: false })
      .populate('job',                    'title department jobType location')
      .populate('candidate',              'firstName lastName email phone source resume')
      .populate('stageHistory.movedBy',   'name email')
      .lean();
    if (!app) return notFound(res, 'JobApplication');
    return ok(res, app);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Create ────────────────────────────────────────────────────────────────────

exports.createApplication = async (req, res) => {
  try {
    const app = await JobApplication().create({
      ...req.body,
      appliedAt: new Date(),
      stageHistory: [{ stage: 'Applied', movedBy: req.user._id, movedAt: new Date() }],
    });

    const io = req.app.locals.io;
    if (io) io.emit('hr:candidate_applied', { applicationId: app._id, jobId: app.job, candidateId: app.candidate });

    _audit(req, 'APPLICATION_CREATED', 'JobApplication', app._id, `Application #${app._id}`, null, app.toObject());
    return created(res, app, 'Application created');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Update ────────────────────────────────────────────────────────────────────

exports.updateApplication = async (req, res) => {
  try {
    const app = await JobApplication().findOne({ _id: req.params.id, isDeleted: false });
    if (!app) return notFound(res, 'JobApplication');
    const before = app.toObject();

    const allowed = ['rating', 'tags', 'coverLetter', 'resumeUrl', 'notes', 'expectedCTC', 'currentCTC', 'noticePeriod', 'currentEmployer'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) app[key] = req.body[key];
    }
    await app.save();

    _audit(req, 'APPLICATION_UPDATED', 'JobApplication', app._id, `Application #${app._id}`, before, app.toObject());
    return ok(res, app, 'Application updated');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Soft Delete ───────────────────────────────────────────────────────────────

exports.deleteApplication = async (req, res) => {
  try {
    const app = await JobApplication().findOne({ _id: req.params.id, isDeleted: false });
    if (!app) return notFound(res, 'JobApplication');
    const before = app.toObject();
    app.isDeleted = true;
    await app.save();
    _audit(req, 'APPLICATION_DELETED', 'JobApplication', app._id, `Application #${app._id}`, before, null);
    return ok(res, null, 'Application deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Move Stage ────────────────────────────────────────────────────────────────

exports.moveStage = async (req, res) => {
  try {
    const { stage, status, notes } = req.body;
    if (!stage) return fail(res, 'stage is required');

    const app = await JobApplication().findOne({ _id: req.params.id, isDeleted: false });
    if (!app) return notFound(res, 'JobApplication');
    const before = app.toObject();

    app.currentStage = stage;
    if (status) app.status = status;
    app.stageHistory.push({ stage, status: status || app.status, notes, movedBy: req.user._id, movedAt: new Date() });
    await app.save();

    _audit(req, 'APPLICATION_STAGE_MOVED', 'JobApplication', app._id, stage, before, app.toObject());
    return ok(res, app, 'Stage updated');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Shortlist ─────────────────────────────────────────────────────────────────

exports.shortlistApplication = async (req, res) => {
  try {
    const app = await JobApplication().findOne({ _id: req.params.id, isDeleted: false });
    if (!app) return notFound(res, 'JobApplication');
    const before = app.toObject();

    app.status        = 'shortlisted';
    app.shortlistedAt = new Date();
    app.currentStage  = 'Shortlisted';
    app.stageHistory.push({ stage: 'Shortlisted', status: 'shortlisted', movedBy: req.user._id, movedAt: new Date() });
    await app.save();

    _audit(req, 'APPLICATION_SHORTLISTED', 'JobApplication', app._id, `Application #${app._id}`, before, app.toObject());
    return ok(res, app, 'Application shortlisted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Reject ────────────────────────────────────────────────────────────────────

exports.rejectApplication = async (req, res) => {
  try {
    const app = await JobApplication().findOne({ _id: req.params.id, isDeleted: false });
    if (!app) return notFound(res, 'JobApplication');
    const before = app.toObject();

    app.status          = 'rejected';
    app.rejectedAt      = new Date();
    app.rejectionReason = req.body.rejectionReason || '';
    app.currentStage    = 'Rejected';
    app.stageHistory.push({
      stage: 'Rejected', status: 'rejected',
      notes: req.body.rejectionReason || '',
      movedBy: req.user._id, movedAt: new Date(),
    });
    await app.save();

    _audit(req, 'APPLICATION_REJECTED', 'JobApplication', app._id, `Application #${app._id}`, before, app.toObject());
    return ok(res, app, 'Application rejected');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Bulk Action ───────────────────────────────────────────────────────────────

exports.bulkAction = async (req, res) => {
  try {
    const { applicationIds, action, reason } = req.body;
    if (!Array.isArray(applicationIds) || !applicationIds.length) {
      return fail(res, 'applicationIds array is required');
    }
    if (!['shortlist', 'reject'].includes(action)) {
      return fail(res, 'action must be shortlist or reject');
    }

    const now = new Date();
    const updates = [];

    for (const appId of applicationIds) {
      const app = await JobApplication().findOne({ _id: appId, isDeleted: false });
      if (!app) continue;

      if (action === 'shortlist') {
        app.status        = 'shortlisted';
        app.shortlistedAt = now;
        app.currentStage  = 'Shortlisted';
        app.stageHistory.push({ stage: 'Shortlisted', status: 'shortlisted', movedBy: req.user._id, movedAt: now });
      } else if (action === 'reject') {
        app.status          = 'rejected';
        app.rejectedAt      = now;
        app.rejectionReason = reason || '';
        app.currentStage    = 'Rejected';
        app.stageHistory.push({ stage: 'Rejected', status: 'rejected', notes: reason || '', movedBy: req.user._id, movedAt: now });
      }

      await app.save();
      updates.push(appId);
    }

    _audit(req, `BULK_${action.toUpperCase()}`, 'JobApplication', null, 'bulk', null, { applicationIds: updates, action });
    return ok(res, { processed: updates.length, applicationIds: updates }, `Bulk ${action} completed`);
  } catch (err) {
    return serverError(res, err);
  }
};
