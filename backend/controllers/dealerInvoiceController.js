const DealerInvoice = require('../models/DealerInvoice');
const DealerOrder   = require('../models/DealerOrder');
const Dealer        = require('../models/Dealer');
const { addLedgerEntry } = require('../utils/dealerFinanceHelpers');

// ── Dealer ────────────────────────────────────────────────────────────────────

// GET /api/dealer/finance/invoices
exports.getMyInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const filter = { dealer: req.dealer._id };
    if (status) filter.status = status;
    if (search) filter.invoiceNumber = { $regex: search, $options: 'i' };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerInvoice.countDocuments(filter);

    const invoices = await DealerInvoice.find(filter)
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-items'); // exclude items for list view

    res.json({
      success: true, invoices,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Get dealer invoices error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dealer/finance/invoices/:id
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await DealerInvoice.findOne({
      _id:    req.params.id,
      dealer: req.dealer._id,
    })
      .populate('order', 'orderNumber status')
      .populate('dealer', 'businessName gstNumber ownerName addressLine1 addressLine2 city state pincode phone email');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Get invoice by id error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/admin/dealer-finance/invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, dealer, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dealer) filter.dealer = dealer;
    if (search) filter.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
    ];

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerInvoice.countDocuments(filter);

    const invoices = await DealerInvoice.find(filter)
      .populate('dealer', 'dealerCode businessName email')
      .populate('order',  'orderNumber')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-items');

    res.json({
      success: true, invoices,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Admin get invoices error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dealer-finance/invoices/:id
exports.getAdminInvoiceById = async (req, res) => {
  try {
    const invoice = await DealerInvoice.findById(req.params.id)
      .populate('dealer', 'businessName gstNumber ownerName addressLine1 addressLine2 city state pincode phone email dealerCode')
      .populate('order',  'orderNumber status')
      .populate('createdBy', 'name email');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Admin get invoice error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/invoices  — create invoice (manual or from order)
exports.createInvoice = async (req, res) => {
  try {
    const {
      dealerId,
      orderId,
      items,
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      totalTax,
      grandTotal,
      roundOff,
      gstType,
      supplyType,
      transportDetails,
      billingAddress,
      shippingAddress,
      dueDate,
      notes,
    } = req.body;

    if (!dealerId || !items?.length || subtotal === undefined || grandTotal === undefined) {
      return res.status(400).json({ success: false, message: 'dealerId, items, subtotal, grandTotal required' });
    }

    // Fetch dealer to auto-fill billing address if not provided
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });

    const billing = billingAddress || {
      businessName: dealer.businessName,
      gstNumber:    dealer.gstNumber,
      addressLine1: dealer.addressLine1,
      addressLine2: dealer.addressLine2,
      city:         dealer.city,
      state:        dealer.state,
      pincode:      dealer.pincode,
    };

    const shipping = shippingAddress || {
      addressLine1: dealer.addressLine1,
      addressLine2: dealer.addressLine2,
      city:         dealer.city,
      state:        dealer.state,
      pincode:      dealer.pincode,
    };

    const invoice = await DealerInvoice.create({
      dealer: dealerId,
      order:  orderId || null,
      items,
      subtotal,
      cgstTotal:  cgstTotal  || 0,
      sgstTotal:  sgstTotal  || 0,
      igstTotal:  igstTotal  || 0,
      totalTax:   totalTax   || 0,
      roundOff:   roundOff   || 0,
      grandTotal,
      gstType:    gstType    || 'B2B',
      supplyType: supplyType || 'intrastate',
      transportDetails: transportDetails || {},
      billingAddress:   billing,
      shippingAddress:  shipping,
      status:    'issued',
      dueDate:   dueDate ? new Date(dueDate) : null,
      notes:     notes || '',
      createdBy: req.user._id,
    });

    // Create ledger debit entry
    await addLedgerEntry({
      dealer:      dealerId,
      type:        'debit',
      category:    'invoice_charge',
      amount:      grandTotal,
      description: `Invoice ${invoice.invoiceNumber} issued`,
      refType:     'DealerInvoice',
      refId:       invoice._id,
      reference:   invoice.invoiceNumber,
      dueDate:     dueDate ? new Date(dueDate) : null,
      status:      'pending',
      createdBy:   req.user._id,
    });

    res.status(201).json({ success: true, message: 'Invoice created', invoice });
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// PUT /api/admin/dealer-finance/invoices/:id/status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    const valid = ['draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const invoice = await DealerInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    invoice.status = status;
    if (status === 'paid')      invoice.paidAt      = new Date();
    if (status === 'cancelled') { invoice.cancelledAt = new Date(); invoice.cancelReason = cancelReason || ''; }
    await invoice.save();

    res.json({ success: true, message: 'Invoice status updated', invoice });
  } catch (err) {
    console.error('Update invoice status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
