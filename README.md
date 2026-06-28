# Metro Appliances ERP — Backend API

**Version**: v1.0.0  
**Stack**: Node.js 20 · Express.js · MongoDB (Mongoose) · Socket.IO  
**Deployed**: Render (https://metroappliances-backend.onrender.com)

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/maazulhaque26-ship-it/metroappliances_backend
cd metroappliances_backend

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, Cloudinary keys, and email credentials

# 4. Seed admin user
node scripts/seedAdmin.js

# 5. Run
npm run dev          # development (nodemon)
npm start            # production
```

---

## Environment Variables

See [.env.example](.env.example) for the complete list. Required:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 64-byte random hex (see .env.example for generation command) |
| `CLIENT_URL` | Frontend URL for CORS whitelist |
| `STRIPE_SECRET_KEY` | Stripe secret key for payment processing |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `MAIL_USER` | Gmail address for transactional emails |
| `MAIL_PASS` | Gmail App Password (not your Gmail login password) |
| `MONGO_TEST_URI` | Local MongoDB for test isolation (default: localhost:27017/metro_test) |

---

## Running Tests

```bash
# All 34 suites (requires local MongoDB on localhost:27017)
npm test

# Single suite
npx jest test/hrms.test.js --forceExit

# With coverage
npx jest --coverage --forceExit
```

**Test results**: 34 suites · 1896 tests · 100% GREEN

---

## API Overview

Base URL: `/api`

| Portal | Base Path | Auth |
|---|---|---|
| Customer storefront | `/api/auth`, `/api/products`, `/api/orders` | Bearer JWT (no type) |
| Admin panel | `/api/admin/*` | Bearer JWT + role≥admin |
| Dealer portal | `/api/dealer/*` | Bearer JWT (type:dealer) |
| Sales Agent | `/api/agent/*` | Bearer JWT (type:agent) |
| Supplier | `/api/supplier/*` | Bearer JWT (type:supplier) |
| Technician | `/api/technician/*` | Bearer JWT (type:technician) |
| Installation Engineer | `/api/engineer/*` | Bearer JWT (type:engineer) |
| Warehouse Staff | `/api/warehouse/*` | Bearer JWT (type:warehouse) |
| Employee ESS | `/api/employee/*` | Bearer JWT (type:employee) |

Health check: `GET /health` — returns uptime and DB connectivity.

---

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full platform map including:
- 9-portal JWT auth stack
- 44-sprint delivery map
- Folder standards
- Naming conventions
- Security checklist

---

## Security

- Helmet (CSP, HSTS, X-Frame-Options)
- CORS whitelist: localhost + *.vercel.app + CLIENT_URL
- Rate limiting: 10 req/15min on all auth endpoints, 200 req/min general
- MongoDB injection prevention via `express-mongo-sanitize`
- ReDoS protection on user-input regex queries
- Body size limit: 2MB
- bcrypt password hashing (rounds 10–12) on all portal models
- JWT type isolation: each portal's token rejected by other middlewares
- AuditLog TTL: 2 years (auto-cleanup)

---

## Deployment (Render)

1. Connect GitHub repo to Render
2. Set Build Command: `npm install`
3. Set Start Command: `node server.js`
4. Add all environment variables from `.env.example`
5. Health check URL: `/health`

---

## Known Issues (v1.0.0)

| Issue | Severity | Notes |
|---|---|---|
| `cloudinary` npm package v1.41.3 (CVE GHSA-g4mf-96x5-5m2c) | Medium | Upgrade to v2 requires replacing `multer-storage-cloudinary` (no v2-compatible version exists). Our usage does not pass user input as Cloudinary params — low exploitability. |
| `js-yaml` via Jest dev dependency (moderate) | Low | Jest internal dependency; zero production exposure as Jest does not run in production. |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for full release history.
