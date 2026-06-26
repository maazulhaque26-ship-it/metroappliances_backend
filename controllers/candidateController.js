'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const Candidate          = () => mongoose.model('Candidate');
const CandidateDocument  = () => mongoose.model('CandidateDocument');
const JobApplication     = () => mongoose.model('JobApplication');
const Employee           = () => mongoose.model('Employee');
const RecruitmentAgency  = () => mongoose.model('RecruitmentAgency');
const CandidateSource    = () => mongoose.model('CandidateSource');
const OfferAcceptance    = () => mongoose.model('OfferAcceptance');

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

// ── List Candidates ───────────────────────────────────────────────────────────

exports.getCandidates = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { status, source, talentPools, search } = req.query;
    const filter = { isDeleted: false };

    if (status)     filter.status = status;
    if (source)     filter.source = source;
    if (talentPools) filter.talentPools = talentPools;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
        { phone:     { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Candidate().find(filter)
        .populate('referredBy', 'name email')
        .populate('agency',     'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Candidate().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Get Single ────────────────────────────────────────────────────────────────

exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate().findOne({ _id: req.params.id, isDeleted: false })
      .populate('referredBy',        'name email')
      .populate('agency',            'name contactPerson')
      .populate('convertedEmployee', 'employeeCode displayName department')
      .lean();
    if (!candidate) return notFound(res, 'Candidate');
    return ok(res, candidate);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Create ────────────────────────────────────────────────────────────────────

exports.createCandidate = async (req, res) => {
  try {
    const candidate = await Candidate().create(req.body);
    _audit(req, 'CANDIDATE_CREATED', 'Candidate', candidate._id, `${candidate.firstName} ${candidate.lastName}`, null, candidate.toObject());
    return created(res, candidate, 'Candidate created');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Update ────────────────────────────────────────────────────────────────────

exports.updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate().findOne({ _id: req.params.id, isDeleted: false });
    if (!candidate) return notFound(res, 'Candidate');
    const before = candidate.toObject();

    Object.assign(candidate, req.body);
    await candidate.save();

    _audit(req, 'CANDIDATE_UPDATED', 'Candidate', candidate._id, `${candidate.firstName} ${candidate.lastName}`, before, candidate.toObject());
    return ok(res, candidate, 'Candidate updated');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Soft Delete ───────────────────────────────────────────────────────────────

exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate().findOne({ _id: req.params.id, isDeleted: false });
    if (!candidate) return notFound(res, 'Candidate');
    const before = candidate.toObject();
    candidate.isDeleted = true;
    await candidate.save();
    _audit(req, 'CANDIDATE_DELETED', 'Candidate', candidate._id, `${candidate.firstName} ${candidate.lastName}`, before, null);
    return ok(res, null, 'Candidate deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Candidate Applications ────────────────────────────────────────────────────

exports.getCandidateApplications = async (req, res) => {
  try {
    const candidate = await Candidate().findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!candidate) return notFound(res, 'Candidate');

    const apps = await JobApplication().find({ candidate: req.params.id, isDeleted: false })
      .populate('job', 'title department status jobType')
      .sort({ appliedAt: -1 })
      .lean();

    return ok(res, apps);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Candidate Documents ───────────────────────────────────────────────────────

exports.getCandidateDocuments = async (req, res) => {
  try {
    const docs = await CandidateDocument().find({ candidate: req.params.id, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    return ok(res, docs);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.addDocument = async (req, res) => {
  try {
    const candidate = await Candidate().findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!candidate) return notFound(res, 'Candidate');

    const { docType, fileName, fileUrl } = req.body;
    if (!docType || !fileUrl) return fail(res, 'docType and fileUrl are required');

    const doc = await CandidateDocument().create({
      candidate: req.params.id,
      docType, fileName, fileUrl,
      uploadedBy: req.user._id,
    });

    _audit(req, 'CANDIDATE_DOCUMENT_ADDED', 'CandidateDocument', doc._id, fileName || docType, null, doc.toObject());
    return created(res, doc, 'Document added');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Talent Pool ───────────────────────────────────────────────────────────────

exports.addToTalentPool = async (req, res) => {
  try {
    const { tag } = req.body;
    if (!tag) return fail(res, 'tag is required');

    const candidate = await Candidate().findOne({ _id: req.params.id, isDeleted: false });
    if (!candidate) return notFound(res, 'Candidate');
    const before = candidate.toObject();

    if (!candidate.talentPools) candidate.talentPools = [];
    if (!candidate.talentPools.includes(tag)) candidate.talentPools.push(tag);
    await candidate.save();

    _audit(req, 'CANDIDATE_TALENT_POOL_ADDED', 'Candidate', candidate._id, `${candidate.firstName} ${candidate.lastName}`, before, candidate.toObject());
    return ok(res, candidate, 'Added to talent pool');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getTalentPool = async (req, res) => {
  try {
    const filter = { isDeleted: false, talentPools: { $exists: true, $ne: [] } };
    if (req.query.tag) filter.talentPools = req.query.tag;

    const candidates = await Candidate().find(filter)
      .select('firstName lastName email phone skills talentPools source status')
      .sort({ createdAt: -1 })
      .lean();

    return ok(res, candidates);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Convert to Employee ───────────────────────────────────────────────────────

exports.convertToEmployee = async (req, res) => {
  try {
    const candidate = await Candidate().findOne({ _id: req.params.id, isDeleted: false });
    if (!candidate) return notFound(res, 'Candidate');
    if (candidate.status === 'hired') return fail(res, 'Candidate is already hired and converted');

    // Get the most recent hired/offered application to determine department+designation
    const app = await JobApplication().findOne({
      candidate: candidate._id,
      status: { $in: ['hired', 'offered'] },
      isDeleted: false,
    })
      .populate('job', 'department designation title')
      .sort({ updatedAt: -1 })
      .lean();

    // Get offer acceptance for joining date
    let joiningDate = req.body.joiningDate ? new Date(req.body.joiningDate) : new Date();
    if (app) {
      const acceptance = await OfferAcceptance().findOne({ application: app._id }).lean();
      if (acceptance && acceptance.joiningDate) joiningDate = acceptance.joiningDate;
    }

    const employeeData = {
      firstName:   candidate.firstName,
      lastName:    candidate.lastName,
      email:       candidate.email,
      mobile:      candidate.phone || '0000000000',
      department:  app ? app.job.department  : req.body.department,
      designation: app ? app.job.designation : req.body.designation,
      joiningDate,
      status:      'active',
      source:      'recruitment',
    };

    const employee = await Employee().create(employeeData);

    candidate.status             = 'hired';
    candidate.convertedEmployee  = employee._id;
    await candidate.save();

    const io = req.app.locals.io;
    if (io) io.emit('hr:candidate_hired', { candidateId: candidate._id, employeeId: employee._id });

    _audit(req, 'CANDIDATE_CONVERTED_TO_EMPLOYEE', 'Candidate', candidate._id,
      `${candidate.firstName} ${candidate.lastName}`, { status: 'offered' }, { status: 'hired', employeeId: employee._id });
    return created(res, employee, 'Candidate converted to employee');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Agencies ──────────────────────────────────────────────────────────────────

exports.getAgencies = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

    const [data, total] = await Promise.all([
      RecruitmentAgency().find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      RecruitmentAgency().countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createAgency = async (req, res) => {
  try {
    const agency = await RecruitmentAgency().create(req.body);
    _audit(req, 'AGENCY_CREATED', 'RecruitmentAgency', agency._id, agency.name, null, agency.toObject());
    return created(res, agency, 'Agency created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateAgency = async (req, res) => {
  try {
    const agency = await RecruitmentAgency().findOne({ _id: req.params.id, isDeleted: false });
    if (!agency) return notFound(res, 'RecruitmentAgency');
    const before = agency.toObject();
    Object.assign(agency, req.body);
    await agency.save();
    _audit(req, 'AGENCY_UPDATED', 'RecruitmentAgency', agency._id, agency.name, before, agency.toObject());
    return ok(res, agency, 'Agency updated');
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Candidate Sources ─────────────────────────────────────────────────────────

exports.getSources = async (req, res) => {
  try {
    const sources = await CandidateSource().find({ isDeleted: false }).sort({ name: 1 }).lean();
    return ok(res, sources);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createSource = async (req, res) => {
  try {
    const source = await CandidateSource().create(req.body);
    return created(res, source, 'Source created');
  } catch (err) {
    return serverError(res, err);
  }
};
