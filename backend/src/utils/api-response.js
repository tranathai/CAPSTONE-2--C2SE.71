export function ok(res, data, message = null, status = 200) {
  const payload = { success: true, data };
  if (message) payload.message = message;
  return res.status(status).json(payload);
}

export function fail(res, message, status = 400, details = null) {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
}
