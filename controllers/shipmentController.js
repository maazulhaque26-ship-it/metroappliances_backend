const Shipment  = require('../models/Shipment');
const Dispatch  = require('../models/Dispatch');
const Courier   = require('../models/Courier');
const { paginateQuery, respOk, respErr } = require('../utils/logisticsHelpers');

// ── Admin: List shipments ─────────────────────────────────────────────────────
exports.getShipments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, courier, search } = req.query;
    const filter = { isDeleted: false };
    if (status)  filter.status  = status;
    if (courier) filter.courier = courier;
    if (search)  filter.$or = [
      { shipmentNumber:  { $regex: search, $options: 'i' } },
      { trackingNumber:  { $regex: search, $options: 'i' } },
      { recipientName:   { $regex: search, $options: 'i' } },
    ];
    const result = await paginateQuery(Shipment, filter, {
      page: +page, limit: +limit,
      populate: ['courier','dispatch','package'],
    });
    res.json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, limit: result.limit, pages: result.pages } });
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Admin: Create shipment ────────────────────────────────────────────────────
exports.createShipment = async (req, res) => {
  try {
    const { dispatchId, courierId, serviceLevel, trackingNumber, estimatedDelivery, weight, freightCharge } = req.body;
    const dispatch = await Dispatch.findOne({ _id: dispatchId, isDeleted: false });
    if (!dispatch) return respErr(res, 'Dispatch not found', 404);

    const courier = courierId ? await Courier.findById(courierId) : null;

    let trackingUrl;
    if (courier?.trackingUrl && trackingNumber) {
      trackingUrl = courier.trackingUrl.replace('{trackingNumber}', trackingNumber);
    }

    const shipment = await Shipment.create({
      dispatch:         dispatchId,
      package:          dispatch.package,
      warehouse:        dispatch.warehouse,
      courier:          courierId || undefined,
      courierName:      courier?.name || req.body.courierName,
      courierCode:      courier?.code || req.body.courierCode,
      serviceLevel,
      trackingNumber,
      trackingUrl,
      estimatedDelivery,
      weight,
      freightCharge,
      recipientName:    dispatch.recipientName,
      recipientPhone:   dispatch.recipientPhone,
      deliveryAddress:  dispatch.deliveryAddress,
      createdBy:        req.user._id,
    });

    dispatch.shipment = shipment._id;
    dispatch.status   = 'ready';
    await dispatch.save();

    respOk(res, shipment, 'Shipment created', 201);
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Get shipment by ID ─────────────────────────────────────────────────
exports.getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, isDeleted: false })
      .populate('courier dispatch package');
    if (!shipment) return respErr(res, 'Shipment not found', 404);
    respOk(res, shipment);
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Admin: Update shipment status ─────────────────────────────────────────────
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { status, notes, location, podReceivedBy, podNotes, failureReason, returnReason } = req.body;
    const shipment = await Shipment.findOne({ _id: req.params.id, isDeleted: false });
    if (!shipment) return respErr(res, 'Shipment not found', 404);

    const prev = shipment.status;
    shipment.status = status;
    if (notes) shipment.notes = notes;
    if (failureReason) shipment.failureReason = failureReason;
    if (returnReason)  shipment.returnReason  = returnReason;
    if (podReceivedBy) shipment.podReceivedBy = podReceivedBy;
    if (podNotes)      shipment.podNotes      = podNotes;

    if (status === 'dispatched' && prev !== 'dispatched') shipment.dispatchedAt = new Date();
    if (status === 'delivered')  shipment.deliveredAt  = new Date();
    if (status === 'returned')   shipment.returnedAt   = new Date();
    if (status === 'failed')     shipment.attempts     = (shipment.attempts || 0) + 1;

    // Tracking event
    shipment.trackingEvents.push({ status, location, description: notes, timestamp: new Date() });
    await shipment.save();

    // Sync dispatch status
    const dsStatus = {
      dispatched:      'dispatched',
      in_transit:      'in_transit',
      out_for_delivery:'in_transit',
      delivered:       'delivered',
      failed:          'failed',
      returned:        'returned',
      cancelled:       'cancelled',
    }[status];
    if (dsStatus) {
      await Dispatch.findByIdAndUpdate(shipment.dispatch, { status: dsStatus, ...(status === 'dispatched' ? { dispatchedAt: new Date() } : {}), ...(status === 'delivered' ? { deliveredAt: new Date() } : {}) });
    }

    respOk(res, shipment, 'Shipment updated');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: Add tracking event ─────────────────────────────────────────────────
exports.addTrackingEvent = async (req, res) => {
  try {
    const { status, location, description } = req.body;
    const shipment = await Shipment.findOne({ _id: req.params.id, isDeleted: false });
    if (!shipment) return respErr(res, 'Not found', 404);
    shipment.trackingEvents.push({ status, location, description, timestamp: new Date() });
    await shipment.save();
    respOk(res, shipment, 'Event added');
  } catch (err) { respErr(res, err.message, 400); }
};

// ── Admin: CRUD Couriers ──────────────────────────────────────────────────────
exports.getCouriers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { isDeleted: false };
    if (status) filter.status = status;
    const couriers = await Courier.find(filter).sort({ name: 1 }).lean();
    respOk(res, couriers);
  } catch (err) { respErr(res, err.message, 500); }
};

exports.createCourier = async (req, res) => {
  try {
    const courier = await Courier.create(req.body);
    respOk(res, courier, 'Courier created', 201);
  } catch (err) { respErr(res, err.message, 400); }
};

exports.getCourierById = async (req, res) => {
  try {
    const courier = await Courier.findOne({ _id: req.params.id, isDeleted: false });
    if (!courier) return respErr(res, 'Not found', 404);
    respOk(res, courier);
  } catch (err) { respErr(res, err.message, 500); }
};

exports.updateCourier = async (req, res) => {
  try {
    const courier = await Courier.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true, runValidators: true });
    if (!courier) return respErr(res, 'Not found', 404);
    respOk(res, courier, 'Courier updated');
  } catch (err) { respErr(res, err.message, 400); }
};

exports.deleteCourier = async (req, res) => {
  try {
    const courier = await Courier.findOneAndUpdate({ _id: req.params.id }, { isDeleted: true }, { new: true });
    if (!courier) return respErr(res, 'Not found', 404);
    respOk(res, null, 'Courier removed');
  } catch (err) { respErr(res, err.message, 500); }
};

// ── Warehouse portal: Track shipment ─────────────────────────────────────────
exports.warehouseGetShipmentTracking = async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id })
      .populate('courier dispatch').lean();
    if (!shipment) return respErr(res, 'Not found', 404);
    respOk(res, shipment);
  } catch (err) { respErr(res, err.message, 500); }
};

exports.warehouseGetShipments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { warehouse: req.warehouseUser.warehouse, isDeleted: false };
    if (status) filter.status = status;
    const shipments = await Shipment.find(filter).populate('courier').sort({ createdAt: -1 }).limit(50).lean();
    respOk(res, shipments);
  } catch (err) { respErr(res, err.message, 500); }
};
