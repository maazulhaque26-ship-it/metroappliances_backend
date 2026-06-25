const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditLogSchema = new Schema({
  admin:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  adminName:   { type: String, default: '' },
  adminEmail:  { type: String, default: '' },
  adminRole:   { type: String, default: '' },
  action:      { type: String, required: true },  // e.g. 'DEALER_APPROVED'
  entity:      { type: String, required: true },  // e.g. 'Dealer'
  entityId:    { type: Schema.Types.ObjectId },
  entityLabel: { type: String, default: '' },     // human-readable name/email
  changes: {
    before: { type: Schema.Types.Mixed, default: null },
    after:  { type: Schema.Types.Mixed, default: null },
  },
  ip:        { type: String, default: 'unknown' },
  userAgent: { type: String, default: 'unknown' },
}, { timestamps: true });

// Compound indexes for the most common query patterns
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ admin:    1, createdAt: -1 });
auditLogSchema.index({ entity:   1, createdAt: -1 });
auditLogSchema.index({ action:   1, createdAt: -1 });
auditLogSchema.index({ entityId: 1, createdAt: -1 });

// TTL: purge logs older than 2 years automatically
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63_072_000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
