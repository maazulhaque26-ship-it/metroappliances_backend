const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:         { type: String, required: true, trim: true },
  symbol:       { type: String, required: true },
  decimalPlaces:{ type: Number, default: 2 },
  isBase:       { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  isDeleted:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Currency', currencySchema);
