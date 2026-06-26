'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, fail, serverError } = require('../utils/response');

const JobOpening          = () => mongoose.model('JobOpening');
const JobApplication      = () => mongoose.model('JobApplication');
const OfferLetter         = () => mongoose.model('OfferLetter');
const RecruitmentSetting  = () => mongoose.model('RecruitmentSetting');

// ── Open Positions by Department ──────────────────────────────────────────────

exports.getOpenPositions = async (req, res) => {
  try {
    const data = await JobOpening().aggregate([
      { $match: { status: 'open', isDeleted: false } },
      {
        $lookup: {
          from:         'departments',
          localField:   'department',
          foreignField: '_id',
          as:           'dept',
        },
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:          '$department',
          deptName:     { $first: '$dept.name' },
          openPositions: { $push: { _id: '$_id', title: '$title', jobType: '$jobType', openings: '$openings', postedDate: '$postedDate' } },
          totalOpenings: { $sum: '$openings' },
        },
      },
      {
        $project: {
          _id:           0,
          department:    { id: '$_id', name: '$deptName' },
          openPositions: 1,
          totalOpenings: 1,
        },
      },
      { $sort: { totalOpenings: -1 } },
    ]);

    return ok(res, data, 'Open positions by department');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Hiring Funnel ─────────────────────────────────────────────────────────────

exports.getHiringFunnel = async (req, res) => {
  try {
    const year  = Number(req.query.year) || new Date().getFullYear();
    const jobId = req.query.jobId;

    const matchStage = {
      isDeleted: false,
      appliedAt: {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59),
      },
    };
    if (jobId) matchStage.job = new mongoose.Types.ObjectId(jobId);

    const agg = await JobApplication().aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const map = {};
    for (const item of agg) map[item._id] = item.count;

    const funnel = {
      applied:     map['applied']     || 0,
      screening:   map['screening']   || 0,
      shortlisted: map['shortlisted'] || 0,
      interview:   map['interview']   || 0,
      offered:     map['offered']     || 0,
      hired:       map['hired']       || 0,
      rejected:    map['rejected']    || 0,
    };

    return ok(res, { year, jobId: jobId || null, funnel }, 'Hiring funnel data');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Source Effectiveness ──────────────────────────────────────────────────────

exports.getSourceEffectiveness = async (req, res) => {
  try {
    const data = await JobApplication().aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from:         'candidates',
          localField:   'candidate',
          foreignField: '_id',
          as:           'candidateDoc',
        },
      },
      { $unwind: { path: '$candidateDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:    '$candidateDoc.source',
          total:  { $sum: 1 },
          hired:  { $sum: { $cond: [{ $eq: ['$status', 'hired'] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id:            0,
          source:         { $ifNull: ['$_id', 'Unknown'] },
          total:          1,
          hired:          1,
          conversionRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$hired', '$total'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return ok(res, data, 'Source effectiveness report');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Time to Hire ──────────────────────────────────────────────────────────────

exports.getTimeToHire = async (req, res) => {
  try {
    // Overall average
    const overallAgg = await JobApplication().aggregate([
      {
        $match: {
          isDeleted: false,
          status:    'hired',
          appliedAt: { $exists: true },
          hiredAt:   { $exists: true },
        },
      },
      {
        $project: {
          daysToHire: {
            $divide: [
              { $subtract: ['$hiredAt', '$appliedAt'] },
              1000 * 60 * 60 * 24,
            ],
          },
          job: 1,
        },
      },
      {
        $group: {
          _id:         null,
          averageDays: { $avg: '$daysToHire' },
        },
      },
    ]);

    const averageDays = overallAgg.length ? Math.round(overallAgg[0].averageDays) : 0;

    // By department
    const byDeptAgg = await JobApplication().aggregate([
      {
        $match: {
          isDeleted: false,
          status:    'hired',
          appliedAt: { $exists: true },
          hiredAt:   { $exists: true },
        },
      },
      {
        $lookup: {
          from:         'jobopenings',
          localField:   'job',
          foreignField: '_id',
          as:           'jobDoc',
        },
      },
      { $unwind: { path: '$jobDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from:         'departments',
          localField:   'jobDoc.department',
          foreignField: '_id',
          as:           'deptDoc',
        },
      },
      { $unwind: { path: '$deptDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:         '$jobDoc.department',
          deptName:    { $first: '$deptDoc.name' },
          averageDays: {
            $avg: {
              $divide: [
                { $subtract: ['$hiredAt', '$appliedAt'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id:         0,
          department:  { id: '$_id', name: '$deptName' },
          averageDays: { $round: ['$averageDays', 0] },
          count:       1,
        },
      },
      { $sort: { averageDays: 1 } },
    ]);

    return ok(res, { averageDays, byDepartment: byDeptAgg }, 'Time to hire report');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Offer Acceptance Rate ─────────────────────────────────────────────────────

exports.getOfferAcceptance = async (req, res) => {
  try {
    const agg = await OfferLetter().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const map = {};
    for (const item of agg) map[item._id] = item.count;

    const total    = Object.values(map).reduce((a, b) => a + b, 0);
    const accepted = map['accepted'] || 0;
    const rejected = (map['rejected'] || 0) + (map['withdrawn'] || 0);
    const pending  = (map['sent'] || 0) + (map['approved'] || 0);
    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    return ok(res, {
      total, accepted, rejected, pending,
      draft: map['draft'] || 0,
      acceptanceRate,
      byStatus: map,
    }, 'Offer acceptance report');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Recruiter Performance ─────────────────────────────────────────────────────

exports.getRecruiterPerformance = async (req, res) => {
  try {
    const data = await JobOpening().aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from:         'jobapplications',
          localField:   '_id',
          foreignField: 'job',
          as:           'applications',
        },
      },
      {
        $group: {
          _id:                  '$postedBy',
          jobsPosted:           { $sum: 1 },
          applicationsReceived: { $sum: { $size: '$applications' } },
          hired: {
            $sum: {
              $size: {
                $filter: {
                  input: '$applications',
                  cond:  { $eq: ['$$this.status', 'hired'] },
                },
              },
            },
          },
        },
      },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'recruiterDoc',
        },
      },
      { $unwind: { path: '$recruiterDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id:                  0,
          recruiter:            { id: '$_id', name: '$recruiterDoc.name', email: '$recruiterDoc.email' },
          jobsPosted:           1,
          applicationsReceived: 1,
          hired:                1,
        },
      },
      { $sort: { hired: -1 } },
    ]);

    return ok(res, data, 'Recruiter performance report');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Department Hiring ─────────────────────────────────────────────────────────

exports.getDepartmentHiring = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const data = await JobApplication().aggregate([
      {
        $match: {
          isDeleted: false,
          status:    'hired',
          hiredAt:   {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $lookup: {
          from:         'jobopenings',
          localField:   'job',
          foreignField: '_id',
          as:           'jobDoc',
        },
      },
      { $unwind: { path: '$jobDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from:         'departments',
          localField:   'jobDoc.department',
          foreignField: '_id',
          as:           'deptDoc',
        },
      },
      { $unwind: { path: '$deptDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:             '$jobDoc.department',
          deptName:        { $first: '$deptDoc.name' },
          hired:           { $sum: 1 },
          targetHeadcount: { $first: '$deptDoc.targetHeadcount' },
        },
      },
    ]);

    // Fetch open positions per department
    const openByDept = await JobOpening().aggregate([
      { $match: { status: 'open', isDeleted: false } },
      { $group: { _id: '$department', openPositions: { $sum: '$openings' } } },
    ]);
    const openMap = {};
    for (const o of openByDept) openMap[String(o._id)] = o.openPositions;

    const result = data.map(d => ({
      department:      { id: d._id, name: d.deptName },
      hired:           d.hired,
      openPositions:   openMap[String(d._id)] || 0,
      targetHeadcount: d.targetHeadcount || 0,
    }));

    return ok(res, { year, data: result }, 'Department hiring report');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Settings ──────────────────────────────────────────────────────────────────

const SETTING_DEFAULTS = {
  singleton:              'default',
  offerApprovalLevels:    2,
  autoRejectAfterDays:    90,
  maxInterviewRounds:     5,
  defaultPipeline:        null,
  allowSelfApplication:   false,
  requireBGVBeforeOffer:  true,
  notifyHROnApplication:  true,
  notifyHROnOffer:        true,
  emailTemplates: {
    applicationReceived: '',
    interviewInvite:     '',
    offerLetter:         '',
    rejection:           '',
  },
};

exports.getSettings = async (req, res) => {
  try {
    let settings = await RecruitmentSetting().findOne({ singleton: 'default' }).lean();
    if (!settings) {
      settings = await RecruitmentSetting().create(SETTING_DEFAULTS);
    }
    return ok(res, settings, 'Recruitment settings loaded');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const before = await RecruitmentSetting().findOne({ singleton: 'default' }).lean();

    const settings = await RecruitmentSetting().findOneAndUpdate(
      { singleton: 'default' },
      { ...req.body, singleton: 'default' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    setImmediate(async () => {
      try {
        await AuditLog.create({
          admin: req.user._id, adminName: req.user.name,
          adminEmail: req.user.email, adminRole: req.user.role,
          action:      'RECRUITMENT_SETTINGS_UPDATED',
          entity:      'RecruitmentSetting',
          entityId:    settings._id,
          entityLabel: 'Recruitment Settings',
          changes:     { before, after: settings.toObject() },
          ip: (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
          userAgent: (req.get('User-Agent') || '').slice(0, 300),
        });
      } catch (_) {}
    });

    return ok(res, settings, 'Recruitment settings updated');
  } catch (err) {
    return serverError(res, err);
  }
};
