/**
 * mailer.js — Professional Email Utility
 * ========================================
 * Handles all transactional emails for HomeKitchen.
 *
 * SETUP (one-time):
 *   npm install nodemailer
 *   Add to backend/.env:
 *     MAIL_USER=yourgmail@gmail.com
 *     MAIL_PASS=xxxx xxxx xxxx xxxx   ← Google App Password (16 chars)
 *     ADMIN_EMAIL=admin@metroappliances.com
 *     STORE_NAME=Metro Appliances
 *     CLIENT_URL=http://localhost:5173
 *
 * EXPORTS:
 *   sendCustomerReceipt(orderData)     → Thank you email to customer
 *   sendAdminNotification(orderData)   → New order alert to admin
 */

'use strict';

const nodemailer = require('nodemailer');

// ── Brand tokens ───────────────────────────────────────────────
const BRAND = {
  name:    process.env.STORE_NAME  || 'HomeKitchen',
  color:   '#FF9900',
  dark:    '#131921',
  url:     process.env.CLIENT_URL  || 'http://localhost:5173',
  support: process.env.MAIL_USER  ,
};

// ── Transporter (created lazily — only when first email is sent)
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error(
      'Email not configured. Add MAIL_USER and MAIL_PASS to backend/.env'
    );
  }

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,   // Google App Password — NOT your Gmail password
    },
    // Connection pool for better performance under load
    pool:            true,
    maxConnections:  3,
    maxMessages:     100,
  });

  return _transporter;
};

// ────────────────────────────────────────────────────────────────
// SHARED HTML HELPERS
// ────────────────────────────────────────────────────────────────

/** Wraps content in the base email shell (header + footer) */
const shell = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <title>${BRAND.name}</title>
  <style>
    /* Reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter',
                   Helvetica, Arial, sans-serif;
      background: #f5f5f7;
      color: #1d1d1f;
      -webkit-text-size-adjust: 100%;
    }
    a { color: ${BRAND.color}; text-decoration: none; }
    img { display: block; border: 0; }
    .email-wrapper {
      width: 100%;
      max-width: 600px;
      margin: 32px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .email-header {
      background: ${BRAND.dark};
      padding: 28px 40px;
      text-align: center;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .logo-accent { color: ${BRAND.color}; }
    .logo-white  { color: #ffffff; }
    .email-body  { padding: 40px; }
    .email-footer {
      background: #f5f5f7;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
    }
    .footer-text {
      font-size: 12px;
      color: #86868b;
      line-height: 1.6;
    }
    .divider {
      height: 1px;
      background: #f0f0f0;
      margin: 28px 0;
    }
    @media (max-width: 600px) {
      .email-wrapper { margin: 0; border-radius: 0; }
      .email-body    { padding: 28px 20px; }
      .email-header  { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header -->
    <div class="email-header">
      <div class="logo-text">
        <span class="logo-accent">${BRAND.name.slice(0, 4)}</span><span class="logo-white">${BRAND.name.slice(4)}</span>
      </div>
    </div>

    <!-- Body -->
    <div class="email-body">
      ${bodyContent}
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p class="footer-text">
        © ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.<br />
        Questions? Email us at
        <a href="mailto:${BRAND.support}">${BRAND.support}</a>
      </p>
      <p class="footer-text" style="margin-top: 8px;">
        You received this because you placed an order on
        <a href="${BRAND.url}">${BRAND.url}</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

/** Renders one order item row */
const itemRow = (item) => {
  const price  = item.price || 0;
  const qty    = item.quantity || 1;
  const total  = (price * qty).toLocaleString('en-IN');
  return `
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
      <div style="font-size: 14px; font-weight: 600; color: #1d1d1f; line-height: 1.4;">
        ${item.name || 'Product'}
      </div>
      <div style="font-size: 12px; color: #86868b; margin-top: 3px;">
        Qty: ${qty} × ₹${price.toLocaleString('en-IN')}
      </div>
    </td>
    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right;
               vertical-align: top; font-size: 14px; font-weight: 600; color: #1d1d1f;">
      ₹${total}
    </td>
  </tr>`;
};

