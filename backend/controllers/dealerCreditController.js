const DealerCredit      = require('../models/DealerCredit');
const DealerCreditNote  = require('../models/DealerCreditNote');
const DealerNotification = require('../models/DealerNotification');
const { addLedgerEntry } = require('../utils/dealerFinanceHelpers');

// ── Dealer — Credit ───────────────────────────────────────────────────────────

// GET /api/dealer/finance/credit
exports.getMyCredit = async (req, res) => {
  try {
    let credit = await DealerCredit.findOne({ dealer: req.dealer._id });
    if (!credit) {
      credit = await DealerCredit.create({ dealer: req.dealer._id });
    }
    res.json({ success: true, credit });
  } catch (err) {
    console.error('Get dealer credit error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Dealer — Credit Notes ─────────────────────────────────────────────────────

// GET /api/dealer/finance/credit-notes
exports.getMyCreditNotes = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { dealer: req.dealer._id };
    if (status) filter.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerCreditNote.countDocuments(filter);

    const notes = await DealerCreditNote.find(filter)
      .populate('order',    'orderNumber')
      .populate('invoice',  'invoiceNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      creditNotes: notes,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Get dealer credit notes error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/dealer/finance/credit-notes/:id
exports.getCreditNoteById = async (req, res) => {
  try {
    const note = await DealerCreditNote.findOne({
      _id:    req.params.id,
      dealer: req.dealer._id,
    })
      .populate('order',   'orderNumber')
      .populate('invoice', 'invoiceNumber');

    if (!note) return res.status(404).json({ success: false, message: 'Credit note not found' });

    res.json({ success: true, creditNote: note });
  } catch (err) {
    console.error('Get credit note error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Admin — Credit ────────────────────────────────────────────────────────────

// GET /api/admin/dealer-finance/credits
exports.getAllCredits = async (req, res) => {
  try {
    const { page = 1, limit = 20, creditStatus } = req.query;
    const filter = {};
    if (creditStatus) filter.creditStatus = creditStatus;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerCredit.countDocuments(filter);

    const credits = await DealerCredit.find(filter)
      .populate('dealer',    'dealerCode businessName email phone status')
      .populate('setBy',     'name email')
      .populate('updatedBy', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true, credits,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Admin get credits error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/dealer-finance/credits/:dealerId
exports.getDealerCredit = async (req, res) => {
  try {
    let credit = await DealerCredit.findOne({ dealer: req.params.dealerId })
      .populate('dealer',    'dealerCode businessName email')
      .populate('setBy',     'name')
      .populate('updatedBy', 'name');

    if (!credit) {
      credit = await DealerCredit.create({ dealer: req.params.dealerId });
    }
    res.json({ success: true, credit });
  } catch (err) {
    console.error('Admin get dealer credit error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/credits/:dealerId/set
exports.setCredit = async (req, res) => {
  try {
    const { creditLimit, creditExpiry, reason } = req.body;
    const dealerId = req.params.dealerId;

    if (creditLimit === undefined) {
      return res.status(400).json({ success: false, message: 'creditLimit required' });
    }

    let credit = await DealerCredit.findOne({ dealer: dealerId });
    const isNew = !credit;

    if (!credit) {
      credit = new DealerCredit({ dealer: dealerId });
    }

    const prevLimit = credit.creditLimit;
    credit.history.push({
      action:        isNew ? 'set' : 'update',
      previousLimit: prevLimit,
      newLimit:      creditLimit,
      reason:        reason || '',
      performedBy:   req.user._id,
      performedAt:   new Date(),
    });

    credit.creditLimit   = creditLimit;
    credit.creditExpiry  = creditExpiry ? new Date(creditExpiry) : credit.creditExpiry;
    credit.creditStatus  = creditLimit > 0 ? 'active' : 'none';
    credit.setBy         = isNew ? req.user._id : credit.setBy;
    credit.updatedBy     = req.user._id;

    await credit.save();

    await DealerNotification.create({
      dealer:  dealerId,
      type:    'pricing',
      title:   'Credit Limit Updated',
      message: `Your credit limit has been set to ₹${creditLimit.toLocaleString('en-IN')}.`,
      link:    '/dealer/finance/credit',
    });

    res.json({ success: true, message: 'Credit limit set', credit });
  } catch (err) {
    console.error('Set dealer credit error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/credits/:dealerId/hold
exports.holdCredit = async (req, res) => {
  try {
    const { reason } = req.body;
    const credit = await DealerCredit.findOne({ dealer: req.params.dealerId });
    if (!credit) return res.status(404).json({ success: false, message: 'Credit record not found' });

    credit.isOnHold      = true;
    credit.holdReason    = reason || '';
    credit.creditStatus  = 'hold';
    credit.updatedBy     = req.user._id;
    credit.history.push({
      action: 'hold', previousLimit: credit.creditLimit, newLimit: credit.creditLimit,
      reason: reason || '', performedBy: req.user._id, performedAt: new Date(),
    });
    await credit.save();

    res.json({ success: true, message: 'Credit put on hold', credit });
  } catch (err) {
    console.error('Hold credit error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/credits/:dealerId/release
exports.releaseCredit = async (req, res) => {
  try {
    const credit = await DealerCredit.findOne({ dealer: req.params.dealerId });
    if (!credit) return res.status(404).json({ success: false, message: 'Credit record not found' });

    credit.isOnHold     = false;
    credit.holdReason   = '';
    credit.creditStatus = credit.creditLimit > 0 ? 'active' : 'none';
    credit.updatedBy    = req.user._id;
    credit.history.push({
      action: 'release', previousLimit: credit.creditLimit, newLimit: credit.creditLimit,
      reason: 'Credit hold released', performedBy: req.user._id, performedAt: new Date(),
    });
    await credit.save();

    res.json({ success: true, message: 'Credit hold released', credit });
  } catch (err) {
    console.error('Release credit error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Admin — Credit Notes ──────────────────────────────────────────────────────

// GET /api/admin/dealer-finance/credit-notes
exports.getAllCreditNotes = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, dealer } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (dealer) filter.dealer = dealer;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await DealerCreditNote.countDocuments(filter);

    const notes = await DealerCreditNote.find(filter)
      .populate('dealer',     'dealerCode businessName email')
      .populate('order',      'orderNumber')
      .populate('invoice',    'invoiceNumber')
      .populate('createdBy',  'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      creditNotes: notes,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('Admin get credit notes error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/credit-notes
exports.createCreditNote = async (req, res) => {
  try {
    const { dealerId, orderId, invoiceId, amount, reason, type, notes } = req.body;

    if (!dealerId || !amount || !reason || !type) {
      return res.status(400).json({ success: false, message: 'dealerId, amount, reason, type required' });
    }

    const note = await DealerCreditNote.create({
      dealer:    dealerId,
      order:     orderId   || null,
      invoice:   invoiceId || null,
      amount,
      reason,
      type,
      status:    'pending',
      createdBy: req.user._id,
      notes:     notes || '',
    });

    res.status(201).json({ success: true, message: 'Credit note created', creditNote: note });
  } catch (err) {
    console.error('Create credit note error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/credit-notes/:id/approve
exports.approveCreditNote = async (req, res) => {
  try {
    const note = await DealerCreditNote.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Credit note not found' });
    if (note.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Credit note is not pending' });
    }

    note.status     = 'approved';
    note.approvedBy = req.user._id;
    note.approvedAt = new Date();
    await note.save();

    res.json({ success: true, message: 'Credit note approved', creditNote: note });
  } catch (err) {
    console.error('Approve credit note error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/credit-notes/:id/apply
exports.applyCreditNote = async (req, res) => {
  try {
    const note = await DealerCreditNote.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Credit note not found' });
    if (!['approved'].includes(note.status)) {
      return res.status(400).json({ success: false, message: 'Credit note must be approved first' });
    }

    // Create ledger credit entry
    const entry = await addLedgerEntry({
      dealer:      note.dealer,
      type:        'credit',
      category:    'credit_note',
      amount:      note.amount,
      description: `Credit note ${note.creditNoteNumber} applied — ${note.reason}`,
      refType:     'DealerCreditNote',
      refId:       note._id,
      reference:   note.creditNoteNumber,
      status:      'na',
      createdBy:   req.user._id,
    });

    note.status             = 'applied';
    note.appliedAt          = new Date();
    note.appliedLedgerEntry = entry._id;
    await note.save();

    await DealerNotification.create({
      dealer:  note.dealer,
      type:    'pricing',
      title:   'Credit Note Applied',
      message: `Credit note ${note.creditNoteNumber} for ₹${note.amount.toLocaleString('en-IN')} has been applied to your account.`,
      link:    `/dealer/finance/credit-notes/${note._id}`,
    });

    res.json({ success: true, message: 'Credit note applied', creditNote: note });
  } catch (err) {
    console.error('Apply credit note error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/admin/dealer-finance/credit-notes/:id/reject
exports.rejectCreditNote = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const note = await DealerCreditNote.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Credit note not found' });

    note.status          = 'rejected';
    note.rejectionReason = rejectionReason || '';
    await note.save();

    res.json({ success: true, message: 'Credit note rejected', creditNote: note });
  } catch (err) {
    console.error('Reject credit note error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
