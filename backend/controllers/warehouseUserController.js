const jwt           = require('jsonwebtoken');
const WarehouseUser = require('../models/WarehouseUser');
const Warehouse     = require('../models/Warehouse');
const { ok, created, noContent, paginated, fail, notFound, serverError } = require('../utils/response');

const signToken = (id) => jwt.sign(
  { id, type: 'warehouse' },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE || '30d' }
);

// ── Warehouse user auth ───────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email and password required');

    const user = await WarehouseUser.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+password');
    if (!user)               return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(401).json({ success: false, message: 'Account not active. Contact admin.' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token    = signToken(user._id);
    const userData = user.toObject();
    delete userData.password;

    return res.json({ success: true, token, user: userData });
  } catch (err) { return serverError(res, err); }
};

exports.logout = (req, res) => res.json({ success: true, message: 'Logged out' });

exports.getMe = async (req, res) => {
  try {
    const user = await WarehouseUser.findById(req.warehouseUser._id)
      .populate('warehouse', 'code name city status');
    return ok(res, user);
  } catch (err) { return serverError(res, err); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await WarehouseUser.findById(req.warehouseUser._id).select('+password');
    if (!await user.matchPassword(currentPassword)) {
      return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    return ok(res, null, 'Password changed');
  } catch (err) { return serverError(res, err); }
};

// ── Admin: Warehouse user management ─────────────────────────────────────────
exports.getWarehouseUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, warehouseId, role, status } = req.query;
    const filter = { isDeleted: false };
    if (warehouseId) filter.warehouse = warehouseId;
    if (role)        filter.role      = role;
    if (status)      filter.status    = status;
    if (search) {
      filter.$or = [
        { name:       new RegExp(search, 'i') },
        { email:      new RegExp(search, 'i') },
        { employeeId: new RegExp(search, 'i') },
      ];
    }

    const [data, total] = await Promise.all([
      WarehouseUser.find(filter)
        .populate('warehouse', 'code name city')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      WarehouseUser.countDocuments(filter),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) { return serverError(res, err); }
};

exports.createWarehouseUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, warehouse, employeeId } = req.body;
    if (!name || !email || !password || !warehouse) {
      return fail(res, 'name, email, password, warehouse are required');
    }

    const wh = await Warehouse.findOne({ _id: warehouse, isDeleted: false });
    if (!wh) return notFound(res, 'Warehouse');

    const exists = await WarehouseUser.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (exists) return fail(res, 'Email already in use');

    const user = await WarehouseUser.create({ name, email, phone, password, role: role || 'picker', warehouse, employeeId });
    const userData = user.toObject();
    delete userData.password;

    return created(res, userData, 'Warehouse user created');
  } catch (err) { return serverError(res, err); }
};

exports.getWarehouseUserById = async (req, res) => {
  try {
    const user = await WarehouseUser.findOne({ _id: req.params.id, isDeleted: false })
      .populate('warehouse', 'code name city');
    if (!user) return notFound(res, 'Warehouse user');
    return ok(res, user);
  } catch (err) { return serverError(res, err); }
};

exports.updateWarehouseUser = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'role', 'warehouse', 'employeeId', 'status'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await WarehouseUser.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    ).populate('warehouse', 'code name city');

    if (!user) return notFound(res, 'Warehouse user');
    return ok(res, user, 'Warehouse user updated');
  } catch (err) { return serverError(res, err); }
};

exports.toggleWarehouseUserStatus = async (req, res) => {
  try {
    const user = await WarehouseUser.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return notFound(res, 'Warehouse user');
    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save({ validateBeforeSave: false });
    return ok(res, { status: user.status }, `User ${user.status}`);
  } catch (err) { return serverError(res, err); }
};

exports.deleteWarehouseUser = async (req, res) => {
  try {
    const user = await WarehouseUser.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, status: 'inactive' },
      { new: true }
    );
    if (!user) return notFound(res, 'Warehouse user');
    return noContent(res, 'Warehouse user deleted');
  } catch (err) { return serverError(res, err); }
};

exports.resetWarehouseUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return fail(res, 'Password must be at least 6 characters');

    const user = await WarehouseUser.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return notFound(res, 'Warehouse user');
    user.password = password;
    await user.save();
    return ok(res, null, 'Password reset');
  } catch (err) { return serverError(res, err); }
};
