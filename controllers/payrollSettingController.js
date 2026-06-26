'use strict';
const PayrollSetting = require('../models/PayrollSetting');
const AuditLog       = require('../models/AuditLog');
const { ok, serverError } = require('../utils/response');

exports.getSettings = async (req, res) => {
  try {
    let settings = await PayrollSetting.findOne({ isDeleted: false })
      .populate('salaryExpenseAccount salaryPayableAccount pfPayableAccount esiPayableAccount tdsPayableAccount ptPayableAccount', 'accountCode accountName');
    if (!settings) settings = await PayrollSetting.create({});
    return ok(res, settings);
  } catch (e) { return serverError(res, e); }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await PayrollSetting.findOne({ isDeleted: false });
    if (!settings) settings = new PayrollSetting();
    const before = settings.toObject();
    Object.assign(settings, req.body);
    await settings.save();
    setImmediate(async () => {
      try {
        await AuditLog.create({
          admin: req.admin._id, adminName: req.admin.name, adminEmail: req.admin.email, adminRole: req.admin.role,
          action: 'UPDATE', entity: 'PayrollSetting', entityId: settings._id, entityLabel: 'Payroll Settings',
          changes: { before, after: settings.toObject() }, ip: req.ip, userAgent: req.headers['user-agent'],
        });
      } catch (_) {}
    });
    return ok(res, settings, 'Payroll settings updated');
  } catch (e) { return serverError(res, e); }
};
