'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectDependencySchema = new Schema({
  task:      { type: Schema.Types.ObjectId, ref: 'ProjectTask', required: true },
  dependsOn: { type: Schema.Types.ObjectId, ref: 'ProjectTask', required: true },
  type:      { type: String, enum: ['finish_to_start','start_to_start','finish_to_finish','start_to_finish'], default: 'finish_to_start' },
  lagDays:   { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

projectDependencySchema.index({ task: 1 });
projectDependencySchema.index({ dependsOn: 1 });

module.exports = mongoose.model('ProjectDependency', projectDependencySchema);
