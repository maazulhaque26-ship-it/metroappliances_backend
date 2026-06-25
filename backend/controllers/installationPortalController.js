'use strict';
const InstallationRequest  = require('../models/InstallationRequest');
const InstallationEngineer = require('../models/InstallationEngineer');
const Notification         = require('../models/Notification');
const { ok, fail, notFound, serverError } = require('../utils/response');

async function notifyCustomer(userId, title, message, link = '') {
  try { await Notification.create({ user: userId, type: 'system', title, message, link }); } catch (_) {}
}

// Dashboard summary
exports.getEngineerDashboard = async (req, res) => {
  try {
    const engId = req.engineer._id;
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    const [active, todayJobs, completed, pending] = await Promise.all([
      InstallationRequest.countDocuments({ assignedEngineer: engId, isDeleted: false, status: { $in: ['assigned', 'travelling', 'arrived', 'in_progress', 'demo_in_progress'] } }),
      InstallationRequest.find({ assignedEngineer: engId, isDeleted: false, scheduledAt: { $gte: today, $lt: tomorrow } })
        .populate('customer', 'name phone').sort({ scheduledAt: 1 }).limit(5),
      InstallationRequest.countDocuments({ assignedEngineer: engId, isDeleted: false, status: 'completed' }),
      InstallationRequest.countDocuments({ assignedEngineer: engId, isDeleted: false, status: { $in: ['assigned', 'confirmed'] } }),
    ]);

    return ok(res, {
      engineer:  { name: req.engineer.name, rating: req.engineer.rating, totalInstallations: req.engineer.totalInstallations, isAvailable: req.engineer.isAvailable, currentWorkload: req.engineer.currentWorkload },
      stats:     { active, todayCount: todayJobs.length, completed, pending },
      todayJobs,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

// My jobs list
exports.getEngineerJobs = async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = { assignedEngineer: req.engineer._id, isDeleted: false };
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      filter.scheduledAt = { $gte: d, $lt: next };
    }

    const jobs = await InstallationRequest.find(filter)
      .populate('customer', 'name phone')
      .sort({ scheduledAt: 1 });

    return ok(res, jobs);
  } catch (err) {
    return serverError(res, err);
  }
};

// Job detail
exports.getEngineerJobDetail = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, assignedEngineer: req.engineer._id, isDeleted: false })
      .populate('customer', 'name phone email')
      .populate('warrantyId')
      .populate('registrationId');
    if (!ir) return notFound(res, 'Installation request');
    return ok(res, ir);
  } catch (err) {
    return serverError(res, err);
  }
};

// Update job status
exports.updateJobStatus = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, assignedEngineer: req.engineer._id, isDeleted: false });
    if (!ir) return notFound(res, 'Installation request');

    const { status, note } = req.body;
    ir.status = status;
    ir.history.push({ status, note: note || '', changedBy: req.engineer._id, changedByModel: 'InstallationEngineer', changedAt: new Date() });
    if (status === 'in_progress') ir.startedAt = new Date();
    if (status === 'completed') {
      ir.completedAt = new Date();
      if (ir.startedAt) ir.totalDuration = Math.round((ir.completedAt - ir.startedAt) / 60000);
      const engineer = await InstallationEngineer.findById(req.engineer._id);
      if (engineer) {
        engineer.currentWorkload    = Math.max(0, (engineer.currentWorkload || 1) - 1);
        engineer.totalInstallations = (engineer.totalInstallations || 0) + 1;
        await engineer.save();
      }
    }
    await ir.save();

    const labels = {
      travelling:        'Engineer is on the way to your location',
      arrived:           'Engineer has arrived at your location',
      in_progress:       'Installation in progress',
      demo_in_progress:  'Product demo is being conducted',
      completed:         'Installation completed successfully!',
    };
    if (labels[status]) notifyCustomer(ir.customer, `Installation Update: ${ir.requestNumber}`, labels[status], `/my-installations/${ir._id}`);

    return ok(res, ir);
  } catch (err) {
    return serverError(res, err);
  }
};

// Update checklist item
exports.updateChecklist = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, assignedEngineer: req.engineer._id, isDeleted: false });
    if (!ir) return notFound(res, 'Installation request');

    const { itemId, completed, note } = req.body;
    const item = ir.checklist.id(itemId);
    if (!item) return fail(res, 'Checklist item not found', 404);

    item.completed   = completed;
    if (completed) item.completedAt = new Date();
    if (note !== undefined) item.note = note;
    await ir.save();
    return ok(res, ir.checklist);
  } catch (err) {
    return serverError(res, err);
  }
};

// Upload engineer photo
exports.uploadJobPhoto = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, assignedEngineer: req.engineer._id, isDeleted: false });
    if (!ir) return notFound(res, 'Installation request');
    if (!req.file) return fail(res, 'No file uploaded', 400);

    const { caption = '', type = 'general' } = req.body;
    ir.engineerPhotos.push({ url: req.file.path, caption, type, uploadedAt: new Date() });
    await ir.save();
    return ok(res, { url: req.file.path, engineerPhotos: ir.engineerPhotos });
  } catch (err) {
    return serverError(res, err);
  }
};

// Save customer signature + auto-complete
exports.saveSignature = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, assignedEngineer: req.engineer._id, isDeleted: false });
    if (!ir) return notFound(res, 'Installation request');
    if (!req.body.signature) return fail(res, 'Signature data is required', 400);

    ir.customerSignature = req.body.signature;
    if (['in_progress', 'demo_in_progress'].includes(ir.status)) {
      ir.status      = 'completed';
      ir.completedAt = new Date();
      if (ir.startedAt) ir.totalDuration = Math.round((ir.completedAt - ir.startedAt) / 60000);
      ir.history.push({ status: 'completed', note: 'Customer signed off', changedBy: req.engineer._id, changedByModel: 'InstallationEngineer', changedAt: new Date() });

      const engineer = await InstallationEngineer.findById(req.engineer._id);
      if (engineer) {
        engineer.currentWorkload    = Math.max(0, (engineer.currentWorkload || 1) - 1);
        engineer.totalInstallations = (engineer.totalInstallations || 0) + 1;
        await engineer.save();
      }
      notifyCustomer(ir.customer, `Installation Complete: ${ir.requestNumber}`, `Your ${ir.productName} installation is complete. Thank you!`, `/my-installations/${ir._id}`);
    }
    await ir.save();
    return ok(res, { customerSignature: ir.customerSignature, status: ir.status });
  } catch (err) {
    return serverError(res, err);
  }
};

// Save demo notes
exports.saveDemoNotes = async (req, res) => {
  try {
    const ir = await InstallationRequest.findOne({ _id: req.params.id, assignedEngineer: req.engineer._id, isDeleted: false });
    if (!ir) return notFound(res, 'Installation request');
    ir.demoNotes    = req.body.demoNotes   || '';
    ir.demoCompleted = req.body.demoCompleted ?? ir.demoCompleted;
    if (req.body.demoVideoUrl) ir.demoVideoUrl = req.body.demoVideoUrl;
    await ir.save();
    return ok(res, { demoNotes: ir.demoNotes, demoCompleted: ir.demoCompleted });
  } catch (err) {
    return serverError(res, err);
  }
};
