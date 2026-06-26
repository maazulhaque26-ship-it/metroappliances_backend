# Metro Appliances — Architecture Map

**Version**: Sprint 9F (Enterprise Hardening)  
**Stack**: MongoDB · Express.js · React 18 · Node.js (MERN)  
**Deployed**: Render (backend) · Vercel (frontend)

---

## Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────┐
│                        METRO APPLIANCES PLATFORM                     │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Customer   │  │    Dealer    │  │ Sales Agent  │              │
│  │   Portal     │  │    Portal    │  │    Portal    │              │
│  │  (React 18)  │  │  (React 18)  │  │  (React 18)  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────▼─────────────────▼──────────────────▼───────┐             │
│  │                   Vite Frontend Bundle                │             │
│  │  Redux Store: auth | dealerAuth | agentAuth |        │             │
│  │              cart | wishlist | products |            │             │
│  │              settings | compare | notifications |   │             │
│  │              dealerCart                             │             │
│  └──────────────────────────┬────────────────────────┘             │
│                              │ HTTPS (axios)                         │
│  ┌───────────────────────────▼────────────────────────┐             │
│  │              Express.js API Server                   │             │
│  │  Rate Limit · Helmet · CORS · Morgan · Cookie-Parser│             │
│  │  dbGuard (503 while MongoDB unavailable)            │             │
│  │                                                      │             │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │             │
│  │  │ Customer │ │  Dealer  │ │  Agent   │           │             │
│  │  │   Auth   │ │   Auth   │ │   Auth   │           │             │
│  │  │JWT(type:─│ │JWT(type: │ │JWT(type: │           │             │
│  │  │ none)    │ │ dealer)  │ │ agent)   │           │             │
│  │  └──────────┘ └──────────┘ └──────────┘           │             │
│  └──────────────────────┬─────────────────────────────┘             │
│                          │                                            │
│  ┌───────────────────────▼────────────────────────┐                 │
│  │              MongoDB (Mongoose ODM)               │                 │
│  │  44 Models · Auto-indexes · TTL on AuditLog     │                 │
│  └────────────────────────────────────────────────┘                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Sprint Delivery Map

| Sprint | Module | Key Files |
|--------|--------|-----------|
| 1–3 | Core e-commerce | User, Product, Order, Category, Cart, Wishlist, Review |
| 4–5 | Content CMS | Banner, Blog, Gallery, Achievement, WhyChoose, Team, Testimonial |
| 6–7 | Auth & Payments | authController, Stripe integration, Admin management |
| 8 | Marketing Platform | Campaign, FlashSale, MarketingPopup, AnnouncementBar, Notification |
| 9A | Dealer Portal | Dealer model, dealerAuth JWT, DealerLogin/Register/Profile |
| 9B | B2B Commerce | DealerPricing, DealerCart, DealerOrder, dealer product catalog |
| 9C | Dealer Finance | DealerInvoice, DealerWallet, DealerLedger, DealerPayment, DealerCredit |
| 9D | CRM | SalesAgent, Territory, Lead, VisitReport, Task, Assignment |
| 9E | Enterprise BI | biController, targetController, 9 analytics pages, recharts |
| 9F | Enterprise Hardening | AuditLog, shared components, RBAC, hooks, services, DB indexes |

---

## Folder Standards

