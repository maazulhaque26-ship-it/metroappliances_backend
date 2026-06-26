'use strict';
const mongoose = require('mongoose');
const { ok, serverError } = require('../utils/response');

const JobOpening       = () => mongoose.model('JobOpening');
const JobApplication   = () => mongoose.model('JobApplication');
const Interview        = () => mongoose.model('Interview');
const OfferLetter      = () => mongoose.model('OfferLetter');

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfDay(d) { const dt = new Date(d); dt.setHours(0, 0, 0, 0); return dt; }
function endOfDay(d)   { const dt = new Date(d); dt.setHours(23, 59, 59, 999); return dt; }

function startOfWeek(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() - dt.getDay());
  return dt;
}

function endOfWeek(d) {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  dt.setDate(dt.getDate() + (6 - dt.getDay()));
  return dt;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const now       = new Date();
    const todayStart = startOfDay(now);
    const todayEnd   = endOfDay(now);
    const weekStart  = startOfWeek(now);
    const weekEnd    = endOfWeek(now);
    const monthStart = startOfMonth(now);

    // Job opening counts by status
    const [
      openJobs, draftJobs, onHoldJobs, closedJobs, cancelledJobs,
      totalApplications,
      interviewsToday, interviewsThisWeek,
      offersPending,
      hiredThisMonth,
      recentJobs,
    ] = await Promise.all([
      JobOpening().countDocuments({ status: 'open',      isDeleted: false }),
      JobOpening().countDocuments({ status: 'draft',     isDeleted: false }),
      JobOpening().countDocuments({ status: 'on_hold',   isDeleted: false }),
      JobOpening().countDocuments({ status: 'closed',    isDeleted: false }),
      JobOpening().countDocuments({ status: 'cancelled', isDeleted: false }),

      JobApplication().countDocuments({ isDeleted: false }),

      Interview().countDocuments({ scheduledAt: { $gte: todayStart, $lte: todayEnd }, status: 'scheduled', isDeleted: false }),
      Interview().countDocuments({ scheduledAt: { $gte: weekStart,  $lte: weekEnd  }, status: 'scheduled', isDeleted: false }),

      OfferLetter().countDocuments({ status: 'sent', isDeleted: false }),

      JobApplication().countDocuments({ status: 'hired', hiredAt: { $gte: monthStart }, isDeleted: false }),

      JobOpening().find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title department status jobType openings appliedCount createdAt')
        .lean(),
    ]);

    // Applications by status
    const appsByStatus = await JobApplication().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const applicationsByStatus = {};
    for (const item of appsByStatus) applicationsByStatus[item._id] = item.count;

    // Source breakdown
    const sourceAgg = await JobApplication().aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidateDoc',
        },
      },
      { $unwind: { path: '$candidateDoc', preserveNullAndEmpty: true } },
      { $group: { _id: '$candidateDoc.source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Hiring funnel
    const funnelStages = ['applied', 'screening', 'shortlisted', 'interview', 'offered', 'hired'];
    const funnelAgg = await JobApplication().aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const funnelMap = {};
    for (const f of funnelAgg) funnelMap[f._id] = f.count;
    const hiringFunnel = {
      applied:     funnelMap['applied']     || 0,
      screening:   funnelMap['screening']   || 0,
      shortlisted: funnelMap['shortlisted'] || 0,
      interview:   funnelMap['interview']   || 0,
      offered:     funnelMap['offered']     || 0,
      hired:       funnelMap['hired']       || 0,
      rejected:    funnelMap['rejected']    || 0,
    };

    return ok(res, {
      jobOpenings: {
        open: openJobs, draft: draftJobs, onHold: onHoldJobs,
        closed: closedJobs, cancelled: cancelledJobs,
        total: openJobs + draftJobs + onHoldJobs + closedJobs + cancelledJobs,
      },
      applications: {
        total: totalApplications,
        byStatus: applicationsByStatus,
      },
      interviews: {
        today: interviewsToday,
        thisWeek: interviewsThisWeek,
      },
      offersPending,
      hiredThisMonth,
      sourceBreakdown: sourceAgg.map(s => ({ source: s._id || 'Unknown', count: s.count })),
      hiringFunnel,
      recentJobs,
    }, 'Recruitment dashboard loaded');
  } catch (err) {
    return serverError(res, err);
  }
};
