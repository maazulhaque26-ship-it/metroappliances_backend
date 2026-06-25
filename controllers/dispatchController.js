const Dispatch      = require('../models/Dispatch');
const PickingList   = require('../models/PickingList');
const Package       = require('../models/Package');
const Inventory     = require('../models/Inventory');
const { paginateQuery, respOk, respErr } = require('../utils/logisticsHelpers');

// ── Admin: List dispatches ─────────────────────────────────────────────────────
exports.getDispatches = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, warehouse, priority, search } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (warehouse) filter.warehouse = warehouse;
    if (priority)  filter.priority  = priority;
    if (search)    filter.$or = [
      { dispatchNumber: { $regex: search, $options: 'i' } },
      { recipientName:  { $regex: search, $options: 'i' } },
      { orderNumber:    { $regex: search, $options: 'i' } },
    ];
    const result = await paginateQuery(Dispatch, filter, {
      page: +page, limit: +limit,
      populate: ['warehouse'],
    });
    respOk(res, result.data, 'OK');
    // Inject pagination header
    res.locals._pagination = { total: result.total, page: result.page, limit: result.limit, pages: result.pages };
  } catch (err) { respErr(res, err.message, 500); }
};

// helper re-send with pagination
const sendPaged = async (res, filter, query) => {
  const { page = 1, limit = 20 } = query;
  const result = await paginateQuery(Dispatch, filter, { page: +page, limit: +limit, populate: ['warehouse','shipment','pickingList'] });
  return res.json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, limit: result.limit, pages: result.pages } });
};

