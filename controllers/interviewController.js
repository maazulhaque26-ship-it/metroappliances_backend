'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const Interview         = () => mongoose.model('Interview');
const InterviewFeedback = () => mongoose.model('InterviewFeedback');
const InterviewPanel    = () => mongoose.model('InterviewPanel');
const JobApplication    = () => mongoose.model('JobApplication');

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

exports.getInterviews = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { status, type, from, to, application, candidate } = req.query;
    const filter = { isDeleted: false };

    if (status)      filter.status      = status;
    if (type)        filter.type        = type;
    if (application) filter.application = application;
    if (candidate)   filter.candidate   = candidate;
    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(from);
      if (to)   filter.scheduledAt.$lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      Interview().find(filter)
        .populate('application', 'status currentStage')
        .populate('candidate',   'firstName lastName email phone')
        .populate('job',         'title department')
        .populate('interviewers.user', 'name email')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Interview().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Get Single ────────────────────────────────────────────────────────────────

exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview().findOne({ _id: req.params.id, isDeleted: false })
      .populate('application', 'status currentStage stageHistory')
      .populate('candidate',   'firstName lastName email phone')
      .populate('job',         'title department')
      .populate('interviewers.user', 'name email role')
      .lean();
    if (!interview) return notFound(res, 'Interview');
    return ok(res, interview);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Schedule ──────────────────────────────────────────────────────────────────

exports.scheduleInterview = async (req, res) => {
  try {
    const interview = await Interview().create({ ...req.body, scheduledBy: req.user._id, status: 'scheduled' });

    // Push interview stage to application
    if (req.body.application) {
      const app = await JobApplication().findOne({ _id: req.body.application, isDeleted: false });
      if (app) {
        app.currentStage = 'Interview';
        app.status       = 'interview';
        app.stageHistory.push({ stage: 'Interview', status: 'interview', notes: `Interview scheduled: ${interview._id}`, movedBy: req.user._id, movedAt: new Date() });
        await app.save();
      }
    }

    const io = req.app.locals.io;
    if (io) io.emit('hr:interview_scheduled', { interviewId: interview._id, candidateId: interview.candidate, scheduledAt: interview.scheduledAt });

    _audit(req, 'INTERVIEW_SCHEDULED', 'Interview', interview._id, `Interview #${interview._id}`, null, interview.toObject());
    return created(res, interview, 'Interview scheduled');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Update ────────────────────────────────────────────────────────────────────

exports.updateInterview = async (req, res) => {
  try {
    const interview = await Interview().findOne({ _id: req.params.id, isDeleted: false });
    if (!interview) return notFound(res, 'Interview');
    const before = interview.toObject();

    // Don't allow changing status via this endpoint — use complete/cancel/reschedule
    const { status, ...rest } = req.body;
    Object.assign(interview, rest);
    await interview.save();

    _audit(req, 'INTERVIEW_UPDATED', 'Interview', interview._id, `Interview #${interview._id}`, before, interview.toObject());
    return ok(res, interview, 'Interview updated');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Complete ──────────────────────────────────────────────────────────────────

exports.completeInterview = async (req, res) => {
  try {
    const interview = await Interview().findOne({ _id: req.params.id, isDeleted: false });
    if (!interview) return notFound(res, 'Interview');
    const before = interview.toObject();

    interview.status      = 'completed';
    interview.completedAt = new Date();
    if (req.body.result) interview.result = req.body.result;
    if (req.body.notes)  interview.notes  = req.body.notes;
    await interview.save();

    _audit(req, 'INTERVIEW_COMPLETED', 'Interview', interview._id, `Interview #${interview._id}`, before, interview.toObject());
    return ok(res, interview, 'Interview marked as completed');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Cancel ────────────────────────────────────────────────────────────────────

exports.cancelInterview = async (req, res) => {
  try {
    const interview = await Interview().findOne({ _id: req.params.id, isDeleted: false });
    if (!interview) return notFound(res, 'Interview');
    const before = interview.toObject();

    interview.status       = 'cancelled';
    interview.cancelledBy  = req.user._id;
    interview.cancelReason = req.body.cancelReason || '';
    interview.cancelledAt  = new Date();
    await interview.save();

    _audit(req, 'INTERVIEW_CANCELLED', 'Interview', interview._id, `Interview #${interview._id}`, before, interview.toObject());
    return ok(res, interview, 'Interview cancelled');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Reschedule ────────────────────────────────────────────────────────────────

exports.rescheduleInterview = async (req, res) => {
  try {
    const oldInterview = await Interview().findOne({ _id: req.params.id, isDeleted: false });
    if (!oldInterview) return notFound(res, 'Interview');
    const before = oldInterview.toObject();

    // Mark old interview as rescheduled
    oldInterview.status = 'rescheduled';
    await oldInterview.save();

    const { scheduledAt, duration, mode, location, meetLink } = req.body;

    // Create new interview as rescheduled version
    const newInterview = await Interview().create({
      application:     oldInterview.application,
      candidate:       oldInterview.candidate,
      job:             oldInterview.job,
      interviewers:    oldInterview.interviewers,
      type:            oldInterview.type,
      round:           oldInterview.round,
      scheduledAt,
      duration:        duration       || oldInterview.duration,
      mode:            mode           || oldInterview.mode,
      location:        location       || oldInterview.location,
      meetLink:        meetLink       || oldInterview.meetLink,
      rescheduledFrom: oldInterview._id,
      scheduledBy:     req.user._id,
      status:          'scheduled',
    });

    const io = req.app.locals.io;
    if (io) io.emit('hr:interview_scheduled', { interviewId: newInterview._id, candidateId: newInterview.candidate, scheduledAt: newInterview.scheduledAt, rescheduled: true });

    _audit(req, 'INTERVIEW_RESCHEDULED', 'Interview', oldInterview._id, `Interview #${oldInterview._id}`, before, { rescheduledTo: newInterview._id });
    return ok(res, newInterview, 'Interview rescheduled');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Panel ─────────────────────────────────────────────────────────────────────

exports.getPanel = async (req, res) => {
  try {
    const panel = await InterviewPanel().findOne({ job: req.params.jobId }).lean();
    if (!panel) return notFound(res, 'InterviewPanel');
    return ok(res, panel);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.setPanel = async (req, res) => {
  try {
    const panel = await InterviewPanel().findOneAndUpdate(
      { job: req.params.jobId },
      { ...req.body, job: req.params.jobId, updatedBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return ok(res, panel, 'Interview panel saved');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Feedback ──────────────────────────────────────────────────────────────────

exports.getFeedback = async (req, res) => {
  try {
    const feedback = await InterviewFeedback().find({ interview: req.params.interviewId })
      .populate('interviewer', 'name email')
      .sort({ submittedAt: -1 })
      .lean();
    return ok(res, feedback);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { interview, interviewer } = req.body;
    const interviewId   = interview   || req.params.interviewId;
    const interviewerId = interviewer || req.user._id;

    const feedback = await InterviewFeedback().findOneAndUpdate(
      { interview: interviewId, interviewer: interviewerId },
      {
        ...req.body,
        interview:   interviewId,
        interviewer: interviewerId,
        isSubmitted: true,
        submittedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    _audit(req, 'INTERVIEW_FEEDBACK_SUBMITTED', 'InterviewFeedback', feedback._id,
      `Feedback for interview ${interviewId}`, null, feedback.toObject());
    return ok(res, feedback, 'Feedback submitted');
  } catch (err) {
    return serverError(res, err);
  }
};
