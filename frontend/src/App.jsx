import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './redux/slices/authSlice';
import { fetchCart } from './redux/slices/shopSlices';
import { fetchWishlist } from './redux/slices/shopSlices';
import { fetchSettings } from './redux/slices/settingsSlice';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CompareDrawer from './components/ui/CompareDrawer';
import { HeroSkeleton } from './components/ui/Skeleton';
import { CookieConsent } from './components/ui/CookieConsent';
import AnnouncementBar from './components/ui/AnnouncementBar';
import MarketingPopup from './components/ui/MarketingPopup';
import OfflineBanner from './components/ui/OfflineBanner';
import { trackPageView } from './utils/analytics';

// ── Eager-loaded pages (critical path) ──────────────────────────────────────
import Home from './pages/Home';

// ── Lazy-loaded pages ────────────────────────────────────────────────────────
const Login          = lazy(() => import('./pages/Login'));
const Register       = lazy(() => import('./pages/Register'));
const Shop          = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart          = lazy(() => import('./pages/Cart'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const Profile       = lazy(() => import('./pages/Profile'));
const Orders            = lazy(() => import('./pages/Orders'));
const OrderDetailPage   = lazy(() => import('./pages/OrderDetailPage'));
const TrackOrderPage    = lazy(() => import('./pages/TrackOrderPage'));
const Wishlist      = lazy(() => import('./pages/Wishlist'));
const Deals         = lazy(() => import('./pages/Deals'));
const About         = lazy(() => import('./pages/About'));
const Contact       = lazy(() => import('./pages/Contact'));

// ── Admin pages ───────────────────────────────────────────────────────────────
const AdminDashboard   = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts    = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders      = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers       = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCoupons     = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminReviews     = lazy(() => import('./pages/admin/AdminReviews'));
const AdminSubscribers = lazy(() => import('./pages/admin/AdminSubscribers'));
const AdminSettings    = lazy(() => import('./pages/admin/AdminSettings'));
const AdminCategories  = lazy(() => import('./pages/admin/AdminCategories'));
const AdminManagement  = lazy(() => import('./pages/admin/AdminManagement'));
const AdminWhyChoose   = lazy(() => import('./pages/admin/AdminWhyChoose'));
const AdminTeam        = lazy(() => import('./pages/admin/AdminTeam'));
const AdminBanners     = lazy(() => import('./pages/admin/AdminBanners'));
const AdminHomepageContent = lazy(() => import('./pages/admin/AdminHomepageContent'));

const AdminTestimonials  = lazy(() => import('./pages/admin/AdminTestimonials'));
const AdminAchievements      = lazy(() => import('./pages/admin/AdminAchievements'));
const AdminAchievementStats  = lazy(() => import('./pages/admin/AdminAchievementStats'));
const AdminGallery           = lazy(() => import('./pages/admin/AdminGallery'));
const AdminBlogs             = lazy(() => import('./pages/admin/AdminBlogs'));
const AdminLoginSlider       = lazy(() => import('./pages/admin/AdminLoginSlider'));
const BlogDetail             = lazy(() => import('./pages/Blog'));

// ── Sprint 8: Marketing pages ────────────────────────────────────────────────
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminPopups        = lazy(() => import('./pages/admin/AdminPopups'));
const AdminFlashSales    = lazy(() => import('./pages/admin/AdminFlashSales'));
const AdminPromoSections = lazy(() => import('./pages/admin/AdminPromoSections'));
const AdminCampaigns     = lazy(() => import('./pages/admin/AdminCampaigns'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));

// ── Sprint 9A: Dealer Portal ──────────────────────────────────────────────────
const DealerLogin          = lazy(() => import('./pages/dealer/DealerLogin'));
const DealerRegister       = lazy(() => import('./pages/dealer/DealerRegister'));
const DealerForgotPassword = lazy(() => import('./pages/dealer/DealerForgotPassword'));
const DealerResetPassword  = lazy(() => import('./pages/dealer/DealerResetPassword'));
const DealerDashboard      = lazy(() => import('./pages/dealer/DealerDashboard'));
const DealerProfile        = lazy(() => import('./pages/dealer/DealerProfile'));
const AdminDealers         = lazy(() => import('./pages/admin/AdminDealers'));
const AdminDealerDetail    = lazy(() => import('./pages/admin/AdminDealerDetail'));

// ── Sprint 9B: B2B Commerce Portal ───────────────────────────────────────────
const DealerProducts      = lazy(() => import('./pages/dealer/DealerProducts'));
const DealerProductDetail = lazy(() => import('./pages/dealer/DealerProductDetail'));
const DealerCart          = lazy(() => import('./pages/dealer/DealerCart'));
const DealerOrders        = lazy(() => import('./pages/dealer/DealerOrders'));
const DealerOrderDetail   = lazy(() => import('./pages/dealer/DealerOrderDetail'));
const DealerNotifications = lazy(() => import('./pages/dealer/DealerNotifications'));
const AdminDealerPricing  = lazy(() => import('./pages/admin/AdminDealerPricing'));
const AdminDealerOrders   = lazy(() => import('./pages/admin/AdminDealerOrders'));

// ── Sprint 9C: Dealer Finance Portal ─────────────────────────────────────────
const DealerFinanceOverview = lazy(() => import('./pages/dealer/DealerFinanceOverview'));
const DealerWallet          = lazy(() => import('./pages/dealer/DealerWallet'));
const DealerLedger          = lazy(() => import('./pages/dealer/DealerLedger'));
const DealerInvoices        = lazy(() => import('./pages/dealer/DealerInvoices'));
const DealerInvoiceDetail   = lazy(() => import('./pages/dealer/DealerInvoiceDetail'));
const DealerPayments        = lazy(() => import('./pages/dealer/DealerPayments'));
const DealerCredit          = lazy(() => import('./pages/dealer/DealerCredit'));
const DealerCreditNotes     = lazy(() => import('./pages/dealer/DealerCreditNotes'));
const AdminDealerWallet     = lazy(() => import('./pages/admin/AdminDealerWallet'));
const AdminDealerCredit     = lazy(() => import('./pages/admin/AdminDealerCredit'));
const AdminDealerInvoices   = lazy(() => import('./pages/admin/AdminDealerInvoices'));
const AdminDealerPayments   = lazy(() => import('./pages/admin/AdminDealerPayments'));
const AdminDealerCreditNotes= lazy(() => import('./pages/admin/AdminDealerCreditNotes'));

// ── Sprint 9D: Sales Agent Portal ────────────────────────────────────────────
const SalesAgentLogin    = lazy(() => import('./pages/agent/SalesAgentLogin'));
const AgentLayout        = lazy(() => import('./pages/agent/AgentLayout'));
const AgentDashboard     = lazy(() => import('./pages/agent/AgentDashboard'));
const AgentLeads         = lazy(() => import('./pages/agent/AgentLeads'));
const AgentLeadDetail    = lazy(() => import('./pages/agent/AgentLeadDetail'));
const AgentDealers       = lazy(() => import('./pages/agent/AgentDealers'));
const AgentVisitReports  = lazy(() => import('./pages/agent/AgentVisitReports'));
const AgentVisitDetail   = lazy(() => import('./pages/agent/AgentVisitDetail'));
const AgentTasks         = lazy(() => import('./pages/agent/AgentTasks'));
const AgentProfile       = lazy(() => import('./pages/agent/AgentProfile'));
// ── Sprint 9D: Admin CRM Pages ────────────────────────────────────────────────
const AdminSalesAgents   = lazy(() => import('./pages/admin/AdminSalesAgents'));
const AdminTerritories   = lazy(() => import('./pages/admin/AdminTerritories'));
const AdminLeads         = lazy(() => import('./pages/admin/AdminLeads'));
const AdminVisitReports  = lazy(() => import('./pages/admin/AdminVisitReports'));
const AdminTasks         = lazy(() => import('./pages/admin/AdminTasks'));
const AdminAssignments   = lazy(() => import('./pages/admin/AdminAssignments'));

// ── Sprint 9F: Enterprise Hardening ─────────────────────────────────────────
const AdminAuditLog = lazy(() => import('./pages/admin/AdminAuditLog'));

// ── Sprint 9E: BI & Analytics Pages ──────────────────────────────────────────
const AdminBIDashboard        = lazy(() => import('./pages/admin/AdminBIDashboard'));
const AdminRevenueAnalytics   = lazy(() => import('./pages/admin/AdminRevenueAnalytics'));
const AdminSalesDashboard     = lazy(() => import('./pages/admin/AdminSalesDashboard'));
const AdminAgentPerformance   = lazy(() => import('./pages/admin/AdminAgentPerformance'));
const AdminDealerAnalytics    = lazy(() => import('./pages/admin/AdminDealerAnalytics'));
const AdminTerritoryAnalytics = lazy(() => import('./pages/admin/AdminTerritoryAnalytics'));
const AdminLeadFunnel         = lazy(() => import('./pages/admin/AdminLeadFunnel'));
const AdminReports            = lazy(() => import('./pages/admin/AdminReports'));
const AdminTargets            = lazy(() => import('./pages/admin/AdminTargets'));

// ── Guards ────────────────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { token } = useSelector(s => s.auth);
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { token, user } = useSelector(s => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (!['admin', 'super_admin', 'moderator'].includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

// Agent route guard — reads agentAuth slice (completely isolated)
function AgentRoute({ children }) {
  const { token, agent } = useSelector(s => s.agentAuth);
  if (!token) return <Navigate to="/agent/login" replace />;
  if (agent?.status !== 'active') return <Navigate to="/agent/login" replace />;
  return children;
}

// Dealer route guard — reads dealerAuth slice (completely isolated from auth slice)
function DealerRoute({ children }) {
  const { token, dealer } = useSelector(s => s.dealerAuth);
  if (!token) return <Navigate to="/dealer/login" replace />;
  if (dealer?.status === 'suspended') return <Navigate to="/dealer/login" replace />;
  return children;
}

// ── Page wrapper: scroll-to-top + page view tracking ─────────────────────────
function PageWrapper({ children }) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Fire after a microtask so document.title is updated by usePageTitle first
    const t = setTimeout(() => trackPageView(pathname, document.title), 100);
    return () => clearTimeout(t);
  }, [pathname]);
  return <div className="page-enter">{children}</div>;
}

// ── Main Layout — rendered once for the whole "storefront" route group via
// <Outlet/>, instead of being re-instantiated inside every <Route element>.
// Previously Navbar/Footer remounted on every navigation (each was a fresh
// element tree per route), re-firing their own data fetches every time the
// user clicked a link. Mounting it once here means those fetches run once
// per session instead of once per page view. ────────────────────────────────
function MainLayout() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className="min-h-screen">
        <PageWrapper><Outlet /></PageWrapper>
      </main>
      <Footer />
      <CompareDrawer />
    </>
  );
}

