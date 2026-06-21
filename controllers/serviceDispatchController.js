const Technician     = require('../models/Technician');
const ServiceRequest = require('../models/ServiceRequest');
const { ok, fail, serverError } = require('../utils/response');

// Score a technician for a given service request
function scoreTechnician(tech, sr) {
  let score = 0;

  // Skill match
  const requiredSkill = sr.category?.toLowerCase();
  if (tech.skills.some(s => s.toLowerCase().includes(requiredSkill))) score += 30;

  // Territory match
  const city = sr.serviceAddress?.city;
  const pincode = sr.serviceAddress?.pincode;
  if (city && tech.territory.cities.some(c => c.toLowerCase() === city.toLowerCase())) score += 25;
  if (pincode && tech.territory.pincodes.includes(pincode)) score += 15;

  // Availability
  if (tech.availability.isAvailable) score += 20;

  // Workload (lower is better)
  const workloadRatio = tech.currentWorkload / (tech.maxWorkload || 5);
  score += Math.round((1 - workloadRatio) * 20);

  // Rating
  if (tech.rating.average > 0) score += Math.round(tech.rating.average * 2);

  return score;
}

// ── Admin: get dispatch recommendations ──────────────────────────────────────
exports.getDispatchRecommendations = async (req, res) => {
  try {
    const { serviceRequestId } = req.params;
    const sr = await ServiceRequest.findOne({ _id: serviceRequestId, isDeleted: false });
    if (!sr) return fail(res, 'Service request not found', 404);

    const technicians = await Technician.find({
      isDeleted: false,
      status: 'active',
      'availability.isAvailable': true,
      $expr: { $lt: ['$currentWorkload', '$maxWorkload'] },
    });

    const scored = technicians
      .map(tech => ({ technician: tech, score: scoreTechnician(tech, sr) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return ok(res, {
      serviceRequest: { ticketNumber: sr.ticketNumber, category: sr.category, priority: sr.priority, serviceAddress: sr.serviceAddress },
      recommendations: scored.map(({ technician, score }) => ({
        _id: technician._id,
        name: technician.name,
        phone: technician.phone,
        skills: technician.skills,
        territory: technician.territory,
        currentWorkload: technician.currentWorkload,
        maxWorkload: technician.maxWorkload,
        rating: technician.rating,
        isAvailable: technician.availability.isAvailable,
        score,
      })),
    });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: auto-assign technician ─────────────────────────────────────────────
exports.autoAssign = async (req, res) => {
  try {
    const { serviceRequestId } = req.params;
    const sr = await ServiceRequest.findOne({ _id: serviceRequestId, isDeleted: false });
    if (!sr) return fail(res, 'Service request not found', 404);
    if (sr.assignedTechnician) return fail(res, 'Service request already has a technician assigned', 400);

    const technicians = await Technician.find({
      isDeleted: false, status: 'active',
      'availability.isAvailable': true,
      $expr: { $lt: ['$currentWorkload', '$maxWorkload'] },
    });

    if (!technicians.length) return fail(res, 'No available technicians found', 404);

    const best = technicians
      .map(t => ({ tech: t, score: scoreTechnician(t, sr) }))
      .sort((a, b) => b.score - a.score)[0];

    sr.assignedTechnician = best.tech._id;
    sr.status = 'assigned';
    sr.history.push({
      status: 'assigned',
      note: `Auto-assigned to ${best.tech.name} (score: ${best.score})`,
      changedAt: new Date(),
    });

    best.tech.currentWorkload = Math.min(best.tech.currentWorkload + 1, best.tech.maxWorkload);
    await best.tech.save();
    await sr.save();

    const io = req.app.locals.io;
    if (io) io.emit('service:technician_assigned', { ticketNumber: sr.ticketNumber, technicianId: best.tech._id });

    return ok(res, {
      serviceRequest: sr,
      assignedTechnician: { _id: best.tech._id, name: best.tech.name, score: best.score },
    });
  } catch (err) {
    return serverError(res, err);
  }
};

// ── Admin: get live dispatch board ────────────────────────────────────────────
exports.getDispatchBoard = async (req, res) => {
  try {
    const [unassigned, inProgress, technicians] = await Promise.all([
      ServiceRequest.find({
        isDeleted: false,
        status: { $in: ['open', 'verified', 'warranty_check'] },
        assignedTechnician: null,
      })
        .populate('customer', 'name phone')
        .sort({ priority: -1, createdAt: 1 })
        .limit(50),

      ServiceRequest.find({
        isDeleted: false,
        status: { $in: ['assigned','accepted','travelling','reached','diagnosis','repair','testing'] },
      })
        .populate('customer', 'name phone')
        .populate('assignedTechnician', 'name phone gpsLocation')
        .sort({ scheduledAt: 1 })
        .limit(100),

      Technician.find({ isDeleted: false, status: 'active' })
        .select('name phone skills territory availability currentWorkload maxWorkload rating gpsLocation'),
    ]);

    return ok(res, { unassigned, inProgress, technicians });
  } catch (err) {
    return serverError(res, err);
  }
};
