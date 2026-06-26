'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const TrainingCourse        = () => mongoose.model('TrainingCourse');
const TrainingSession       = () => mongoose.model('TrainingSession');
const TrainingEnrollment    = () => mongoose.model('TrainingEnrollment');
const CertificationTracking = () => mongoose.model('CertificationTracking');

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

// ── Courses ───────────────────────────────────────────────────────────────────

exports.createCourse = async (req, res) => {
  try {
    const course = await TrainingCourse().create(req.body);
    _audit(req, 'CREATE', 'TrainingCourse', course._id, course.courseCode, null, req.body);
    return created(res, course, 'Training course created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getCourses = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { category, mode, level, isActive, isMandatory, search } = req.query;
    const filter = { isDeleted: false };
    if (category) filter.category = category;
    if (mode)     filter.mode     = mode;
    if (level)    filter.level    = level;
    if (isActive !== undefined)    filter.isActive    = isActive === 'true';
    if (isMandatory !== undefined) filter.isMandatory = isMandatory === 'true';
    if (search) filter.title = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      TrainingCourse().find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TrainingCourse().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await TrainingCourse().findOne({ _id: req.params.id, isDeleted: false })
      .populate('prerequisites', 'courseCode title')
      .lean();
    if (!course) return notFound(res, 'Training course');
    return ok(res, course);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await TrainingCourse().findOne({ _id: req.params.id, isDeleted: false });
    if (!course) return notFound(res, 'Training course');
    const before = course.toObject();
    Object.assign(course, req.body);
    await course.save();
    _audit(req, 'UPDATE', 'TrainingCourse', course._id, course.courseCode, before, req.body);
    return ok(res, course, 'Course updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await TrainingCourse().findOne({ _id: req.params.id, isDeleted: false });
    if (!course) return notFound(res, 'Training course');
    course.isDeleted = true;
    await course.save();
    _audit(req, 'DELETE', 'TrainingCourse', course._id, course.courseCode, course.toObject(), null);
    return ok(res, null, 'Course deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Sessions ──────────────────────────────────────────────────────────────────

exports.createSession = async (req, res) => {
  try {
    const session = await TrainingSession().create(req.body);
    _audit(req, 'CREATE', 'TrainingSession', session._id, session.sessionCode, null, req.body);
    return created(res, session, 'Training session created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getSessions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { course, status } = req.query;
    const filter = { isDeleted: false };
    if (course) filter.course = course;
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      TrainingSession().find(filter)
        .populate('course', 'courseCode title mode level')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TrainingSession().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Enrollments ───────────────────────────────────────────────────────────────

exports.enrollEmployee = async (req, res) => {
  try {
    const { session: sessionId, employee } = req.body;
    if (!sessionId || !employee) return fail(res, 'session and employee are required');

    const session = await TrainingSession().findOne({ _id: sessionId, isDeleted: false });
    if (!session) return notFound(res, 'Training session');

    if (session.maxCapacity && session.enrolledCount >= session.maxCapacity) {
      return fail(res, 'Session is at full capacity');
    }

    const enrollment = await TrainingEnrollment().create({
      session: sessionId,
      employee,
      course: session.course,
    });

    session.enrolledCount = (session.enrolledCount || 0) + 1;
    await session.save();

    req.io?.emit('hr:training_assigned', { enrollmentId: enrollment._id, employee, session: sessionId });
    _audit(req, 'ENROLL', 'TrainingEnrollment', enrollment._id, enrollment._id.toString(), null, req.body);
    return created(res, enrollment, 'Employee enrolled');
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Employee already enrolled in this session');
    return serverError(res, err);
  }
};

exports.getEnrollments = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { session, employee, status, course } = req.query;
    const filter = { isDeleted: false };
    if (session)  filter.session  = session;
    if (employee) filter.employee = employee;
    if (status)   filter.status   = status;
    if (course)   filter.course   = course;

    const [data, total] = await Promise.all([
      TrainingEnrollment().find(filter)
        .populate('employee', 'firstName lastName employeeCode')
        .populate('session', 'sessionCode startDate endDate location')
        .populate('course', 'courseCode title')
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TrainingEnrollment().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.completeTraining = async (req, res) => {
  try {
    const enrollment = await TrainingEnrollment().findOne({ _id: req.params.id, isDeleted: false });
    if (!enrollment) return notFound(res, 'Enrollment');
    const before = enrollment.toObject();
    enrollment.status         = 'completed';
    enrollment.completionDate = req.body.completionDate || new Date();
    if (req.body.score !== undefined)             enrollment.score             = req.body.score;
    if (req.body.feedback)                        enrollment.feedback          = req.body.feedback;
    if (req.body.attendancePercent !== undefined) enrollment.attendancePercent = req.body.attendancePercent;
    await enrollment.save();
    req.io?.emit('hr:training_completed', { enrollmentId: enrollment._id, employee: enrollment.employee });
    _audit(req, 'COMPLETE', 'TrainingEnrollment', enrollment._id, enrollment._id.toString(), before, { status: 'completed' });
    return ok(res, enrollment, 'Training completed');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.issueCertificate = async (req, res) => {
  try {
    const enrollment = await TrainingEnrollment().findOne({ _id: req.params.id, isDeleted: false })
      .populate('course', 'title');
    if (!enrollment) return notFound(res, 'Enrollment');
    if (enrollment.status !== 'completed') return fail(res, 'Training must be completed before issuing certificate');

    enrollment.certificateIssued = true;
    if (req.body.certificateUrl) enrollment.certificateUrl = req.body.certificateUrl;
    await enrollment.save();

    const cert = await CertificationTracking().create({
      employee: enrollment.employee,
      certificationName: enrollment.course?.title || req.body.certificationName || 'Training Certificate',
      issuingAuthority: req.body.issuingAuthority || 'Internal',
      certificationNumber: req.body.certificationNumber,
      issueDate: new Date(),
      expiryDate: req.body.expiryDate,
      documentUrl: req.body.certificateUrl,
      course: enrollment.course?._id || enrollment.course,
    });

    _audit(req, 'ISSUE_CERT', 'TrainingEnrollment', enrollment._id, enrollment._id.toString(), null, { certificateIssued: true });
    return ok(res, { enrollment, certification: cert }, 'Certificate issued');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Certifications ────────────────────────────────────────────────────────────

exports.getCertifications = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { employee, status, course } = req.query;
    const filter = { isDeleted: false };
    if (employee) filter.employee = employee;
    if (status)   filter.status   = status;
    if (course)   filter.course   = course;

    const [data, total] = await Promise.all([
      CertificationTracking().find(filter)
        .populate('employee', 'firstName lastName employeeCode')
        .populate('course', 'courseCode title')
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CertificationTracking().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};
