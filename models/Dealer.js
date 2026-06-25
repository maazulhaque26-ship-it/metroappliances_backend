const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
  'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim',
  'Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry',
  'Andaman & Nicobar Islands','Dadra & Nagar Haveli','Daman & Diu','Lakshadweep',
];

const docSlot = new mongoose.Schema({
  url:        { type: String, default: '' },
  public_id:  { type: String, default: '' },
  uploadedAt: { type: Date,   default: null },
  verified:   { type: Boolean, default: false },
}, { _id: false });

const dealerSchema = new mongoose.Schema({

  // ── Auto-generated dealer code (MTR-DLR-XXXXX) ────────────────────────────
  dealerCode: { type: String, unique: true, sparse: true },

  // ── Business Info ─────────────────────────────────────────────────────────
  businessName: {
    type: String, required: [true, 'Business name is required'],
    trim: true, maxlength: [200, 'Business name cannot exceed 200 characters'],
  },
  businessCategory: {
    type: String, required: [true, 'Business category is required'],
    enum: {
      values: ['appliances','electronics','furniture','hardware','home_decor',
               'kitchen','lighting','plumbing','sanitary','multi_brand','other'],
      message: 'Invalid business category',
    },
  },
  dealerType: {
    type: String, required: [true, 'Dealer type is required'],
    enum: { values: ['retail','wholesale','distributor'], message: 'Invalid dealer type' },
  },
  yearsInBusiness: { type: Number, min: 0, max: 100, default: 0 },
  website:         { type: String, default: '', trim: true },

  // ── Owner / Contact ───────────────────────────────────────────────────────
  ownerName: {
    type: String, required: [true, 'Owner name is required'],
    trim: true, maxlength: [100, 'Owner name too long'],
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String, required: [true, 'Phone number is required'], trim: true,
    match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
  },
  alternatePhone: { type: String, default: '', trim: true },
  password: {
    type: String, required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'], select: false,
  },

  // ── Address ───────────────────────────────────────────────────────────────
  addressLine1: { type: String, required: [true, 'Address is required'], trim: true },
  addressLine2: { type: String, default: '', trim: true },
  city:         { type: String, required: [true, 'City is required'], trim: true },
  district:     { type: String, default: '', trim: true },
  state: {
    type: String, required: [true, 'State is required'],
    enum: { values: INDIAN_STATES, message: 'Invalid state' },
  },
  pincode: {
    type: String, required: [true, 'Pincode is required'], trim: true,
    match: [/^\d{6}$/, 'Pincode must be 6 digits'],
  },
  geoLocation: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },

  // ── Tax & Legal ───────────────────────────────────────────────────────────
  gstNumber: {
    type: String, required: [true, 'GST number is required'],
    uppercase: true, trim: true,
    match: [/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GST number format'],
  },
  panNumber: {
    type: String, required: [true, 'PAN number is required'],
    uppercase: true, trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format'],
  },

  // ── Status & KYC ─────────────────────────────────────────────────────────
  status:    { type: String, enum: ['pending','approved','rejected','suspended'], default: 'pending', index: true },
  kycStatus: { type: String, enum: ['pending','submitted','verified','rejected'],  default: 'pending' },

  // ── Documents ─────────────────────────────────────────────────────────────
  documents: {
    gstCertificate:  { type: docSlot, default: () => ({}) },
    panCard:         { type: docSlot, default: () => ({}) },
    shopLicense:     { type: docSlot, default: () => ({}) },
    visitingCard:    { type: docSlot, default: () => ({}) },
    storefrontPhoto: { type: docSlot, default: () => ({}) },
  },

  // ── Bank Details (optional at registration) ───────────────────────────────
  bankDetails: {
    accountHolderName: { type: String, default: '' },
    accountNumber:     { type: String, default: '' },
    bankName:          { type: String, default: '' },
    ifscCode:          {
      type: String, default: '',
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$|^$/, 'Invalid IFSC code'],
    },
    branchName:  { type: String, default: '' },
    accountType: { type: String, enum: ['savings','current',''], default: '' },
  },

  // ── Admin / Workflow ──────────────────────────────────────────────────────
  createdBy:       { type: String, default: 'self' },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvalDate:    { type: Date,   default: null },
  rejectionReason: { type: String, default: '' },
  remarks:         { type: String, default: '' },

  // ── Auth helpers ──────────────────────────────────────────────────────────
  lastLogin:           { type: Date,   default: null },
  resetPasswordToken:  { type: String, select: false, default: null },
  resetPasswordExpiry: { type: Date,   select: false, default: null },

  // ── Soft delete ───────────────────────────────────────────────────────────
  isActive:  { type: Boolean, default: true,  index: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date,    default: null },

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ── Indexes ───────────────────────────────────────────────────────────────────
dealerSchema.index({ status: 1, isDeleted: 1 });
dealerSchema.index({ state: 1, city: 1 });
dealerSchema.index({ createdAt: -1 });
dealerSchema.index({ geoLocation: '2dsphere' });

// ── Hash password before save ────────────────────────────────────────────────
dealerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Auto-generate dealer code ────────────────────────────────────────────────
dealerSchema.pre('save', async function (next) {
  if (this.dealerCode) return next();
  const count = await mongoose.model('Dealer').countDocuments();
  this.dealerCode = `MTR-DLR-${String(count + 1).padStart(5, '0')}`;
  next();
});

dealerSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Dealer', dealerSchema);
