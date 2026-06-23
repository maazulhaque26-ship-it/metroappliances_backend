const DealerPayment     = require('../models/DealerPayment');
const DealerInvoice     = require('../models/DealerInvoice');
const DealerNotification = require('../models/DealerNotification');
const { addLedgerEntry } = require('../utils/dealerFinanceHelpers');

// ── Dealer ────────────────────────────────────────────────────────────────────

// GET /api/dealer/finance/payments
exports.getMyPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, search } = req.query;
    const filter = { dealer: req.dealer._id };
    if (type)   filter.type   = type;
    if (status) filter.status = status;
    if (search) filter.$or = [
      { paymentNumber:   { $regex: search, $options: 'i' } },
      { referenceNumber: { $regex: search, $options: 'i' } },
    ];

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerPayment.countDocuments(filter);

    const payments = await DealerPayment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true, payments,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Get dealer payments error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dealer/finance/payments/:id
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await DealerPayment.findOne({
      _id:    req.params.id,
      dealer: req.dealer._id,
    }).populate('invoices.invoice', 'invoiceNumber grandTotal status');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    res.json({ success: true, payment });
  } catch (err) {
    console.error('Get payment by id error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/admin/dealer-finance/payments
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, dealer, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type)   filter.type   = type;
    if (dealer) filter.dealer = dealer;
    if (search) filter.$or = [
      { paymentNumber:   { $regex: search, $options: 'i' } },
      { referenceNumber: { $regex: search, $options: 'i' } },
    ];

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerPayment.countDocuments(filter);

    const payments = await DealerPayment.find(filter)
      .populate('dealer', 'dealerCode businessName email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true, payments,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Admin get payments error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/payments  — admin records a payment
exports.createPayment = async (req, res) => {
  try {
    const {
      dealerId, amount, type, method, referenceNumber,
      bankDetails, invoices, notes, adminNotes,
    } = req.body;

    if (!dealerId || !amount || !type || !method) {
      return res.status(400).json({ success: false, message: 'dealerId, amount, type, method required' });
    }

    const payment = await DealerPayment.create({
      dealer:          dealerId,
      amount,
      type:            type || 'payment',
      method,
      referenceNumber: referenceNumber || '',
      bankDetails:     bankDetails || {},
      invoices:        invoices || [],
      status:          'pending',
      notes:           notes || '',
      adminNotes:      adminNotes || '',
      createdBy:       req.user._id,
    });

    res.status(201).json({ success: true, message: 'Payment recorded', payment });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/payments/:id/verify
exports.verifyPayment = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const payment = await DealerPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    if (payment.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Payment is already processed' });
    }

    payment.status     = 'verified';
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();
    if (adminNotes) payment.adminNotes = adminNotes;
    await payment.save();

    // Create ledger credit entry
    await addLedgerEntry({
      dealer:      payment.dealer,
      type:        'credit',
      category:    payment.type === 'refund' ? 'refund' : 'payment',
      amount:      payment.amount,
      description: `Payment ${payment.paymentNumber} verified (${payment.method})`,
      refType:     'DealerPayment',
      refId:       payment._id,
      reference:   payment.paymentNumber,
      status:      'na',
      createdBy:   req.user._id,
    });

    // Mark linked invoices as paid if fully covered
    if (payment.invoices?.length) {
      for (const link of payment.invoices) {
        await DealerInvoice.findByIdAndUpdate(link.invoice, { status: 'paid', paidAt: new Date() });
      }
    }

    // Notify dealer
    await DealerNotification.create({
      dealer:  payment.dealer,
      type:    'pricing',
      title:   'Payment Verified',
      message: `Your payment of ₹${payment.amount.toLocaleString('en-IN')} (${payment.paymentNumber}) has been verified.`,
      link:    `/dealer/finance/payments/${payment._id}`,
    });

    res.json({ success: true, message: 'Payment verified', payment });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/payments/:id/reject
exports.rejectPayment = async (req, res) => {
  try {
    const { failureReason } = req.body;
    const payment = await DealerPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.status        = 'failed';
    payment.failureReason = failureReason || '';
    await payment.save();

    res.json({ success: true, message: 'Payment rejected', payment });
  } catch (err) {
    console.error('Reject payment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