/** Renders price summary rows */
const summaryRow = (label, value, highlight = false) => `
  <tr>
    <td style="padding: 5px 0; font-size: 14px; color: ${highlight ? '#1d1d1f' : '#515154'};
               font-weight: ${highlight ? '700' : '400'};">${label}</td>
    <td style="padding: 5px 0; font-size: 14px; text-align: right;
               color: ${highlight ? BRAND.color : '#1d1d1f'};
               font-weight: ${highlight ? '700' : '400'};">${value}</td>
  </tr>`;

/** Status badge pill */
const statusBadge = (paymentStatus) => {
  const isPaid = ['Paid', 'paid', 'Success', 'success', 'succeeded'].includes(paymentStatus);
  const bg     = isPaid ? '#d1fae5' : '#fef3c7';
  const fg     = isPaid ? '#065f46' : '#92400e';
  const icon   = isPaid ? '✅' : '⏳';
  const label  = isPaid ? 'Payment Confirmed' : 'Payment Pending';
  return `
  <span style="display: inline-block; background: ${bg}; color: ${fg};
               padding: 4px 14px; border-radius: 99px; font-size: 13px;
               font-weight: 600; letter-spacing: 0.2px;">
    ${icon} ${label}
  </span>`;
};

// ────────────────────────────────────────────────────────────────
// FUNCTION 1 — sendCustomerReceipt
// Sends a premium "Thank You" order confirmation to the customer
// ────────────────────────────────────────────────────────────────

/**
 * @param {Object} orderData
 * @param {string} orderData.customerName
 * @param {string} orderData.customerEmail
 * @param {string} orderData.orderId
 * @param {string} orderData.orderNumber
 * @param {Array}  orderData.items           — [{ name, price, quantity }]
 * @param {number} orderData.itemsPrice
 * @param {number} orderData.shippingPrice
 * @param {number} orderData.taxPrice
 * @param {number} orderData.totalPrice
 * @param {string} orderData.paymentStatus   — 'Paid' | 'Pending'
 * @param {string} orderData.paymentMethod   — 'Stripe' | 'COD'
 * @param {Object} orderData.shippingAddress
 */
