'use strict';
const jwt  = require('jsonwebtoken');
const InstallationEngineer = require('../models/InstallationEngineer');
const InstallationRequest  = require('../models/InstallationRequest');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

exports.createEngineer = async (req, res) => {
  try {
    const engineer = await InstallationEngineer.create(req.body);
    const { password: _, ...eng } = engineer.toObject();
    return created(res, eng);
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Email or Employee ID already exists', 409);
    return serverError(res, err);
  }
};

exports.getEngineers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, skill, city, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (skill) filter.skills = { $in: [new RegExp(skill, 'i')] };
    if (city) filter['territory.cities'] = { $in: [new RegExp(city, 'i')] };
    if (search) filter.$or = [
      { name:       { $regex: search, $options: 'i' } },
      { email:      { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
    ];

    const total     = await InstallationEngineer.countDocuments(filter);
    const engineers = await InstallationEngineer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return paginated(res, engineers, total, Number(page), Number(limit));
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getEngineer = async (req, res) => {
  try {
    const engineer = await InstallationEngineer.findOne({ _id: req.params.id, isDeleted: false });
    if (!engineer) return notFound(res, 'Engineer');
    return ok(res, engineer);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateEngineer = async (req, res) => {
  try {
    const engineer = await InstallationEngineer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!engineer) return notFound(res, 'Engineer');
    return ok(res, engineer);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteEngineer = async (req, res) => {
  try {
    const engineer = await InstallationEngineer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, status: 'inactive' },
      { new: true }
    );
    if (!engineer) return notFound(res, 'Engineer');
    return ok(res, { message: 'Engineer deleted' });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.resetEngineerPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return fail(res, 'Password must be at least 6 characters', 400);
    const engineer = await InstallationEngineer.findOne({ _id: req.params.id, isDeleted: false }).select('+password');
    if (!engineer) return notFound(res, 'Engineer');
    engineer.password = password;
    await engineer.save();
    return ok(res, { message: 'Password reset successful' });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.generateEngineerToken = async (req, res) => {
  try {
    const engineer = await InstallationEngineer.findOne({ _id: req.params.id, isDeleted: false });
    if (!engineer) return notFound(res, 'Engineer');
    const token = jwt.sign(
      { id: engineer._id, type: 'engineer' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return ok(res, { token, engineerName: engineer.name });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getEngineerStats = async (req, res) => {
  try {
    const [total, active, available, onLeave] = await Promise.all([
      InstallationEngineer.countDocuments({ isDeleted: false }),
      InstallationEngineer.countDocuments({ isDeleted: false, status: 'active' }),
      InstallationEngineer.countDocuments({ isDeleted: false, status: 'active', isAvailable: true }),
      InstallationEngineer.countDocuments({ isDeleted: false, status: 'on_leave' }),
    ]);
    return ok(res, { total, active, available, onLeave });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getEngineerWorkload = async (req, res) => {
  try {
    const engineer = await InstallationEngineer.findOne({ _id: req.params.id, isDeleted: false });
    if (!engineer) return notFound(res, 'Engineer');
    const [activeJobs, completedJobs] = await Promise.all([
      InstallationRequest.countDocuments({ assignedEngineer: engineer._id, isDeleted: false, status: { $in: ['assigned', 'travelling', 'arrived', 'in_progress', 'demo_in_progress'] } }),
      InstallationRequest.countDocuments({ assignedEngineer: engineer._id, isDeleted: false, status: 'completed' }),
    ]);
    return ok(res, { engineer: engineer.name, currentWorkload: engineer.currentWorkload, maxWorkload: engineer.maxWorkload, activeJobs, completedJobs, totalInstallations: engineer.totalInstallations, rating: engineer.rating });
  } catch (err) {
    return serverError(res, err);
  }
};
