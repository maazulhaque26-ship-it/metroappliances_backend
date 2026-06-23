const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const Technician = require('../models/Technician');
const ServiceRequest = require('../models/ServiceRequest');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const signToken = (id) =>
  jwt.sign({ id, type: 'technician' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

// ── Admin: create technician ──────────────────────────────────────────────────
exports.createTechnician = async (req, res) => {
  try {
    const { employeeId, name, email, phone, password, skills, territory, certifications, workingHours } = req.body;
    const exists = await Technician.findOne({ $or: [{ email: email?.toLowerCase() }, { employeeId }] });
    if (exists) return fail(res, 'Technician with this email or employee ID already exists', 409);

    const technician = await Technician.create({
      employeeId, name, email, phone, password,
      skills: skills || [],
      territory: territory || {},
      certifications: certifications || [],
      workingHours: workingHours || [],
    });

    const safe = technician.toObject();
    delete safe.password;
    return created(res, { technician: safe });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: list technicians ───────────────────────────────────────────────────
exports.getTechnicians = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, skill, city, search, isAvailable } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    if (skill) q.skills = skill;
    if (city) q['territory.cities'] = { $regex: city, $options: 'i' };
    if (isAvailable !== undefined) q['availability.isAvailable'] = isAvailable === 'true';
    if (search) {
      q.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Technician.countDocuments(q);
    const technicians = await Technician.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return paginated(res, technicians, { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: get single technician ──────────────────────────────────────────────
exports.getTechnician = async (req, res) => {
  try {
    const technician = await Technician.findOne({ _id: req.params.id, isDeleted: false });
    if (!technician) return notFound(res, 'Technician');
    return ok(res, { technician });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: update technician ──────────────────────────────────────────────────
exports.updateTechnician = async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    const technician = await Technician.findOne({ _id: req.params.id, isDeleted: false });
    if (!technician) return notFound(res, 'Technician');

    Object.assign(technician, updates);
    if (password) {
      const salt = await bcrypt.genSalt(10);
      technician.password = await bcrypt.hash(password, salt);
    }
    await technician.save();
    const safe = technician.toObject();
    delete safe.password;
    return ok(res, { technician: safe });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: delete (soft) ──────────────────────────────────────────────────────
exports.deleteTechnician = async (req, res) => {
  try {
    const technician = await Technician.findOne({ _id: req.params.id, isDeleted: false });
    if (!technician) return notFound(res, 'Technician');
    technician.isDeleted = true;
    technician.status = 'inactive';
    await technician.save();
    return ok(res, { message: 'Technician deleted' });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: reset password ─────────────────────────────────────────────────────
exports.resetTechnicianPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return fail(res, 'New password required', 400);
    const technician = await Technician.findOne({ _id: req.params.id, isDeleted: false });
    if (!technician) return notFound(res, 'Technician');
    technician.password = password;
    await technician.save();
    return ok(res, { message: 'Password reset successfully' });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: generate login token for technician ────────────────────────────────
exports.generateTechnicianToken = async (req, res) => {
  try {
    const technician = await Technician.findOne({ _id: req.params.id, isDeleted: false });
    if (!technician) return notFound(res, 'Technician');
    const token = signToken(technician._id);
    return ok(res, { token });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: get technician workload ────────────────────────────────────────────
exports.getTechnicianWorkload = async (req, res) => {
  try {
    const { id } = req.params;
    const technician = await Technician.findOne({ _id: id, isDeleted: false });
    if (!technician) return notFound(res, 'Technician');

    const activeJobs = await ServiceRequest.countDocuments({
      assignedTechnician: id,
      status: { $in: ['assigned', 'accepted', 'travelling', 'reached', 'diagnosis', 'repair', 'testing', 'awaiting_confirmation'] },
    });
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const completedToday = await ServiceRequest.countDocuments({
      assignedTechnician: id,
      status: 'completed',
      closedAt: { $gte: todayStart },
    });

    return ok(res, {
      technicianId: id,
      name: technician.name,
      currentWorkload: technician.currentWorkload,
      maxWorkload: technician.maxWorkload,
      activeJobs,
      completedToday,
      isAvailable: technician.availability.isAvailable,
      rating: technician.rating,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: get technician stats ───────────────────────────────────────────────
exports.getTechnicianStats = async (req, res) => {
  try {
    const total = await Technician.countDocuments({ isDeleted: false });
    const active = await Technician.countDocuments({ isDeleted: false, status: 'active' });
    const available = await Technician.countDocuments({
      isDeleted: false, status: 'active', 'availability.isAvailable': true,
    });
    return ok(res, { total, active, inactive: total - active, available });
  } catch (err) {
    return serverError(res, err);
  }
};
