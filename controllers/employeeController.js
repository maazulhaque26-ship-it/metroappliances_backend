'use strict';
const Employee              = require('../models/Employee');
const EmployeeDocument      = require('../models/EmployeeDocument');
const EmployeeBankAccount   = require('../models/EmployeeBankAccount');
const EmergencyContact      = require('../models/EmergencyContact');
const EmployeeSkill         = require('../models/EmployeeSkill');
const EmployeeCertification = require('../models/EmployeeCertification');
const EmployeeNote          = require('../models/EmployeeNote');
const EmploymentHistory     = require('../models/EmploymentHistory');
const AuditLog              = require('../models/AuditLog');
const { ok, created, noContent, paginated, notFound, fail, serverError } = require('../utils/response');

// ── Employees ─────────────────────────────────────────────────────────────────
exports.getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, department, designation, search, employmentType } = req.query;
    const filter = { isDeleted: false };
    if (status)         filter.status = status;
    if (department)     filter.department = department;
    if (designation)    filter.designation = designation;
    if (employmentType) filter.employmentType = employmentType;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { displayName:{ $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { workEmail: { $regex: search, $options: 'i' } },
        { mobile:    { $regex: search, $options: 'i' } },
      ];
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Employee.find(filter)
        .populate('department designation businessUnit location reportingManager', 'name title deptCode designationCode displayName employeeCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Employee.countDocuments(filter),
    ]);
    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.getEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOne({ _id: req.params.id, isDeleted: false })
      .populate('department designation businessUnit costCenter location reportingManager', 'name title deptCode designationCode buCode displayName employeeCode centerCode');
    if (!emp) return notFound(res, 'Employee');
    return ok(res, emp);
  } catch (err) { return serverError(res, err); }
};

exports.createEmployee = async (req, res) => {
  try {
    const emp = await Employee.create(req.body);
    const io = req.app.locals.io;
    if (io) io.emit('hr:employee_created', { employeeCode: emp.employeeCode, name: emp.displayName });
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role,
      action: 'EMPLOYEE_CREATED', entity: 'Employee', entityId: emp._id, entityLabel: emp.displayName,
      changes: { before: null, after: emp.toObject() },
      ip: (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
      userAgent: (req.get('User-Agent') || '').slice(0, 300),
    });
    return created(res, emp, 'Employee created');
  } catch (err) { return serverError(res, err); }
};

exports.updateEmployee = async (req, res) => {
  try {
    const before = await Employee.findById(req.params.id).lean();
    const emp = await Employee.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true },
    ).populate('department designation businessUnit location');
    if (!emp) return notFound(res, 'Employee');
    await AuditLog.create({
      admin: req.user._id, adminName: req.user.name, adminEmail: req.user.email, adminRole: req.user.role,
      action: 'EMPLOYEE_UPDATED', entity: 'Employee', entityId: emp._id, entityLabel: emp.displayName,
      changes: { before, after: emp.toObject() },
      ip: (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
      userAgent: (req.get('User-Agent') || '').slice(0, 300),
    });
    return ok(res, emp, 'Employee updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, status: 'inactive' },
      { new: true },
    );
    if (!emp) return notFound(res, 'Employee');
    return noContent(res, 'Employee deleted');
  } catch (err) { return serverError(res, err); }
};

exports.confirmEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'active', confirmationDate: new Date() },
      { new: true },
    );
    if (!emp) return notFound(res, 'Employee');
    const io = req.app.locals.io;
    if (io) io.emit('hr:employee_confirmed', { employeeCode: emp.employeeCode, name: emp.displayName });
    return ok(res, emp, 'Employee confirmed');
  } catch (err) { return serverError(res, err); }
};

