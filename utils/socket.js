// Lightweight socket.io event emitter utility
// Usage: emit(req.app.locals.io, 'event:name', payload)

exports.emit = function emit(io, event, data) {
  try {
    if (io) io.emit(event, data);
  } catch (_) {}
};
