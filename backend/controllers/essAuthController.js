'use strict';
const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { ok, fail, notFound, serverError } = require('../utils/response');

const EmployeeUser = () => mongoose.model('EmployeeUser');
const Employee     = () => mongoose.model('Employee');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email and password are required');

    const user = await EmployeeUser().findOne({ email: email.toLowerCase(), isDeleted: false })
      .select('+passwordHash');
    if (!user) return fail(res, 'Invalid email or password', 401);
    if (!user.isActive) return fail(res, 'Account is deactivated', 401);

    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) return fail(res, 'Invalid email or password', 401);

    const employee = await Employee().findById(user.employee)
      .populate('department', 'name')
      .populate('designation', 'name')
      .lean();

    user.lastLogin = new Date();
    user.loginAttempts = 0;
    await user.save();

    const token = jwt.sign(
      { id: user._id, type: 'employee', employeeId: user.employee },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const userData = user.toObject();
    delete userData.passwordHash;

    return ok(res, { token, user: userData, employee }, 'Login successful');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.logout = async (req, res) => {
  return ok(res, null, 'Logged out successfully');
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return fail(res, 'oldPassword and newPassword are required');
    if (newPassword.length < 8) return fail(res, 'New password must be at least 8 characters');

    const user = await EmployeeUser().findOne({ _id: req.employeeUser._id, isDeleted: false })
      .select('+passwordHash');
    if (!user) return notFound(res, 'Employee user');

    const match = await bcrypt.compare(oldPassword, user.passwordHash || '');
    if (!match) return fail(res, 'Current password is incorrect', 401);

    user.passwordHash      = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await user.save();

    return ok(res, null, 'Password changed successfully');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const employee = await Employee().findById(req.employee._id)
      .populate('department', 'name')
      .populate('designation', 'name')
      .populate('reportingManager', 'firstName lastName employeeCode')
      .lean();

    const userData = req.employeeUser.toObject ? req.employeeUser.toObject() : { ...req.employeeUser };
    delete userData.passwordHash;

    return ok(res, { user: userData, employee });
  } catch (err) {
    return serverError(res, err);
  }
};
