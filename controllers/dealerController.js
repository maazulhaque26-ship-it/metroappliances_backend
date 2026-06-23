const Dealer = require('../models/Dealer');

// ── @GET /api/admin/dealers ───────────────────────────────────────────────────
exports.getDealers = async (req, res) => {
  try {
    const {
      page   = 1,
      limit  = 15,
      search = '',
      status,
      state,
      dealerType,
      kycStatus,
      sort   = '-createdAt',
    } = req.query;

    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (state)     filter.state     = state;
    if (dealerType) filter.dealerType = dealerType;
    if (kycStatus) filter.kycStatus = kycStatus;

    if (search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      filter.$or = [
        { businessName: re },
        { ownerName:    re },
        { email:        re },
        { phone:        re },
        { dealerCode:   re },
        { gstNumber:    re },
        { city:         re },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [dealers, total] = await Promise.all([
      Dealer.find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpiry')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Dealer.countDocuments(filter),
    ]);

    res.json({
      success: true,
      dealers,
      total,
      page:       Number(page),
      pages:      Math.ceil(total / Number(limit)),
      limit:      Number(limit),
    });
  } catch (err) {
    console.error('[DealerCtrl] getDealers:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dealers' });
  }
};

// ── @GET /api/admin/dealers/:id ───────────────────────────────────────────────
exports.getDealerById = async (req, res) => {
  try {
    const dealer = await Dealer.findOne({ _id: req.params.id, isDeleted: false })
      .select('-password -resetPasswordToken -resetPasswordExpiry')
      .populate('approvedBy', 'name email');
    if (!dealer) {
      return res.status(404).json({ success: false, message: 'Dealer not found' });
    }
    res.json({ success: true, dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch dealer' });
  }
};

// ── @PUT /api/admin/dealers/:id/approve ──────────────────────────────────────
exports.approveDealer = async (req, res) => {
  try {
    const dealer = await Dealer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      {
        status:       'approved',
        approvedBy:   req.user._id,
        approvalDate: new Date(),
        rejectionReason: '',
      },
      { new: true }
    ).select('-password');

    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });
    res.json({ success: true, message: 'Dealer approved', dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to approve dealer' });
  }
};

// ── @PUT /api/admin/dealers/:id/reject ───────────────────────────────────────
exports.rejectDealer = async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const dealer = await Dealer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'rejected', rejectionReason: reason, approvedBy: null, approvalDate: null },
      { new: true }
    ).select('-password');

    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });
    res.json({ success: true, message: 'Dealer rejected', dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject dealer' });
  }
};

// ── @PUT /api/admin/dealers/:id/suspend ──────────────────────────────────────
exports.suspendDealer = async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const dealer = await Dealer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'suspended', remarks: reason || undefined },
      { new: true }
    ).select('-password');

    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });
    res.json({ success: true, message: 'Dealer suspended', dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to suspend dealer' });
  }
};

// ── @PUT /api/admin/dealers/:id/activate ─────────────────────────────────────
exports.activateDealer = async (req, res) => {
  try {
    const dealer = await Dealer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status: 'approved', isActive: true },
      { new: true }
    ).select('-password');

    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });
    res.json({ success: true, message: 'Dealer re-activated', dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to activate dealer' });
  }
};

// ── @PUT /api/admin/dealers/:id/remarks ──────────────────────────────────────
exports.updateRemarks = async (req, res) => {
  try {
    const { remarks, kycStatus } = req.body;
    const update = {};
    if (remarks   !== undefined) update.remarks   = remarks;
    if (kycStatus !== undefined) update.kycStatus = kycStatus;

    const dealer = await Dealer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: update },
      { new: true }
    ).select('-password');

    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });
    res.json({ success: true, dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update remarks' });
  }
};

// ── @DELETE /api/admin/dealers/:id ───────────────────────────────────────────
exports.softDeleteDealer = async (req, res) => {
  try {
    const dealer = await Dealer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, isActive: false, deletedAt: new Date() },
      { new: true }
    );
    if (!dealer) return res.status(404).json({ success: false, message: 'Dealer not found' });
    res.json({ success: true, message: 'Dealer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete dealer' });
  }
};

// ── @GET /api/admin/dealers/stats ────────────────────────────────────────────
exports.getDealerStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, suspended] = await Promise.all([
      Dealer.countDocuments({ isDeleted: false }),
      Dealer.countDocuments({ status: 'pending',   isDeleted: false }),
      Dealer.countDocuments({ status: 'approved',  isDeleted: false }),
      Dealer.countDocuments({ status: 'rejected',  isDeleted: false }),
      Dealer.countDocuments({ status: 'suspended', isDeleted: false }),
    ]);
    res.json({ success: true, stats: { total, pending, approved, rejected, suspended } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};
