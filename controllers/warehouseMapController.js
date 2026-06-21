/**
 * Sprint 10E — Warehouse Map Controller
 * Returns spatial data for the visual warehouse map and heatmap
 */
const StorageLocation = require('../models/StorageLocation');
const WarehouseZone   = require('../models/WarehouseZone');
const Inventory       = require('../models/Inventory');
const Warehouse       = require('../models/Warehouse');
const { ok, notFound, serverError } = require('../utils/response');

exports.getWarehouseMapData = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const wh = await Warehouse.findById(warehouseId);
    if (!wh || wh.isDeleted) return notFound(res, 'Warehouse');

    const [zones, locations] = await Promise.all([
      WarehouseZone.find({ warehouse: warehouseId, isDeleted: false }),
      StorageLocation.find({ warehouse: warehouseId, isDeleted: false })
        .select('_id aisle rack shelf bin capacity occupied status barcode temperatureZone isHazmat mapX mapY zone isFastMoving nearDispatch nearReceiving'),
    ]);

    // Build utilization heatmap by zone
    const zoneStats = {};
    zones.forEach(z => { zoneStats[z._id] = { zone: z, bins: 0, occupied: 0, capacity: 0 }; });
    locations.forEach(loc => {
      const zid = String(loc.zone);
      if (zoneStats[zid]) {
        zoneStats[zid].bins++;
        zoneStats[zid].occupied += loc.occupied || 0;
        zoneStats[zid].capacity += loc.capacity || 0;
      }
    });

    // Rack-level grouping for map grid
    const racksMap = {};
    locations.forEach(loc => {
      const key = `${loc.aisle || 'A'}-${loc.rack}`;
      if (!racksMap[key]) racksMap[key] = { aisle: loc.aisle || 'A', rack: loc.rack, bins: [] };
      racksMap[key].bins.push({
        id:          loc._id,
        shelf:       loc.shelf,
        bin:         loc.bin,
        capacity:    loc.capacity,
        occupied:    loc.occupied,
        utilization: loc.capacity > 0 ? Math.round((loc.occupied / loc.capacity) * 100) : 0,
        status:      loc.status,
        barcode:     loc.barcode,
        tempZone:    loc.temperatureZone,
        isHazmat:    loc.isHazmat,
        mapX:        loc.mapX,
        mapY:        loc.mapY,
        zoneId:      loc.zone,
      });
    });

    return ok(res, {
      warehouse: { id: wh._id, name: wh.name, code: wh.code },
      zones: Object.values(zoneStats).map(({ zone, bins, occupied, capacity }) => ({
        id: zone._id, name: zone.name, type: zone.type, code: zone.code,
        bins, occupied, capacity,
        utilization: capacity > 0 ? Math.round((occupied / capacity) * 100) : 0,
      })),
      racks: Object.values(racksMap).sort((a, b) => a.aisle.localeCompare(b.aisle) || a.rack.localeCompare(b.rack)),
      totalBins:     locations.length,
      availableBins: locations.filter(l => l.status === 'available').length,
      occupiedBins:  locations.filter(l => l.status === 'occupied').length,
    });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.searchBin = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { q, productId } = req.query;

    if (!q && !productId) return ok(res, []);

    const filter = { warehouse: warehouseId, isDeleted: false };

    if (q) {
      const upper = q.toUpperCase();
      filter.$or = [
        { rack:    { $regex: upper, $options: 'i' } },
        { shelf:   { $regex: upper, $options: 'i' } },
        { bin:     { $regex: upper, $options: 'i' } },
        { aisle:   { $regex: upper, $options: 'i' } },
        { barcode: upper },
      ];
    }

    if (productId) {
      const invDocs = await Inventory.find({ product: productId, warehouse: warehouseId, availableQty: { $gt: 0 }, isDeleted: false });
      const locIds  = invDocs.map(i => i.storageLocation).filter(Boolean);
      filter._id    = { $in: locIds };
    }

    const bins = await StorageLocation.find(filter)
      .populate('zone', 'name type')
      .limit(20);

    return ok(res, bins.map(b => ({
      id:       b._id,
      address:  `${b.aisle ? b.aisle + '-' : ''}${b.rack}-${b.shelf}${b.bin ? '-' + b.bin : ''}`,
      aisle:    b.aisle, rack: b.rack, shelf: b.shelf, bin: b.bin,
      zone:     b.zone?.name, zoneType: b.zone?.type,
      capacity: b.capacity, occupied: b.occupied,
      utilization: b.capacity > 0 ? Math.round((b.occupied / b.capacity) * 100) : 0,
      status:   b.status, barcode: b.barcode, mapX: b.mapX, mapY: b.mapY,
    })));
  } catch (err) {
    return serverError(res, err);
  }
};

exports.getBinUtilizationReport = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const locations = await StorageLocation.find({ warehouse: warehouseId, isDeleted: false })
      .populate('zone', 'name type');

    const total    = locations.length;
    const capacity = locations.reduce((s, l) => s + (l.capacity || 0), 0);
    const occupied = locations.reduce((s, l) => s + (l.occupied || 0), 0);

    const utilization = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

    const byZone = {};
    locations.forEach(loc => {
      const zn = loc.zone?.name || 'Unassigned';
      if (!byZone[zn]) byZone[zn] = { name: zn, type: loc.zone?.type, bins: 0, capacity: 0, occupied: 0 };
      byZone[zn].bins++;
      byZone[zn].capacity += loc.capacity || 0;
      byZone[zn].occupied += loc.occupied || 0;
    });

    const distribution = [
      { label: 'Empty (0%)',    count: locations.filter(l => l.occupied === 0).length },
      { label: 'Low (1–25%)',   count: locations.filter(l => l.capacity > 0 && l.occupied / l.capacity <= 0.25 && l.occupied > 0).length },
      { label: 'Med (26–75%)',  count: locations.filter(l => l.capacity > 0 && l.occupied / l.capacity > 0.25 && l.occupied / l.capacity <= 0.75).length },
      { label: 'High (76–99%)',count: locations.filter(l => l.capacity > 0 && l.occupied / l.capacity > 0.75 && l.occupied < l.capacity).length },
      { label: 'Full (100%)',   count: locations.filter(l => l.capacity > 0 && l.occupied >= l.capacity).length },
    ];

    return ok(res, {
      total, capacity, occupied, utilization,
      byZone:       Object.values(byZone).map(z => ({ ...z, utilization: z.capacity > 0 ? Math.round((z.occupied / z.capacity) * 100) : 0 })),
      distribution,
    });
  } catch (err) {
    return serverError(res, err);
  }
};
