const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // ── Brand ─────────────────────────────────────────────────────────────────
  storeName:       { type: String, default: 'Metro Appliances' },
  storeLogo:       { type: String, default: '' },
  transparentLogo: { type: String, default: '' },
  darkLogo:        { type: String, default: '' },
  lightLogo:       { type: String, default: '' },
  storeFavicon:    { type: String, default: '' },
  storeTagline:    { type: String, default: 'Your one-stop destination for home appliances' },
  copyrightText:   { type: String, default: '© 2026 Metro Appliances. All rights reserved.' },
  maintenanceMode: { type: Boolean, default: false },

  // ── Commerce ───────────────────────────────────────────────────────────────
  currency:              { type: String,  default: '₹' },
  freeShippingEnabled:   { type: Boolean, default: true },
  freeShippingThreshold: { type: Number,  default: 5000 },
  shippingCharge:        { type: Number,  default: 99 },
  taxRate:               { type: Number,  default: 18 },
  hideExpiredOffers:     { type: Boolean, default: true },

  // ── SEO ────────────────────────────────────────────────────────────────────
  metaTitle:       { type: String, default: 'Metro Appliances - Best Home Appliances Online' },
  metaDescription: { type: String, default: 'Shop best home appliances at lowest prices' },

  // ── Contact ───────────────────────────────────────────────────────────────
  phone:         { type: String, default: '1800-123-4567' },
  email:         { type: String, default: 'support@metroappliances.com' },
  whatsapp:      { type: String, default: '' },
  storeAddress:  { type: String, default: '' },
  fullAddress:   { type: String, default: '' },
  mapEmbedUrl:   { type: String, default: '' },
  officeHours:   { type: String, default: 'Mon–Sat: 9 AM – 7 PM' },
  holidayNotice: { type: String, default: '' },
  branches: {
    type: [{
      name:    { type: String, default: '' },
      address: { type: String, default: '' },
      phone:   { type: String, default: '' },
      hours:   { type: String, default: '' },
    }],
    default: [],
  },

  // ── Social Links ──────────────────────────────────────────────────────────
  facebook:  { type: String, default: '' },
  twitter:   { type: String, default: '' },
  instagram: { type: String, default: '' },
  youtube:   { type: String, default: '' },
  linkedin:  { type: String, default: '' },
  telegram:  { type: String, default: '' },

  // ── Footer CMS ─────────────────────────────────────────────────────────────
  footerTagline:   { type: String, default: 'Premium appliances engineered for modern Indian living.' },
  footerQuickLinks: {
    type: [{
      label: { type: String, default: '' },
      path:  { type: String, default: '' },
    }],
    default: [],
  },
  footerSupportLinks: {
    type: [{
      label: { type: String, default: '' },
      path:  { type: String, default: '' },
    }],
    default: [],
  },
  footerPolicyLinks: {
    type: [{
      label: { type: String, default: '' },
      path:  { type: String, default: '' },
    }],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);