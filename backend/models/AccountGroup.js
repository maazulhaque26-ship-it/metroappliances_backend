const mongoose = require('mongoose');

const accountGroupSchema = new mongoose.Schema({
  groupCode:    { type: String, unique: true },
  groupName:    { type: String, required: true, trim: true },
  groupType:    { type: String, required: true, enum: ['asset','liability','equity','revenue','expense'] },
  parentGroup:  { type: mongoose.Schema.Types.ObjectId, ref: 'AccountGroup', default: null },
  nature:       { type: String, enum: ['debit','credit'], required: true },
  description:  { type: String, default: '' },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

accountGroupSchema.pre('validate', async function (next) {
  if (this.groupCode) return next();
  const count = await this.constructor.countDocuments();
  this.groupCode = `AG-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('AccountGroup', accountGroupSchema);
