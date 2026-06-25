'use strict';
const jwt  = require('jsonwebtoken');
const InstallationEngineer = require('../models/InstallationEngineer');
const { ok, fail, serverError } = require('../utils/response');

const signToken = (id) =>
  jwt.sign({ id, type: 'engineer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

exports.loginEngineer = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email and password are required', 400);

    const engineer = await InstallationEngineer.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+password');
    if (!engineer) return fail(res, 'Invalid credentials', 401);
    if (engineer.status !== 'active') return fail(res, 'Account is not active. Contact admin.', 401);

    const match = await engineer.matchPassword(password);
    if (!match) return fail(res, 'Invalid credentials', 401);

    const token = signToken(engineer._id);
    const { password: _, ...eng } = engineer.toObject();
    return ok(res, { token, engineer: eng });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getEngineerProfile = async (req, res) => {
  try {
    return ok(res, req.engineer);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateEngineerProfile = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'avatar', 'gpsLocation'];
    const update  = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const engineer = await InstallationEngineer.findByIdAndUpdate(
      req.engineer._id, update, { new: true, runValidators: true }
    );
    return ok(res, engineer);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const engineer = await InstallationEngineer.findByIdAndUpdate(
      req.engineer._id,
      { isAvailable: req.body.isAvailable },
      { new: true }
    );
    return ok(res, { isAvailable: engineer.isAvailable });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const engineer = await InstallationEngineer.findByIdAndUpdate(
      req.engineer._id,
      { gpsLocation: { lat, lng } },
      { new: true }
    );
    return ok(res, { gpsLocation: engineer.gpsLocation });
  } catch (err) {
    return serverError(res, err);
  }
};
