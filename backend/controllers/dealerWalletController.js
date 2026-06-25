const DealerWallet  = require('../models/DealerWallet');
const DealerLedger  = require('../models/DealerLedger');
const { addLedgerEntry } = require('../utils/dealerFinanceHelpers');

// GET /api/dealer/finance/wallet
exports.getMyWallet = async (req, res) => {
  try {
    const dealerId = req.dealer._id;
    let wallet = await DealerWallet.findOne({ dealer: dealerId });
    if (!wallet) {
      wallet = await DealerWallet.create({ dealer: dealerId });
    }
    res.json({ success: true, wallet });
  } catch (err) {
    console.error('Get dealer wallet error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dealer/finance/wallet/transactions
exports.getMyTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category } = req.query;
    const dealerId = req.dealer._id;

    const filter = { dealer: dealerId };
    if (type)     filter.type     = type;
    if (category) filter.category = category;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerLedger.countDocuments(filter);

    const entries = await DealerLedger.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      entries,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Get dealer transactions error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/admin/dealer-finance/wallets
exports.getAllWallets = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerWallet.countDocuments();

    const wallets = await DealerWallet.find()
      .populate('dealer', 'dealerCode businessName email phone status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true, wallets,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Admin get wallets error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dealer-finance/wallets/:dealerId
exports.getDealerWallet = async (req, res) => {
  try {
    const dealerId = req.params.dealerId;
    let wallet = await DealerWallet.findOne({ dealer: dealerId })
      .populate('dealer', 'dealerCode businessName email');

    if (!wallet) wallet = await DealerWallet.create({ dealer: dealerId });

    const transactions = await DealerLedger.find({ dealer: dealerId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, wallet, transactions });
  } catch (err) {
    console.error('Admin get dealer wallet error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/wallets/:dealerId/topup
exports.topupWallet = async (req, res) => {
  try {
    const { amount, method, reference, notes } = req.body;
    const dealerId = req.params.dealerId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }

    const entry = await addLedgerEntry({
      dealer:      dealerId,
      type:        'credit',
      category:    'wallet_topup',
      amount,
      description: `Wallet top-up${method ? ` via ${method}` : ''}${reference ? ` (Ref: ${reference})` : ''}`,
      refType:     'DealerWallet',
      reference:   reference || '',
      status:      'na',
      createdBy:   req.user._id,
      notes:       notes || '',
    });

    // Update lastRecharge snapshot
    await DealerWallet.findOneAndUpdate({ dealer: dealerId }, {
      'lastRecharge.amount':    amount,
      'lastRecharge.date':      new Date(),
      'lastRecharge.method':    method || '',
      'lastRecharge.reference': reference || '',
    });

    res.json({ success: true, message: `₹${amount.toLocaleString('en-IN')} added to wallet`, entry });
  } catch (err) {
    console.error('Wallet topup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/wallets/:dealerId/deduct
exports.deductWallet = async (req, res) => {
  try {
    const { amount, reason, notes } = req.body;
    const dealerId = req.params.dealerId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required for deduction' });
    }

    const entry = await addLedgerEntry({
      dealer:      dealerId,
      type:        'debit',
      category:    'wallet_deduct',
      amount,
      description: `Admin deduction: ${reason}`,
      refType:     'DealerWallet',
      status:      'na',
      createdBy:   req.user._id,
      notes:       notes || '',
    });

    res.json({ success: true, message: `₹${amount.toLocaleString('en-IN')} deducted from wallet`, entry });
  } catch (err) {
    console.error('Wallet deduct error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
