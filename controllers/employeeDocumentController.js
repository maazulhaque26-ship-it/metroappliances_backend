'use strict';
const EmployeeDocument = require('../models/EmployeeDocument');
const { ok, created, noContent, paginated, notFound, serverError } = require('../utils/response');

exports.getDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 20, employee, docType, isVerified } = req.query;
    const filter = { isDeleted: false };
    if (employee)   filter.employee  = employee;
    if (docType)    filter.docType   = docType;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      EmployeeDocument.find(filter)
        .populate('employee', 'displayName employeeCode')
        .populate('verifiedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      EmployeeDocument.countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getDocument = async (req, res) => {
  try {
    const doc = await EmployeeDocument.findOne({ _id: req.params.id, isDeleted: false })
      .populate('employee', 'displayName employeeCode')
      .populate('verifiedBy', 'name');
    if (!doc) return notFound(res, 'Document');
    return ok(res, doc);
  } catch (err) { return serverError(res, err); }
};

exports.createDocument = async (req, res) => {
  try {
    const doc = await EmployeeDocument.create(req.body);
    return created(res, doc, 'Document added');
  } catch (err) { return serverError(res, err); }
};

exports.updateDocument = async (req, res) => {
  try {
    const doc = await EmployeeDocument.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true },
    );
    if (!doc) return notFound(res, 'Document');
    return ok(res, doc, 'Document updated');
  } catch (err) { return serverError(res, err); }
};

exports.verifyDocument = async (req, res) => {
  try {
    const doc = await EmployeeDocument.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, verifiedBy: req.user._id, verifiedAt: new Date() },
      { new: true },
    );
    if (!doc) return notFound(res, 'Document');
    return ok(res, doc, 'Document verified');
  } catch (err) { return serverError(res, err); }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await EmployeeDocument.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true },
    );
    if (!doc) return notFound(res, 'Document');
    return noContent(res, 'Document deleted');
  } catch (err) { return serverError(res, err); }
};

// Expiring documents alert
exports.getExpiringDocuments = async (req, res) => {
  try {
    const days = parseInt(req.query.days || '30');
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const docs = await EmployeeDocument.find({
      isDeleted: false,
      expiryDate: { $gte: new Date(), $lte: cutoff },
    })
      .populate('employee', 'displayName employeeCode workEmail')
      .sort({ expiryDate: 1 });
    return ok(res, docs);
  } catch (err) { return serverError(res, err); }
};
