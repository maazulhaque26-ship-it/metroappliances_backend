# Changelog — Metro Appliances ERP

All notable changes are documented here. Format follows [Keep a Changelog](https://keepachangelog.com).

---

## [1.0.1] — 2026-06-28

### Removed (repository hygiene — no functional change)
- Purged duplicated source trees that a monorepo merge had committed into the
  backend repository: nested `backend/` (740 files) and `frontend/` (537 files)
  directories, plus a stale root-level copy of the frontend (`src/`, `public/`,
  `index.html`, `vite.config.js`, `vercel.json`, `tailwind.config.js`,
  `postcss.config.js`). None of these were imported by `server.js` or any
  backend module, served as static assets, or executed by the Jest test suite.

### Added
- `LICENSE` (proprietary) and `SECURITY.md` (security policy + disclosure process).

### Verified
- `npm test` — 34 suites / 1896 tests pass (unchanged before and after cleanup).
- `node --check` passes on all backend source files.
- Backend CI green; Render `/health` reports `db: connected`.

---

## [1.0.0] — 2026-06-28

### Release Summary
Metro Appliances ERP v1.0.0 — Full-stack enterprise platform built over 44 development sprints.
Covers e-commerce, B2B, CRM, Warehouse, Procurement, Manufacturing, Finance, HR, Project Management, and AI Copilot.

### Platform Stats
- **Backend tests**: 1896 passing across 34 suites (100% GREEN)
- **Frontend build**: 0 errors, 0 warnings (Vite, ~432 admin pages)
- **API routes**: ~2,777 registered routes
- **Mongoose models**: 513+
- **Auth stacks**: 9 independent JWT portals
- **Socket.IO events**: 25+ real-time events

---

### Added — Core E-Commerce (Sprints 1–7)
- Customer storefront: Product catalog, cart, wishlist, checkout, Stripe payments
- User authentication: Register, login, JWT, password reset via email
- Admin panel: Product/category/order/coupon/user management
- Content CMS: Banners, blogs, gallery, testimonials, team, achievements
- Review system: Ratings, media uploads, helpful votes

### Added — Marketing & B2B (Sprints 8–9F)
- Marketing platform: Campaigns, flash sales, popups, announcement bars, notifications
- Dealer portal: Separate Dealer model, JWT type:dealer, B2B pricing, MOQ enforcement
- Dealer finance: Invoices, ledger, wallet, credit notes
- Sales Agent CRM: Territory, leads, visits, tasks, assignments
- Enterprise BI: Sales analytics, agent performance, target tracking, recharts dashboards
- Enterprise hardening: AuditLog, RBAC, shared components, hooks, DB indexes

### Added — Warehouse & Supply Chain (Sprints 10A–10F)
- Warehouse management: Multi-warehouse, zones, locations, staff JWT
- Inventory: GRN, stock adjustments, cycle counts, serial/batch tracking
- Procurement: Purchase orders, vendor management, 3-way matching, supplier JWT
- Dispatch & logistics: Shipments, couriers, GST challans, route tracking
- Barcode & scanning: EAN/UPC/QR generation, smart putaway, warehouse map
- IoT & Industry 4.0: Device registry, sensor readings, alert rules, Socket.IO

### Added — After-Sales Service (Sprints 11A–11C)
- Service management: Tickets, warranty cards, AMC contracts, spare parts
- Technician portal: Mobile-first, canvas signatures, photo capture, JWT type:technician
- Customer service portal: Self-service ticket creation, status tracking
- Installation management: Engineer dispatch, smart scoring, JWT type:engineer

### Added — Manufacturing ERP (Sprints 12A–12F)
- Manufacturing foundation: BOM, work centers, machines, shifts, QC
- Production planning: MPS, capacity planning, material requirements
- Enterprise MRP: Demand forecasting, safety stock, inventory projection
- MES: Work orders, operations, OEE tracking, genealogy
- EAM: Asset registry, maintenance orders, failure modes, MTBF/MTTR

### Added — Financial ERP (Sprints 13A–13F)
- General ledger: Double-entry engine, chart of accounts, journal entries
- Accounts payable: Vendor invoices, 3-way match, payment runs, aging
- Accounts receivable: Customer invoices, collections, credit management
- Tax & compliance: GST returns, TDS, e-invoice, e-way bill, compliance calendar
- Banking & treasury: Bank accounts, reconciliation, cash flow, FX
- CFO dashboard: Consolidation, MIS reports, budget vs actual

### Added — HRMS (Sprints 14A–14E)
- HR foundation: Employee profiles, departments, designations, org chart
- Attendance & leave: Biometric integration, shift management, leave workflows
- Payroll: Salary structures, payslip generation, PF/ESI, GL integration
- Recruitment ATS: Job postings, applications, interviews, offer letters
- Performance & LMS: Goals, KPIs, appraisals, training, ESS portal (JWT type:employee)

### Added — Project & Portfolio Management (Sprints 15A–15E)
- Project management: Projects, tasks, Kanban (HTML5 DnD), Gantt (recharts), milestones
- Enterprise PPM: Portfolios, programs, resource planning, Socket.IO
- PMO governance: EVM (CPI/SPI/EV), risk heatmap, strategic alignment
- BPM & workflow: Sequential/parallel/multi-level approval engine, SLA, escalation
- Document management: Version control, digital signatures, knowledge base, retention

### Added — AI & Intelligence (Sprints 16A–16C)
- Business intelligence: Custom dashboards, KPI targets, alerts, benchmarking
- AI forecasting: Sales/inventory/demand forecasts, anomaly detection (keyword NLQ)
- AI Copilot: Natural language queries, automation rules, executive briefings, knowledge assistant

### Added — Production Hardening (Sprints 16D–16E)
- Test stability: `createIndexes()` in all unique-constraint test suites (eliminates race conditions)
- `express-mongo-sanitize` for MongoDB injection protection
- Rate limiting extended to all 9 portal auth endpoints
- ReDoS protection on user-input `$regex` queries
- Production error handler (hides 500 details when NODE_ENV=production)
- `nodemailer` upgraded from v6.10.1 to v9.0.1 (security fix)
- Compound indexes on Order and Product models
- ARCHITECTURE.md fully updated through v1.0.0

---

### Known Issues (v1.0.0)
- `cloudinary` npm package v1.41.3 is flagged by npm audit (CVE: GHSA-g4mf-96x5-5m2c). Upgrade to v2 requires replacing `multer-storage-cloudinary` which has no v2-compatible version. Our usage does not expose user input to Cloudinary params — low exploitability. Scheduled for v1.1.
- `js-yaml` moderate CVE via Jest dev dependency — zero production exposure.

---

### Breaking Changes
None (initial release).

### Migration Notes
None required for fresh installations.

### Environment Variables Added in v1.0.0
- `MONGO_TEST_URI` — local MongoDB URI for test isolation (optional; defaults to localhost:27017/metro_test)
