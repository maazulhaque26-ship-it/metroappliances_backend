const mongoose = require('mongoose');
const { ok, created, notFound, serverError, paginated } = require('../utils/response');

const BIDashboard = () => mongoose.model('BIDashboard');
const BIAlert     = () => mongoose.model('BIAlert');
const BIBookmark  = () => mongoose.model('BIBookmark');

// ── Dashboards ────────────────────────────────────────────────────────────────
exports.listDashboards = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.dashboardType = type;
    const dashboards = await BIDashboard().find(filter).sort({ isDefault: -1, createdAt: -1 }).lean();
    ok(res, dashboards);
  } catch (e) { serverError(res, e); }
};

exports.createDashboard = async (req, res) => {
  try {
    const d = await BIDashboard().create({ ...req.body, owner: req.user?._id });
    created(res, d);
  } catch (e) { serverError(res, e); }
};

exports.getDashboard = async (req, res) => {
  try {
    const d = await BIDashboard().findById(req.params.id).lean();
    if (!d) return notFound(res, 'Dashboard not found');
    await BIDashboard().findByIdAndUpdate(req.params.id, { lastViewed: new Date(), $inc: { viewCount: 1 } });
    ok(res, d);
  } catch (e) { serverError(res, e); }
};

exports.updateDashboard = async (req, res) => {
  try {
    const d = await BIDashboard().findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!d) return notFound(res, 'Dashboard not found');
    ok(res, d);
  } catch (e) { serverError(res, e); }
};

exports.deleteDashboard = async (req, res) => {
  try {
    await BIDashboard().findByIdAndDelete(req.params.id);
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};

// ── Alerts ────────────────────────────────────────────────────────────────────
exports.listAlerts = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const alerts = await BIAlert().find(filter).sort({ severity: 1, createdAt: -1 }).lean();
    ok(res, alerts);
  } catch (e) { serverError(res, e); }
};

exports.createAlert = async (req, res) => {
  try {
    const a = await BIAlert().create({ ...req.body, owner: req.user?._id });
    created(res, a);
  } catch (e) { serverError(res, e); }
};

exports.getAlert = async (req, res) => {
  try {
    const a = await BIAlert().findById(req.params.id).lean();
    if (!a) return notFound(res, 'Alert not found');
    ok(res, a);
  } catch (e) { serverError(res, e); }
};

exports.updateAlert = async (req, res) => {
  try {
    const a = await BIAlert().findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!a) return notFound(res, 'Alert not found');
    ok(res, a);
  } catch (e) { serverError(res, e); }
};

exports.deleteAlert = async (req, res) => {
  try {
    await BIAlert().findByIdAndDelete(req.params.id);
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};

exports.toggleAlert = async (req, res) => {
  try {
    const a = await BIAlert().findById(req.params.id);
    if (!a) return notFound(res, 'Alert not found');
    a.isActive = !a.isActive;
    await a.save();
    ok(res, a);
  } catch (e) { serverError(res, e); }
};

// ── Bookmarks ─────────────────────────────────────────────────────────────────
exports.listBookmarks = async (req, res) => {
  try {
    const bookmarks = await BIBookmark().find({ user: req.user?._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    ok(res, bookmarks);
  } catch (e) { serverError(res, e); }
};

exports.createBookmark = async (req, res) => {
  try {
    const b = await BIBookmark().create({ ...req.body, user: req.user?._id });
    created(res, b);
  } catch (e) { serverError(res, e); }
};

exports.deleteBookmark = async (req, res) => {
  try {
    await BIBookmark().findOneAndDelete({ _id: req.params.id, user: req.user?._id });
    ok(res, { deleted: true });
  } catch (e) { serverError(res, e); }
};

exports.setDefaultBookmark = async (req, res) => {
  try {
    await BIBookmark().updateMany({ user: req.user?._id }, { isDefault: false });
    const b = await BIBookmark().findByIdAndUpdate(req.params.id, { isDefault: true }, { new: true });
    if (!b) return notFound(res, 'Bookmark not found');
    ok(res, b);
  } catch (e) { serverError(res, e); }
};
