const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:        { type: String, required: true },
  image:       { type: String, default: '' },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  variantId:   { type: String, default: '' },
  variantName: { type: String, default: '' },
  variantSku:  { type: String, default: '' },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
  },
  paymentMethod: { type: String, enum: ['COD', 'Stripe'], required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
  stripePaymentIntentId: { type: String, default: '' },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  couponCode: { type: String, default: '' },
  couponDiscount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  statusHistory: [{
    status: String,
    note: String,
    trackingId: String,
    updatedAt: { type: Date, default: Date.now },
  }],
  trackingId: { type: String, default: '' },
  deliveredAt: Date,
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'HK' + Date.now().toString().slice(-8) + Math.floor(1000 + Math.random() * 9000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);