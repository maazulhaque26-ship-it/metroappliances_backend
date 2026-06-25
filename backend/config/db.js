const mongoose = require('mongoose');

// ─── Connection state helpers ─────────────────────────────────────────────────
// mongoose.connection.readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
const READY_STATE = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

const isDbConnected = () => mongoose.connection.readyState === 1;
const dbStatus      = () => READY_STATE[mongoose.connection.readyState] || 'unknown';

// ─── Retry configuration ──────────────────────────────────────────────────────
const RETRY_DELAY_MS = 5000;
let   retryTimer     = null;
let   listenersBound = false;

// Bind lifecycle listeners once so DB health is always visible in the logs.
const bindListeners = () => {
  if (listenersBound) return;
  listenersBound = true;

  const conn = mongoose.connection;
  conn.on('connected',    () => console.log('✅ MongoDB connected'));
  conn.on('reconnected',  () => console.log('🔄 MongoDB reconnected'));
  conn.on('disconnected', () => console.warn('⚠️  MongoDB disconnected — DB-dependent routes will return 503 until it recovers'));
  conn.on('error',        (err) => console.error(`❌ MongoDB error: ${err.message}`));
};

// Attempt the initial connection; retry on failure instead of crashing.
// Once the first connection succeeds, the driver auto-recovers transient drops
// (the 'disconnected'/'reconnected' events above report those).
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast instead of hanging when Mongo is down
    });
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}. Retrying in ${RETRY_DELAY_MS / 1000}s…`);
    clearTimeout(retryTimer);
    retryTimer = setTimeout(connectWithRetry, RETRY_DELAY_MS);
  }
};

// Kick off connection in the background. Never throws, never exits the process.
const connectDB = () => {
  bindListeners();
  connectWithRetry();
};

module.exports = { connectDB, isDbConnected, dbStatus };
