/**
 * Standardized API response helpers — Sprint 9F
 *
 * All helpers return the same shape:
 *   { success, message, data?, pagination?, meta?, errors? }
 *
 * Use these in NEW controllers. Existing controllers are left unchanged
 * to preserve backward compatibility.
 */

exports.ok = (res, data, message = 'Success', meta = {}) => {
  const payload = { success: true, message };
  if (data !== undefined)    payload.data = data;
  if (meta.pagination)       payload.pagination = meta.pagination;
  if (meta.meta)             payload.meta = meta.meta;
  return res.json(payload);
};

exports.created = (res, data, message = 'Created successfully') => {
  return res.status(201).json({ success: true, message, data });
};

exports.noContent = (res, message = 'Deleted successfully') => {
  return res.json({ success: true, message });
};

exports.paginated = (res, data, total, page, limit, message = 'Success') => {
  return res.json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1,
    },
  });
};

exports.fail = (res, message = 'Bad request', status = 400, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};

exports.notFound = (res, entity = 'Resource') => {
  return res.status(404).json({ success: false, message: `${entity} not found` });
};

exports.forbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({ success: false, message });
};

exports.serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({ success: false, message: err?.message || 'Internal Server Error' });
};
