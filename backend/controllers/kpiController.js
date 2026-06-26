'use strict';
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const { ok, created, paginated, fail, notFound, serverError } = require('../utils/response');

const KPI                   = () => mongoose.model('KPI');
const KPIReview             = () => mongoose.model('KPIReview');
const Competency            = () => mongoose.model('Competency');
const CompetencyAssessment  = () => mongoose.model('CompetencyAssessment');

function _audit(req, action, entity, id, label, before, after) {
  setImmediate(async () => {
    try {
      await AuditLog.create({
        admin: req.user._id, adminName: req.user.name,
        adminEmail: req.user.email, adminRole: req.user.role,
        action, entity, entityId: id,
        entityLabel: String(label || '').slice(0, 200),
        changes: { before, after },
        ip: (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
        userAgent: (req.get('User-Agent') || '').slice(0, 300),
      });
    } catch (_) {}
  });
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

exports.createKPI = async (req, res) => {
  try {
    const kpi = await KPI().create(req.body);
    _audit(req, 'CREATE', 'KPI', kpi._id, kpi.kpiCode, null, req.body);
    return created(res, kpi, 'KPI created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getKPIs = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { department, designation, isActive, search } = req.query;
    const filter = { isDeleted: false };
    if (department)  filter.department  = department;
    if (designation) filter.designation = designation;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      KPI().find(filter)
        .populate('department', 'name')
        .populate('designation', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      KPI().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getKPI = async (req, res) => {
  try {
    const kpi = await KPI().findOne({ _id: req.params.id, isDeleted: false })
      .populate('department', 'name')
      .populate('designation', 'name')
      .lean();
    if (!kpi) return notFound(res, 'KPI');
    return ok(res, kpi);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateKPI = async (req, res) => {
  try {
    const kpi = await KPI().findOne({ _id: req.params.id, isDeleted: false });
    if (!kpi) return notFound(res, 'KPI');
    const before = kpi.toObject();
    Object.assign(kpi, req.body);
    await kpi.save();
    _audit(req, 'UPDATE', 'KPI', kpi._id, kpi.kpiCode, before, req.body);
    return ok(res, kpi, 'KPI updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteKPI = async (req, res) => {
  try {
    const kpi = await KPI().findOne({ _id: req.params.id, isDeleted: false });
    if (!kpi) return notFound(res, 'KPI');
    kpi.isDeleted = true;
    await kpi.save();
    _audit(req, 'DELETE', 'KPI', kpi._id, kpi.kpiCode, kpi.toObject(), null);
    return ok(res, null, 'KPI deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createKPIReview = async (req, res) => {
  try {
    const { kpi: kpiId, cycle, employee, targetValue, actualValue, rating, comments } = req.body;
    if (!kpiId || !cycle || !employee) return fail(res, 'kpi, cycle, employee are required');

    const target = targetValue != null ? Number(targetValue) : 0;
    const actual = actualValue != null ? Number(actualValue) : 0;
    const achievementPercent = target > 0 ? Math.round((actual / target) * 10000) / 100 : 0;

    const review = await KPIReview().create({
      kpi: kpiId,
      cycle,
      employee,
      targetValue: target,
      actualValue: actual,
      achievementPercent,
      rating,
      comments,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    });

    _audit(req, 'CREATE', 'KPIReview', review._id, review._id.toString(), null, req.body);
    return created(res, review, 'KPI review created');
  } catch (err) {
    if (err.code === 11000) return fail(res, 'KPI review already exists for this employee/cycle/kpi');
    return serverError(res, err);
  }
};

exports.getKPIReviews = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { kpi, cycle, employee } = req.query;
    const filter = { isDeleted: false };
    if (kpi)      filter.kpi      = kpi;
    if (cycle)    filter.cycle    = cycle;
    if (employee) filter.employee = employee;

    const [data, total] = await Promise.all([
      KPIReview().find(filter)
        .populate('kpi', 'kpiCode name unit')
        .populate('cycle', 'name cycleCode')
        .populate('employee', 'firstName lastName employeeCode')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      KPIReview().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Competencies ──────────────────────────────────────────────────────────────

exports.createCompetency = async (req, res) => {
  try {
    const comp = await Competency().create(req.body);
    _audit(req, 'CREATE', 'Competency', comp._id, comp.code, null, req.body);
    return created(res, comp, 'Competency created');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getCompetencies = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { competencyType, isActive, search } = req.query;
    const filter = { isDeleted: false };
    if (competencyType) filter.competencyType = competencyType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      Competency().find(filter)
        .populate('departments', 'name')
        .populate('designations', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Competency().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getCompetency = async (req, res) => {
  try {
    const comp = await Competency().findOne({ _id: req.params.id, isDeleted: false })
      .populate('departments', 'name')
      .populate('designations', 'name')
      .lean();
    if (!comp) return notFound(res, 'Competency');
    return ok(res, comp);
  } catch (err) {
    return serverError(res, err);
  }
};

exports.updateCompetency = async (req, res) => {
  try {
    const comp = await Competency().findOne({ _id: req.params.id, isDeleted: false });
    if (!comp) return notFound(res, 'Competency');
    const before = comp.toObject();
    Object.assign(comp, req.body);
    await comp.save();
    _audit(req, 'UPDATE', 'Competency', comp._id, comp.code, before, req.body);
    return ok(res, comp, 'Competency updated');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.deleteCompetency = async (req, res) => {
  try {
    const comp = await Competency().findOne({ _id: req.params.id, isDeleted: false });
    if (!comp) return notFound(res, 'Competency');
    comp.isDeleted = true;
    await comp.save();
    _audit(req, 'DELETE', 'Competency', comp._id, comp.code, comp.toObject(), null);
    return ok(res, null, 'Competency deleted');
  } catch (err) {
    return serverError(res, err);
  }
};

exports.createCompetencyAssessment = async (req, res) => {
  try {
    const assessment = await CompetencyAssessment().create({
      ...req.body,
      assessedBy: req.user._id,
    });
    _audit(req, 'CREATE', 'CompetencyAssessment', assessment._id, assessment._id.toString(), null, req.body);
    return created(res, assessment, 'Competency assessment created');
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Assessment already exists for this employee/cycle/competency');
    return serverError(res, err);
  }
};

exports.getCompetencyAssessments = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const { cycle, employee, competency } = req.query;
    const filter = { isDeleted: false };
    if (cycle)      filter.cycle      = cycle;
    if (employee)   filter.employee   = employee;
    if (competency) filter.competency = competency;

    const [data, total] = await Promise.all([
      CompetencyAssessment().find(filter)
        .populate('competency', 'code name competencyType')
        .populate('cycle', 'name cycleCode')
        .populate('employee', 'firstName lastName employeeCode')
        .populate('assessedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CompetencyAssessment().countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return serverError(res, err);
  }
};
