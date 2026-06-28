# Metro Appliances ERP — Backend API

> **Enterprise-grade MERN stack ERP** covering e-commerce, warehouse, manufacturing, finance, HRMS, CRM, project management, after-sales service, AI/BI analytics, and more — all in a single Node.js API.

**Version**: v1.0.0 | **Stack**: Node.js 20 · Express.js · MongoDB (Mongoose) · Socket.IO | **Deployed**: Render

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Project Structure](#project-structure)
6. [Authentication System](#authentication-system)
7. [API Reference](#api-reference)
8. [Database Models](#database-models)
9. [Running Tests](#running-tests)
10. [Socket.IO Events](#socketio-events)
11. [Security](#security)
12. [Deployment (Render)](#deployment-render)
13. [Adding New Features](#adding-new-features)
14. [Known Issues](#known-issues)
15. [Changelog](#changelog)

---

## Project Overview

Metro Appliances ERP is a full-featured enterprise platform built over 44 sprints.

| Domain | What It Covers |
|---|---|
| **E-Commerce** | Product catalog, cart, orders, Stripe payments, reviews |
| **Warehouse & Inventory** | Multi-location stock, barcode scanning, IoT sensors, putaway engine |
| **Procurement** | Purchase orders, vendor management, 3-way match, supplier portal |
| **Manufacturing** | BOM, work orders, MRP, MES, production scheduling, EAM |
| **Finance** | General ledger, AP, AR, tax (GST/TDS/e-invoice), banking, CFO dashboard |
| **HRMS** | Employee records, attendance, payroll, recruitment (ATS), performance, ESS |
| **After-Sales** | Service tickets, technician dispatch, installation, warranty management |
| **CRM / Sales** | Sales agent portal, dealer B2B commerce, lead management |
| **Project Management** | Projects, Gantt/Kanban, PPM portfolio, PMO governance |
| **BPM** | Workflow builder, approval engine, SLA/escalation automation |
| **Documents** | DMS with versioning, approval workflows, knowledge base |
| **BI & AI** | Dashboards, KPI tracking, AI forecasting, AI copilot |

---

## Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **MongoDB 6+** running locally on `localhost:27017` (for tests) — [Download](https://www.mongodb.com/try/download/community)
- **Git**
- A free **Cloudinary** account (for image uploads)
- A **Gmail** account with an **App Password** enabled (for transactional emails)
- A **Stripe** account (for payment processing — test keys are fine for development)

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/maazulhaque26-ship-it/metroappliances_backend
cd metroappliances_backend

# 2. Install dependencies
npm install

# 3. Copy the environment template and fill in your values
cp .env.example .env
# Open .env and set all required variables (see Environment Variables section)

# 4. Start local MongoDB (if not already running as a service)
mongod --dbpath /data/db

# 5. Seed the default admin user (run once)
node scripts/seedAdmin.js

# 6. Start the development server
npm run dev
# Server starts on http://localhost:5000
```

Test the API is running:
```bash
curl http://localhost:5000/health
# Expected: { "status": "ok", "db": "connected", "uptime": ... }
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in every value.

### Database

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB Atlas connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/metrodb`) |
| `MONGO_TEST_URI` | No | Local MongoDB for test isolation. Defaults to `mongodb://localhost:27017/metro_test` if not set |

### Authentication

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Secret key for signing JWTs. Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

### Frontend / CORS

| Variable | Required | Description |
|---|---|---|
| `CLIENT_URL` | Yes | Frontend URL for CORS whitelist (e.g., `https://metroappliances-frontend.vercel.app`). Use `http://localhost:5173` in development |

### Payments

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Use `sk_test_...` for development, `sk_live_...` for production |

### File Uploads (Cloudinary)

| Variable | Required | Description |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary cloud name (from dashboard) |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |

### Email (Gmail SMTP)

| Variable | Required | Description |
|---|---|---|
| `MAIL_USER` | Yes | Gmail address to send emails from |
| `MAIL_PASS` | Yes | Gmail **App Password** — NOT your regular Gmail login. Enable 2FA → myaccount.google.com → Security → App Passwords |

### Server

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port to listen on. Defaults to `5000` |
| `NODE_ENV` | No | Set to `production` on Render. Controls error message verbosity |

---

## Project Structure

```
backend/
├── server.js                 # Entry point — Express setup, middleware, route mounting
├── package.json
├── jest.config.js            # Test runner config (maxWorkers: 4, testTimeout: 30000)
├── .env.example              # Environment variable template
│
├── controllers/              # Route handler functions — business logic lives here (68 total)
│   ├── authController.js     # Customer login/register/profile
│   ├── productController.js  # Product CRUD + search
│   ├── orderController.js    # Customer orders + admin order management
│   ├── adminController.js    # Admin user/product/order management
│   └── ...                   # One controller file per domain
│
├── models/                   # Mongoose schemas (513+ models)
│   ├── User.js               # Customer account
│   ├── Product.js            # Product catalog
│   ├── Order.js              # Customer orders
│   └── ...                   # One model file per entity
│
├── routes/
│   └── index.js              # Single file — all 2777+ routes registered here
│
├── middleware/               # Express middleware functions
│   ├── authMiddleware.js     # Customer/admin JWT validation
│   ├── dealerAuthMiddleware.js
│   ├── agentAuthMiddleware.js
│   ├── supplierAuthMiddleware.js
│   ├── technicianAuthMiddleware.js
│   ├── engineerAuthMiddleware.js
│   ├── warehouseAuthMiddleware.js
│   ├── employeeAuthMiddleware.js
│   └── uploadMiddleware.js   # Multer + Cloudinary file upload
│
├── utils/
│   ├── mailer.js             # Nodemailer Gmail SMTP sender
│   └── formatters.js         # Currency, date, number formatters
│
├── scripts/
│   └── seedAdmin.js          # Creates the default admin user (run once)
│
└── test/                     # Jest test suites (34 files, 1896 tests)
    ├── auth.test.js
    ├── product.test.js
    ├── hrms.test.js
    └── ...
```

### How the code is organized

Every feature follows the same 3-layer pattern:

```
URL → routes/index.js → middleware (auth check) → controller → model → MongoDB
```

**Example — Admin views all orders:**
1. `GET /api/admin/orders` is matched in `routes/index.js`
2. `protect` + `admin` middleware validates the JWT and checks role
3. `adminController.getAllOrders()` queries `Order.find(...)` with filters/pagination
4. Controller sends JSON response

---

## Authentication System

The platform uses **9 separate JWT authentication stacks**, one per portal. A dealer token cannot access admin routes and vice versa.

| Portal | Login Endpoint | JWT `type` field | Protected by |
|---|---|---|---|
| Customer | `POST /api/auth/login` | *(none)* | `protect` middleware |
| Admin | `POST /api/auth/login` | *(none, role≥admin)* | `protect` + `admin` |
| Dealer | `POST /api/dealer/auth/login` | `dealer` | `dealerAuth` middleware |
| Sales Agent | `POST /api/agent/auth/login` | `agent` | `agentAuth` middleware |
| Supplier | `POST /api/supplier/auth/login` | `supplier` | `supplierAuth` middleware |
| Technician | `POST /api/technician/auth/login` | `technician` | `technicianAuth` middleware |
| Engineer | `POST /api/engineer/auth/login` | `engineer` | `engineerAuth` middleware |
| Warehouse | `POST /api/warehouse/auth/login` | `warehouse` | `warehouseAuth` middleware |
| Employee | `POST /api/employee/auth/login` | `employee` | `employeeAuth` middleware |

**How to call protected routes:**
```
Authorization: Bearer <your-jwt-token>
```

**Rate limiting on all login endpoints:** 10 requests per 15 minutes per IP. Returns `429 Too Many Requests` when exceeded.

---

## API Reference

Base URL: `http://localhost:5000/api` (development)

### Health

```
GET /health   → { status, db, uptime, timestamp }
```

### Customer Portal

```
POST /api/auth/register           Create customer account
POST /api/auth/login              Login, returns JWT
GET  /api/auth/me                 Get own profile [auth]
PUT  /api/auth/profile            Update profile [auth]

GET  /api/products                List products (filter: category, brand, price, search)
GET  /api/products/:id            Single product detail
POST /api/products/:id/reviews    Submit review [auth]

POST /api/orders                  Place order + creates Stripe PaymentIntent [auth]
GET  /api/orders/:id              Order detail [auth]
```

### Admin Panel (`/api/admin/*`) — requires admin JWT

```
/api/admin/products/*    Product management (CRUD + image upload)
/api/admin/orders/*      Order management (list, update status, export)
/api/admin/users/*       User management (list, ban, promote)
/api/admin/dashboard     Sales stats and KPIs
/api/admin/bi-exec/*     BI dashboards, KPI targets, reports
/api/admin/ai/*          AI forecasting, anomaly detection
/api/admin/copilot/*     AI copilot queries and configuration
/api/admin/pmo/*         PMO governance and analytics
/api/admin/workflow/*    Workflow definitions and instances
/api/admin/documents/*   Document management system
```

### Domain Portals (full route lists in `routes/index.js`)

```
/api/dealer/*       B2B catalog, cart, orders, invoices, wallet
/api/agent/*        CRM leads, targets, commissions
/api/supplier/*     Purchase orders, deliveries, invoices
/api/technician/*   Service tickets, job cards, parts
/api/engineer/*     Installation requests, job completion
/api/warehouse/*    Inventory, receiving, putaway, picking, IoT
/api/employee/*     ESS: payslips, leave, attendance, profile
```

---

## Database Models

The project has **513+ Mongoose models** grouped by domain:

| Domain | Key Models |
|---|---|
| Core E-Commerce | `User`, `Product`, `Order`, `Cart`, `Review`, `Category` |
| Marketing | `Campaign`, `Promotion`, `EmailTemplate`, `Notification` |
| Dealer/B2B | `Dealer`, `DealerOrder`, `DealerCart`, `DealerPricing`, `DealerInvoice` |
| Sales | `SalesAgent`, `Lead`, `SalesTarget`, `Commission` |
| Warehouse | `Warehouse`, `Bin`, `StockMovement`, `Barcode`, `IoTDevice` |
| Inventory | `Inventory`, `StockAdjustment`, `StockAlert`, `CycleCount` |
| Procurement | `PurchaseOrder`, `Vendor`, `GRN`, `SupplierInvoice` |
| Logistics | `Shipment`, `Carrier`, `GSTChallan`, `VehicleTrip` |
| Manufacturing | `BillOfMaterial`, `WorkOrder`, `ProductionSchedule`, `QualityCheck` |
| MRP/MES | `MRPRun`, `MaterialRequirement`, `ProductionOrder`, `ShopFloorEvent` |
| EAM | `Asset`, `MaintenanceWork`, `PreventivePlan`, `AssetFailure` |
| Finance GL | `ChartOfAccounts`, `JournalEntry`, `TrialBalance`, `FinancialPeriod` |
| Accounts Payable | `APInvoice`, `PaymentRun`, `VendorPayment`, `AgingBucket` |
| Accounts Receivable | `ARInvoice`, `CustomerPayment`, `CreditNote`, `CollectionActivity` |
| Tax | `GSTReturn`, `TDSDeduction`, `EInvoice`, `EWayBill` |
| Banking | `BankAccount`, `BankTransaction`, `CashFlow`, `Reconciliation` |
| HRMS | `Employee`, `Department`, `Designation`, `HRPolicy` |
| Attendance | `AttendanceRecord`, `LeaveRequest`, `LeaveBalance`, `Shift` |
| Payroll | `PayrollRun`, `Payslip`, `SalaryComponent`, `PFContribution` |
| Recruitment | `JobPosting`, `Candidate`, `Interview`, `Offer` |
| Performance | `AppraisalCycle`, `GoalSetting`, `PerformanceReview` |
| Service | `ServiceTicket`, `Technician`, `JobCard`, `WarrantyRecord` |
| Installation | `InstallationRequest`, `InstallationEngineer`, `ProductRegistration` |
| Projects | `Project`, `ProjectTask`, `Milestone`, `TimeEntry` |
| PPM | `Portfolio`, `ProgramProject`, `PortfolioRisk`, `ResourceAllocation` |
| PMO | `PMOGovernance`, `PMOReport`, `RiskRegister`, `StrategicObjective` |
| Workflow | `WorkflowDefinition`, `WorkflowInstance`, `ApprovalStep` |
| Documents | `Document`, `DocumentVersion`, `DocumentFolder`, `KnowledgeArticle` |
| BI | `BIDashboard`, `KPITarget`, `BIReport`, `BIAlert` |
| AI | `AIForecast`, `AIAnomaly`, `AIRecommendation`, `PredictionSetting` |
| AI Copilot | `CopilotSession`, `CopilotMessage`, `CopilotConfig` |
| Audit | `AuditLog` (TTL 2 years, auto-cleanup) |

---

## Running Tests

The test suite requires a **local MongoDB** instance on `localhost:27017`. Tests use isolated databases so they never touch your development data.

```bash
# Run all 34 test suites (1896 tests)
npm test

# Run a single suite
npx jest test/hrms.test.js --forceExit

# Run with verbose output
npx jest --verbose --forceExit

# Run with coverage report
npx jest --coverage --forceExit

# Run tests matching a keyword
npx jest --testNamePattern="payroll" --forceExit
```

**Expected result:** 34 suites · 1896 tests · all PASS

### Why tests use `MONGO_TEST_URI` not `MONGO_URI`

Tests isolate themselves by connecting to `MONGO_TEST_URI` (a local MongoDB). If not set, each suite defaults to a separate local database like `mongodb://localhost:27017/metro_test_hrms`. This prevents hitting cloud Atlas during tests.

### The `createIndexes()` pattern in test files

Some `describe` blocks include:
```js
beforeAll(async () => {
  await SomeModel.createIndexes();
});
```

This is intentional. When Jest runs 4 workers in parallel, Mongoose's async index creation may not complete before unique-constraint tests run, causing false passes. The explicit `createIndexes()` call ensures the index exists first.

---

## Socket.IO Events

Real-time events emitted by the server. Connect to `ws://localhost:5000`.

| Event | Emitted When |
|---|---|
| `orderStatusChanged` | Order status updated by admin |
| `newOrder` | New customer order placed |
| `stockAlert` | Inventory drops below reorder point |
| `serviceTicketUpdated` | Technician updates a service ticket |
| `workflowStepCompleted` | Approval step approved/rejected |
| `portfolioMetricsUpdated` | PPM portfolio recalculated |
| `iotSensorReading` | IoT device sends a reading |
| `productionMilestone` | Work order stage completed |

---

## Security

| Measure | Implementation |
|---|---|
| HTTP headers | `helmet` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) |
| CORS | Whitelist: `localhost:5173`, `*.vercel.app`, `CLIENT_URL` env var |
| Auth rate limiting | 10 req / 15 min per IP on all `/auth/login` endpoints |
| General rate limiting | 200 req / min per IP on all other endpoints |
| MongoDB injection | `express-mongo-sanitize` with `replaceWith: '_'` |
| ReDoS protection | User-supplied search strings escaped before use in `$regex` queries |
| Body size limit | 2 MB (blocks oversized JSON payloads) |
| Password hashing | `bcrypt` rounds 10–12 on all portal models |
| JWT isolation | Each portal's middleware rejects tokens from other portals via `type` field check |
| Error messages | In `production`, 500 errors return generic message — no stack traces leaked |
| Audit logging | All sensitive admin actions written to `AuditLog` (TTL 2 years) |
| DB indexes | Compound indexes on `Order` and `Product` for query performance |

---

## Deployment (Render)

### One-time Setup

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo `metroappliances_backend`
3. Configure:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Health Check Path**: `/health`
4. Add all environment variables from `.env.example` in the Render dashboard → Environment tab
5. Deploy — Render auto-deploys on every push to `master`

### Subsequent Deploys

```bash
git push origin master
# Render auto-deploys within ~2 minutes
```

### Verify deployment

```bash
curl https://metroappliances-backend.onrender.com/health
```

---

## Adding New Features

Follow this pattern to add a new module (example: `SupplierFeedback`):

### 1. Create the Model (`models/SupplierFeedback.js`)

```js
const mongoose = require('mongoose');

const supplierFeedbackSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  rating:   { type: Number, min: 1, max: 5, required: true },
  comment:  { type: String },
  createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SupplierFeedback', supplierFeedbackSchema);
```

### 2. Create the Controller (`controllers/supplierFeedbackController.js`)

```js
const SupplierFeedback = require('../models/SupplierFeedback');

exports.createFeedback = async (req, res) => {
  try {
    const feedback = await SupplierFeedback.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: feedback });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
```

### 3. Add Routes to `routes/index.js`

```js
const supplierFeedback = require('../controllers/supplierFeedbackController');

router.get('/admin/supplier-feedback',  protect, admin, supplierFeedback.list);
router.post('/admin/supplier-feedback', protect, admin, supplierFeedback.createFeedback);
```

### 4. Write a Test (`test/supplierFeedback.test.js`)

```js
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/metro_test_supplier_feedback';

beforeAll(async () => { await mongoose.connect(MONGO_URI); });
afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

describe('SupplierFeedback model', () => {
  it('creates a feedback record', async () => {
    const SupplierFeedback = require('../models/SupplierFeedback');
    const fb = await SupplierFeedback.create({ supplier: new mongoose.Types.ObjectId(), rating: 4 });
    expect(fb.rating).toBe(4);
  });
});
```

---

## Known Issues

| Issue | Severity | Notes |
|---|---|---|
| `cloudinary` npm v1.41.3 — CVE GHSA-g4mf-96x5-5m2c | Medium | Cannot upgrade to v2 — `multer-storage-cloudinary@4.0.0` has no v2-compatible release. Our code never passes user input as Cloudinary transform params — low actual exploitability. Scheduled for v1.1. |
| `js-yaml` (via Jest dev dependency) | Low | Jest internal dependency. Not shipped in production. Zero production exposure. |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the complete v1.0.0 release history covering all 44 development sprints.

---

## License

Proprietary — Metro Appliances. All rights reserved.
