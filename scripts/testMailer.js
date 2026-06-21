/**
 * testMailer.js
 * Run: node testMailer.js
 * Place this file in your backend/ folder
 */
require('dotenv').config();
const { sendCustomerReceipt, sendAdminNotification, verifyMailer } = require('./utils/mailer');

const mockOrder = {
  customerName:    'Rahul Sharma',
  customerEmail:   process.env.MAIL_USER, // sends to yourself for testing
  orderId:         '64f1a2b3c4d5e6f7a8b9c0d1',
  orderNumber:     'HK556667719813',
  items: [
    { name: 'IFB 30L Convection Oven',         price: 14499, quantity: 1 },
    { name: 'Samsung 253L Refrigerator',        price: 24499, quantity: 1 },
  ],
  itemsPrice:    38998,
  shippingPrice: 0,
  taxPrice:      7020,
  totalPrice:    46018,
  paymentStatus: 'Paid',
  paymentMethod: 'Stripe',
  shippingAddress: {
    fullName:     'Rahul Sharma',
    phone:        '9999999999',
    addressLine1: 'Shaheen Bagh, Okhla',
    city:         'Delhi',
    state:        'Delhi',
    pincode:      '110025',
  },
};

const run = async () => {
  console.log('\n🔍 Step 1 — Verifying SMTP connection...');
  const ok = await verifyMailer();
  if (!ok) {
    console.error('❌ SMTP failed. Check MAIL_USER and MAIL_PASS in .env');
    process.exit(1);
  }

  console.log('\n📧 Step 2 — Sending customer receipt...');
  const r1 = await sendCustomerReceipt(mockOrder);
  console.log(r1.success ? `✅ Customer email sent! ID: ${r1.messageId}` : `❌ Failed: ${r1.error}`);

  console.log('\n🔔 Step 3 — Sending admin notification...');
  const r2 = await sendAdminNotification(mockOrder);
  console.log(r2.success ? `✅ Admin email sent! ID: ${r2.messageId}` : `❌ Failed: ${r2.error}`);

  console.log('\n✅ Done! Check your inbox at:', process.env.MAIL_USER);
  console.log('   Also check ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
};

run().catch(console.error);