'use strict';
const mongoose = require('mongoose');
const { ok, serverError } = require('../utils/response');

const PerformanceCycle    = () => mongoose.model('PerformanceCycle');
const Goal                = () => mongoose.model('Goal');
const PerformanceReview   = () => mongoose.model('PerformanceReview');
const KPIReview           = () => mongoose.model('KPIReview');
const TrainingEnrollment  = () => mongoose.model('TrainingEnrollment');
const EmployeeRecognition = () => mongoose.model('EmployeeRecognition');

exports.getDashboard = async (req, res) => {
  try {
    const activeCycle = await PerformanceCycle().findOne({ status: 'active', isDeleted: false }).lean();

    const [
      activeCycles,
      totalGoals,
      pendingReviews,
      dueTrainings,
      recentReviews,
      recentRecognitions,
    ] = await Promise.all([
      PerformanceCycle().countDocuments({ status: 'active', isDeleted: false }),
      Goal().countDocuments({ isDeleted: false }),
      PerformanceReview().countDocuments({
        status: { $in: ['draft', 'self_review', 'manager_review'] },
        isDeleted: false,
      }),
      TrainingEnrollment().countDocuments({ status: 'enrolled', isDeleted: false }),
      PerformanceReview().find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('employee', 'firstName lastName employeeCode')
        .select('reviewNumber status selfScore managerScore finalScore overallRating createdAt')
        .lean(),
      EmployeeRecognition().find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('recipient', 'firstName lastName employeeCode')
        .populate('givenBy', 'name')
        .select('recognitionNumber type title points isPublic createdAt')
        .lean(),
    ]);

    let kpiAchievement = 0;
    if (activeCycle) {
      const kpiAgg = await KPIReview().aggregate([
        { $match: { cycle: activeCycle._id, isDeleted: false } },
        { $group: { _id: null, avg: { $avg: '$achievementPercent' } } },
      ]);
      kpiAchievement = kpiAgg.length ? Math.round(kpiAgg[0].avg * 100) / 100 : 0;
    }

    return ok(res, {
      stats: { activeCycles, totalGoals, pendingReviews, dueTrainings },
      recentReviews,
      recentRecognitions,
      kpiAchievement,
    }, 'Performance dashboard loaded');
  } catch (err) {
    return serverError(res, err);
  }
};