const sendCustomerReceipt = async (orderData) => {
  try {
    const {
      customerName,
      customerEmail,
      orderId,
      orderNumber,
      items = [],
      itemsPrice    = 0,
      shippingPrice = 0,
      taxPrice      = 0,
      totalPrice    = 0,
      paymentStatus = 'Pending',
      paymentMethod = 'COD',
      shippingAddress = {},
    } = orderData;

    if (!customerEmail) {
      console.warn('[Mailer] sendCustomerReceipt — no customer email, skipping');
      return { success: false, reason: 'no_email' };
    }

    const firstName     = customerName?.split(' ')[0] || 'Customer';
    const isPaid        = ['Paid','paid','Success','success'].includes(paymentStatus);
    const trackOrderUrl = `${BRAND.url}/orders/${orderId}`;

    const addr = shippingAddress;
    const addressLine = [
      addr.addressLine1,
      addr.addressLine2,
      addr.city,
      addr.state,
      addr.pincode,
    ].filter(Boolean).join(', ');

    const body = `
      <!-- Greeting -->
      <h1 style="font-size: 26px; font-weight: 700; color: #1d1d1f;
                 letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 8px;">
        Thank you, ${firstName}! 🎉
      </h1>
      <p style="font-size: 15px; color: #515154; line-height: 1.6; margin-bottom: 20px;">
        ${isPaid
          ? 'Your payment was successful and your order is confirmed. We\'re preparing it for dispatch.'
          : 'Your order has been placed. Payment will be collected at delivery.'}
      </p>

      <!-- Status badge -->
      <div style="margin-bottom: 24px;">
        ${statusBadge(paymentStatus)}
      </div>

      <!-- Order meta -->
      <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 50%; padding-bottom: 12px;">
              <div style="font-size: 11px; color: #86868b; text-transform: uppercase;
                          letter-spacing: 0.8px; margin-bottom: 4px;">Order Number</div>
              <div style="font-size: 15px; font-weight: 700; color: ${BRAND.color};">
                #${orderNumber || orderId?.slice(-8).toUpperCase()}
              </div>
            </td>
            <td style="width: 50%; padding-bottom: 12px; text-align: right;">
              <div style="font-size: 11px; color: #86868b; text-transform: uppercase;
                          letter-spacing: 0.8px; margin-bottom: 4px;">Payment</div>
              <div style="font-size: 15px; font-weight: 600; color: #1d1d1f;">
                ${paymentMethod === 'Stripe' ? '💳 Card' : '💵 Cash on Delivery'}
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <div style="font-size: 11px; color: #86868b; text-transform: uppercase;
                          letter-spacing: 0.8px; margin-bottom: 4px;">Delivering to</div>
              <div style="font-size: 14px; color: #1d1d1f; line-height: 1.5;">
                <strong>${addr.fullName || customerName}</strong><br />
                ${addressLine || 'Address on file'}
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Order items -->
      <h2 style="font-size: 16px; font-weight: 700; color: #1d1d1f; margin-bottom: 16px;">
        📦 Items Ordered
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        ${items.map(itemRow).join('')}
      </table>

      <!-- Price summary -->
      <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${summaryRow('Subtotal',     `₹${itemsPrice.toLocaleString('en-IN')}`)}
          ${summaryRow('Shipping',     shippingPrice === 0 ? '🆓 FREE' : `₹${shippingPrice}`)}
          ${summaryRow('GST (18%)',    `₹${taxPrice.toLocaleString('en-IN')}`)}
          <tr><td colspan="2"><div class="divider" style="margin: 10px 0;"></div></td></tr>
          ${summaryRow('Total Paid',   `₹${totalPrice.toLocaleString('en-IN')}`, true)}
        </table>
      </div>

      <!-- CTA button -->
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${trackOrderUrl}"
           style="display: inline-block; background: ${BRAND.color}; color: #fff;
                  font-size: 15px; font-weight: 700; padding: 14px 36px;
                  border-radius: 10px; text-decoration: none; letter-spacing: 0.2px;">
          Track Your Order →
        </a>
      </div>

      <!-- Help note -->
      <p style="font-size: 13px; color: #86868b; line-height: 1.6; text-align: center;">
        Need help? Reply to this email or contact us at
        <a href="mailto:${BRAND.support}" style="color: ${BRAND.color};">${BRAND.support}</a>
      </p>
    `;

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from:    `"${BRAND.name}" <${process.env.MAIL_USER}>`,
      to:      customerEmail,
      subject: `Order Confirmed #${orderNumber || orderId?.slice(-8).toUpperCase()} — ${BRAND.name}`,
      html:    shell(body),
      // Plain-text fallback for email clients that block HTML
      text: [
        `Thank you for your order, ${firstName}!`,
        `Order #${orderNumber} | Total: ₹${totalPrice.toLocaleString('en-IN')}`,
        `Status: ${paymentStatus}`,
        `Track your order: ${trackOrderUrl}`,
      ].join('\n'),
    });

    console.log(`[Mailer] ✅ Customer receipt sent → ${customerEmail} (${info.messageId})`);
    return { success: true, messageId: info.messageId };

  } catch (err) {
    // Never crash the server — just log and return failure
    console.error('[Mailer] ❌ sendCustomerReceipt failed:', err.message);
    return { success: false, error: err.message };
  }
};

// ────────────────────────────────────────────────────────────────
// FUNCTION 2 — sendAdminNotification
// Sends a compact alert to the admin with full order details
// ────────────────────────────────────────────────────────────────

