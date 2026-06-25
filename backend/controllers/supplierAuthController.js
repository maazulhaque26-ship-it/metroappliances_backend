const jwt          = require('jsonwebtoken');
const SupplierUser = require('../models/SupplierUser');
const { ok, fail, forbidden, serverError } = require('../utils/response');

const signToken = (id) => jwt.sign({ id, type: 'supplier' }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email and password are required');

    const user = await SupplierUser.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+password').populate('vendor', 'companyName vendorCode status');
    if (!user)                            return forbidden(res, 'Invalid credentials');
    if (user.status !== 'active')         return forbidden(res, 'Account is not active');
    if (user.vendor?.status === 'blacklisted') return forbidden(res, 'Vendor account is suspended');

    const match = await user.comparePassword(password);
    if (!match) return forbidden(res, 'Invalid credentials');

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    const userData = { _id: user._id, name: user.name, email: user.email, role: user.role, vendor: user.vendor };
    return ok(res, { token, user: userData }, 'Login successful');
  } catch (err) { return serverError(res, err); }
};

exports.me = async (req, res) => {
  try {
    return ok(res, req.supplierUser);
  } catch (err) { return serverError(res, err); }
};

exports.logout = async (req, res) => {
  return ok(res, null, 'Logged out successfully');
};

exports.getSupplierUsers = async (req, res) => {
  try {
    const { vendor, status, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (vendor) filter.vendor = vendor;
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      SupplierUser.find(filter).populate('vendor', 'companyName vendorCode').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      SupplierUser.countDocuments(filter),
    ]);
    const { paginated } = require('../utils/response');
    return paginated(res, data, { page: Number(page), limit: Number(limit), total });
  } catch (err) { return serverError(res, err); }
};

exports.createSupplierUser = async (req, res) => {
  try {
    const { created } = require('../utils/response');
    const user = await SupplierUser.create(req.body);
    const { password: _, ...safe } = user.toObject();
    return created(res, safe, 'Supplier user created');
  } catch (err) {
    if (err.code === 11000) return fail(res, 'Email already in use');
    return serverError(res, err);
  }
};

exports.updateSupplierUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const user = await SupplierUser.findOneAndUpdate({ _id: req.params.userId, isDeleted: false }, rest, { new: true });
    if (!user) { const { notFound } = require('../utils/response'); return notFound(res, 'User not found'); }
    return ok(res, user, 'User updated');
  } catch (err) { return serverError(res, err); }
};
