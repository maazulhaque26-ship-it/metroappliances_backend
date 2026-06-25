'use strict';
const OrganizationNode  = require('../models/OrganizationNode');
const OrganizationChart = require('../models/OrganizationChart');
const ReportingRelationship = require('../models/ReportingRelationship');
const Employee          = require('../models/Employee');
const { ok, created, noContent, notFound, serverError } = require('../utils/response');

// ── Org Nodes ─────────────────────────────────────────────────────────────────
exports.getNodes = async (req, res) => {
  try {
    const nodes = await OrganizationNode.find({ isActive: true })
      .populate('parent', 'name nodeType')
      .populate('headEmployee', 'displayName employeeCode')
      .populate('department', 'name deptCode')
      .populate('businessUnit', 'name buCode')
      .sort({ level: 1, name: 1 });
    return ok(res, nodes);
  } catch (err) { return serverError(res, err); }
};

exports.getNode = async (req, res) => {
  try {
    const node = await OrganizationNode.findById(req.params.id)
      .populate('parent', 'name')
      .populate('headEmployee', 'displayName employeeCode');
    if (!node) return notFound(res, 'Organization node');
    return ok(res, node);
  } catch (err) { return serverError(res, err); }
};

exports.createNode = async (req, res) => {
  try {
    const parent = req.body.parent ? await OrganizationNode.findById(req.body.parent) : null;
    const level  = parent ? parent.level + 1 : 0;
    const path   = parent ? `${parent.path}/${parent._id}` : '';
    const node   = await OrganizationNode.create({ ...req.body, level, path });
    return created(res, node, 'Organization node created');
  } catch (err) { return serverError(res, err); }
};

exports.updateNode = async (req, res) => {
  try {
    const node = await OrganizationNode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!node) return notFound(res, 'Organization node');
    return ok(res, node, 'Node updated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteNode = async (req, res) => {
  try {
    await OrganizationNode.findByIdAndUpdate(req.params.id, { isActive: false });
    return noContent(res, 'Node deactivated');
  } catch (err) { return serverError(res, err); }
};

// ── Org Charts ────────────────────────────────────────────────────────────────
exports.getCharts = async (req, res) => {
  try {
    const charts = await OrganizationChart.find({ isDeleted: false })
      .populate('createdBy', 'name')
      .sort({ effectiveDate: -1 });
    return ok(res, charts);
  } catch (err) { return serverError(res, err); }
};

exports.getActiveChart = async (req, res) => {
  try {
    const chart = await OrganizationChart.findOne({ status: 'active', isDeleted: false })
      .populate({ path: 'nodes', populate: [{ path: 'headEmployee', select: 'displayName employeeCode' }, { path: 'parent', select: 'name' }] });
    if (!chart) return notFound(res, 'Active chart');
    return ok(res, chart);
  } catch (err) { return serverError(res, err); }
};

exports.createChart = async (req, res) => {
  try {
    const chart = await OrganizationChart.create({ ...req.body, createdBy: req.user._id });
    return created(res, chart, 'Org chart created');
  } catch (err) { return serverError(res, err); }
};

exports.activateChart = async (req, res) => {
  try {
    await OrganizationChart.updateMany({ status: 'active' }, { status: 'archived' });
    const chart = await OrganizationChart.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true });
    if (!chart) return notFound(res, 'Org chart');
    return ok(res, chart, 'Chart activated');
  } catch (err) { return serverError(res, err); }
};

exports.deleteChart = async (req, res) => {
  try {
    await OrganizationChart.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return noContent(res, 'Chart deleted');
  } catch (err) { return serverError(res, err); }
};

// ── Reporting Relationships ───────────────────────────────────────────────────
exports.getReportingRelationships = async (req, res) => {
  try {
    const { employee, manager } = req.query;
    const filter = { isActive: true };
    if (employee) filter.employee = employee;
    if (manager)  filter.manager  = manager;
    const data = await ReportingRelationship.find(filter)
      .populate('employee', 'displayName employeeCode')
      .populate('manager', 'displayName employeeCode')
      .sort({ createdAt: -1 });
    return ok(res, data);
  } catch (err) { return serverError(res, err); }
};

exports.createReportingRelationship = async (req, res) => {
  try {
    // Deactivate existing primary relationship for employee
    if (!req.body.relationshipType || req.body.relationshipType === 'primary') {
      await ReportingRelationship.updateMany(
        { employee: req.body.employee, relationshipType: 'primary', isActive: true },
        { isActive: false, effectiveTo: new Date() },
      );
    }
    const doc = await ReportingRelationship.create(req.body);
    // Update reportingManager on Employee
    if (doc.relationshipType === 'primary') {
      await Employee.findByIdAndUpdate(doc.employee, { reportingManager: doc.manager });
    }
    return created(res, doc, 'Reporting relationship created');
  } catch (err) { return serverError(res, err); }
};

exports.terminateReportingRelationship = async (req, res) => {
  try {
    const doc = await ReportingRelationship.findByIdAndUpdate(
      req.params.id,
      { isActive: false, effectiveTo: new Date() },
      { new: true },
    );
    if (!doc) return notFound(res, 'Relationship');
    return ok(res, doc, 'Relationship terminated');
  } catch (err) { return serverError(res, err); }
};

// ── Hierarchy Tree ────────────────────────────────────────────────────────────
exports.getHierarchyTree = async (req, res) => {
  try {
    const { employeeId } = req.params;
    // Get direct reports
    const directReports = await Employee.find({ reportingManager: employeeId, isDeleted: false, status: { $in: ['active','probation'] } })
      .select('displayName employeeCode designation department')
      .populate('designation', 'title')
      .populate('department', 'name');

    const manager = await Employee.findById(employeeId)
      .select('displayName employeeCode designation department reportingManager')
      .populate('designation', 'title')
      .populate('department', 'name')
      .populate('reportingManager', 'displayName employeeCode');

    return ok(res, { manager, directReports, directReportCount: directReports.length });
  } catch (err) { return serverError(res, err); }
};
