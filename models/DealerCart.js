const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity:     { type: Number, required: true, min: 1 },
  dealerPrice:  { type: Number, required: true, min: 0 },
  mrp:          { type: Number, required: true, min: 0 },
  moq:          { type: Number, default: 1, min: 1 },
  caseQuantity: { type: Number, default: 1, min: 1 },
}, { _id: true });

const dealerCartSchema = new mongoose.Schema({
  dealer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dealer',
    required: true,
    unique: true,
  },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });

dealerCartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, i) => sum + i.quantity, 0);
});

dealerCartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, i) => sum + i.quantity * i.dealerPrice, 0);
});

module.exports = mongoose.model('DealerCart', dealerCartSchema);
