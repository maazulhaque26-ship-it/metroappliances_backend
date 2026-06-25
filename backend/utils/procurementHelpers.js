const Vendor            = require('../models/Vendor');
const PurchaseRequisition = require('../models/PurchaseRequisition');
const RFQ               = require('../models/RFQ');
const PurchaseOrder     = require('../models/PurchaseOrder');
const VendorContract    = require('../models/VendorContract');

const pad = (n, len = 4) => String(n).padStart(len, '0');

const datePart = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

const monthPart = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}${mm}`;
};

async function generateVendorCode() {
  const prefix = `VND-${monthPart()}-`;
  const count  = await Vendor.countDocuments({ vendorCode: { $regex: `^${prefix}` } });
  return `${prefix}${pad(count + 1)}`;
}

async function generatePRNumber() {
  const prefix = `PR-${datePart()}-`;
  const count  = await PurchaseRequisition.countDocuments({ prNumber: { $regex: `^${prefix}` } });
  return `${prefix}${pad(count + 1)}`;
}

async function generateRFQNumber() {
  const prefix = `RFQ-${datePart()}-`;
  const count  = await RFQ.countDocuments({ rfqNumber: { $regex: `^${prefix}` } });
  return `${prefix}${pad(count + 1)}`;
}

async function generatePONumber() {
  const prefix = `PO-${datePart()}-`;
  const count  = await PurchaseOrder.countDocuments({ poNumber: { $regex: `^${prefix}` } });
  return `${prefix}${pad(count + 1)}`;
}

async function generateContractNumber() {
  const prefix = `CNT-${datePart()}-`;
  const count  = await VendorContract.countDocuments({ contractNumber: { $regex: `^${prefix}` } });
  return `${prefix}${pad(count + 1)}`;
}

// Build default approval chain for PR / PO
function buildApprovalChain() {
  return [
    { step: 1, role: 'purchase_manager', status: 'pending' },
    { step: 2, role: 'finance',          status: 'pending' },
    { step: 3, role: 'admin',            status: 'pending' },
  ];
}

module.exports = {
  generateVendorCode,
  generatePRNumber,
  generateRFQNumber,
  generatePONumber,
  generateContractNumber,
  buildApprovalChain,
};
