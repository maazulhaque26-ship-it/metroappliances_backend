const mongoose = require('mongoose');
const { Schema } = mongoose;

const widgetSchema = new Schema({
  widgetId:   { type: String, required: true },
  widgetType: { type: String, enum: ['metric_card','bar_chart','line_chart','pie_chart','table','heatmap','gauge','trend','kpi_band'] },
  title:  String,
  module: String,
  metric: String,
  position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
  size:     { w: { type: Number, default: 4 }, h: { type: Number, default: 2 } },
  config:   Schema.Types.Mixed,
}, { _id: false });

const biDashboardSchema = new Schema({
  dashboardCode:  { type: String, unique: true },
  name:           { type: String, required: true, trim: true },
  dashboardType:  { type: String, enum: ['custom','ceo','coo','cfo','chro','operations','manufacturing','supply_chain','sales','customer','projects','enterprise'], default: 'custom' },
  owner:          { type: Schema.Types.ObjectId, ref: 'User' },
  isDefault:      { type: Boolean, default: false },
  isShared:       { type: Boolean, default: false },
  sharedWith:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
  widgets:        [widgetSchema],
  filters:        Schema.Types.Mixed,
  refreshInterval:{ type: Number, default: 15 },
  lastViewed:     Date,
  viewCount:      { type: Number, default: 0 },
}, { timestamps: true });

biDashboardSchema.index({ owner: 1, dashboardType: 1 });
biDashboardSchema.index({ isShared: 1 });

biDashboardSchema.pre('validate', async function (next) {
  if (!this.dashboardCode) {
    const y = new Date().getFullYear();
    const count = await mongoose.model('BIDashboard').countDocuments({ dashboardCode: new RegExp(`^BID-${y}-`) });
    this.dashboardCode = `BID-${y}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('BIDashboard', biDashboardSchema);
