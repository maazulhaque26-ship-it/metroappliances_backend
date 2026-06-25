// Shared invoice generator — single source of truth.
// Both Orders.jsx and OrderDetailPage.jsx call openInvoice(order).
// No PDF library dependency; renders a styled print window.
export function openInvoice(order) {
  if (!order) return;
  const w = window.open('', '_blank', 'width=860,height=1000');
  if (!w) return;

  const addr = order.shippingAddress;

  const shippingBlock = addr ? `
    <p style="font-weight:700;color:#111111;">${addr.fullName || ''}</p>
    <p>${addr.addressLine1 || ''}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}</p>
    <p>${addr.city || ''}${addr.state ? ', ' + addr.state : ''}${addr.pincode ? ' — ' + addr.pincode : ''}</p>
    ${addr.phone ? `<p>📞 ${addr.phone}</p>` : ''}
  ` : '<p>—</p>';

  const rows = order.items.map(it => `
    <tr>
      <td>
        <div class="item-name">${it.name}</div>
        ${it.variantName ? `<div class="item-variant">${it.variantName}</div>` : ''}
      </td>
      <td class="t-center">${it.quantity}</td>
      <td class="t-right">₹${it.price?.toLocaleString('en-IN')}</td>
      <td class="t-right">₹${(it.price * it.quantity)?.toLocaleString('en-IN')}</td>
    </tr>`).join('');

  const subtotalExGst = order.itemsPrice ? Math.round((order.itemsPrice / 1.18) * 100) / 100 : 0;
  const gstAmt        = order.taxPrice   ?? Math.round(order.itemsPrice * 0.18 * 100) / 100;
  const invDate       = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const orderDate     = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  w.document.write(`
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Invoice #${order.orderNumber || order._id}</title>
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111111; background: #fff; padding: 48px 56px; font-size: 13px; line-height: 1.5; }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .brand-name { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #FF7A00; margin-bottom: 3px; }
        .brand-tagline { font-size: 10px; color: #999999; text-transform: uppercase; letter-spacing: 0.08em; }
        .inv-meta { text-align: right; }
        .inv-title { font-size: 28px; font-weight: 800; color: #111111; letter-spacing: -0.03em; line-height: 1; }
        .inv-num { font-size: 11px; color: #666666; margin-top: 6px; }

        /* Divider */
        hr { border: none; border-top: 1.5px solid #111111; margin: 24px 0; }
        .hr-light { border: none; border-top: 1px solid #EEEEEE; margin: 16px 0; }

        /* Addresses */
        .addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 32px; }
        .addr-label { font-size: 9px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #999999; margin-bottom: 8px; }
        .addr-block { font-size: 12px; color: #444444; line-height: 1.7; }
        .addr-block p { margin: 0; }

        /* Order meta */
        .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background: #F7F6F3; padding: 16px 20px; margin-bottom: 32px; border-radius: 4px; }
        .meta-item-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #999999; margin-bottom: 3px; }
        .meta-item-value { font-size: 12px; font-weight: 700; color: #111111; }

        /* Items table */
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead th {
          text-align: left; border-bottom: 1.5px solid #111111;
          padding: 8px 6px; font-size: 10px; text-transform: uppercase;
          letter-spacing: 0.08em; color: #666666; font-weight: 700;
        }
        tbody td { border-bottom: 1px solid #EEEEEE; padding: 11px 6px; font-size: 12px; vertical-align: top; }
        .item-name { font-weight: 600; color: #111111; }
        .item-variant { font-size: 10px; color: #FF7A00; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
        .t-center { text-align: center; }
        .t-right { text-align: right; }

        /* Totals */
        .totals-wrap { display: flex; justify-content: flex-end; }
        .totals { width: 300px; }
        .totals-row { display: flex; justify-content: space-between; font-size: 12px; color: #555555; padding: 5px 0; }
        .totals-row.free { color: #16A34A; font-weight: 700; }
        .totals-grand { display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #111111; border-top: 1.5px solid #111111; margin-top: 8px; padding-top: 12px; }

        /* GST note */
        .gst-note { margin-top: 8px; font-size: 9px; color: #999999; text-align: right; }

        /* Footer */
        .footer { margin-top: 56px; border-top: 1px solid #EEEEEE; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .footer-thanks { font-size: 11px; color: #111111; font-weight: 700; letter-spacing: 0.05em; }
        .footer-note { font-size: 9px; color: #AAAAAA; text-transform: uppercase; letter-spacing: 0.1em; }

        /* Print button */
        .print-btn { display: block; margin: 32px auto 0; padding: 12px 32px; background: #111111; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; border: none; cursor: pointer; border-radius: 2px; }
        .print-btn:hover { background: #333333; }
        @media print { .print-btn { display: none !important; } }
      </style>
    </head>
    <body>

      <!-- Header -->
      <div class="header">
        <div>
          <div class="brand-name">Metro Appliances</div>
          <div class="brand-tagline">Premium Home Appliances</div>
        </div>
        <div class="inv-meta">
          <div class="inv-title">Invoice</div>
          <div class="inv-num">#${order.orderNumber || order._id?.slice(-8).toUpperCase()}</div>
        </div>
      </div>

      <hr />

      <!-- Order meta -->
      <div class="meta-grid">
        <div>
          <div class="meta-item-label">Invoice Date</div>
          <div class="meta-item-value">${invDate}</div>
        </div>
        <div>
          <div class="meta-item-label">Order Date</div>
          <div class="meta-item-value">${orderDate}</div>
        </div>
        <div>
          <div class="meta-item-label">Payment</div>
          <div class="meta-item-value">${order.paymentMethod} · ${order.paymentStatus}</div>
        </div>
      </div>

      <!-- Addresses -->
      <div class="addr-grid">
        <div>
          <div class="addr-label">Bill To / Sold To</div>
          <div class="addr-block">${shippingBlock}</div>
        </div>
        <div>
          <div class="addr-label">Ship To</div>
          <div class="addr-block">${shippingBlock}</div>
        </div>
      </div>

      <!-- Items -->
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="t-center">Qty</th>
            <th class="t-right">Unit Price</th>
            <th class="t-right">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <!-- Totals -->
      <div class="totals-wrap">
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal (excl. GST)</span>
            <span>₹${subtotalExGst.toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-row">
            <span>GST (18%)</span>
            <span>₹${gstAmt?.toLocaleString('en-IN') || 0}</span>
          </div>
          <div class="totals-row ${order.shippingPrice === 0 ? 'free' : ''}">
            <span>Shipping</span>
            <span>${order.shippingPrice === 0 ? 'FREE' : '₹' + order.shippingPrice}</span>
          </div>
          <div class="totals-grand">
            <span>Total</span>
            <span>₹${order.totalPrice?.toLocaleString('en-IN')}</span>
          </div>
          <div class="gst-note">All prices include applicable GST · GSTIN: Not applicable</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div>
          <div class="footer-thanks">Thank you for shopping with Metro Appliances</div>
          <div class="footer-note" style="margin-top:4px;">This is a computer-generated invoice and does not require a signature.</div>
        </div>
        <div class="footer-note">support@metro.in</div>
      </div>

      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>

    </body>
    </html>`);
  w.document.close();
  w.focus();
  w.print();
}
