# Metro Appliances Platform — Architecture Reference

## Overview

Full-stack MERN e-commerce and ERP platform for home appliance retail. The system spans B2C e-commerce, B2B dealer portal, sales agent CRM, warehouse management, procurement, dispatch & logistics, and enterprise BI — all served from a single Express API and a single React frontend.

**Stack:** Node.js ≥18 / Express 4.22 / MongoDB (Mongoose 8.x) / React 18.3 / Vite / Redux Toolkit

---

## Repository Structure

```
ecommerce-app/
├── backend/           # Express API (deployed → Render)
│   ├── config/        # db.js (MongoDB with retry), cloudinary
│   ├── controllers/   # 68 controller files
│   ├── middleware/    # auth, dealerAuth, agentAuth, warehouseAuth, supplierAuth, dbGuard, auditLog
│   ├── models/        # 74 Mongoose models
│   ├── routes/        # routes/index.js (876 lines, all routes registered here)
│   ├── scripts/       # One-off maintenance scripts (not part of the API)
│   ├── test/          # Jest test suites (5 files)
│   ├── uploads/       # Local file storage (dev only; prod uses Cloudinary)
│   ├── utils/         # response.js, logisticsHelpers.js, permissions.js
│   └── server.js      # Entry point
└── frontend/          # React SPA (deployed → Vercel)
    └── src/
        ├── components/    # 14 shared Sprint-9F components (StatusBadge, MetricCard, etc.)
        ├── hooks/         # 11 custom hooks
        ├── pages/         # Feature pages by portal
        ├── redux/         # 11 slices + store.js
        ├── services/      # api.js (axios), formatters.js
        └── test/          # Vitest test suites (2 files)
```

---

## Authentication — 8 JWT Stacks

All stacks share the same `JWT_SECRET`. Each middleware verifies `decoded.type` to prevent cross-portal token reuse.

| Portal | JWT type field | Middleware file | Login endpoint |
|--------|---------------|-----------------|----------------|
| Customer | *(absent)* | `middleware/auth.js` | `POST /api/auth/login` |
| Dealer | `type: 'dealer'` | `middleware/dealerAuth.js` | `POST /api/dealer/auth/login` |
| Sales Agent | `type: 'agent'` | `middleware/agentAuth.js` | `POST /api/agent/auth/login` |
| Warehouse | `type: 'warehouse'` | `middleware/warehouseAuth.js` | `POST /api/warehouse/auth/login` |
| Supplier | `type: 'supplier'` | `middleware/supplierAuth.js` | `POST /api/supplier/auth/login` |
| Technician | `type: 'technician'` | `middleware/technicianAuth.js` | `POST /api/technician/auth/login` |
| Engineer | `type: 'engineer'` | `middleware/engineerAuth.js` | `POST /api/engineer/auth/login` |

All auth login endpoints receive `authLimiter` (10 req / 15 min) before hitting `apiLimiter`.

---

## Portal Structure

| Portal | Front-end prefix | Back-end prefix | Purpose |
|--------|-----------------|-----------------|---------|
| Customer storefront | `/` | `/api/` | B2C shopping |
| Admin panel | `/admin` | `/api/admin/` | Full platform management |
| Dealer portal | `/dealer` | `/api/dealer/` | B2B ordering & invoicing |
| Sales agent | `/agent` | `/api/agent/` | CRM + visit tracking |
| Warehouse portal | `/warehouse` | `/api/warehouse/` | WMS operations |
| Supplier portal | `/supplier` | `/api/supplier/` | Procurement & deliveries |
| Technician portal | `/technician` | `/api/technician/` | Service jobs |
| Installation engineer portal | `/engineer` | `/api/engineer/` | Installation jobs |

---

## Key Subsystems

