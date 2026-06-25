const DealerLedger = require('../models/DealerLedger');
const { addLedgerEntry } = require('../utils/dealerFinanceHelpers');

// GET /api/dealer/finance/ledger
exports.getMyLedger = async (req, res) => {
  try {
    const {
      page     = 1,
      limit    = 20,
      type,
      category,
      status,
      from,
      to,
      search,
    } = req.query;

    const filter = { dealer: req.dealer._id };
    if (type)     filter.type     = type;
    if (category) filter.category = category;
    if (status)   filter.status   = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { reference:   { $regex: search, $options: 'i' } },
        { entryNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerLedger.countDocuments(filter);

    const entries = await DealerLedger.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Outstanding = running balance of latest entry
    const latest = await DealerLedger.findOne({ dealer: req.dealer._id })
      .sort({ createdAt: -1 })
      .select('runningBalance');

    res.json({
      success: true,
      entries,
      outstanding: latest?.runningBalance ?? 0,
      pagination:  { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Get dealer ledger error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dealer/finance/ledger/export  — placeholder
exports.exportLedger = async (req, res) => {
  res.json({ success: false, message: 'CSV export coming soon. Please use Print/Save from browser.' });
};

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/admin/dealer-finance/ledger/:dealerId
exports.getDealerLedger = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, status } = req.query;
    const filter = { dealer: req.params.dealerId };
    if (type)     filter.type     = type;
    if (category) filter.category = category;
    if (status)   filter.status   = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerLedger.countDocuments(filter);

    const entries = await DealerLedger.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name email');

    res.json({
      success: true, entries,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Admin get dealer ledger error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/ledger/:dealerId/entry  — manual adjustment
exports.addManualEntry = async (req, res) => {
  try {
    const { type, category, amount, description, reference, notes, dueDate, status } = req.body;
    const dealerId = req.params.dealerId;

    if (!type || !category || !amount || !description) {
      return res.status(400).json({ success: false, message: 'type, category, amount, description required' });
    }

    const entry = await addLedgerEntry({
      dealer: dealerId,
      type,
      category: category || 'adjustment',
      amount,
      description,
      reference: reference || '',
      refType:   'manual',
      dueDate:   dueDate || null,
      status:    status || 'na',
      createdBy: req.user._id,
      notes:     notes || '',
    });

    res.status(201).json({ success: true, message: 'Manual entry added', entry });
  } catch (err) {
    console.error('Add manual ledger entry error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
