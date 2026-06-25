'use strict';
const InstallationEngineer = require('../models/InstallationEngineer');
const InstallationRequest  = require('../models/InstallationRequest');
const { ok, fail, serverError } = require('../utils/response');

function scoreEngineer(engineer, ir) {
  let score = 0;

  const category = ir.category?.toLowerCase() || '';
  if (engineer.skills.some(s => s.toLowerCase().includes(category) || category.includes(s.toLowerCase()))) score += 30;

  const city    = ir.installationAddress?.city;
  const pincode = ir.installationAddress?.pincode;
  if (city    && engineer.territory.cities.some(c => c.toLowerCase() === city.toLowerCase())) score += 25;
  if (pincode && engineer.territory.pincodes.includes(pincode)) score += 15;

  if (engineer.isAvailable) score += 20;

  const workloadRatio = engineer.currentWorkload / (engineer.maxWorkload || 6);
  score += Math.round((1 - workloadRatio) * 20);

  if (ir.priority === 'urgent') score += 10;
  if (ir.priority === 'vip')    score += 15;

  if (engineer.rating.average > 0) score += Math.round(engineer.rating.average * 2);

  return score;
}

exports.getDispatchRecommendations = async (req, res) => {
  try {
    const { requestId } = req.params;
    const ir = await InstallationRequest.findOne({ _id: requestId, isDeleted: false });
    if (!ir) return fail(res, 'Installation request not found', 404);

    const engineers = await InstallationEngineer.find({
      isDeleted: false,
      status: 'active',
      isAvailable: true,
      $expr: { $lt: ['$currentWorkload', '$maxWorkload'] },
    });

    const scored = engineers
      .map(eng => ({ engineer: eng, score: scoreEngineer(eng, ir) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return ok(res, {
      installationRequest: {
        requestNumber:       ir.requestNumber,
        category:            ir.category,
        priority:            ir.priority,
        installationAddress: ir.installationAddress,
      },
      recommendations: scored.map(({ engineer, score }) => ({
        _id:             engineer._id,
        name:            engineer.name,
        phone:           engineer.phone,
        skills:          engineer.skills,
        territory:       engineer.territory,
        currentWorkload: engineer.currentWorkload,
        maxWorkload:     engineer.maxWorkload,
        rating:          engineer.rating,
        isAvailable:     engineer.isAvailable,
        score,
      })),
    });
  } catch (err) {
    return serverError(res, err);
  }
};

exports.autoAssign = async (req, res) => {
  try {
    const { requestId } = req.params;
    const ir = await InstallationRequest.findOne({ _id: requestId, isDeleted: false });
    if (!ir) return fail(res, 'Installation request not found', 404);
    if (ir.assignedEngineer) return fail(res, 'Already has an engineer assigned', 400);

    const engineers = await InstallationEngineer.find({
      isDeleted: false, status: 'active', isAvailable: true,
      $expr: { $lt: ['$currentWorkload', '$maxWorkload'] },
    });
    if (!engineers.length) return fail(res, 'No available engineers found', 404);

    const best = engineers
      .map(eng => ({ engineer: eng, score: scoreEngineer(eng, ir) }))
      .sort((a, b) => b.score - a.score)[0];

    ir.assignedEngineer = best.engineer._id;
    ir.dispatchScore    = best.score;
    ir.status           = 'assigned';
    ir.scheduledAt      = ir.preferredDate;
    ir.history.push({
      status: 'assigned',
      note:   `Auto-assigned to ${best.engineer.name} (score: ${best.score})`,
      changedBy:      req.user._id,
      changedByModel: 'Admin',
      changedAt:      new Date(),
    });
    best.engineer.currentWorkload = (best.engineer.currentWorkload || 0) + 1;

    await Promise.all([ir.save(), best.engineer.save()]);
    return ok(res, {
      assignedEngineer: { name: best.engineer.name, phone: best.engineer.phone, score: best.score },
      installationRequest: ir,
    });
  } catch (err) {
    return serverError(res, err);
  }
};
