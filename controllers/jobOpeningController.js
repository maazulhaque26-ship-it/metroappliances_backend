'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const JobOpening     = () => mongoose.model('JobOpening');
const JobApplication = () => mongoose.model('JobApplication');

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

exports.getJobs = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { status, department, jobType, search } = req.query;
    const filter = { isDeleted: false };
    if (status)     filter.status = status;
    if (department) filter.department = department;
    if (jobType)    filter.jobType = jobType;
    if (search)     filter.title = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      JobOpening().find(filter)
        .populate('department', 'name')
        .populate('designation', 'name')
        .populate('postedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobOpening().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Get Single ────────────────────────────────────────────────────────────────

exports.getJob = async (req, res) => {
  try {
    const job = await JobOpening().findOne({ _id: req.params.id, isDeleted: false })
      .populate('department', 'name code')
      .populate('designation', 'name')
      .populate('pipeline',   'name stages')
      .populate('postedBy',   'name email')
      .lean();
    if (!job) return notFound(res, 'JobOpening');
    return ok(res, job);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Create ────────────────────────────────────────────────────────────────────

exports.createJob = async (req, res) => {
  try {
    const job = await JobOpening().create({ ...req.body, postedBy: req.user._id });

    const io = req.app.locals.io;
    if (io && job.status === 'open') io.emit('hr:job_created', { jobId: job._id, title: job.title });

    _audit(req, 'JOB_OPENING_CREATED', 'JobOpening', job._id, job.title, null, job.toObject());
    return created(res, job, 'Job opening created');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Update ────────────────────────────────────────────────────────────────────

exports.updateJob = async (req, res) => {
  try {
    const job = await JobOpening().findOne({ _id: req.params.id, isDeleted: false });
    if (!job) return notFound(res, 'JobOpening');
    const before = job.toObject();

    Object.assign(job, req.body);
    await job.save();

    _audit(req, 'JOB_OPENING_UPDATED', 'JobOpening', job._id, job.title, before, job.toObject());
    return ok(res, job, 'Job opening updated');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Soft Delete ───────────────────────────────────────────────────────────────

exports.deleteJob = async (req, res) => {
  try {
    const job = await JobOpening().findOne({ _id: req.params.id, isDeleted: false });
    if (!job) return notFound(res, 'JobOpening');
    const before = job.toObject();
    job.isDeleted = true;
    await job.save();
    _audit(req, 'JOB_OPENING_DELETED', 'JobOpening', job._id, job.title, before, null);
    return ok(res, null, 'Job opening deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Post (publish) ────────────────────────────────────────────────────────────

exports.postJob = async (req, res) => {
  try {
    const job = await JobOpening().findOne({ _id: req.params.id, isDeleted: false });
    if (!job) return notFound(res, 'JobOpening');
    const before = job.toObject();

    job.status     = 'open';
    job.postedDate = new Date();
    await job.save();

    const io = req.app.locals.io;
    if (io) io.emit('hr:job_created', { jobId: job._id, title: job.title });

    _audit(req, 'JOB_OPENING_POSTED', 'JobOpening', job._id, job.title, before, job.toObject());
    return ok(res, job, 'Job opening posted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Close ─────────────────────────────────────────────────────────────────────

exports.closeJob = async (req, res) => {
  try {
    const job = await JobOpening().findOne({ _id: req.params.id, isDeleted: false });
    if (!job) return notFound(res, 'JobOpening');
    const before = job.toObject();

    job.status     = 'closed';
    job.closedDate = new Date();
    job.closedBy   = req.user._id;
    await job.save();

    _audit(req, 'JOB_OPENING_CLOSED', 'JobOpening', job._id, job.title, before, job.toObject());
    return ok(res, job, 'Job opening closed');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Hold ──────────────────────────────────────────────────────────────────────

exports.holdJob = async (req, res) => {
  try {
    const job = await JobOpening().findOne({ _id: req.params.id, isDeleted: false });
    if (!job) return notFound(res, 'JobOpening');
    const before = job.toObject();

    job.status = 'on_hold';
    await job.save();

    _audit(req, 'JOB_OPENING_ON_HOLD', 'JobOpening', job._id, job.title, before, job.toObject());
    return ok(res, job, 'Job opening put on hold');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Applications for a Job ────────────────────────────────────────────────────

exports.getJobApplications = async (req, res) => {
  try {
    const job = await JobOpening().findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!job) return notFound(res, 'JobOpening');

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = { job: req.params.id, isDeleted: false };
    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
      JobApplication().find(filter)
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
