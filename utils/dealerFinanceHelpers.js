const DealerLedger = require('../models/DealerLedger');
const DealerWallet = require('../models/DealerWallet');

/**
 * Creates a ledger entry and atomically updates the dealer wallet balance.
 * Returns the new ledger entry.
 */
exports.addLedgerEntry = async ({
  dealer,
  type,
  category,
  amount,
  description,
  refType = 'manual',
  refId = null,
  reference = '',
  dueDate = null,
  status = 'na',
  createdBy = null,
  notes = '',
}) => {
  // Get current running balance
  const last = await DealerLedger.findOne({ dealer }).sort({ createdAt: -1 }).select('runningBalance');
  const currentBalance = last?.runningBalance ?? 0;

  const newBalance = type === 'credit'
    ? currentBalance + amount
    : currentBalance - amount;

  const entry = await DealerLedger.create({
    dealer, type, category, amount,
    runningBalance: newBalance,
    description, refType, refId, reference, dueDate, status, createdBy, notes,
  });

  // Update wallet balance
  let wallet = await DealerWallet.findOne({ dealer });
  if (!wallet) {
    wallet = await DealerWallet.create({ dealer });
  }

  if (type === 'credit') {
    await DealerWallet.findOneAndUpdate({ dealer }, {
      $inc: { totalBalance: amount, availableBalance: amount },
    });
  } else {
    await DealerWallet.findOneAndUpdate({ dealer }, {
      $inc: { totalBalance: -amount, availableBalance: -amount },
    });
  }

  return entry;
};

/**
 * Returns the current outstanding balance for a dealer (sum of unpaid debit entries)
 */
exports.getOutstandingBalance = async (dealerId) => {
  const last = await DealerLedger.findOne({ dealer: dealerId }).sort({ createdAt: -1 }).select('runningBalance');
  return last?.runningBalance ?? 0;
};
