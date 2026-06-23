const DealerWallet      = require('../models/DealerWallet');
const DealerCredit      = require('../models/DealerCredit');
const DealerInvoice     = require('../models/DealerInvoice');
const DealerPayment     = require('../models/DealerPayment');
const DealerLedger      = require('../models/DealerLedger');
const DealerCreditNote  = require('../models/DealerCreditNote');

// GET /api/dealer/finance/summary
exports.getFinanceSummary = async (req, res) => {
  try {
    const dealerId = req.dealer._id;

    const [wallet, credit, unpaidInvoices, pendingPayments, recentLedger, pendingCreditNotes] = await Promise.all([
      DealerWallet.findOne({ dealer: dealerId }),
      DealerCredit.findOne({ dealer: dealerId }),
      DealerInvoice.countDocuments({ dealer: dealerId, status: { $in: ['issued', 'overdue', 'partially_paid'] } }),
      DealerPayment.countDocuments({ dealer: dealerId, status: 'pending' }),
      DealerLedger.find({ dealer: dealerId }).sort({ createdAt: -1 }).limit(5),
      DealerCreditNote.countDocuments({ dealer: dealerId, status: { $in: ['pending', 'approved'] } }),
    ]);

    // Outstanding balance = running balance from last ledger entry
    const lastEntry     = recentLedger[0];
    const outstanding   = lastEntry?.runningBalance ?? 0;

    res.json({
      success: true,
      summary: {
        wallet: {
          totalBalance:      wallet?.totalBalance      ?? 0,
          availableBalance:  wallet?.availableBalance  ?? 0,
          blockedBalance:    wallet?.blockedBalance     ?? 0,
          pendingSettlement: wallet?.pendingSettlement  ?? 0,
          lastRecharge:      wallet?.lastRecharge       ?? null,
        },
        credit: {
          creditLimit:     credit?.creditLimit     ?? 0,
          usedCredit:      credit?.usedCredit      ?? 0,
          remainingCredit: credit?.remainingCredit ?? 0,
          creditStatus:    credit?.creditStatus    ?? 'none',
          isOnHold:        credit?.isOnHold        ?? false,
          creditExpiry:    credit?.creditExpiry    ?? null,
        },
        outstanding,
        unpaidInvoices,
        pendingPayments,
        pendingCreditNotes,
        recentLedger,
      },
    });
  } catch (err) {
    console.error('Finance summary error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
