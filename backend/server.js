const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const mongoose     = require('mongoose');
const dotenv       = require('dotenv');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const path         = require('path');
const fs           = require('fs');

const routes = require('./routes/index');
const { connectDB, isDbConnected, dbStatus } = require('./config/db');
const dbGuard = require('./middleware/dbGuard');

// ─── Rate limiters ────────────────────────────────────────────────────────────
// Auth endpoints: tight limit to block brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// General API: generous limit to allow normal browsing
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute
  max: 200,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

dotenv.config();

const app    = express();
const server = http.createServer(app);

// ─── CORS origin validator ────────────────────────────────────────────────────
// Accepts: localhost (dev), any *.vercel.app (preview deployments),
// and the explicit CLIENT_URL env var (production custom domain).
const isAllowedOrigin = (origin) => {
  if (!origin) return true;                                    // server-to-server / curl
  if (/^http:\/\/localhost/.test(origin)) return true;        // local dev
  if (/\.vercel\.app$/.test(origin)) return true;             // Vercel preview URLs
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;
  return false;
};

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => isAllowedOrigin(origin)
      ? cb(null, true)
      : cb(new Error('CORS: origin not allowed → ' + origin)),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible from controllers via req.app.locals.io
app.locals.io = io;

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Ensure upload directories exist ─────────────────────────────────────────
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'products'),
  path.join(__dirname, 'uploads', 'reviews'),
  path.join(__dirname, 'uploads', 'categories'),
  path.join(__dirname, 'uploads', 'collections'),
  path.join(__dirname, 'uploads', 'settings'),
];
uploadDirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => isAllowedOrigin(origin)
    ? cb(null, true)
    : cb(new Error('CORS: origin not allowed → ' + origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Security & Logging ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc:      ["'self'"],
      baseUri:         ["'self'"],
      scriptSrc:       ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      styleSrc:        ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:         ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc:          ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://images.cloudinary.com", "https://www.google-analytics.com"],
      connectSrc:      ["'self'", "https:", "wss:", "https://www.google-analytics.com"],
      mediaSrc:        ["'self'", "https://res.cloudinary.com"],
      objectSrc:       ["'none'"],
      frameSrc:        ["'none'"],
      frameAncestors:  ["'none'"],
      formAction:      ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(morgan('dev'));
app.use(cookieParser());

// ─── Body Parsers (explicit limits to prevent payload attacks) ────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── Static: serve uploaded images ───────────────────────────────────────────
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, 'uploads')));

const sitemap = require('./controllers/sitemapController');

// ─── Health Checks (always available, never DB-gated) ─────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Metro Appliances API is running', version: '2.0.0' });
});

// ─── Dynamic sitemap (public, DB-required but not DB-gated so it fails gracefully)
app.get('/api/sitemap.xml', sitemap.getSitemap);

// Liveness/readiness probe. Always returns 200 so the process stays observable
// even while MongoDB is down; the payload reports current DB connectivity.
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status:    'ok',
    uptime:    process.uptime(),
    db:        { status: dbStatus(), connected: isDbConnected() },
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes (DB-gated: return 503 while MongoDB is unavailable) ───────────
// Auth endpoints get a tighter rate limit; everything else gets the general one
app.use('/api/auth/register',              authLimiter);
app.use('/api/auth/login',                 authLimiter);
// Dealer auth endpoints — same tight limit as customer auth
app.use('/api/dealer/auth/register',       authLimiter);
app.use('/api/dealer/auth/login',          authLimiter);
app.use('/api/dealer/auth/forgot-password', authLimiter);
// Agent / Warehouse / Supplier login — same brute-force protection
app.use('/api/agent/auth/login',           authLimiter);
app.use('/api/warehouse/auth/login',       authLimiter);
app.use('/api/supplier/auth/login',        authLimiter);
app.use('/api/engineer/auth/login',        authLimiter);
app.use('/api',                            apiLimiter, dbGuard, routes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Open the HTTP port immediately — independent of MongoDB. The server stays up
// and observable (health checks + clear 503s) even if the database is down, so
// clients never hit an opaque ERR_CONNECTION_REFUSED because of a DB outage.
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

// Connect to MongoDB separately, with automatic retry. A DB failure never
// crashes the process; DB-dependent routes return 503 until it recovers.
connectDB();

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(() => {
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref(); // force-exit if cleanup hangs
};
['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));