/**
 * @param {Object} orderData — same shape as sendCustomerReceipt
 */
const sendAdminNotification = async (orderData) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('[Mailer] sendAdminNotification — ADMIN_EMAIL not set, skipping');
      return { success: false, reason: 'no_admin_email' };
    }

    const {
      customerName,
      customerEmail,
      orderId,
      orderNumber,
      items = [],
      totalPrice    = 0,
      paymentStatus = 'Pending',
      paymentMethod = 'COD',
      shippingAddress = {},
    } = orderData;

    const isPaid        = ['Paid','paid','Success','success'].includes(paymentStatus);
    const adminOrderUrl = `${BRAND.url}/admin/orders/${orderId}`;
    const addr          = shippingAddress;

    const body = `
      <!-- Alert banner -->
      <div style="background: ${isPaid ? '#d1fae5' : '#fef3c7'}; border-radius: 10px;
                  padding: 16px 20px; margin-bottom: 28px; border-left: 4px solid
                  ${isPaid ? '#10b981' : '#f59e0b'};">
        <div style="font-size: 18px; font-weight: 700;
                    color: ${isPaid ? '#065f46' : '#92400e'}; margin-bottom: 4px;">
          ${isPaid ? '✅ New Paid Order Received!' : '⏳ New COD Order Placed'}
        </div>
        <div style="font-size: 13px; color: ${isPaid ? '#065f46' : '#92400e'};">
          ${isPaid
            ? 'Payment confirmed via Stripe. Please process this order.'
            : 'Cash on Delivery. Payment will be collected at doorstep.'}
        </div>
      </div>

      <!-- Quick stats -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
        <tr>
          ${[
            ['Order #',      `#${orderNumber || orderId?.slice(-8).toUpperCase()}`, BRAND.color],
            ['Amount',       `₹${totalPrice.toLocaleString('en-IN')}`,              '#1d1d1f'],
            ['Payment',      paymentMethod === 'Stripe' ? 'Stripe' : 'COD',         '#515154'],
          ].map(([label, val, color]) => `
          <td style="width: 33%; text-align: center; background: #f5f5f7;
                     border-radius: 10px; padding: 16px 8px; margin: 0 4px;">
            <div style="font-size: 11px; color: #86868b; text-transform: uppercase;
                        letter-spacing: 0.8px; margin-bottom: 6px;">${label}</div>
            <div style="font-size: 16px; font-weight: 700; color: ${color};">${val}</div>
          </td>`).join('<td width="8"></td>')}
        </tr>
      </table>

      <!-- Customer info -->
      <h2 style="font-size: 14px; font-weight: 700; color: #86868b;
                 text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">
        Customer Details
      </h2>
      <div style="background: #f5f5f7; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #86868b; width: 120px;">Name</td>
            <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1d1d1f;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #86868b;">Email</td>
            <td style="padding: 4px 0; font-size: 13px; font-weight: 600;">
              <a href="mailto:${customerEmail}" style="color: ${BRAND.color};">${customerEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #86868b; vertical-align: top;">Address</td>
            <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #1d1d1f; line-height: 1.5;">
              ${[addr.fullName, addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode]
                .filter(Boolean).join(', ')}
            </td>
          </tr>
        </table>
      </div>

      <!-- Items table -->
      <h2 style="font-size: 14px; font-weight: 700; color: #86868b;
                 text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">
        Items (${items.length})
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        ${items.map(itemRow).join('')}
        <tr>
          <td colspan="2" style="padding-top: 12px; text-align: right;">
            <strong style="font-size: 16px; color: ${BRAND.color};">
              Total: ₹${totalPrice.toLocaleString('en-IN')}
            </strong>
          </td>
        </tr>
      </table>

      <!-- Admin CTA -->
      <div style="text-align: center; margin-bottom: 8px;">
        <a href="${adminOrderUrl}"
           style="display: inline-block; background: ${BRAND.dark}; color: #fff;
                  font-size: 14px; font-weight: 700; padding: 12px 32px;
                  border-radius: 10px; text-decoration: none;">
          View & Manage Order →
        </a>
      </div>
    `;

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from:    `"${BRAND.name} Orders" <${process.env.MAIL_USER}>`,
      to:      adminEmail,
      subject: `${isPaid ? '✅ Paid' : '⏳ COD'} Order #${orderNumber || orderId?.slice(-8).toUpperCase()} — ₹${totalPrice.toLocaleString('en-IN')}`,
      html:    shell(body),
      text: [
        `New Order Alert — ${BRAND.name}`,
        `Order: #${orderNumber} | ₹${totalPrice} | ${paymentStatus}`,
        `Customer: ${customerName} <${customerEmail}>`,
        `Manage: ${adminOrderUrl}`,
      ].join('\n'),
    });

    console.log(`[Mailer] ✅ Admin notification sent → ${adminEmail} (${info.messageId})`);
    return { success: true, messageId: info.messageId };

  } catch (err) {
    console.error('[Mailer] ❌ sendAdminNotification failed:', err.message);
    return { success: false, error: err.message };
  }
};