// ── Bank Accounts ─────────────────────────────────────────────────────────────
exports.getBankAccounts = async (req, res) => {
  try {
    const data = await EmployeeBankAccount.find({ employee: req.params.id, isDeleted: false });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.createBankAccount = async (req, res) => {
  try {
    const data = await EmployeeBankAccount.create({ ...req.body, employee: req.params.id });
    return created(res, data, 'Bank account added');
  } catch (err) { return serverError(res, err); }
};

exports.deleteBankAccount = async (req, res) => {
  try {
    await EmployeeBankAccount.findByIdAndUpdate(req.params.bid, { isDeleted: true });
    return noContent(res, 'Bank account removed');
  } catch (err) { return serverError(res, err); }
};

// ── Emergency Contacts ────────────────────────────────────────────────────────
exports.getEmergencyContacts = async (req, res) => {
  try {
    const data = await EmergencyContact.find({ employee: req.params.id, isDeleted: false });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.createEmergencyContact = async (req, res) => {
  try {
    const data = await EmergencyContact.create({ ...req.body, employee: req.params.id });
    return created(res, data, 'Emergency contact added');
  } catch (err) { return serverError(res, err); }
};

exports.deleteEmergencyContact = async (req, res) => {
  try {
    await EmergencyContact.findByIdAndUpdate(req.params.cid, { isDeleted: true });
    return noContent(res, 'Emergency contact removed');
  } catch (err) { return serverError(res, err); }
};

// ── Skills ────────────────────────────────────────────────────────────────────
exports.getSkills = async (req, res) => {
  try {
    const data = await EmployeeSkill.find({ employee: req.params.id, isDeleted: false });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.createSkill = async (req, res) => {
  try {
    const data = await EmployeeSkill.create({ ...req.body, employee: req.params.id });
    return created(res, data, 'Skill added');
  } catch (err) { return serverError(res, err); }
};

exports.updateSkill = async (req, res) => {
  try {
    const data = await EmployeeSkill.findByIdAndUpdate(req.params.sid, req.body, { new: true });
    if (!data) return notFound(res, 'Skill');
    return ok(res, data, 'Skill updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteSkill = async (req, res) => {
  try {
    await EmployeeSkill.findByIdAndUpdate(req.params.sid, { isDeleted: true });
    return noContent(res, 'Skill removed');
  } catch (err) { return serverError(res, err); }
};

// ── Certifications ────────────────────────────────────────────────────────────
exports.getCertifications = async (req, res) => {
  try {
    const data = await EmployeeCertification.find({ employee: req.params.id, isDeleted: false });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.createCertification = async (req, res) => {
  try {
    const data = await EmployeeCertification.create({ ...req.body, employee: req.params.id });
    return created(res, data, 'Certification added');
  } catch (err) { return serverError(res, err); }
};

exports.deleteCertification = async (req, res) => {
  try {
    await EmployeeCertification.findByIdAndUpdate(req.params.certId, { isDeleted: true });
    return noContent(res, 'Certification removed');
  } catch (err) { return serverError(res, err); }
};

// ── Notes ─────────────────────────────────────────────────────────────────────
exports.getNotes = async (req, res) => {
  try {
    const data = await EmployeeNote.find({ employee: req.params.id, isDeleted: false })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.createNote = async (req, res) => {
  try {
    const data = await EmployeeNote.create({ ...req.body, employee: req.params.id, createdBy: req.user._id });
    return created(res, data, 'Note added');
  } catch (err) { return serverError(res, err); }
};

exports.deleteNote = async (req, res) => {
  try {
    await EmployeeNote.findByIdAndUpdate(req.params.nid, { isDeleted: true });
    return noContent(res, 'Note removed');
  } catch (err) { return serverError(res, err); }
};

// ── Employment History ────────────────────────────────────────────────────────
exports.getEmploymentHistory = async (req, res) => {
  try {
    const data = await EmploymentHistory.find({ employee: req.params.id, isDeleted: false }).sort({ startDate: -1 });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.createEmploymentHistory = async (req, res) => {
  try {
    const data = await EmploymentHistory.create({ ...req.body, employee: req.params.id });
    return created(res, data, 'Employment history added');
  } catch (err) { return serverError(res, err); }
};

exports.deleteEmploymentHistory = async (req, res) => {
  try {
    await EmploymentHistory.findByIdAndUpdate(req.params.hid, { isDeleted: true });
    return noContent(res, 'History removed');
  } catch (err) { return serverError(res, err); }
};
