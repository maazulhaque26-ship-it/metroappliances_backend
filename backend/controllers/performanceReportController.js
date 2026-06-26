'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const Goal                    = () => mongoose.model('Goal');
const KPIReview               = () => mongoose.model('KPIReview');
const PerformanceReview       = () => mongoose.model('PerformanceReview');
const TrainingEnrollment      = () => mongoose.model('TrainingEnrollment');
const EmployeeRecognition     = () => mongoose.model('EmployeeRecognition');
const CompetencyAssessment    = () => mongoose.model('CompetencyAssessment');
const EmployeeAnnouncement    = () => mongoose.model('EmployeeAnnouncement');
const EmployeeSelfServiceSetting = () => mongoose.model('EmployeeSelfServiceSetting');

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

// ── Reports ───────────────────────────────────────────────────────────────────

exports.getGoalCompletionReport = async (req, res) => {
  try {
    const { cycle } = req.query;
    const match = { isDeleted: false };
    if (cycle) match.cycle = new mongoose.Types.ObjectId(cycle);

    const [byStatus, byDepartment] = await Promise.all([
      Goal().aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Goal().aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'employees',
            localField: 'employee',
            foreignField: '_id',
            as: 'emp',
          },
        },
        { $unwind: { path: '$emp', preserveNullAndEmpty: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'emp.department',
            foreignField: '_id',
            as: 'dept',
          },
        },
        { $unwind: { path: '$dept', preserveNullAndEmpty: true } },
        {
          $group: {
            _id: { dept: '$dept._id', deptName: '$dept.name', status: '$status' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.deptName': 1 } },
      ]),
    ]);

    return ok(res, { byStatus, byDepartment }, 'Goal completion report');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getKPIReport = async (req, res) => {
  try {
    const { cycle } = req.query;
    const match = { isDeleted: false };
    if (cycle) match.cycle = new mongoose.Types.ObjectId(cycle);

    const byDepartment = await KPIReview().aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'emp',
        },
      },
      { $unwind: { path: '$emp', preserveNullAndEmpty: true } },
      {
        $lookup: {
          from: 'departments',
          localField: 'emp.department',
          foreignField: '_id',
          as: 'dept',
        },
      },
      { $unwind: { path: '$dept', preserveNullAndEmpty: true } },
      {
        $group: {
          _id: { dept: '$dept._id', deptName: '$dept.name' },
          avgAchievement: { $avg: '$achievementPercent' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.deptName': 1 } },
    ]);

    return ok(res, { byDepartment }, 'KPI report');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getReviewDistribution = async (req, res) => {
  try {
    const { cycle } = req.query;
    const match = { isDeleted: false, overallRating: { $exists: true, $ne: null } };
    if (cycle) match.cycle = new mongoose.Types.ObjectId(cycle);

    const distribution = await PerformanceReview().aggregate([
      { $match: match },
      { $group: { _id: '$overallRating', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const total = distribution.reduce((s, d) => s + d.count, 0);
    const result = distribution.map(d => ({
      rating: d._id,
      count: d.count,
      percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
    }));

    return ok(res, { distribution: result, total }, 'Review distribution report');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getTrainingReport = async (req, res) => {
  try {
    const [enrollmentCounts, completionRates] = await Promise.all([
      TrainingEnrollment().aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      TrainingEnrollment().aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: 'trainingsessions',
            localField: 'session',
            foreignField: '_id',
            as: 'sess',
          },
        },
        { $unwind: { path: '$sess', preserveNullAndEmpty: true } },
        {
          $lookup: {
            from: 'trainingcourses',
            localField: 'course',
            foreignField: '_id',
            as: 'crs',
          },
        },
        { $unwind: { path: '$crs', preserveNullAndEmpty: true } },
        {
          $group: {
            _id: { course: '$crs._id', courseTitle: '$crs.title', courseCode: '$crs.courseCode' },
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
          },
        },
        {
          $addFields: {
            completionRate: {
              $cond: [
                { $gt: ['$total', 0] },
                { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
                0,
              ],
            },
          },
        },
        { $sort: { '_id.courseTitle': 1 } },
      ]),
    ]);

    const statusMap = {};
    for (const e of enrollmentCounts) statusMap[e._id] = e.count;

    return ok(res, { enrollmentsByStatus: statusMap, courseCompletionRates: completionRates }, 'Training report');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getRecognitionReport = async (req, res) => {
  try {
    const { cycle } = req.query;
    const match = { isDeleted: false };
    if (cycle) match.cycle = new mongoose.Types.ObjectId(cycle);

    const [topEmployees, byType] = await Promise.all([
      EmployeeRecognition().aggregate([
        { $match: match },
        { $group: { _id: '$recipient', count: { $sum: 1 }, totalPoints: { $sum: '$points' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'employees',
            localField: '_id',
            foreignField: '_id',
            as: 'emp',
          },
        },
        { $unwind: { path: '$emp', preserveNullAndEmpty: true } },
        {
          $project: {
            employee: {
              _id: '$emp._id',
              firstName: '$emp.firstName',
              lastName: '$emp.lastName',
              employeeCode: '$emp.employeeCode',
            },
            count: 1,
            totalPoints: 1,
          },
        },
      ]),
      EmployeeRecognition().aggregate([
        { $match: match },
        { $group: { _id: '$type', count: { $sum: 1 }, totalPoints: { $sum: '$points' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return ok(res, { topRecognizedEmployees: topEmployees, byType }, 'Recognition report');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getCompetencyReport = async (req, res) => {
  try {
    const { cycle } = req.query;
    const match = { isDeleted: false };
    if (cycle) match.cycle = new mongoose.Types.ObjectId(cycle);

    const byCompetency = await CompetencyAssessment().aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'competencies',
          localField: 'competency',
          foreignField: '_id',
          as: 'comp',
        },
      },
      { $unwind: { path: '$comp', preserveNullAndEmpty: true } },
      {
        $group: {
          _id: { comp: '$comp._id', name: '$comp.name', type: '$comp.competencyType' },
          avgSelfRating:    { $avg: '$selfRating' },
          avgManagerRating: { $avg: '$managerRating' },
          avgFinalRating:   { $avg: '$finalRating' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.name': 1 } },
    ]);

    return ok(res, { byCompetency }, 'Competency report');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getOverallPerformanceReport = async (req, res) => {
  try {
    const { cycle } = req.query;
    const cycleFilter = cycle ? { cycle: new mongoose.Types.ObjectId(cycle) } : {};

    const [
      goalStats,
      reviewStats,
      kpiStats,
      trainingStats,
      recognitionStats,
    ] = await Promise.all([
      Goal().aggregate([
        { $match: { isDeleted: false, ...cycleFilter } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            achieved: { $sum: { $cond: [{ $eq: ['$status', 'achieved'] }, 1, 0] } },
            avgProgress: { $avg: '$progress' },
          },
        },
      ]),
      PerformanceReview().aggregate([
        { $match: { isDeleted: false, ...cycleFilter } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            avgFinalScore: { $avg: '$finalScore' },
          },
        },
      ]),
      KPIReview().aggregate([
        { $match: { isDeleted: false, ...cycleFilter } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgAchievement: { $avg: '$achievementPercent' },
          },
        },
      ]),
      TrainingEnrollment().aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          },
        },
      ]),
      EmployeeRecognition().aggregate([
        { $match: { isDeleted: false, ...cycleFilter } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalPoints: { $sum: '$points' },
          },
        },
      ]),
    ]);

    return ok(res, {
      goals: goalStats[0] || { total: 0, achieved: 0, avgProgress: 0 },
      reviews: reviewStats[0] || { total: 0, completed: 0, avgFinalScore: 0 },
      kpis: kpiStats[0] || { count: 0, avgAchievement: 0 },
      training: trainingStats[0] || { total: 0, completed: 0 },
      recognition: recognitionStats[0] || { total: 0, totalPoints: 0 },
    }, 'Overall performance report');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Announcements ─────────────────────────────────────────────────────────────

exports.createAnnouncement = async (req, res) => {
  try {
    const ann = await EmployeeAnnouncement().create({ ...req.body, publishedBy: req.user._id });
    _audit(req, 'CREATE', 'EmployeeAnnouncement', ann._id, ann.announcementNumber, null, req.body);
    return created(res, ann, 'Announcement created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { isPublished, priority, targetAudience, search } = req.query;
    const filter = { isDeleted: false };
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    if (priority)       filter.priority       = priority;
    if (targetAudience) filter.targetAudience = targetAudience;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      EmployeeAnnouncement().find(filter)
        .populate('publishedBy', 'name')
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

exports.getAnnouncement = async (req, res) => {
  try {
    const ann = await EmployeeAnnouncement().findOne({ _id: req.params.id, isDeleted: false })
      .populate('publishedBy', 'name')
      .lean();
    if (!ann) return notFound(res, 'Announcement');
    return ok(res, ann);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const ann = await EmployeeAnnouncement().findOne({ _id: req.params.id, isDeleted: false });
    if (!ann) return notFound(res, 'Announcement');
    const before = ann.toObject();
    Object.assign(ann, req.body);
    await ann.save();
    _audit(req, 'UPDATE', 'EmployeeAnnouncement', ann._id, ann.announcementNumber, before, req.body);
    return ok(res, ann, 'Announcement updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const ann = await EmployeeAnnouncement().findOne({ _id: req.params.id, isDeleted: false });
    if (!ann) return notFound(res, 'Announcement');
    ann.isDeleted = true;
    await ann.save();
    _audit(req, 'DELETE', 'EmployeeAnnouncement', ann._id, ann.announcementNumber, ann.toObject(), null);
    return ok(res, null, 'Announcement deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.publishAnnouncement = async (req, res) => {
  try {
    const ann = await EmployeeAnnouncement().findOne({ _id: req.params.id, isDeleted: false });
    if (!ann) return notFound(res, 'Announcement');
    const before = ann.toObject();
    ann.isPublished  = true;
    ann.publishAt    = ann.publishAt || new Date();
    ann.publishedBy  = req.user._id;
    await ann.save();
    _audit(req, 'PUBLISH', 'EmployeeAnnouncement', ann._id, ann.announcementNumber, before, { isPublished: true });
    return ok(res, ann, 'Announcement published');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── ESS Settings ──────────────────────────────────────────────────────────────

exports.getESSSettings = async (req, res) => {
  try {
    let settings = await EmployeeSelfServiceSetting().findOne({ isDeleted: false }).lean();
    if (!settings) {
      settings = await EmployeeSelfServiceSetting().create({});
      settings = settings.toObject();
    }
    return ok(res, settings);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateESSSettings = async (req, res) => {
  try {
    const settings = await EmployeeSelfServiceSetting().findOneAndUpdate(
      { isDeleted: false },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    _audit(req, 'UPDATE', 'EmployeeSelfServiceSetting', settings._id, 'ESS Settings', null, req.body);
    return ok(res, settings, 'ESS settings updated');
  } catch (err) {
    return serverError(res, err);
  }
};
