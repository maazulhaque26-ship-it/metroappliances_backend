'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetHierarchySchema = new Schema({
  asset:         { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
  parentAsset:   { type: Schema.Types.ObjectId, ref: 'Asset' },
  children:      [{ type: Schema.Types.ObjectId, ref: 'Asset' }],
  level:         { type: Number, default: 0 },
  path:          { type: String, default: '' },  // e.g. "AST-2026-00001/AST-2026-00002"
  systemCode:    { type: String, default: '' },  // functional location code
  systemName:    { type: String, default: '' },
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });

assetHierarchySchema.index({ asset: 1 });
assetHierarchySchema.index({ parentAsset: 1 });
assetHierarchySchema.index({ path: 1 });

module.exports = mongoose.model('AssetHierarchy', assetHierarchySchema);
