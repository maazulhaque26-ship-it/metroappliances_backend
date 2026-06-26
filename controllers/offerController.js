'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const OfferLetter      = () => mongoose.model('OfferLetter');
const OfferApproval    = () => mongoose.model('OfferApproval');
const OfferAcceptance  = () => mongoose.model('OfferAcceptance');
const JobApplication   = () => mongoose.model('JobApplication');

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

exports.getOffers = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { status, job, candidate } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (job)       filter.job       = job;
    if (candidate) filter.candidate = candidate;

    const [data, total] = await Promise.all([
      OfferLetter().find(filter)
        .populate('application', 'status')
        .populate('candidate',   'firstName lastName email')
        .populate('job',         'title department')
        .populate('generatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OfferLetter().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Get Single ────────────────────────────────────────────────────────────────

exports.getOffer = async (req, res) => {
  try {
    const offer = await OfferLetter().findOne({ _id: req.params.id, isDeleted: false })
      .populate('application', 'status currentStage')
      .populate('candidate',   'firstName lastName email phone')
      .populate('job',         'title department designation')
      .populate('generatedBy', 'name email')
      .populate('approvedBy',  'name email')
      .lean();
    if (!offer) return notFound(res, 'OfferLetter');
    return ok(res, offer);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Create ────────────────────────────────────────────────────────────────────

exports.createOffer = async (req, res) => {
  try {
    const offer = await OfferLetter().create({
      ...req.body,
      status:      'draft',
      generatedBy: req.user._id,
    });

    // Create approval records if offerApprovalLevels > 0
    const approvalLevels = Number(req.body.offerApprovalLevels) || 0;
    if (approvalLevels > 0) {
      const approvalDocs = [];
      for (let level = 1; level <= approvalLevels; level++) {
        approvalDocs.push({
          offer:    offer._id,
          level,
          status:   'pending',
          sequence: level,
        });
      }
      await OfferApproval().insertMany(approvalDocs);
    }

    const io = req.app.locals.io;
    if (io) io.emit('hr:offer_generated', { offerId: offer._id, candidateId: offer.candidate, jobId: offer.job });

    _audit(req, 'OFFER_CREATED', 'OfferLetter', offer._id, `Offer #${offer._id}`, null, offer.toObject());
    return created(res, offer, 'Offer created');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Update ────────────────────────────────────────────────────────────────────

exports.updateOffer = async (req, res) => {
  try {
    const offer = await OfferLetter().findOne({ _id: req.params.id, isDeleted: false });
    if (!offer) return notFound(res, 'OfferLetter');
    if (offer.status !== 'draft') return fail(res, 'Only draft offers can be updated');
    const before = offer.toObject();

    Object.assign(offer, req.body);
    await offer.save();

    _audit(req, 'OFFER_UPDATED', 'OfferLetter', offer._id, `Offer #${offer._id}`, before, offer.toObject());
    return ok(res, offer, 'Offer updated');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Send ──────────────────────────────────────────────────────────────────────

exports.sendOffer = async (req, res) => {
  try {
    const offer = await OfferLetter().findOne({ _id: req.params.id, isDeleted: false });
    if (!offer) return notFound(res, 'OfferLetter');
    const before = offer.toObject();

    const approvalLevels = Number(offer.offerApprovalLevels) || 0;
    if (approvalLevels > 0 && offer.status !== 'approved') {
      return fail(res, 'Offer must be approved before sending');
    }

    offer.status = 'sent';
    offer.sentAt = new Date();
    await offer.save();

    _audit(req, 'OFFER_SENT', 'OfferLetter', offer._id, `Offer #${offer._id}`, before, offer.toObject());
    return ok(res, offer, 'Offer sent to candidate');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Approve ───────────────────────────────────────────────────────────────────

exports.approveOffer = async (req, res) => {
  try {
    const offer = await OfferLetter().findOne({ _id: req.params.id, isDeleted: false });
    if (!offer) return notFound(res, 'OfferLetter');
    const before = offer.toObject();

    const { level, decision, comments } = req.body;
    if (!level || !decision) return fail(res, 'level and decision are required');

    // Update the approval record for this level
    await OfferApproval().findOneAndUpdate(
      { offer: offer._id, level: Number(level) },
      {
        decision,
        comments:   comments || '',
        decidedBy:  req.user._id,
        decidedAt:  new Date(),
        status:     decision,
      },
      { new: true }
    );

    // If rejected at any level, mark offer as rejected
    if (decision === 'rejected') {
      offer.status = 'rejected';
      await offer.save();
      _audit(req, 'OFFER_APPROVAL_REJECTED', 'OfferLetter', offer._id, `Offer #${offer._id}`, before, offer.toObject());
      return ok(res, offer, 'Offer rejected at approval level');
    }

    // Check if all levels are approved
    const approvalLevels = Number(offer.offerApprovalLevels) || 0;
    const approvedCount  = await OfferApproval().countDocuments({ offer: offer._id, status: 'approved' });

    if (approvedCount >= approvalLevels) {
      offer.status     = 'approved';
      offer.approvedBy = req.user._id;
      offer.approvedAt = new Date();
      await offer.save();
    }

    _audit(req, 'OFFER_APPROVED', 'OfferLetter', offer._id, `Offer level ${level} approved`, before, offer.toObject());
    return ok(res, offer, `Approval level ${level} processed`);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Reject / Withdraw ─────────────────────────────────────────────────────────

exports.rejectOffer = async (req, res) => {
  try {
    const offer = await OfferLetter().findOne({ _id: req.params.id, isDeleted: false });
    if (!offer) return notFound(res, 'OfferLetter');
    const before = offer.toObject();

    offer.status = 'withdrawn';
    await offer.save();

    _audit(req, 'OFFER_WITHDRAWN', 'OfferLetter', offer._id, `Offer #${offer._id}`, before, offer.toObject());
    return ok(res, offer, 'Offer withdrawn');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Record Acceptance ─────────────────────────────────────────────────────────

exports.recordAcceptance = async (req, res) => {
  try {
    const offer = await OfferLetter().findOne({ _id: req.params.id, isDeleted: false });
    if (!offer) return notFound(res, 'OfferLetter');

    const { decision, joiningDate, counterCTC, reason } = req.body;
    if (!decision) return fail(res, 'decision is required');

    const acceptance = await OfferAcceptance().create({
      offer:        offer._id,
      application:  offer.application,
      candidate:    offer.candidate,
      decision,
      joiningDate:  joiningDate ? new Date(joiningDate) : null,
      counterCTC:   counterCTC || null,
      reason:       reason     || '',
      recordedBy:   req.user._id,
      acceptedAt:   decision === 'accepted' ? new Date() : null,
    });

    // Update offer and application status
    if (decision === 'accepted') {
      offer.status     = 'accepted';
      offer.offeredAt  = new Date();
      await offer.save();

      if (offer.application) {
        await JobApplication().findOneAndUpdate(
          { _id: offer.application, isDeleted: false },
          {
            status:  'hired',
            hiredAt: new Date(),
            $push:   { stageHistory: { stage: 'Hired', status: 'hired', movedBy: req.user._id, movedAt: new Date() } },
          }
        );
      }

      const io = req.app.locals.io;
      if (io) io.emit('hr:candidate_hired', { offerId: offer._id, candidateId: offer.candidate, joiningDate });
    }

    _audit(req, `OFFER_${decision.toUpperCase()}`, 'OfferAcceptance', acceptance._id, `Offer #${offer._id}`, null, acceptance.toObject());
    return created(res, acceptance, `Offer ${decision}`);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Get Acceptance ────────────────────────────────────────────────────────────

exports.getAcceptance = async (req, res) => {
  try {
    const acceptance = await OfferAcceptance().findOne({ offer: req.params.offerId }).lean();
    if (!acceptance) return notFound(res, 'OfferAcceptance');
    return ok(res, acceptance);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Get Approvals ─────────────────────────────────────────────────────────────

exports.getApprovals = async (req, res) => {
  try {
    const approvals = await OfferApproval().find({ offer: req.params.offerId })
      .populate('decidedBy', 'name email')
      .sort({ level: 1 })
      .lean();
    return ok(res, approvals);
  } catch (err) {
    return serverError(res, err);
  }
};
