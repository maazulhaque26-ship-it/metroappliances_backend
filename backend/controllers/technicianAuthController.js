const jwt        = require('jsonwebtoken');
const Technician = require('../models/Technician');
const { ok, fail, serverError } = require('../utils/response');

const signToken = (id) =>
  jwt.sign({ id, type: 'technician' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

exports.loginTechnician = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email and password required', 400);

    const technician = await Technician.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+password');
    if (!technician) return fail(res, 'Invalid credentials', 401);
    if (technician.status !== 'active') return fail(res, 'Account is not active', 401);

    const match = await technician.matchPassword(password);
    if (!match) return fail(res, 'Invalid credentials', 401);

    const token = signToken(technician._id);
    const safe = technician.toObject();
    delete safe.password;

    return ok(res, { token, technician: safe });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getTechnicianProfile = async (req, res) => {
  try {
    return ok(res, { technician: req.technician });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateTechnicianProfile = async (req, res) => {
  try {
    const { name, phone, avatar, gpsLocation } = req.body;
    const tech = req.technician;
    if (name) tech.name = name;
    if (phone) tech.phone = phone;
    if (avatar) tech.avatar = avatar;
    if (gpsLocation?.coordinates) {
      tech.gpsLocation.coordinates = gpsLocation.coordinates;
      tech.gpsLocation.updatedAt = new Date();
    }
    await tech.save();
    return ok(res, { technician: tech });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable, reason, nextAvailableAt } = req.body;
    const tech = req.technician;
    tech.availability.isAvailable = isAvailable;
    if (reason) tech.availability.reason = reason;
    if (nextAvailableAt) tech.availability.nextAvailableAt = nextAvailableAt;
    await tech.save();
    return ok(res, { availability: tech.availability });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return fail(res, 'coordinates must be [longitude, latitude]', 400);
    }
    const tech = req.technician;
    tech.gpsLocation.coordinates = coordinates;
    tech.gpsLocation.updatedAt = new Date();
    await tech.save();

    const io = req.app.locals.io;
    if (io) io.emit('technician:location', { technicianId: tech._id, coordinates });

    return ok(res, { gpsLocation: tech.gpsLocation });
  } catch (err) {
    return serverError(res, err);
  }
};
