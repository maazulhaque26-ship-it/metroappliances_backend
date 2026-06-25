const ServiceRequest = require('../models/ServiceRequest');
const WarrantyCard   = require('../models/WarrantyCard');
const AMCContract    = require('../models/AMCContract');
const Technician     = require('../models/Technician');
const Notification   = require('../models/Notification');
const { ok, created, paginated, fail, notFound, forbidden, serverError } = require('../utils/response');

// Fire-and-forget customer notification via Sprint 8 Notification model
async function notifyCustomer(userId, title, message, link = '') {
  try {
    await Notification.create({ user: userId, type: 'system', title, message, link });
  } catch (_) {}
}

// ── Shared: push history entry ────────────────────────────────────────────────
function pushHistory(sr, status, note, actorId, actorModel) {
  sr.history.push({ status, note, changedBy: actorId, changedByModel: actorModel, changedAt: new Date() });
}

// ── Customer: raise new service request ──────────────────────────────────────
exports.raiseServiceRequest = async (req, res) => {
  try {
    const {
      productId, productName, serialNumber, invoiceNumber,
      category, description, priority,
      serviceAddress,
    } = req.body;

    const sr = new ServiceRequest({
      customer: req.user._id,
      product: productId,
      productName,
      serialNumber,
      invoiceNumber,
      category,
      description,
      priority: priority || 'medium',
      serviceAddress,
    });

    // Check active warranty
    if (serialNumber) {
      const warranty = await WarrantyCard.findOne({
        serialNumber,
        customer: req.user._id,
        status: 'active',
        endDate: { $gte: new Date() },
      });
      if (warranty) {
        sr.warrantyId = warranty._id;
        sr.isUnderWarranty = true;
      }
    }

    // Check active AMC
    if (serialNumber) {
      const amc = await AMCContract.findOne({
        serialNumber,
        customer: req.user._id,
        status: 'active',
        endDate: { $gte: new Date() },
      });
      if (amc) {
        sr.amcId = amc._id;
        sr.isUnderAMC = true;
      }
    }

    // SLA defaults
    const now = new Date();
    sr.sla.respondBy = new Date(now.getTime() + sr.sla.responseHours * 3600000);
    sr.sla.resolveBy = new Date(now.getTime() + sr.sla.resolutionHours * 3600000);

    pushHistory(sr, 'open', 'Service request raised by customer', req.user._id, 'User');
    await sr.save();

    const io = req.app.locals.io;
    if (io) io.emit('service:request_raised', { ticketNumber: sr.ticketNumber, customerId: req.user._id });

    notifyCustomer(
      req.user._id,
      `Complaint Raised: ${sr.ticketNumber}`,
      `Your service request for "${sr.productName || sr.category}" has been submitted. We will contact you shortly.`,
      `/my-service/track/${sr._id}`
    );

    return created(res, { serviceRequest: sr });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Customer: list own requests ───────────────────────────────────────────────
exports.getMyServiceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const q = { customer: req.user._id, isDeleted: false };
    if (status) q.status = status;
    const total = await ServiceRequest.countDocuments(q);
    const items = await ServiceRequest.find(q)
      .populate('product', 'name images')
      .populate('assignedTechnician', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, items, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Customer: track single request ───────────────────────────────────────────
exports.trackServiceRequest = async (req, res) => {
  try {
    const sr = await ServiceRequest.findOne({
      $or: [{ _id: req.params.id }, { ticketNumber: req.params.id }],
      customer: req.user._id,
      isDeleted: false,
    })
      .populate('product', 'name images')
      .populate('assignedTechnician', 'name phone avatar')
      .populate('warrantyId', 'warrantyType endDate')
      .populate('amcId', 'contractNumber endDate');
    if (!sr) return notFound(res, 'Service request');
    return ok(res, { serviceRequest: sr });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Customer: add feedback ────────────────────────────────────────────────────
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const sr = await ServiceRequest.findOne({
      _id: req.params.id, customer: req.user._id, isDeleted: false,
    });
    if (!sr) return notFound(res, 'Service request');
    if (!['completed', 'closed'].includes(sr.status)) {
      return fail(res, 'Feedback can only be submitted after service completion', 400);
    }
    sr.customerRating = rating;
    sr.customerFeedback = feedback;
    sr.status = 'closed';
    sr.closedAt = new Date();
    pushHistory(sr, 'closed', `Customer rated ${rating}/5`, req.user._id, 'User');

    // Update technician rating
    if (sr.assignedTechnician && rating) {
      const tech = await Technician.findById(sr.assignedTechnician);
      if (tech) {
        tech.rating.total += rating;
        tech.rating.count += 1;
        tech.rating.average = +(tech.rating.total / tech.rating.count).toFixed(2);
        await tech.save();
      }
    }

    await sr.save();
    return ok(res, { serviceRequest: sr });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: list all service requests ─────────────────────────────────────────
exports.getServiceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, technicianId, search, isEscalated } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    if (priority) q.priority = priority;
    if (technicianId) q.assignedTechnician = technicianId;
    if (isEscalated === 'true') q['escalation.isEscalated'] = true;
    if (search) {
      q.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await ServiceRequest.countDocuments(q);
    const items = await ServiceRequest.find(q)
      .populate('customer', 'name email phone')
      .populate('assignedTechnician', 'name phone')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, items, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: get single request ─────────────────────────────────────────────────
exports.getServiceRequest = async (req, res) => {
  try {
    const sr = await ServiceRequest.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer', 'name email phone addresses')
      .populate('product', 'name images sku')
      .populate('assignedTechnician', 'name phone email skills rating')
      .populate('warrantyId')
      .populate('amcId')
      .populate('partsUsed.sparePartId', 'name partNumber');
    if (!sr) return notFound(res, 'Service request');
    return ok(res, { serviceRequest: sr });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: update status ──────────────────────────────────────────────────────
exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const sr = await ServiceRequest.findOne({ _id: req.params.id, isDeleted: false });
    if (!sr) return notFound(res, 'Service request');
    sr.status = status;
    pushHistory(sr, status, note || `Status updated to ${status}`, req.user._id, 'Admin');
    if (status === 'completed') sr.closedAt = new Date();
    await sr.save();
    const io = req.app.locals.io;
    if (io) io.emit('service:status_updated', { ticketNumber: sr.ticketNumber, status });

    const statusLabels = {
      verified: 'Your complaint has been verified by our team.',
      assigned: 'A technician has been assigned to your request.',
      travelling: 'Your technician is on the way.',
      reached: 'Technician has reached your location.',
      completed: 'Your service request has been completed. Please rate your experience.',
      escalated: 'Your complaint has been escalated to our senior team.',
    };
    if (statusLabels[status]) {
      notifyCustomer(
        sr.customer,
        `Ticket ${sr.ticketNumber}: ${status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}`,
        statusLabels[status],
        `/my-service/track/${sr._id}`
      );
    }

    return ok(res, { serviceRequest: sr });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: assign technician ──────────────────────────────────────────────────
exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId, scheduledAt } = req.body;
    const sr = await ServiceRequest.findOne({ _id: req.params.id, isDeleted: false });
    if (!sr) return notFound(res, 'Service request');
    const tech = await Technician.findOne({ _id: technicianId, isDeleted: false, status: 'active' });
    if (!tech) return notFound(res, 'Technician');

    sr.assignedTechnician = technicianId;
    sr.status = 'assigned';
    if (scheduledAt) sr.scheduledAt = new Date(scheduledAt);
    pushHistory(sr, 'assigned', `Assigned to ${tech.name}`, req.user._id, 'Admin');

    tech.currentWorkload = Math.min(tech.currentWorkload + 1, tech.maxWorkload);
    await tech.save();
    await sr.save();

    const io = req.app.locals.io;
    if (io) io.emit('service:technician_assigned', { ticketNumber: sr.ticketNumber, technicianId });

    notifyCustomer(
      sr.customer,
      `Technician Assigned: ${sr.ticketNumber}`,
      `${tech.name} has been assigned to your service request. Expected contact within 2 hours.`,
      `/my-service/track/${sr._id}`
    );

    return ok(res, { serviceRequest: sr });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: escalate ───────────────────────────────────────────────────────────
exports.escalateServiceRequest = async (req, res) => {
  try {
    const { reason, escalatedTo } = req.body;
    const sr = await ServiceRequest.findOne({ _id: req.params.id, isDeleted: false });
    if (!sr) return notFound(res, 'Service request');
    sr.escalation.isEscalated = true;
    sr.escalation.escalatedAt = new Date();
    sr.escalation.reason = reason;
    sr.escalation.level = (sr.escalation.level || 0) + 1;
    if (escalatedTo) sr.escalation.escalatedTo = escalatedTo;
    sr.status = 'escalated';
    sr.priority = 'urgent';
    pushHistory(sr, 'escalated', `Escalated: ${reason}`, req.user._id, 'Admin');
    await sr.save();
    const io = req.app.locals.io;
    if (io) io.emit('service:escalated', { ticketNumber: sr.ticketNumber, reason });
    return ok(res, { serviceRequest: sr });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: add admin comment ──────────────────────────────────────────────────
exports.addComment = async (req, res) => {
  try {
    const { text, isInternal } = req.body;
    const sr = await ServiceRequest.findOne({ _id: req.params.id, isDeleted: false });
    if (!sr) return notFound(res, 'Service request');
    sr.comments.push({ text, author: req.user._id, authorModel: 'Admin', authorName: req.user.name, isInternal: !!isInternal });
    await sr.save();
    return ok(res, { comments: sr.comments });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Technician: get assigned jobs ─────────────────────────────────────────────
exports.getTechnicianJobs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const q = { assignedTechnician: req.technician._id, isDeleted: false };
    if (status) q.status = status;
    const total = await ServiceRequest.countDocuments(q);
    const items = await ServiceRequest.find(q)
      .populate('customer', 'name phone')
      .populate('product', 'name')
      .sort({ scheduledAt: 1, priority: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, items, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Technician: get single job ────────────────────────────────────────────────
exports.getTechnicianJobDetail = async (req, res) => {
  try {
    const sr = await ServiceRequest.findOne({
      _id: req.params.id,
      assignedTechnician: req.technician._id,
      isDeleted: false,
    })
      .populate('customer', 'name phone email')
      .populate('product', 'name images sku')
      .populate('warrantyId', 'warrantyType endDate')
      .populate('amcId', 'contractNumber endDate')
      .populate('partsUsed.sparePartId', 'name partNumber unitPrice');
    if (!sr) return notFound(res, 'Job');
    return ok(res, { serviceRequest: sr });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Technician: update job status ─────────────────────────────────────────────
exports.updateJobStatus = async (req, res) => {
  try {
    const { status, note, diagnosis, resolution, partsUsed, laborCharge } = req.body;
    const sr = await ServiceRequest.findOne({
      _id: req.params.id,
      assignedTechnician: req.technician._id,
      isDeleted: false,
    });
    if (!sr) return notFound(res, 'Job');

    const ALLOWED = ['accepted', 'travelling', 'reached', 'diagnosis', 'repair', 'testing', 'awaiting_confirmation', 'completed'];
    if (!ALLOWED.includes(status)) return fail(res, 'Invalid status transition', 400);

    sr.status = status;
    if (diagnosis) sr.diagnosis = diagnosis;
    if (resolution) sr.resolution = resolution;
    if (partsUsed) sr.partsUsed = partsUsed;
    if (laborCharge !== undefined) sr.laborCharge = laborCharge;

    pushHistory(sr, status, note || status, req.technician._id, 'Technician');

    if (status === 'completed') {
      sr.closedAt = new Date();
      const tech = req.technician;
      tech.currentWorkload = Math.max(0, tech.currentWorkload - 1);
      await tech.save();
    }

    await sr.save();
    const io = req.app.locals.io;
    if (io) io.emit('service:status_updated', { ticketNumber: sr.ticketNumber, status, technicianId: req.technician._id });
    return ok(res, { serviceRequest: sr });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Technician: upload photos ─────────────────────────────────────────────────
exports.uploadJobPhotos = async (req, res) => {
  try {
    const { photoUrls } = req.body;
    const sr = await ServiceRequest.findOne({
      _id: req.params.id,
      assignedTechnician: req.technician._id,
      isDeleted: false,
    });
    if (!sr) return notFound(res, 'Job');
    sr.technicianPhotos.push(...(photoUrls || []));
    await sr.save();
    return ok(res, { technicianPhotos: sr.technicianPhotos });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Technician: save customer signature ──────────────────────────────────────
exports.saveCustomerSignature = async (req, res) => {
  try {
    const { signatureUrl } = req.body;
    const sr = await ServiceRequest.findOne({
      _id: req.params.id,
      assignedTechnician: req.technician._id,
      isDeleted: false,
    });
    if (!sr) return notFound(res, 'Job');
    sr.customerSignature = signatureUrl;
    sr.status = 'awaiting_confirmation';
    pushHistory(sr, 'awaiting_confirmation', 'Customer signature captured', req.technician._id, 'Technician');
    await sr.save();
    return ok(res, { serviceRequest: sr });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Customer: upload attachment to a service request ─────────────────────────
exports.uploadAttachment = async (req, res) => {
  try {
    const sr = await ServiceRequest.findOne({
      _id: req.params.id,
      customer: req.user._id,
      isDeleted: false,
    });
    if (!sr) return notFound(res, 'Service request');
    if (!req.file) return fail(res, 'No file uploaded', 400);

    const mime = req.file.mimetype || '';
    const attachment = {
      url: req.file.path,
      type: mime.startsWith('image/') ? 'image'
          : mime === 'application/pdf' ? 'document'
          : mime.startsWith('video/') ? 'video'
          : 'image',
      filename: req.file.originalname || req.file.filename,
      uploadedBy: 'customer',
    };
    sr.attachments.push(attachment);
    await sr.save();
    return ok(res, { attachment: sr.attachments[sr.attachments.length - 1] });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Technician: upload photos via Cloudinary (returns URL) ───────────────────
exports.uploadTechnicianPhoto = async (req, res) => {
  try {
    const sr = await ServiceRequest.findOne({
      _id: req.params.id,
      assignedTechnician: req.technician._id,
      isDeleted: false,
    });
    if (!sr) return notFound(res, 'Job');
    if (!req.file) return fail(res, 'No file uploaded', 400);

    const url = req.file.path;
    sr.technicianPhotos.push(url);
    await sr.save();
    return ok(res, { url, technicianPhotos: sr.technicianPhotos });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: dashboard counts ───────────────────────────────────────────────────
exports.getServiceDashboard = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const thirtyDaysLater = new Date(Date.now() + 30 * 86400000);

    const [
      total, open, inProgress, completed, escalated, urgent,
      raisedToday, closedToday, slaBreached, underWarranty, underAMC, cancelled,
      amcRenewalDue,
    ] = await Promise.all([
      ServiceRequest.countDocuments({ isDeleted: false }),
      ServiceRequest.countDocuments({ isDeleted: false, status: 'open' }),
      ServiceRequest.countDocuments({ isDeleted: false, status: { $in: ['assigned','accepted','travelling','reached','diagnosis','repair','testing'] } }),
      ServiceRequest.countDocuments({ isDeleted: false, status: { $in: ['completed','closed'] } }),
      ServiceRequest.countDocuments({ isDeleted: false, 'escalation.isEscalated': true }),
      ServiceRequest.countDocuments({ isDeleted: false, priority: 'urgent', status: { $nin: ['completed','closed','cancelled'] } }),
      ServiceRequest.countDocuments({ isDeleted: false, createdAt: { $gte: todayStart } }),
      ServiceRequest.countDocuments({ isDeleted: false, closedAt: { $gte: todayStart } }),
      ServiceRequest.countDocuments({ isDeleted: false, 'sla.isBreached': true, status: { $nin: ['completed','closed','cancelled'] } }),
      ServiceRequest.countDocuments({ isDeleted: false, isUnderWarranty: true, status: { $nin: ['completed','closed','cancelled'] } }),
      ServiceRequest.countDocuments({ isDeleted: false, isUnderAMC: true, status: { $nin: ['completed','closed','cancelled'] } }),
      ServiceRequest.countDocuments({ isDeleted: false, status: 'cancelled' }),
      AMCContract.countDocuments({ isDeleted: false, status: { $in: ['active','renewal_due'] }, endDate: { $lte: thirtyDaysLater } }),
    ]);

    return ok(res, {
      total, open, inProgress, completed, escalated, urgent,
      raisedToday, closedToday, slaBreached, underWarranty, underAMC, cancelled,
      amcRenewalDue,
    });
  } catch (err) {
    return serverError(res, err);
  }
};
