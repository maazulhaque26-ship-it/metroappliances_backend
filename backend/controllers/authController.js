const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please login instead.' });

    const user = await User.create({ name, email: email.toLowerCase().trim(), password });
    sendTokenResponse(user, 201, res);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please enter your email and password' });

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user)
      return res.status(401).json({ success: false, message: 'No account found with this email address. Please register first.' });

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });

    // Check if account is active
    if (!user.isActive)
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });

    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

exports.logout = (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr)
      return res.status(404).json({ success: false, message: 'Address not found' });
    if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
    Object.assign(addr, req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};