const DeliveryChallan = require('../models/DeliveryChallan');
const Dispatch        = require('../models/Dispatch');
const Settings        = require('../models/Settings');
const { numberInWords, respOk, respErr } = require('../utils/logisticsHelpers');

// ── Admin: List challans ──────────────────────────────────────────────────────
exports.getChallans = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { challanNumber:   { $regex: search, $options: 'i' } },
      { consigneeName:   { $regex: search, $options: 'i' } },
    ];
    const skip    = (+page - 1) * +limit;
    const [data, total] = await Promise.all([
      DeliveryChallan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(+limit).lean(),
      DeliveryChallan.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) } });
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Admin: Generate challan from dispatch ─────────────────────────────────────
exports.generateChallan = async (req, res) => {
  try {
    const { dispatchId, purpose, remarks } = req.body;
    const dispatch = await Dispatch.findOne({ _id: dispatchId, isDeleted: false });
    if (!dispatch) return respErr(res, 'Dispatch not found', 404);

    const settings = await Settings.findOne().lean();

    const items = dispatch.items.map((item, i) => ({
      srNo:        i + 1,
      description: item.productName,
      quantity:    item.quantity,
      unit:        item.unit || 'Nos',
      unitPrice:   0,
      amount:      0,
      taxRate:     0,
      taxAmount:   0,
      totalAmount: 0,
    }));

    const challan = await DeliveryChallan.create({
      dispatch:         dispatchId,
      challanDate:      new Date(),
      supplierName:     settings?.storeName || 'Metro Appliances',
      supplierAddress:  settings?.storeAddress || '',
      supplierPhone:    settings?.storePhone || '',
      consigneeName:    dispatch.recipientName,
      consigneePhone:   dispatch.recipientPhone,
      consigneeAddress: [
        dispatch.deliveryAddress?.street,
        dispatch.deliveryAddress?.city,
        dispatch.deliveryAddress?.state,
        dispatch.deliveryAddress?.pincode,
      ].filter(Boolean).join(', '),
      destination:      dispatch.deliveryAddress?.city,
      items,
      subtotal:         0,
      totalTax:         0,
      totalAmount:      0,
      amountInWords:    'Zero Rupees Only',
      purpose:          purpose || 'sale',
      remarks,
      status:           'generated',
      createdBy:        req.user._id,
    });

    // Link back to dispatch
    dispatch.deliveryChallan = challan._id;
    await dispatch.save();

    respOk(res, challan, 'Challan generated', 201);
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Get challan by ID (for printing) ───────────────────────────────────
exports.getChallanById = async (req, res) => {
  try {
    const challan = await DeliveryChallan.findOne({ _id: req.params.id, isDeleted: false })
      .populate('dispatch createdBy').lean();
    if (!challan) return respErr(res, 'Challan not found', 404);
    respOk(res, challan);
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Admin: Update challan (adjust amounts/items) ──────────────────────────────
exports.updateChallan = async (req, res) => {
  try {
    const challan = await DeliveryChallan.findOne({ _id: req.params.id, isDeleted: false });
    if (!challan) return respErr(res, 'Not found', 404);
    const { items, remarks, purpose } = req.body;
    if (items) {
      challan.items        = items;
      const subtotal       = items.reduce((s, i) => s + (i.amount || 0), 0);
      const totalTax       = items.reduce((s, i) => s + (i.taxAmount || 0), 0);
      const totalAmount    = subtotal + totalTax;
      challan.subtotal     = subtotal;
      challan.totalTax     = totalTax;
      challan.totalAmount  = totalAmount;
      challan.amountInWords= numberInWords(totalAmount);
    }
    if (remarks) challan.remarks = remarks;
    if (purpose) challan.purpose = purpose;
    await challan.save();
    respOk(res, challan, 'Challan updated');
  } catch (err) { respErr(res, err.message, 400); }
};
