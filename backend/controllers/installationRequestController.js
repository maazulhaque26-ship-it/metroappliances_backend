'use strict';
const InstallationRequest  = require('../models/InstallationRequest');
const InstallationEngineer = require('../models/InstallationEngineer');
const WarrantyCard         = require('../models/WarrantyCard');
const Notification         = require('../models/Notification');
const AuditLog             = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

async function notifyCustomer(userId, title, message, link = '') {
  try { await Notification.create({ user: userId, type: 'system', title, message, link }); } catch (_) {}
}

async function audit(req, action, resourceId, details = {}) {
  try {
    await AuditLog.create({
      user:      req.user?._id || req.engineer?._id,
      userModel: req.user ? 'User' : 'InstallationEngineer',
      action,
      resource:   'InstallationRequest',
      resourceId,
      details,
      ip: req.ip,
    });
  } catch (_) {}
}

// ── Customer ──────────────────────────────────────────────────────────────────

exports.bookInstallation = async (req, res) => {
  try {
    const ir = await InstallationRequest.create({ ...req.body, customer: req.user._id });
    await audit(req, 'create', ir._id, { requestNumber: ir.requestNumber });
    notifyCustomer(
      req.user._id,
      `Installation Booked: ${ir.requestNumber}`,
      `Your installation request for ${ir.productName} has been submitted. We will confirm shortly.`,
      `/my-installations/${ir._id}`
    );
    const io = req.app.locals.io;
    if (io) io.emit('installation:new', { requestNumber: ir.requestNumber, category: ir.category });
    return created(res, ir);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getMyInstallations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { customer: req.user._id, isDeleted: false };
    if (status) filter.status = status;

    const total    = await InstallationRequest.countDocuments(filter);
    const requests = await InstallationRequest.find(filter)
      .populate('assignedEngineer', 'name phone avatar rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return paginated(res, requests, total, Number(page), Number(limit));
  } catch (err) {
    return serverError(res, err);
  }
};

exports.trackInstallation = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, customer: req.user._id, isDeleted: false })
      .populate('assignedEngineer', 'name phone avatar rating gpsLocation')
      .populate('warrantyId');
    if (!ir) return notFound(res, 'Installation request');
    return ok(res, ir);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.submitInstallationFeedback = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, customer: req.user._id, isDeleted: false });
    if (!ir) return notFound(res, 'Installation request');
    if (ir.status !== 'completed') return fail(res, 'Feedback can only be submitted for completed installations', 400);

    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) return fail(res, 'Rating must be between 1 and 5', 400);

    ir.customerRating   = rating;
    ir.customerFeedback = feedback;
    await ir.save();

    if (ir.assignedEngineer) {
      const engineer = await InstallationEngineer.findById(ir.assignedEngineer);
      if (engineer) {
        const newCount = engineer.rating.count + 1;
        const newAvg   = ((engineer.rating.average * engineer.rating.count) + rating) / newCount;
        engineer.rating = { average: parseFloat(newAvg.toFixed(2)), count: newCount };
        await engineer.save();
      }
    }
    return ok(res, { customerRating: ir.customerRating, customerFeedback: ir.customerFeedback });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.uploadLocationPhoto = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, customer: req.user._id, isDeleted: false });
    if (!ir) return notFound(res, 'Installation request');
    if (!req.file) return fail(res, 'No file uploaded', 400);
    ir.locationPhotos.push(req.file.path);
    await ir.save();
    return ok(res, { url: req.file.path });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

