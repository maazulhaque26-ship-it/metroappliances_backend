'use strict';
const QualityCertificate = require('../models/QualityCertificate');
const AuditLog = require('../models/AuditLog');
const { success, error, paginated } = require('../utils/response');

exports.getCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, certificateType, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (certificateType) filter.certificateType = certificateType;
    if (search) filter.$or = [
      { certificateNumber: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
    const total = await QualityCertificate.countDocuments(filter);
    const data = await QualityCertificate.find(filter)
      .sort({ issueDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    return paginated(res, data, total, Number(page), Number(limit), 'Certificates retrieved');
  } catch (err) { return error(res, err.message); }
};

exports.createCertificate = async (req, res) => {
  try {
    const cert = await QualityCertificate.create(req.body);
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'create', entity: 'QualityCertificate', entityId: cert._id, entityLabel: cert.certificateNumber, changes: { before: null, after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    const io = req.app.locals.io;
    if (io) io.emit('qms:certificate_generated', { id: cert._id, certificateNumber: cert.certificateNumber, certificateType: cert.certificateType });
    return success(res, cert, 'Certificate created', 201);
  } catch (err) { return error(res, err.message); }
};

exports.getCertificate = async (req, res) => {
  try {
    const cert = await QualityCertificate.findOne({ _id: req.params.id, isDeleted: false })
      .populate('product', 'name sku')
      .populate('vendor', 'name vendorCode')
      .populate('inspectionLot', 'lotNumber');
    if (!cert) return error(res, 'Certificate not found', 404);
    return success(res, cert);
  } catch (err) { return error(res, err.message); }
};

exports.updateCertificate = async (req, res) => {
  try {
    const before = await QualityCertificate.findOne({ _id: req.params.id, isDeleted: false });
    if (!before) return error(res, 'Certificate not found', 404);
    const cert = await QualityCertificate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await AuditLog.create({ admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role, action: 'update', entity: 'QualityCertificate', entityId: cert._id, entityLabel: cert.certificateNumber, changes: { before: before.toObject(), after: req.body }, ip: req.ip, userAgent: req.headers['user-agent'] });
    return success(res, cert, 'Certificate updated');
  } catch (err) { return error(res, err.message); }
};

exports.deleteCertificate = async (req, res) => {
  try {
    const cert = await QualityCertificate.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!cert) return error(res, 'Certificate not found', 404);
    return success(res, null, 'Certificate deleted');
  } catch (err) { return error(res, err.message); }
};

exports.issueCertificate = async (req, res) => {
  try {
    const cert = await QualityCertificate.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: 'draft' },
      { status: 'issued', issuedBy: req.user._id, issuedByName: req.user.name, issueDate: new Date() },
      { new: true }
    );
    if (!cert) return error(res, 'Certificate not found or already issued', 404);
    const io = req.app.locals.io;
    if (io) io.emit('qms:certificate_generated', { id: cert._id, certificateNumber: cert.certificateNumber, certificateType: cert.certificateType });
    return success(res, cert, 'Certificate issued');
  } catch (err) { return error(res, err.message); }
};

exports.revokeCertificate = async (req, res) => {
  try {
    const cert = await QualityCertificate.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, status: 'issued' },
      { status: 'revoked', remarks: req.body.reason || 'Revoked' },
      { new: true }
    );
    if (!cert) return error(res, 'Certificate not found or not issued', 404);
    return success(res, cert, 'Certificate revoked');
  } catch (err) { return error(res, err.message); }
};