### Database (MongoDB)
- **74 models**, **173 indexes** across 54 model files
- `config/db.js`: `connectWithRetry()` with 5 s back-off; exports `isDbConnected()` / `dbStatus()`
- `middleware/dbGuard.js`: Returns HTTP 503 + `Retry-After: 5` while MongoDB is unavailable
- `AuditLog` model: 2-year TTL (`expireAfterSeconds: 63_072_000`), 5 compound indexes, written fire-and-forget via `setImmediate`

### Security
- **Helmet** with explicit CSP directives (enabled in `server.js`)
- **CORS**: allow-list of `localhost`, `*.vercel.app`, and `CLIENT_URL` env var
- **Rate limiting**: `authLimiter` (10/15 min) on all 6 login endpoints; `apiLimiter` (200/min) on all other API routes
- **RBAC**: `utils/permissions.js` — `PERMISSIONS` matrix, `can()`, `canAny()`, `getPermissions()`

### Response Conventions
Two conventions coexist (do not mix in new code):
- **Sprints 1–9F**: `utils/response.js` — `ok()`, `created()`, `paginated()`, `fail()`, `notFound()`, `forbidden()`, `serverError()`
- **Sprint 10D (Logistics)**: `utils/logisticsHelpers.js` — `respOk()`, `respErr()`

### Frontend State
Redux Toolkit store with 11 slices: `auth`, `cart`, `wishlist`, `products`, `orders`, `notifications`, `dealer`, `agent`, `warehouse`, `supplier`, `ui`.

### Shared Components (Sprint 9F)
14 components in `src/components/`: `StatusBadge`, `MetricCard`, `DataTable`, `PageHeader`, `FilterBar`, `EmptyState`, `LoadingSpinner`, `ConfirmModal`, `FormField`, `SearchInput`, `Pagination`, `AlertBanner`, `DateRangePicker`, `ExportButton`.

---

## Deployment

| Service | Platform | Trigger | Region |
|---------|----------|---------|--------|
| Backend API | Render | Push to `master` (auto-deploy) | Singapore |
| Frontend SPA | Vercel | `vercel --prod` (manual) | Edge |

- **Health check**: `GET /health` — always 200, reports DB connectivity
- **Backend repo**: `maazulhaque26-ship-it/metroappliances_backend` (branch: `master`)
- **Frontend repo**: `maazulhaque26-ship-it/metroappliances_frontend` (branch: `master`)
- **CI**: GitHub Actions in `.github/workflows/` — fires on `master`, `main`, `develop`

---

## Sprint History

| Sprint | Scope |
|--------|-------|
| 1–7 | B2C e-commerce core (auth, products, cart, orders, payments, reviews) |
| 8 | Marketing platform (campaigns, banners, notifications) |
| 9A | Dealer portal foundation |
| 9B–9C | B2B commerce + dealer finance (invoices, ledger, wallet) |
| 9D | Sales agent CRM (6 models, 16 pages) |
| 9E | Enterprise BI (9 dashboard pages, recharts) |
| 9F | Enterprise hardening (AuditLog, 14 shared components, RBAC, DB indexes) |
| 10A | Warehouse foundation (5 models, 55 routes, 7 admin pages) |
| 10B | Inventory management (8 models, adjustInventory() engine, 11 admin pages) |
| 10C | Procurement & vendor management (13 models, supplier JWT stack) |
| 10D | Dispatch & logistics (9 models, GST challan, delivery challan print) |
| 11A | After-sales service foundation |
| 11B | Technician portal, service automation, reporting |
| 11C | Installation management and product registration |
| 11D | Platform stabilization, deterministic tests, CI syntax, duplicate-index cleanup |

---

## Development Setup

```bash
# Backend
cd backend
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev                 # nodemon server.js on :5001

# Frontend
cd frontend
npm install
npm run dev                 # Vite dev server on :5173 (proxies /api → :5001)

# Tests
cd backend && npm test      # Jest + mongodb-memory-server
cd frontend && npm test     # Vitest + jsdom
```

### Environment Variables (backend)
See `backend/.env.example` for the full list. Required for production:
`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `CLOUDINARY_*`, `STRIPE_SECRET_KEY`, `EMAIL_*`.