function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center pt-20 px-6"
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center" style={{ maxWidth: '360px' }}>
        <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px' }}>
          Metro Appliances
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(72px,12vw,100px)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '16px' }}>
          404
        </h1>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text-4)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          style={{ display: 'inline-block', background: 'var(--text)', color: '#fff', padding: '13px 32px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector(s => s.auth);
  const settings  = useSelector(s => s.settings.data);

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [token, dispatch]);

  useEffect(() => { dispatch(fetchSettings()); }, [dispatch]);

  useEffect(() => {
    if (!settings) return;
    if (settings.metaTitle) document.title = settings.metaTitle;
    if (settings.storeFavicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = (import.meta.env.VITE_API_URL || '').replace('/api', '') + settings.storeFavicon;
    }
  }, [settings]);

  return (
    <>
    <Suspense fallback={<HeroSkeleton />}>
      <Routes>

        {/* ── Storefront — persistent Navbar/Footer via Outlet ── */}
        <Route element={<MainLayout />}>
          <Route path="/"               element={<Home />} />
          <Route path="/shop"           element={<Shop />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/deals"          element={<Deals />} />
          <Route path="/about"          element={<About />} />
          <Route path="/blog/:slug"     element={<BlogDetail />} />
          <Route path="/contact"        element={<Contact />} />

          <Route path="/cart"       element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="/checkout"   element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/profile"    element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/orders"     element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
          
          <Route path="/my-orders"            element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/order/:orderId"       element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />
          <Route path="/track-order/:orderId" element={<PrivateRoute><TrackOrderPage /></PrivateRoute>} />
          <Route path="/wishlist"   element={<PrivateRoute><Wishlist /></PrivateRoute>} />

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ── Auth (no storefront layout) ── */}
        <Route path="/login"    element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />

        {/* ── Admin ── */}
        <Route path="/admin"               element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/products"      element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="/admin/orders"        element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/users"         element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/coupons"       element={<AdminRoute><AdminCoupons /></AdminRoute>} />
        <Route path="/admin/reviews"       element={<AdminRoute><AdminReviews /></AdminRoute>} />
        <Route path="/admin/subscribers"   element={<AdminRoute><AdminSubscribers /></AdminRoute>} />
        <Route path="/admin/settings"      element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/admin/categories"    element={<AdminRoute><AdminCategories /></AdminRoute>} />
        <Route path="/admin/management"    element={<AdminRoute><AdminManagement /></AdminRoute>} />
        <Route path="/admin/team"          element={<AdminRoute><AdminTeam /></AdminRoute>} />
        <Route path="/admin/banners"       element={<AdminRoute><AdminBanners /></AdminRoute>} />
        <Route path="/admin/homepage-content" element={<AdminRoute><AdminHomepageContent /></AdminRoute>} />
        <Route path="/admin/why-choose"    element={<AdminRoute><AdminWhyChoose /></AdminRoute>} />
        <Route path="/admin/testimonials"   element={<AdminRoute><AdminTestimonials /></AdminRoute>} />
        <Route path="/admin/achievements"       element={<AdminRoute><AdminAchievements /></AdminRoute>} />
        <Route path="/admin/achievement-stats" element={<AdminRoute><AdminAchievementStats /></AdminRoute>} />
        <Route path="/admin/gallery"            element={<AdminRoute><AdminGallery /></AdminRoute>} />
        <Route path="/admin/blogs"              element={<AdminRoute><AdminBlogs /></AdminRoute>} />
        <Route path="/admin/login-slider"       element={<AdminRoute><AdminLoginSlider /></AdminRoute>} />

        {/* Sprint 8: Marketing */}
        <Route path="/admin/announcements"   element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
        <Route path="/admin/popups"          element={<AdminRoute><AdminPopups /></AdminRoute>} />
        <Route path="/admin/flash-sales"     element={<AdminRoute><AdminFlashSales /></AdminRoute>} />
        <Route path="/admin/promo-sections"  element={<AdminRoute><AdminPromoSections /></AdminRoute>} />
        <Route path="/admin/campaigns"       element={<AdminRoute><AdminCampaigns /></AdminRoute>} />
        <Route path="/admin/notifications"   element={<AdminRoute><AdminNotifications /></AdminRoute>} />

        {/* Sprint 9A+9B: Admin Dealer Management */}
        <Route path="/admin/dealers"              element={<AdminRoute><AdminDealers /></AdminRoute>} />
        <Route path="/admin/dealers/:id"          element={<AdminRoute><AdminDealerDetail /></AdminRoute>} />
        <Route path="/admin/dealer-pricing"       element={<AdminRoute><AdminDealerPricing /></AdminRoute>} />
        <Route path="/admin/dealer-orders"        element={<AdminRoute><AdminDealerOrders /></AdminRoute>} />

        {/* Sprint 9A+9B: Dealer Portal (no storefront layout, isolated from customer auth) */}
        <Route path="/dealer/login"                element={<PageWrapper><DealerLogin /></PageWrapper>} />
        <Route path="/dealer/register"             element={<PageWrapper><DealerRegister /></PageWrapper>} />
        <Route path="/dealer/forgot-password"      element={<PageWrapper><DealerForgotPassword /></PageWrapper>} />
        <Route path="/dealer/reset-password/:token" element={<PageWrapper><DealerResetPassword /></PageWrapper>} />
        <Route path="/dealer/dashboard"            element={<DealerRoute><DealerDashboard /></DealerRoute>} />
        <Route path="/dealer/profile"              element={<DealerRoute><DealerProfile /></DealerRoute>} />
        {/* Sprint 9B: B2B Commerce */}
        <Route path="/dealer/products"             element={<DealerRoute><DealerProducts /></DealerRoute>} />
        <Route path="/dealer/products/:slug"       element={<DealerRoute><DealerProductDetail /></DealerRoute>} />
        <Route path="/dealer/cart"                 element={<DealerRoute><DealerCart /></DealerRoute>} />
        <Route path="/dealer/orders"               element={<DealerRoute><DealerOrders /></DealerRoute>} />
        <Route path="/dealer/orders/:id"           element={<DealerRoute><DealerOrderDetail /></DealerRoute>} />
        <Route path="/dealer/notifications"        element={<DealerRoute><DealerNotifications /></DealerRoute>} />
        {/* Sprint 9C: Dealer Finance */}
        <Route path="/dealer/finance"                    element={<DealerRoute><DealerFinanceOverview /></DealerRoute>} />
        <Route path="/dealer/finance/wallet"             element={<DealerRoute><DealerWallet /></DealerRoute>} />
        <Route path="/dealer/finance/ledger"             element={<DealerRoute><DealerLedger /></DealerRoute>} />
        <Route path="/dealer/finance/invoices"           element={<DealerRoute><DealerInvoices /></DealerRoute>} />
        <Route path="/dealer/finance/invoices/:id"       element={<DealerRoute><DealerInvoiceDetail /></DealerRoute>} />
        <Route path="/dealer/finance/payments"           element={<DealerRoute><DealerPayments /></DealerRoute>} />
        <Route path="/dealer/finance/credit"             element={<DealerRoute><DealerCredit /></DealerRoute>} />
        <Route path="/dealer/finance/credit-notes"       element={<DealerRoute><DealerCreditNotes /></DealerRoute>} />
        {/* Sprint 9C: Admin Finance */}
        <Route path="/admin/dealer-wallet"         element={<AdminRoute><AdminDealerWallet /></AdminRoute>} />
        <Route path="/admin/dealer-credit"         element={<AdminRoute><AdminDealerCredit /></AdminRoute>} />
        <Route path="/admin/dealer-invoices"       element={<AdminRoute><AdminDealerInvoices /></AdminRoute>} />
        <Route path="/admin/dealer-payments"       element={<AdminRoute><AdminDealerPayments /></AdminRoute>} />
        <Route path="/admin/dealer-credit-notes"   element={<AdminRoute><AdminDealerCreditNotes /></AdminRoute>} />

        {/* Sprint 9D: Admin CRM */}
        <Route path="/admin/sales-agents"          element={<AdminRoute><AdminSalesAgents /></AdminRoute>} />
        <Route path="/admin/territories"           element={<AdminRoute><AdminTerritories /></AdminRoute>} />
        <Route path="/admin/leads"                 element={<AdminRoute><AdminLeads /></AdminRoute>} />
        <Route path="/admin/visit-reports"         element={<AdminRoute><AdminVisitReports /></AdminRoute>} />
        <Route path="/admin/agent-tasks"           element={<AdminRoute><AdminTasks /></AdminRoute>} />
        <Route path="/admin/agent-assignments"     element={<AdminRoute><AdminAssignments /></AdminRoute>} />

        {/* Sprint 9F: Enterprise Hardening */}
        <Route path="/admin/audit-log"       element={<AdminRoute><AdminAuditLog /></AdminRoute>} />

        {/* Sprint 9E: BI & Analytics */}
        <Route path="/admin/bi/dashboard"    element={<AdminRoute><AdminBIDashboard /></AdminRoute>} />
        <Route path="/admin/bi/revenue"      element={<AdminRoute><AdminRevenueAnalytics /></AdminRoute>} />
        <Route path="/admin/bi/sales"        element={<AdminRoute><AdminSalesDashboard /></AdminRoute>} />
        <Route path="/admin/bi/agents"       element={<AdminRoute><AdminAgentPerformance /></AdminRoute>} />
        <Route path="/admin/bi/dealers"      element={<AdminRoute><AdminDealerAnalytics /></AdminRoute>} />
        <Route path="/admin/bi/territories"  element={<AdminRoute><AdminTerritoryAnalytics /></AdminRoute>} />
        <Route path="/admin/bi/leads"        element={<AdminRoute><AdminLeadFunnel /></AdminRoute>} />
        <Route path="/admin/bi/reports"      element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/bi/targets"      element={<AdminRoute><AdminTargets /></AdminRoute>} />

        {/* Sprint 9D: Agent Portal (isolated auth) */}
        <Route path="/agent/login"   element={<PageWrapper><SalesAgentLogin /></PageWrapper>} />
        <Route path="/agent" element={<AgentRoute><AgentLayout /></AgentRoute>}>
          <Route path="dashboard"           element={<AgentDashboard />} />
          <Route path="leads"               element={<AgentLeads />} />
          <Route path="leads/:id"           element={<AgentLeadDetail />} />
          <Route path="dealers"             element={<AgentDealers />} />
          <Route path="visits"              element={<AgentVisitReports />} />
          <Route path="visits/:id"          element={<AgentVisitDetail />} />
          <Route path="tasks"               element={<AgentTasks />} />
          <Route path="profile"             element={<AgentProfile />} />
        </Route>

      </Routes>
    </Suspense>
    <CookieConsent />
    <MarketingPopup />
    <OfflineBanner />
    </>
  );
}
