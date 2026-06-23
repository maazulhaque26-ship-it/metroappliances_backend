const AuditLog = require('../models/AuditLog');

/**
 * Express middleware that records an audit log entry after a successful
 * mutation. Only fires when the response body contains { success: true }.
 *
 * Usage in routes:
 *   router.put('/admin/dealers/:id/approve', protect, admin,
 *     auditLog('DEALER_APPROVED', 'Dealer'),
 *     dealer.approveDealer);
 *
 * @param {string}   action      - Uppercase event name, e.g. 'DEALER_APPROVED'
 * @param {string}   entity      - Model name, e.g. 'Dealer'
 * @param {Function} [getLabel]  - (req, resBody) => string — human-readable label
 * @param {Function} [getBefore] - (req) => object — snapshot before change
 */
function auditLog(action, entity, getLabel, getBefore) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (body) {
      // Fire-and-forget after the response is already sent — never blocks client
      if (body?.success !== false && req.user) {
        setImmediate(async () => {
          try {
            const entityId = req.params.id || req.params.entityId || body?.data?._id || null;
            const label    = getLabel
              ? getLabel(req, body)
              : (body?.data?.name || body?.data?.email || body?.data?.businessName || String(entityId || ''));
            const before   = getBefore ? await getBefore(req) : null;

            await AuditLog.create({
              admin:       req.user._id,
              adminName:   req.user.name  || '',
              adminEmail:  req.user.email || '',
              adminRole:   req.user.role  || '',
              action,
              entity,
              entityId:    entityId || undefined,
              entityLabel: String(label || '').slice(0, 200),
              changes:     { before, after: body?.data || null },
              ip:          (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
              userAgent:   (req.get('User-Agent') || 'unknown').slice(0, 300),
            });
          } catch (_) { /* audit errors must never surface to client */ }
        });
      }
      return originalJson(body);
    };

    next();
  };
}

module.exports = auditLog;