```
backend/
  config/          DB connection, Cloudinary upload configs
  controllers/     One file per domain. Never import other controllers.
  middleware/       auth.js · dealerAuth.js · agentAuth.js · auditLog.js · dbGuard.js · error.js
  models/          One file per Mongoose model
  routes/          Single index.js — all routes registered here
  utils/            jwt.js · mailer.js · seed.js · permissions.js · response.js
  test/             Jest test files

frontend/src/
  components/
    layout/         Navbar, Footer (storefront)
    ui/             Reusable UI primitives (ErrorBoundary, ImageUploader, Skeleton…)
    shared/         Sprint 9F: Enterprise shared components (DataTable, Pagination…)
  hooks/            Custom React hooks
  pages/
    admin/          Admin panel pages (AdminLayout.jsx is the shell)
    agent/          Agent portal pages (AgentLayout.jsx is the shell)
    dealer/         Dealer portal pages (no shared layout — use inline layout)
    /               Customer storefront pages
  redux/slices/     One slice per domain
  services/         api.js · dealerAPI.js · formatters.js · exportService.js
  test/             Vitest test files + setup
  utils/            orderStatus.js · imageHelper.js · invoice.js · analytics.js
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Model | PascalCase | `SalesAgent`, `DealerOrder` |
| Controller | camelCase file, exports as functions | `salesAgentController.js`, `exports.getAgents` |
| Route | kebab-case URL | `/admin/sales-agents`, `/dealer/auth/login` |
| React component | PascalCase file + default export | `AdminAuditLog.jsx` |
| Redux slice | camelCase | `agentAuth`, `dealerCart` |
| Hook | `use` prefix + camelCase | `usePermissions`, `usePagination` |
| Service | camelCase | `exportService.js`, `formatters.js` |
| Env var | SCREAMING_SNAKE_CASE | `JWT_SECRET`, `VITE_API_URL` |

---

## Auth Stack Isolation

| Portal | JWT Payload | Middleware | Redux Slice |
|--------|-------------|-----------|-------------|
| Customer | `{ id }` (no type) | `protect` | `authSlice` |
| Dealer | `{ id, type:'dealer' }` | `protectDealer` | `dealerAuthSlice` |
| Agent | `{ id, type:'agent' }` | `protectAgent` | `agentAuthSlice` |
| Admin | Customer JWT + role check | `protect + admin` | `authSlice` |

**Rule**: Never mix auth stacks. Each portal's token is rejected by the other middlewares.

---

## API Response Shape

All admin routes return:
```json
{
  "success": true,
  "message": "...",
  "data": { ... } | [...],
  "pagination": { "total": 100, "page": 1, "limit": 10, "pages": 10 }
}
```

Error shape:
```json
{ "success": false, "message": "Error description", "errors": [...] }
```

---

## Developer Guidelines

1. **Add routes to `backend/routes/index.js`** — the single route file.
2. **Never import controllers into other controllers** — use service functions in `utils/` for shared logic.
3. **Every new admin page must**: use `AdminLayout`, import `api` from `../../services/api`, use `react-toastify` for feedback.
4. **Every new agent page must**: be inside `AgentLayout` nested route, use `agentAPI` from `../../services/agentAPI`.
5. **JWT secrets** must live in `.env` — never hardcoded.
6. **MongoDB queries** on large collections must use indexed fields. Check `backend/utils/permissions.js` for the allowed roles list before adding a new role.
7. **Shared components** are in `src/components/shared/index.js` — use barrel import.
8. **CSV exports** use `useExport` hook or `exportService.js` — do not write custom Blob logic inline.
9. **Formatters** (currency, date, phone) come from `src/services/formatters.js`.
10. **Audit log** entries are written automatically by the global admin middleware — no manual calls needed.

---

## Security Checklist

- [x] Helmet (XSS headers, HSTS, X-Frame-Options)
- [x] CORS whitelist (localhost + *.vercel.app + CLIENT_URL)
- [x] Rate limiting: 10 req/15min on auth, 200 req/min general
- [x] JWT validation on all protected routes
- [x] Role-based access via `admin`, `superAdmin`, `moderatorOrAbove` middleware
- [x] `dbGuard` — 503 while MongoDB unavailable
- [x] Body size limit: 2MB
- [x] Sanitized HTML in RichTextEditor (sanitizeHtml utility)
- [x] `isDeleted: false` soft-delete pattern on all CRM models
- [x] RBAC permissions matrix in `backend/utils/permissions.js`
- [x] Audit log on all admin mutations
