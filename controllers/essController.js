'use strict';
const mongoose = require('mongoose');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const Attendance          = () => mongoose.model('Attendance');
const LeaveRequest        = () => mongoose.model('LeaveRequest');
const LeaveBalance        = () => mongoose.model('LeaveBalance');
const Payslip             = () => mongoose.model('Payslip');
const Goal                = () => mongoose.model('Goal');
const PerformanceReview   = () => mongoose.model('PerformanceReview');
const TrainingEnrollment  = () => mongoose.model('TrainingEnrollment');
const LearningPath        = () => mongoose.model('LearningPath');
const EmployeeAnnouncement = () => mongoose.model('EmployeeAnnouncement');
const EmployeeRecognition  = () => mongoose.model('EmployeeRecognition');
const EmployeeFeedback     = () => mongoose.model('EmployeeFeedback');

exports.getEssDashboard = async (req, res) => {
  try {
    const empId = req.employee._id;
    const now   = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      attendanceThisMonth,
      leaveBalance,
      latestPayslip,
      activeGoals,
      activeReview,
      dueTrainings,
      unreadAnnouncements,
    ] = await Promise.all([
      Attendance().countDocuments({
        employee: empId,
        date: { $gte: monthStart, $lte: monthEnd },
        isDeleted: false,
      }),
      LeaveBalance().findOne({ employee: empId, isDeleted: false }).lean(),
      Payslip().findOne({ employee: empId, isDeleted: false })
        .sort({ createdAt: -1 })
        .select('payslipNumber month year netPay status')
        .lean(),
      Goal().countDocuments({ employee: empId, status: 'active', isDeleted: false }),
      PerformanceReview().findOne({ employee: empId, status: { $ne: 'completed' }, isDeleted: false })
        .select('reviewNumber status cycle')
        .populate('cycle', 'name')
        .lean(),
      TrainingEnrollment().countDocuments({ employee: empId, status: 'enrolled', isDeleted: false }),
      EmployeeAnnouncement().countDocuments({
        isPublished: true,
        isDeleted: false,
        $or: [
          { targetAudience: 'all' },
          { targetAudience: 'department', targetDepartments: req.employee.department },
        ],
      }),
    ]);

    return ok(res, {
      attendance: { thisMonth: attendanceThisMonth },
      leaveBalance,
      latestPayslip,
      activeGoals,
      activeReview,
      dueTrainings,
      unreadAnnouncements,
    }, 'ESS dashboard loaded');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const empId = req.employee._id;
    const filter = { employee: empId, isDeleted: false };

    if (req.query.month && req.query.year) {
      const m = parseInt(req.query.month) - 1;
      const y = parseInt(req.query.year);
      filter.date = {
        $gte: new Date(y, m, 1),
        $lte: new Date(y, m + 1, 0, 23, 59, 59, 999),
      };
    }

    const [data, total] = await Promise.all([
      Attendance().find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getMyLeave = async (req, res) => {
  try {
    const empId = req.employee._id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = { employee: empId, isDeleted: false };
    if (req.query.status) filter.status = req.query.status;

    const [requests, total, balance] = await Promise.all([
      LeaveRequest().find(filter)
        .populate('leaveType', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveRequest().countDocuments(filter),
      LeaveBalance().findOne({ employee: empId, isDeleted: false }).lean(),
    ]);

    return ok(res, { requests, total, page, limit, balance });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getMyPayslips = async (req, res) => {
  try {
    const empId = req.employee._id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    const filter = { employee: empId, isDeleted: false };
    if (req.query.year) filter.year = parseInt(req.query.year);

    const [data, total] = await Promise.all([
      Payslip().find(filter)
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payslip().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getMyPerformance = async (req, res) => {
  try {
    const empId = req.employee._id;

    const [goals, activeReview] = await Promise.all([
      Goal().find({ employee: empId, isDeleted: false })
        .populate('cycle', 'name cycleCode')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      PerformanceReview().findOne({ employee: empId, status: { $ne: 'completed' }, isDeleted: false })
        .populate('cycle', 'name cycleCode status')
        .lean(),
    ]);

    return ok(res, { goals, activeReview });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getMyTraining = async (req, res) => {
  try {
    const empId = req.employee._id;

    const [enrollments, learningPaths] = await Promise.all([
      TrainingEnrollment().find({ employee: empId, isDeleted: false })
        .populate('session', 'sessionCode startDate endDate location status')
        .populate('course', 'courseCode title mode level')
        .sort({ enrolledAt: -1 })
        .lean(),
      LearningPath().find({ isActive: true, isDeleted: false })
        .populate('targetRole', 'name')
        .populate('courses.course', 'courseCode title duration')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return ok(res, { enrollments, learningPaths });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const now = new Date();
    const filter = {
      isPublished: true,
      isDeleted: false,
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
      $and: [
        {
          $or: [
            { targetAudience: 'all' },
            { targetAudience: 'department', targetDepartments: req.employee.department },
            { targetAudience: 'individual', targetEmployees: req.employee._id },
          ],
        },
      ],
    };

    const [data, total] = await Promise.all([
      EmployeeAnnouncement().find(filter)
        .sort({ publishAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmployeeAnnouncement().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getRecognitions = async (req, res) => {
  try {
    const empId = req.employee._id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = {
      isDeleted: false,
      $or: [{ recipient: empId }, { isPublic: true }],
    };

    const [data, total] = await Promise.all([
      EmployeeRecognition().find(filter)
        .populate('recipient', 'firstName lastName employeeCode')
        .populate('giver', 'firstName lastName employeeCode')
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

exports.getMyFeedback = async (req, res) => {
  try {
    const empId = req.employee._id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = { toEmployee: empId, isDeleted: false };

    const [data, total] = await Promise.all([
      EmployeeFeedback().find(filter)
        .populate({
          path: 'fromEmployee',
          select: 'firstName lastName employeeCode',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmployeeFeedback().countDocuments(filter),
    ]);

    const result = data.map(fb => {
      if (fb.isAnonymous) {
        const { fromEmployee, ...rest } = fb;
        return { ...rest, fromEmployee: null };
      }
      return fb;
    });

    return paginated(res, result, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const empId = req.employee._id;
    const fb = await EmployeeFeedback().create({ ...req.body, fromEmployee: empId });
    return created(res, fb, 'Feedback submitted');
  } catch (err) {
    return serverError(res, err);
  }
};