// ────────────────────────────────────────────────────────────────
// VERIFY CONNECTION (optional — call at server startup to test)
// ────────────────────────────────────────────────────────────────

const verifyMailer = async () => {
  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.log('[Mailer] ⚠️  Email not configured — skipping verification');
      return false;
    }
    const transporter = getTransporter();
    await transporter.verify();
    console.log(`[Mailer] ✅ SMTP ready — ${process.env.MAIL_USER}`);
    return true;
  } catch (err) {
    console.error('[Mailer] ❌ SMTP connection failed:', err.message);
    return false;
  }
};

// ────────────────────────────────────────────────────────────────
// FUNCTION 3 — sendWelcomeNewsletter
// Sends a welcome email when a user subscribes to the newsletter
// ────────────────────────────────────────────────────────────────
const sendWelcomeNewsletter = async (email) => {
  try {
    const body = `
      <!-- Greeting -->
      <h1 style="font-size: 26px; font-weight: 700; color: #1d1d1f;
                 letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 8px;">
        Welcome to ${BRAND.name}! 🎉
      </h1>
      <p style="font-size: 15px; color: #515154; line-height: 1.6; margin-bottom: 20px;">
        Thank you for subscribing to our newsletter. We're excited to have you on board! You'll be the first to hear about our latest products, exclusive offers, and behind-the-scenes updates.
      </p>

      <!-- CTA button -->
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${BRAND.url}"
           style="display: inline-block; background: ${BRAND.color}; color: #fff;
                  font-size: 15px; font-weight: 700; padding: 14px 36px;
                  border-radius: 10px; text-decoration: none; letter-spacing: 0.2px;">
          Explore Our Store →
        </a>
      </div>

      <!-- Help note -->
      <p style="font-size: 13px; color: #86868b; line-height: 1.6; text-align: center;">
        If you have any questions, feel free to reply to this email or contact us at
        <a href="mailto:${BRAND.support}" style="color: ${BRAND.color};">${BRAND.support}</a>
      </p>
    `;

    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from:    `"${BRAND.name}" <${process.env.MAIL_USER}>`,
      to:      email,
      subject: `Welcome to the ${BRAND.name} Newsletter! 🎉`,
      html:    shell(body),
      text: [
        `Welcome to ${BRAND.name}! 🎉`,
        `Thank you for subscribing to our newsletter.`,
        `Explore our store: ${BRAND.url}`,
      ].join('\n'),
    });

    console.log(`[Mailer] ✅ Welcome newsletter sent → ${email} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Mailer] ❌ sendWelcomeNewsletter failed:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendCustomerReceipt, sendAdminNotification, sendWelcomeNewsletter, verifyMailer };