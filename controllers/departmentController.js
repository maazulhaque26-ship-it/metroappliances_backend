'use strict';
const Department  = require('../models/Department');
const Designation = require('../models/Designation');
const BusinessUnit= require('../models/BusinessUnit');
const Location    = require('../models/Location');
const HRSetting   = require('../models/HRSetting');
const { ok, created, noContent, paginated, notFound, serverError } = require('../utils/response');

// ── Departments ───────────────────────────────────────────────────────────────
exports.getDepartments = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, isActive } = req.query;
    const filter = { isDeleted: false };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Department.find(filter)
        .populate('businessUnit', 'name buCode')
        .populate('manager', 'displayName employeeCode')
        .populate('parentDept', 'name')
        .sort({ name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Department.countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getDepartment = async (req, res) => {
  try {
    const doc = await Department.findOne({ _id: req.params.id, isDeleted: false })
      .populate('businessUnit', 'name buCode')
      .populate('manager', 'displayName employeeCode')
      .populate('parentDept', 'name deptCode');
    if (!doc) return notFound(res, 'Department');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createDepartment = async (req, res) => {
  try {
    const doc = await Department.create(req.body);
    return created(res, doc, 'Department created');
  } catch (err) { return serverError(res, err); }
};

exports.updateDepartment = async (req, res) => {
  try {
    const doc = await Department.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true },
    );
    if (!doc) return notFound(res, 'Department');
    return ok(res, doc, 'Department updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const doc = await Department.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true },
    );
    if (!doc) return notFound(res, 'Department');
    return noContent(res, 'Department deleted');
  } catch (err) { return serverError(res, err); }
};

// ── Designations ──────────────────────────────────────────────────────────────
exports.getDesignations = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, department } = req.query;
    const filter = { isDeleted: false };
    if (department) filter.department = department;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Designation.find(filter)
        .populate('department', 'name deptCode')
        .sort({ level: 1, title: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Designation.countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getDesignation = async (req, res) => {
  try {
    const doc = await Designation.findOne({ _id: req.params.id, isDeleted: false }).populate('department', 'name');
    if (!doc) return notFound(res, 'Designation');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createDesignation = async (req, res) => {
  try {
    const doc = await Designation.create(req.body);
    return created(res, doc, 'Designation created');
  } catch (err) { return serverError(res, err); }
};

exports.updateDesignation = async (req, res) => {
  try {
    const doc = await Designation.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true },
    );
    if (!doc) return notFound(res, 'Designation');
    return ok(res, doc, 'Designation updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteDesignation = async (req, res) => {
  try {
    const doc = await Designation.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true, isActive: false }, { new: true });
    if (!doc) return notFound(res, 'Designation');
    return noContent(res, 'Designation deleted');
  } catch (err) { return serverError(res, err); }
};

// ── Business Units ────────────────────────────────────────────────────────────
exports.getBusinessUnits = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    const data = await BusinessUnit.find(filter)
      .populate('head', 'displayName employeeCode')
      .sort({ name: 1 });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.createBusinessUnit = async (req, res) => {
  try {
    const doc = await BusinessUnit.create(req.body);
    return created(res, doc, 'Business unit created');
  } catch (err) { return serverError(res, err); }
};

exports.updateBusinessUnit = async (req, res) => {
  try {
    const doc = await BusinessUnit.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'BusinessUnit');
    return ok(res, doc, 'Business unit updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteBusinessUnit = async (req, res) => {
  try {
    const doc = await BusinessUnit.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true, isActive: false }, { new: true });
    if (!doc) return notFound(res, 'BusinessUnit');
    return noContent(res, 'Business unit deleted');
  } catch (err) { return serverError(res, err); }
};

// ── Locations ─────────────────────────────────────────────────────────────────
exports.getLocations = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    const data = await Location.find(filter)
      .populate('manager', 'displayName employeeCode')
      .sort({ name: 1 });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.createLocation = async (req, res) => {
  try {
    const doc = await Location.create(req.body);
    return created(res, doc, 'Location created');
  } catch (err) { return serverError(res, err); }
};

exports.updateLocation = async (req, res) => {
  try {
    const doc = await Location.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return notFound(res, 'Location');
    return ok(res, doc, 'Location updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteLocation = async (req, res) => {
  try {
    const doc = await Location.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!doc) return notFound(res, 'Location');
    return noContent(res, 'Location deleted');
  } catch (err) { return serverError(res, err); }
};

// ── HR Settings ───────────────────────────────────────────────────────────────
exports.getSettings = async (req, res) => {
  try {
    const data = await HRSetting.find({ isActive: true });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.upsertSetting = async (req, res) => {
  try {
    const { key, value, category, description } = req.body;
    const doc = await HRSetting.findOneAndUpdate(
      { key },
      { value, category, description, isActive: true },
      { new: true, upsert: true, runValidators: true },
    );
    return ok(res, doc, 'Setting saved');
  } catch (err) { return serverError(res, err); }
};