exports.getAdminInstallations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, engineer, search, dateFrom, dateTo } = req.query;
    const filter = { isDeleted: false };
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (engineer) filter.assignedEngineer = engineer;
    if (search) filter.$or = [
      { requestNumber:                    { $regex: search, $options: 'i' } },
      { productName:                      { $regex: search, $options: 'i' } },
      { 'installationAddress.city':       { $regex: search, $options: 'i' } },
    ];
    if (dateFrom || dateTo) {
      filter.preferredDate = {};
      if (dateFrom) filter.preferredDate.$gte = new Date(dateFrom);
      if (dateTo)   filter.preferredDate.$lte = new Date(dateTo);
    }

    const total    = await InstallationRequest.countDocuments(filter);
    const requests = await InstallationRequest.find(filter)
      .populate('customer',         'name email phone')
      .populate('assignedEngineer', 'name phone')
      .sort({ preferredDate: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return paginated(res, requests, total, Number(page), Number(limit));
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getAdminInstallation = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer',         'name email phone')
      .populate('assignedEngineer', 'name phone avatar rating territory skills')
      .populate('warrantyId')
      .populate('registrationId');
    if (!ir) return notFound(res, 'Installation request');
    return ok(res, ir);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateInstallationStatus = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, isDeleted: false });
    if (!ir) return notFound(res, 'Installation request');

    const prev = ir.status;
    ir.status  = req.body.status;
    ir.history.push({ status: req.body.status, note: req.body.note || '', changedBy: req.user._id, changedByModel: 'Admin', changedAt: new Date() });
    if (req.body.status === 'completed') ir.completedAt = new Date();
    await ir.save();

    await audit(req, 'update', ir._id, { from: prev, to: ir.status });
    notifyCustomer(ir.customer, `Installation Update: ${ir.requestNumber}`, `Status updated to: ${ir.status.replace(/_/g, ' ')}`, `/my-installations/${ir._id}`);
    return ok(res, ir);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.assignEngineer = async (req, res) => {
  try {
    const { engineerId, scheduledAt } = req.body;
    const [ir, engineer] = await Promise.all([
      InstallationRequest.findOne({ _id: req.params.id, isDeleted: false }),
      InstallationEngineer.findOne({ _id: engineerId, isDeleted: false, status: 'active' }),
    ]);
    if (!ir)       return notFound(res, 'Installation request');
    if (!engineer) return notFound(res, 'Engineer');

    ir.assignedEngineer = engineerId;
    ir.status           = 'assigned';
    ir.scheduledAt      = scheduledAt || ir.preferredDate;
    ir.history.push({ status: 'assigned', note: `Engineer ${engineer.name} assigned`, changedBy: req.user._id, changedByModel: 'Admin', changedAt: new Date() });
    engineer.currentWorkload = (engineer.currentWorkload || 0) + 1;

    await Promise.all([ir.save(), engineer.save()]);
    await audit(req, 'assign', ir._id, { engineer: engineer.name });
    notifyCustomer(ir.customer, `Engineer Assigned: ${ir.requestNumber}`, `${engineer.name} will handle your installation. Scheduled: ${new Date(ir.scheduledAt).toDateString()}`, `/my-installations/${ir._id}`);
    return ok(res, ir);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getInstallationDashboard = async (req, res) => {
  try {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    const [total, pending, confirmed, assigned, inProgress, completed, cancelled, todayScheduled, engineers, avgRating] = await Promise.all([
      InstallationRequest.countDocuments({ isDeleted: false }),
      InstallationRequest.countDocuments({ isDeleted: false, status: 'pending' }),
      InstallationRequest.countDocuments({ isDeleted: false, status: 'confirmed' }),
      InstallationRequest.countDocuments({ isDeleted: false, status: 'assigned' }),
      InstallationRequest.countDocuments({ isDeleted: false, status: { $in: ['travelling', 'arrived', 'in_progress', 'demo_in_progress'] } }),
      InstallationRequest.countDocuments({ isDeleted: false, status: 'completed' }),
      InstallationRequest.countDocuments({ isDeleted: false, status: 'cancelled' }),
      InstallationRequest.countDocuments({ isDeleted: false, scheduledAt: { $gte: today, $lt: tomorrow } }),
      InstallationEngineer.countDocuments({ isDeleted: false, status: 'active' }),
      InstallationRequest.aggregate([
        { $match: { isDeleted: false, customerRating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$customerRating' } } },
      ]),
    ]);

    const csat        = avgRating.length ? parseFloat(avgRating[0].avg.toFixed(2)) : 0;
    const successRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;

    return ok(res, { total, pending, confirmed, assigned, inProgress, completed, cancelled, todayScheduled, engineers, csat, successRate });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getInstallationReports = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const match = { isDeleted: false };
    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   match.createdAt.$lte = new Date(dateTo);
    }

    const [statusBreakdown, categoryBreakdown, engineerPerformance] = await Promise.all([
      InstallationRequest.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      InstallationRequest.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
      InstallationRequest.aggregate([
        { $match: { ...match, assignedEngineer: { $exists: true }, status: 'completed' } },
        { $group: { _id: '$assignedEngineer', completed: { $sum: 1 }, avgRating: { $avg: '$customerRating' }, avgDuration: { $avg: '$totalDuration' } } },
        { $lookup: { from: 'installationengineers', localField: '_id', foreignField: '_id', as: 'engineer' } },
        { $unwind: { path: '$engineer', preserveNullAndEmpty: true } },
        { $project: { name: '$engineer.name', completed: 1, avgRating: { $round: ['$avgRating', 2] }, avgDuration: { $round: ['$avgDuration', 0] } } },
        { $sort: { completed: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return ok(res, { statusBreakdown, categoryBreakdown, engineerPerformance });
  } catch (err) {
    return serverError(res, err);
  }
};
