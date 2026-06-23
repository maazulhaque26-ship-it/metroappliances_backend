const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Dealer   = require('../models/Dealer');

// ── Token helpers ─────────────────────────────────────────────────────────────

const generateDealerToken = (id) =>
  jwt.sign({ id, type: 'dealer' }, process.env.JWT_SECRET, { expiresIn: '7d' });

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  expires:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  secure:   process.env.NODE_ENV === 'production',
};

const dealerPublicFields = (d) => ({
  _id:          d._id,
  dealerCode:   d.dealerCode,
  businessName: d.businessName,
  businessCategory: d.businessCategory,
  dealerType:   d.dealerType,
  ownerName:    d.ownerName,
  email:        d.email,
  phone:        d.phone,
  alternatePhone: d.alternatePhone,
  state:        d.state,
  city:         d.city,
  district:     d.district,
  pincode:      d.pincode,
  addressLine1: d.addressLine1,
  addressLine2: d.addressLine2,
  gstNumber:    d.gstNumber,
  panNumber:    d.panNumber,
  status:       d.status,
  kycStatus:    d.kycStatus,
  website:      d.website,
  yearsInBusiness: d.yearsInBusiness,
  bankDetails:  d.bankDetails,
  documents:    d.documents,
  lastLogin:    d.lastLogin,
  createdAt:    d.createdAt,
});

const sendToken = (dealer, statusCode, res) => {
  const token = generateDealerToken(dealer._id);
  res.status(statusCode)
    .cookie('dealerToken', token, COOKIE_OPTS)
    .json({ success: true, token, dealer: dealerPublicFields(dealer) });
};

// ── @POST /api/dealer/auth/register ──────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const {
      businessName, businessCategory, dealerType, yearsInBusiness, website,
      ownerName, email, phone, alternatePhone,
      addressLine1, addressLine2, city, district, state, pincode,
      gstNumber, panNumber,
      bankDetails,
      password,
    } = req.body;

    if (await Dealer.findOne({ email: email?.toLowerCase() })) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }
    if (await Dealer.findOne({ gstNumber: gstNumber?.toUpperCase() })) {
      return res.status(400).json({ success: false, message: 'A dealer with this GST number is already registered' });
    }

    const dealer = await Dealer.create({
      businessName, businessCategory, dealerType,
      yearsInBusiness: yearsInBusiness || 0,
      website: website || '',
      ownerName, email, phone,
      alternatePhone: alternatePhone || '',
      addressLine1, addressLine2: addressLine2 || '',
      city, district: district || '', state, pincode,
      gstNumber, panNumber,
      bankDetails: bankDetails || {},
      password,
    });

    sendToken(dealer, 201, res);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join('; ');
      return res.status(400).json({ success: false, message: msg });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or GST already registered' });
    }
    console.error('[DealerAuth] register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ── @POST /api/dealer/auth/login ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const dealer = await Dealer.findOne({ email: email.toLowerCase(), isDeleted: false })
      .select('+password');
    if (!dealer) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!dealer.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated' });
    }

    const match = await dealer.matchPassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    dealer.lastLogin = new Date();
    await dealer.save({ validateBeforeSave: false });

    sendToken(dealer, 200, res);
  } catch (err) {
    console.error('[DealerAuth] login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ── @POST /api/dealer/auth/logout ────────────────────────────────────────────
exports.logout = (req, res) => {
  res.cookie('dealerToken', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
};

// ── @GET /api/dealer/auth/me ─────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const dealer = await Dealer.findById(req.dealer._id);
    res.json({ success: true, dealer: dealerPublicFields(dealer) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// ── @PUT /api/dealer/auth/profile ────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const allowed = [
      'ownerName','phone','alternatePhone','website','yearsInBusiness',
      'addressLine1','addressLine2','city','district','pincode',
      'bankDetails',
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const dealer = await Dealer.findByIdAndUpdate(
      req.dealer._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json({ success: true, dealer: dealerPublicFields(dealer) });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join('; ');
      return res.status(400).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// ── @PUT /api/dealer/auth/change-password ────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const dealer = await Dealer.findById(req.dealer._id).select('+password');
    const match  = await dealer.matchPassword(currentPassword);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    dealer.password = newPassword;
    await dealer.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

// ── @POST /api/dealer/auth/forgot-password ───────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const dealer = await Dealer.findOne({ email: email.toLowerCase(), isDeleted: false });
    // Always return 200 to avoid user enumeration
    if (!dealer) {
      return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    const rawToken   = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    dealer.resetPasswordToken  = hashedToken;
    dealer.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await dealer.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/dealer/reset-password/${rawToken}`;

    // Send email if configured
    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        });
        await transporter.sendMail({
          from:    `"Metro Appliances" <${process.env.MAIL_USER}>`,
          to:      dealer.email,
          subject: 'Dealer Portal — Password Reset Request',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fff;border-radius:12px;">
              <h2 style="color:#111;margin-bottom:8px;">Reset your password</h2>
              <p style="color:#555;margin-bottom:24px;">Hi ${dealer.ownerName}, click the button below to reset your dealer portal password. This link expires in 1 hour.</p>
              <a href="${resetUrl}" style="display:inline-block;background:#FF7A00;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;">Reset Password</a>
              <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error('[DealerAuth] forgot-password email failed:', mailErr.message);
      }
    } else {
      // Development: log the URL
      console.log('[DealerAuth] Reset URL (dev):', resetUrl);
    }

    res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[DealerAuth] forgotPassword error:', err);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

// ── @PUT /api/dealer/auth/reset-password/:token ──────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const dealer = await Dealer.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
      isDeleted: false,
    });

    if (!dealer) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired' });
    }

    dealer.password             = password;
    dealer.resetPasswordToken   = null;
    dealer.resetPasswordExpiry  = null;
    await dealer.save();

    sendToken(dealer, 200, res);
  } catch (err) {
    console.error('[DealerAuth] resetPassword error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// ── @POST /api/dealer/documents/:docType ─────────────────────────────────────
// File is already uploaded to Cloudinary by multer middleware before this runs
exports.uploadDocument = async (req, res) => {
  try {
    const { docType } = req.params;
    const validTypes = ['gstCertificate','panCard','shopLicense','visitingCard','storefrontPhoto'];

    if (!validTypes.includes(docType)) {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const update = {
      [`documents.${docType}.url`]:        req.file.path,
      [`documents.${docType}.public_id`]:  req.file.filename,
      [`documents.${docType}.uploadedAt`]: new Date(),
      [`documents.${docType}.verified`]:   false,
    };

    const dealer = await Dealer.findByIdAndUpdate(
      req.dealer._id,
      { $set: update },
      { new: true }
    );

    // Promote KYC status to 'submitted' when mandatory docs are present
    const docs = dealer.documents;
    if (docs.gstCertificate?.url && docs.panCard?.url && dealer.kycStatus === 'pending') {
      await Dealer.findByIdAndUpdate(req.dealer._id, { kycStatus: 'submitted' });
      dealer.kycStatus = 'submitted';
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      document: dealer.documents[docType],
      kycStatus: dealer.kycStatus,
    });
  } catch (err) {
    console.error('[DealerAuth] uploadDocument error:', err);
    res.status(500).json({ success: false, message: 'Document upload failed' });
  }
};