exports.listDispatches = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, warehouse, priority, search } = req.query;
    const filter = { isDeleted: false };
    if (status)    filter.status    = status;
    if (warehouse) filter.warehouse = warehouse;
    if (priority)  filter.priority  = priority;
    if (search)    filter.$or = [
      { dispatchNumber: { $regex: search, $options: 'i' } },
      { recipientName:  { $regex: search, $options: 'i' } },
      { orderNumber:    { $regex: search, $options: 'i' } },
    ];
    await sendPaged(res, filter, { page, limit });
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Admin: Create dispatch ─────────────────────────────────────────────────────
exports.createDispatch = async (req, res) => {
  try {
    const dispatch = await Dispatch.create({ ...req.body, createdBy: req.user._id, createdByName: req.user.name });
    respOk(res, dispatch, 'Dispatch created', 201);
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Get dispatch by ID ─────────────────────────────────────────────────
exports.getDispatchById = async (req, res) => {
  try {
    const dispatch = await Dispatch.findOne({ _id: req.params.id, isDeleted: false })
      .populate('warehouse shipment pickingList package deliveryChallan');
    if (!dispatch) return respErr(res, 'Dispatch not found', 404);
    respOk(res, dispatch);
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Admin: Assign picker + create picking list ─────────────────────────────────
exports.assignPicker = async (req, res) => {
  try {
    const { pickerId, pickerName } = req.body;
    const dispatch = await Dispatch.findOne({ _id: req.params.id, isDeleted: false });
    if (!dispatch) return respErr(res, 'Dispatch not found', 404);
    if (!['pending'].includes(dispatch.status)) return respErr(res, 'Can only assign from pending status');

    // Create picking list
    const pickingItems = dispatch.items.map(item => ({
      dispatch:         dispatch._id,
      dispatchNumber:   dispatch.dispatchNumber,
      product:          item.product,
      productName:      item.productName,
      sku:              item.sku,
      quantityRequired: item.quantity,
      storageLocation:  item.storageLocation,
      locationCode:     item.locationCode,
    }));
    const pickingList = await PickingList.create({
      warehouse:    dispatch.warehouse,
      warehouseName:dispatch.warehouseName,
      assignedTo:   pickerId,
      assignedName: pickerName,
      items:        pickingItems,
      dispatches:   [dispatch._id],
      createdBy:    req.user._id,
    });

    dispatch.status         = 'assigned';
    dispatch.assignedPicker = pickerId;
    dispatch.pickerName     = pickerName;
    dispatch.pickingList    = pickingList._id;
    await dispatch.save();

    respOk(res, dispatch, 'Picker assigned');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Update dispatch status ─────────────────────────────────────────────
exports.updateDispatchStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const dispatch = await Dispatch.findOne({ _id: req.params.id, isDeleted: false });
    if (!dispatch) return respErr(res, 'Dispatch not found', 404);
    dispatch.status = status;
    if (notes) dispatch.notes = notes;
    if (status === 'dispatched') dispatch.dispatchedAt = new Date();
    if (status === 'delivered')  dispatch.deliveredAt  = new Date();
    await dispatch.save();
    respOk(res, dispatch, 'Status updated');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Cancel dispatch ────────────────────────────────────────────────────
exports.cancelDispatch = async (req, res) => {
  try {
    const dispatch = await Dispatch.findOne({ _id: req.params.id, isDeleted: false });
    if (!dispatch) return respErr(res, 'Dispatch not found', 404);
    if (['delivered','cancelled'].includes(dispatch.status)) return respErr(res, 'Cannot cancel at this stage');
    dispatch.status = 'cancelled';
    dispatch.notes  = req.body.reason || dispatch.notes;
    await dispatch.save();
    respOk(res, dispatch, 'Dispatch cancelled');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Dashboard stats ────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [
      total, pending, inTransit, delivered, failed,
      todayDispatches, avgDelivery,
    ] = await Promise.all([
      Dispatch.countDocuments({ isDeleted: false }),
      Dispatch.countDocuments({ status: 'pending', isDeleted: false }),
      Dispatch.countDocuments({ status: 'in_transit', isDeleted: false }),
      Dispatch.countDocuments({ status: 'delivered', isDeleted: false }),
      Dispatch.countDocuments({ status: 'failed', isDeleted: false }),
      Dispatch.countDocuments({ isDeleted: false, createdAt: { $gte: today } }),
      Dispatch.aggregate([
        { $match: { status: 'delivered', deliveredAt: { $exists: true }, isDeleted: false } },
        { $project: { days: { $divide: [{ $subtract: ['$deliveredAt', '$createdAt'] }, 86400000] } } },
        { $group: { _id: null, avg: { $avg: '$days' } } },
      ]),
    ]);
    respOk(res, {
      total, pending, inTransit, delivered, failed, todayDispatches,
      avgDeliveryDays: avgDelivery[0]?.avg?.toFixed(1) || 0,
    });
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Warehouse portal: Get my picking lists ────────────────────────────────────
exports.warehouseGetPickingLists = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { warehouse: req.warehouseUser.warehouse, isDeleted: false };
    if (status) filter.status = status;
    const lists = await PickingList.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    respOk(res, lists);
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Warehouse portal: Get picking list by ID ──────────────────────────────────
exports.warehouseGetPickingList = async (req, res) => {
  try {
    const list = await PickingList.findOne({ _id: req.params.id, warehouse: req.warehouseUser.warehouse })
      .populate('assignedTo dispatches');
    if (!list) return respErr(res, 'Picking list not found', 404);
    respOk(res, list);
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Warehouse portal: Start picking ──────────────────────────────────────────
exports.warehouseStartPicking = async (req, res) => {
  try {
    const list = await PickingList.findOne({ _id: req.params.id, warehouse: req.warehouseUser.warehouse });
    if (!list) return respErr(res, 'Not found', 404);
    list.status    = 'in_progress';
    list.startedAt = new Date();
    await list.save();
    // Update dispatches
    await Dispatch.updateMany({ _id: { $in: list.dispatches } }, { status: 'picking', pickingStartedAt: new Date() });
    respOk(res, list, 'Picking started');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Warehouse portal: Update picked quantities ────────────────────────────────
exports.warehouseUpdatePickedQty = async (req, res) => {
  try {
    const { items } = req.body; // [{itemIndex, quantityPicked, status}]
    const list = await PickingList.findOne({ _id: req.params.id, warehouse: req.warehouseUser.warehouse });
    if (!list) return respErr(res, 'Not found', 404);
    items.forEach(({ itemIndex, quantityPicked, status }) => {
      if (list.items[itemIndex]) {
        list.items[itemIndex].quantityPicked = quantityPicked;
        list.items[itemIndex].status = status || (quantityPicked >= list.items[itemIndex].quantityRequired ? 'picked' : 'short_picked');
      }
    });
    await list.save();
    respOk(res, list, 'Items updated');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Warehouse portal: Complete picking ───────────────────────────────────────
exports.warehouseCompletePicking = async (req, res) => {
  try {
    const list = await PickingList.findOne({ _id: req.params.id, warehouse: req.warehouseUser.warehouse });
    if (!list) return respErr(res, 'Not found', 404);
    list.status      = 'completed';
    list.completedAt = new Date();
    await list.save();
    await Dispatch.updateMany({ _id: { $in: list.dispatches } }, { status: 'picked', pickingCompletedAt: new Date() });
    respOk(res, list, 'Picking completed');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Warehouse portal: Create package (packing stage) ─────────────────────────
exports.warehouseCreatePackage = async (req, res) => {
  try {
    const { dispatchId, length, width, height, weight, packingMaterial, notes } = req.body;
    const dispatch = await Dispatch.findOne({ _id: dispatchId, warehouse: req.warehouseUser.warehouse });
    if (!dispatch) return respErr(res, 'Dispatch not found', 404);
    dispatch.status = 'packing';
    await dispatch.save();
    const pkg = await Package.create({
      dispatch: dispatchId,
      warehouse: dispatch.warehouse,
      length, width, height, weight, packingMaterial, notes,
      packedBy:     req.warehouseUser._id,
      packedByName: req.warehouseUser.name,
    });
    dispatch.status             = 'packed';
    dispatch.package            = pkg._id;
    dispatch.assignedPacker     = req.warehouseUser._id;
    dispatch.packingCompletedAt = new Date();
    await dispatch.save();
    respOk(res, pkg, 'Package created', 201);
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Warehouse portal: Get dispatches ready for dispatch ───────────────────────
exports.warehouseGetReadyDispatches = async (req, res) => {
  try {
    const dispatches = await Dispatch.find({
      warehouse: req.warehouseUser.warehouse,
      status: { $in: ['packed','ready'] },
      isDeleted: false,
    }).populate('package shipment').sort({ createdAt: -1 }).lean();
    respOk(res, dispatches);
  } catch (err) { respErr(res, err.message, 500); }
};
