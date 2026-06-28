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

// ── Sprint 10A: Warehouse Foundation ─────────────────────────────────────────
const AdminWarehouseDashboard = lazy(() => import('./pages/admin/AdminWarehouseDashboard'));
const AdminWarehouses         = lazy(() => import('./pages/admin/AdminWarehouses'));
const AdminWarehouseDetail    = lazy(() => import('./pages/admin/AdminWarehouseDetail'));
const AdminWarehouseZones     = lazy(() => import('./pages/admin/AdminWarehouseZones'));
const AdminWarehouseLocations = lazy(() => import('./pages/admin/AdminWarehouseLocations'));
const AdminWarehouseUsers     = lazy(() => import('./pages/admin/AdminWarehouseUsers'));
const AdminWarehouseSettings  = lazy(() => import('./pages/admin/AdminWarehouseSettings'));

// ── Sprint 10B: Inventory Management — Admin pages ────────────────────────────
const AdminInventoryDashboard   = lazy(() => import('./pages/admin/AdminInventoryDashboard'));
const AdminInventoryList        = lazy(() => import('./pages/admin/AdminInventoryList'));
const AdminInventoryDetail      = lazy(() => import('./pages/admin/AdminInventoryDetail'));
const AdminInventoryTransactions= lazy(() => import('./pages/admin/AdminInventoryTransactions'));
const AdminGRNList              = lazy(() => import('./pages/admin/AdminGRNList'));
const AdminGRNDetail            = lazy(() => import('./pages/admin/AdminGRNDetail'));
const AdminStockAdjustment      = lazy(() => import('./pages/admin/AdminStockAdjustment'));
const AdminCycleCount           = lazy(() => import('./pages/admin/AdminCycleCount'));
const AdminBatchManagement      = lazy(() => import('./pages/admin/AdminBatchManagement'));
const AdminSerialManagement     = lazy(() => import('./pages/admin/AdminSerialManagement'));
const AdminReservationDashboard = lazy(() => import('./pages/admin/AdminReservationDashboard'));

// ── Sprint 10B: Warehouse Portal pages ────────────────────────────────────────
const WarehouseLogin            = lazy(() => import('./pages/warehouse/WarehouseLogin'));
const WarehouseLayout           = lazy(() => import('./pages/warehouse/WarehouseLayout'));
const WarehouseDashboard        = lazy(() => import('./pages/warehouse/WarehouseDashboard'));
const WarehouseInventoryLookup  = lazy(() => import('./pages/warehouse/WarehouseInventoryLookup'));
const WarehouseReceiveStock     = lazy(() => import('./pages/warehouse/WarehouseReceiveStock'));
const WarehouseCycleCount       = lazy(() => import('./pages/warehouse/WarehouseCycleCount'));
const WarehouseAdjustment       = lazy(() => import('./pages/warehouse/WarehouseAdjustment'));

// ── Sprint 10C: Procurement & Vendor Management — Admin pages ────────────────
const AdminVendorDashboard       = lazy(() => import('./pages/admin/AdminVendorDashboard'));
const AdminVendorList            = lazy(() => import('./pages/admin/AdminVendorList'));
const AdminVendorDetail          = lazy(() => import('./pages/admin/AdminVendorDetail'));
const AdminVendorPerformance     = lazy(() => import('./pages/admin/AdminVendorPerformance'));
const AdminPurchaseRequisitions  = lazy(() => import('./pages/admin/AdminPurchaseRequisitions'));
const AdminRFQList               = lazy(() => import('./pages/admin/AdminRFQList'));
const AdminRFQDetail             = lazy(() => import('./pages/admin/AdminRFQDetail'));
const AdminPurchaseOrders        = lazy(() => import('./pages/admin/AdminPurchaseOrders'));
const AdminPurchaseOrderDetail   = lazy(() => import('./pages/admin/AdminPurchaseOrderDetail'));
const AdminApprovalQueue         = lazy(() => import('./pages/admin/AdminApprovalQueue'));
const AdminProcurementReports    = lazy(() => import('./pages/admin/AdminProcurementReports'));

// ── Sprint 10C: Supplier Portal pages ────────────────────────────────────────
const SupplierLogin         = lazy(() => import('./pages/supplier/SupplierLogin'));
const SupplierLayout        = lazy(() => import('./pages/supplier/SupplierLayout'));
const SupplierDashboard     = lazy(() => import('./pages/supplier/SupplierDashboard'));
const SupplierPurchaseOrders = lazy(() => import('./pages/supplier/SupplierPurchaseOrders'));
const SupplierOrderDetail   = lazy(() => import('./pages/supplier/SupplierOrderDetail'));
const SupplierRFQs          = lazy(() => import('./pages/supplier/SupplierRFQs'));
const SupplierInvoices      = lazy(() => import('./pages/supplier/SupplierInvoices'));
const SupplierDocuments     = lazy(() => import('./pages/supplier/SupplierDocuments'));
const SupplierNotifications = lazy(() => import('./pages/supplier/SupplierNotifications'));
const SupplierProfile       = lazy(() => import('./pages/supplier/SupplierProfile'));

// ── Sprint 10D: Enterprise Dispatch & Logistics — Admin pages ────────────────
const AdminLogisticsDashboard = lazy(() => import('./pages/admin/AdminLogisticsDashboard'));
const AdminDispatchQueue      = lazy(() => import('./pages/admin/AdminDispatchQueue'));
const AdminShipmentList       = lazy(() => import('./pages/admin/AdminShipmentList'));
const AdminCourierManagement  = lazy(() => import('./pages/admin/AdminCourierManagement'));
const AdminStockTransfers     = lazy(() => import('./pages/admin/AdminStockTransfers'));
const AdminDeliveryChallans   = lazy(() => import('./pages/admin/AdminDeliveryChallans'));

// ── Sprint 10D: Warehouse Portal logistics pages ──────────────────────────────
const WarehousePickingList      = lazy(() => import('./pages/warehouse/WarehousePickingList'));
const WarehousePacking          = lazy(() => import('./pages/warehouse/WarehousePacking'));
const WarehouseDispatch         = lazy(() => import('./pages/warehouse/WarehouseDispatch'));
const WarehouseTransfers        = lazy(() => import('./pages/warehouse/WarehouseTransfers'));
const WarehouseShipmentTracking = lazy(() => import('./pages/warehouse/WarehouseShipmentTracking'));

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

// ── Sprint 10F: IoT & Industry 4.0 — Admin pages ─────────────────────────────
const AdminIoTDashboard           = lazy(() => import('./pages/admin/AdminIoTDashboard'));
const AdminRFIDManagement         = lazy(() => import('./pages/admin/AdminRFIDManagement'));
const AdminWarehouseDevices       = lazy(() => import('./pages/admin/AdminWarehouseDevices'));
const AdminSensorDashboard        = lazy(() => import('./pages/admin/AdminSensorDashboard'));
const AdminAlertCenter            = lazy(() => import('./pages/admin/AdminAlertCenter'));
const AdminAutomationRules        = lazy(() => import('./pages/admin/AdminAutomationRules'));
const AdminReplenishmentDashboard = lazy(() => import('./pages/admin/AdminReplenishmentDashboard'));

// ── Sprint 10E: Barcode & Scanning — Admin pages ─────────────────────────────
const AdminBarcodeDashboard   = lazy(() => import('./pages/admin/AdminBarcodeDashboard'));
const AdminBarcodeGenerator   = lazy(() => import('./pages/admin/AdminBarcodeGenerator'));
const AdminLabelCenter        = lazy(() => import('./pages/admin/AdminLabelCenter'));
const AdminWarehouseMap       = lazy(() => import('./pages/admin/AdminWarehouseMap'));
const AdminBinManagement      = lazy(() => import('./pages/admin/AdminBinManagement'));
const AdminScannerActivity    = lazy(() => import('./pages/admin/AdminScannerActivity'));
const AdminAutomationDashboard= lazy(() => import('./pages/admin/AdminAutomationDashboard'));

// ── Sprint 10E: Warehouse Mobile pages ────────────────────────────────────────
const WarehouseMobileDashboard = lazy(() => import('./pages/warehouse/WarehouseMobileDashboard'));
const WarehouseMobileScan      = lazy(() => import('./pages/warehouse/WarehouseMobileScan'));
const WarehouseMobilePutaway   = lazy(() => import('./pages/warehouse/WarehouseMobilePutaway'));
const WarehouseMobileBinLookup = lazy(() => import('./pages/warehouse/WarehouseMobileBinLookup'));
const WarehouseMobileReturns   = lazy(() => import('./pages/warehouse/WarehouseMobileReturns'));

// ── Sprint 11C: Product Registration + Installation Management ───────────────
const CustomerProductRegistration = lazy(() => import('./pages/customer/CustomerProductRegistration'));
const CustomerRegistrationHistory = lazy(() => import('./pages/customer/CustomerRegistrationHistory'));
const CustomerProductRegistrationDetail = lazy(() => import('./pages/customer/CustomerProductRegistrationDetail'));
const CustomerBookInstallation    = lazy(() => import('./pages/customer/CustomerBookInstallation'));
const CustomerInstallations       = lazy(() => import('./pages/customer/CustomerInstallations'));
const CustomerInstallationStatus  = lazy(() => import('./pages/customer/CustomerInstallationStatus'));
const CustomerInstallationFeedback= lazy(() => import('./pages/customer/CustomerInstallationFeedback'));

const EngineerLogin              = lazy(() => import('./pages/engineer/EngineerLogin'));
const EngineerLayout             = lazy(() => import('./pages/engineer/EngineerLayout'));
const EngineerDashboard          = lazy(() => import('./pages/engineer/EngineerDashboard'));
const EngineerInstallations      = lazy(() => import('./pages/engineer/EngineerInstallations'));
const EngineerInstallationDetail = lazy(() => import('./pages/engineer/EngineerInstallationDetail'));
const EngineerRoutePlaceholder   = lazy(() => import('./pages/engineer/EngineerRoutePlaceholder'));
const EngineerProfile            = lazy(() => import('./pages/engineer/EngineerProfile'));

const AdminInstallationDashboard      = lazy(() => import('./pages/admin/AdminInstallationDashboard'));
const AdminInstallationRequests       = lazy(() => import('./pages/admin/AdminInstallationRequests'));
const AdminInstallationRequestDetail  = lazy(() => import('./pages/admin/AdminInstallationRequestDetail'));
const AdminInstallationEngineers      = lazy(() => import('./pages/admin/AdminInstallationEngineers'));
const AdminProductRegistrations       = lazy(() => import('./pages/admin/AdminProductRegistrations'));
const AdminInstallationReports        = lazy(() => import('./pages/admin/AdminInstallationReports'));

// ── Sprint 12A: Manufacturing ERP Foundation — Admin pages ───────────────────
const AdminManufacturingDashboard = lazy(() => import('./pages/admin/AdminManufacturingDashboard'));
const AdminFactories              = lazy(() => import('./pages/admin/AdminFactories'));
const AdminWorkCenters            = lazy(() => import('./pages/admin/AdminWorkCenters'));
const AdminMachines               = lazy(() => import('./pages/admin/AdminMachines'));
const AdminShiftPlanner           = lazy(() => import('./pages/admin/AdminShiftPlanner'));
const AdminBOMList                = lazy(() => import('./pages/admin/AdminBOMList'));
const AdminBOMDetail              = lazy(() => import('./pages/admin/AdminBOMDetail'));
const AdminProductionOrders       = lazy(() => import('./pages/admin/AdminProductionOrders'));
const AdminProductionOrderDetail  = lazy(() => import('./pages/admin/AdminProductionOrderDetail'));

// ── Sprint 12C: Enterprise MRP ───────────────────────────────────────────────
const AdminMRPDashboard          = lazy(() => import('./pages/admin/AdminMRPDashboard'));
const AdminMRPRuns               = lazy(() => import('./pages/admin/AdminMRPRuns'));
const AdminMRPRunDetail          = lazy(() => import('./pages/admin/AdminMRPRunDetail'));
const AdminMaterialRequirements  = lazy(() => import('./pages/admin/AdminMaterialRequirements'));
const AdminMRPReservations       = lazy(() => import('./pages/admin/AdminMRPReservations'));
const AdminMRPShortages          = lazy(() => import('./pages/admin/AdminMRPShortages'));
const AdminInventoryProjection   = lazy(() => import('./pages/admin/AdminInventoryProjection'));
const AdminDemandForecast        = lazy(() => import('./pages/admin/AdminDemandForecast'));
const AdminPurchaseSuggestions   = lazy(() => import('./pages/admin/AdminPurchaseSuggestions'));
const AdminProductionSuggestions = lazy(() => import('./pages/admin/AdminProductionSuggestions'));
const AdminSafetyStock           = lazy(() => import('./pages/admin/AdminSafetyStock'));
const AdminMRPReports            = lazy(() => import('./pages/admin/AdminMRPReports'));

// ── Sprint 12D: Enterprise MES ───────────────────────────────────────────────
const AdminMESDashboard       = lazy(() => import('./pages/admin/AdminMESDashboard'));
const AdminWorkOrders         = lazy(() => import('./pages/admin/AdminWorkOrders'));
const AdminWorkOrderDetail    = lazy(() => import('./pages/admin/AdminWorkOrderDetail'));
const AdminOperations         = lazy(() => import('./pages/admin/AdminOperations'));
const AdminProductionExecution= lazy(() => import('./pages/admin/AdminProductionExecution'));
const AdminQualityInspection  = lazy(() => import('./pages/admin/AdminQualityInspection'));
const AdminQualityDashboard   = lazy(() => import('./pages/admin/AdminQualityDashboard'));
const AdminDowntimeDashboard  = lazy(() => import('./pages/admin/AdminDowntimeDashboard'));
const AdminOEEDashboard       = lazy(() => import('./pages/admin/AdminOEEDashboard'));
const AdminOperatorManagement = lazy(() => import('./pages/admin/AdminOperatorManagement'));
const AdminOperatorAttendance = lazy(() => import('./pages/admin/AdminOperatorAttendance'));
const AdminToolManagement     = lazy(() => import('./pages/admin/AdminToolManagement'));
const AdminMachineRuntime     = lazy(() => import('./pages/admin/AdminMachineRuntime'));
const AdminProductionEvents   = lazy(() => import('./pages/admin/AdminProductionEvents'));
const AdminScrapManagement    = lazy(() => import('./pages/admin/AdminScrapManagement'));
const AdminReworkManagement   = lazy(() => import('./pages/admin/AdminReworkManagement'));
const AdminMESReports         = lazy(() => import('./pages/admin/AdminMESReports'));

// ── Sprint 12E: Enterprise QMS ───────────────────────────────────────────────
const AdminQMSDashboard        = lazy(() => import('./pages/admin/AdminQMSDashboard'));
const AdminInspectionPlans     = lazy(() => import('./pages/admin/AdminInspectionPlans'));
const AdminInspectionLots      = lazy(() => import('./pages/admin/AdminInspectionLots'));
const AdminInspectionDetail    = lazy(() => import('./pages/admin/AdminInspectionDetail'));
const AdminCertificates        = lazy(() => import('./pages/admin/AdminCertificates'));
const AdminCAPA                = lazy(() => import('./pages/admin/AdminCAPA'));
const AdminCAPADetail          = lazy(() => import('./pages/admin/AdminCAPADetail'));
const AdminNonConformance      = lazy(() => import('./pages/admin/AdminNonConformance'));
const AdminAuditPrograms       = lazy(() => import('./pages/admin/AdminAuditPrograms'));
const AdminAudits              = lazy(() => import('./pages/admin/AdminAudits'));
const AdminCalibrationDashboard = lazy(() => import('./pages/admin/AdminCalibrationDashboard'));
const AdminGaugeManagement     = lazy(() => import('./pages/admin/AdminGaugeManagement'));
const AdminSupplierQuality     = lazy(() => import('./pages/admin/AdminSupplierQuality'));
const AdminQualityReports      = lazy(() => import('./pages/admin/AdminQualityReports'));
const AdminDocumentControl     = lazy(() => import('./pages/admin/AdminDocumentControl'));

// ── Sprint 12F: Enterprise Asset Management (EAM / CMMS) ────────────────────
const AdminEAMDashboard         = lazy(() => import('./pages/admin/AdminEAMDashboard'));
const AdminAssets               = lazy(() => import('./pages/admin/AdminAssets'));
const AdminAssetDetail          = lazy(() => import('./pages/admin/AdminAssetDetail'));
const AdminAssetHierarchy       = lazy(() => import('./pages/admin/AdminAssetHierarchy'));
const AdminMaintenancePlans     = lazy(() => import('./pages/admin/AdminMaintenancePlans'));
const AdminMaintenanceCalendar  = lazy(() => import('./pages/admin/AdminMaintenanceCalendar'));
const AdminMaintenanceWorkOrders = lazy(() => import('./pages/admin/AdminMaintenanceWorkOrders'));
const AdminMaintenanceRequests  = lazy(() => import('./pages/admin/AdminMaintenanceRequests'));
const AdminBreakdowns           = lazy(() => import('./pages/admin/AdminBreakdowns'));
const AdminMeters               = lazy(() => import('./pages/admin/AdminMeters'));
const AdminConditionMonitoring  = lazy(() => import('./pages/admin/AdminConditionMonitoring'));
const AdminMaintenanceReports   = lazy(() => import('./pages/admin/AdminMaintenanceReports'));
const AdminMaintenanceAnalytics = lazy(() => import('./pages/admin/AdminMaintenanceAnalytics'));
const AdminAssetWarranty        = lazy(() => import('./pages/admin/AdminAssetWarranty'));
const AdminMaintenanceInventory = lazy(() => import('./pages/admin/AdminMaintenanceInventory'));
const AdminMaintenanceContracts = lazy(() => import('./pages/admin/AdminMaintenanceContracts'));

// ── Sprint 13A: Enterprise Finance & General Ledger ──────────────────────────
const AdminFinanceDashboard     = lazy(() => import('./pages/admin/AdminFinanceDashboard'));
const AdminChartOfAccounts      = lazy(() => import('./pages/admin/AdminChartOfAccounts'));
const AdminAccountGroups        = lazy(() => import('./pages/admin/AdminAccountGroups'));
const AdminJournalEntries       = lazy(() => import('./pages/admin/AdminJournalEntries'));
const AdminJournalDetail        = lazy(() => import('./pages/admin/AdminJournalDetail'));
const AdminGeneralLedger        = lazy(() => import('./pages/admin/AdminGeneralLedger'));
const AdminFiscalYears          = lazy(() => import('./pages/admin/AdminFiscalYears'));
const AdminAccountingPeriods    = lazy(() => import('./pages/admin/AdminAccountingPeriods'));
const AdminCostCenters          = lazy(() => import('./pages/admin/AdminCostCenters'));
const AdminProfitCenters        = lazy(() => import('./pages/admin/AdminProfitCenters'));
const AdminPostingRules         = lazy(() => import('./pages/admin/AdminPostingRules'));
const AdminVoucherSeries        = lazy(() => import('./pages/admin/AdminVoucherSeries'));
const AdminTrialBalance         = lazy(() => import('./pages/admin/AdminTrialBalance'));
const AdminBalanceSheet         = lazy(() => import('./pages/admin/AdminBalanceSheet'));
const AdminProfitAndLoss        = lazy(() => import('./pages/admin/AdminProfitAndLoss'));
const AdminCashBook             = lazy(() => import('./pages/admin/AdminCashBook'));
const AdminBankBook             = lazy(() => import('./pages/admin/AdminBankBook'));
const AdminFinancialSettings    = lazy(() => import('./pages/admin/AdminFinancialSettings'));

// ── Sprint 13B: Enterprise Accounts Payable ───────────────────────────────────
const AdminAccountsPayableDashboard = lazy(() => import('./pages/admin/AdminAccountsPayableDashboard'));
const AdminVendorBills              = lazy(() => import('./pages/admin/AdminVendorBills'));
const AdminVendorBillDetail         = lazy(() => import('./pages/admin/AdminVendorBillDetail'));
const AdminVendorPayments           = lazy(() => import('./pages/admin/AdminVendorPayments'));
const AdminPaymentRun               = lazy(() => import('./pages/admin/AdminPaymentRun'));
const AdminVendorLedger             = lazy(() => import('./pages/admin/AdminVendorLedger'));
const AdminVendorStatements         = lazy(() => import('./pages/admin/AdminVendorStatements'));
const AdminVendorAging              = lazy(() => import('./pages/admin/AdminVendorAging'));
const AdminDebitNotes               = lazy(() => import('./pages/admin/AdminDebitNotes'));
const AdminCreditNotes              = lazy(() => import('./pages/admin/AdminCreditNotes'));
const AdminInvoiceMatching          = lazy(() => import('./pages/admin/AdminInvoiceMatching'));
const AdminPaymentAdvice            = lazy(() => import('./pages/admin/AdminPaymentAdvice'));
const AdminAccountsPayableReports   = lazy(() => import('./pages/admin/AdminAccountsPayableReports'));

// ── Sprint 13C: Enterprise Accounts Receivable ───────────────────────────────
const AdminAccountsReceivableDashboard = lazy(() => import('./pages/admin/AdminAccountsReceivableDashboard'));
const AdminCustomerInvoices            = lazy(() => import('./pages/admin/AdminCustomerInvoices'));
const AdminCustomerInvoiceDetail       = lazy(() => import('./pages/admin/AdminCustomerInvoiceDetail'));
const AdminCustomerReceipts            = lazy(() => import('./pages/admin/AdminCustomerReceipts'));
const AdminReceiptAllocation           = lazy(() => import('./pages/admin/AdminReceiptAllocation'));
const AdminCustomerLedger              = lazy(() => import('./pages/admin/AdminCustomerLedger'));
const AdminCustomerStatements          = lazy(() => import('./pages/admin/AdminCustomerStatements'));
const AdminCustomerAging               = lazy(() => import('./pages/admin/AdminCustomerAging'));
const AdminCollections                 = lazy(() => import('./pages/admin/AdminCollections'));
const AdminCreditManagement            = lazy(() => import('./pages/admin/AdminCreditManagement'));
const AdminPromiseToPay                = lazy(() => import('./pages/admin/AdminPromiseToPay'));
const AdminWriteOffs                   = lazy(() => import('./pages/admin/AdminWriteOffs'));
const AdminBadDebt                     = lazy(() => import('./pages/admin/AdminBadDebt'));
const AdminAccountsReceivableReports   = lazy(() => import('./pages/admin/AdminAccountsReceivableReports'));

// ── Sprint 13D: Enterprise Tax & Compliance Engine ───────────────────────────
const AdminTaxDashboard      = lazy(() => import('./pages/admin/AdminTaxDashboard'));
const AdminTaxCodes          = lazy(() => import('./pages/admin/AdminTaxCodes'));
const AdminTaxRates          = lazy(() => import('./pages/admin/AdminTaxRates'));
const AdminGSTDashboard      = lazy(() => import('./pages/admin/AdminGSTDashboard'));
const AdminGSTReturns        = lazy(() => import('./pages/admin/AdminGSTReturns'));
const AdminInputCredit       = lazy(() => import('./pages/admin/AdminInputCredit'));
const AdminOutputTax         = lazy(() => import('./pages/admin/AdminOutputTax'));
const AdminTDSDashboard      = lazy(() => import('./pages/admin/AdminTDSDashboard'));
const AdminTDSCertificates   = lazy(() => import('./pages/admin/AdminTDSCertificates'));
const AdminComplianceCalendar = lazy(() => import('./pages/admin/AdminComplianceCalendar'));
const AdminEInvoice          = lazy(() => import('./pages/admin/AdminEInvoice'));
const AdminEWayBill          = lazy(() => import('./pages/admin/AdminEWayBill'));
const AdminTaxReports        = lazy(() => import('./pages/admin/AdminTaxReports'));

// ── Sprint 13E: Enterprise Banking & Treasury ────────────────────────────────
const AdminBankingDashboard    = lazy(() => import('./pages/admin/AdminBankingDashboard'));
const AdminBanks               = lazy(() => import('./pages/admin/AdminBanks'));
const AdminBankAccounts        = lazy(() => import('./pages/admin/AdminBankAccounts'));
const AdminBankStatements      = lazy(() => import('./pages/admin/AdminBankStatements'));
const AdminReconciliation      = lazy(() => import('./pages/admin/AdminReconciliation'));
const AdminBankCashBook        = lazy(() => import('./pages/admin/AdminBankCashBook'));
const AdminPettyCash           = lazy(() => import('./pages/admin/AdminPettyCash'));
const AdminCashTransfers       = lazy(() => import('./pages/admin/AdminCashTransfers'));
const AdminChequeBooks         = lazy(() => import('./pages/admin/AdminChequeBooks'));
const AdminTreasury            = lazy(() => import('./pages/admin/AdminTreasury'));
const AdminCashForecast        = lazy(() => import('./pages/admin/AdminCashForecast'));
const AdminLiquidityForecast   = lazy(() => import('./pages/admin/AdminLiquidityForecast'));
const AdminInvestments         = lazy(() => import('./pages/admin/AdminInvestments'));
const AdminFixedDeposits       = lazy(() => import('./pages/admin/AdminFixedDeposits'));
const AdminBankGuarantees      = lazy(() => import('./pages/admin/AdminBankGuarantees'));
const AdminLettersOfCredit     = lazy(() => import('./pages/admin/AdminLettersOfCredit'));
const AdminFXManagement        = lazy(() => import('./pages/admin/AdminFXManagement'));
const AdminBankingReports      = lazy(() => import('./pages/admin/AdminBankingReports'));

// ── Sprint 13F: Enterprise CFO Dashboard & Financial Consolidation ───────────
const AdminCFODashboard           = lazy(() => import('./pages/admin/AdminCFODashboard'));
const AdminBudgets                = lazy(() => import('./pages/admin/AdminBudgets'));
const AdminBudgetDetail           = lazy(() => import('./pages/admin/AdminBudgetDetail'));
const AdminForecasts              = lazy(() => import('./pages/admin/AdminForecasts'));
const AdminForecastDetail         = lazy(() => import('./pages/admin/AdminForecastDetail'));
const AdminFinancialKPIs          = lazy(() => import('./pages/admin/AdminFinancialKPIs'));
const AdminCashFlowDashboard      = lazy(() => import('./pages/admin/AdminCashFlowDashboard'));
const AdminProfitabilityDashboard = lazy(() => import('./pages/admin/AdminProfitabilityDashboard'));
const AdminConsolidationDashboard = lazy(() => import('./pages/admin/AdminConsolidationDashboard'));
const AdminBoardReports           = lazy(() => import('./pages/admin/AdminBoardReports'));
const AdminVarianceAnalysis       = lazy(() => import('./pages/admin/AdminVarianceAnalysis'));
const AdminFinancialAlerts        = lazy(() => import('./pages/admin/AdminFinancialAlerts'));
const AdminExecutiveReports       = lazy(() => import('./pages/admin/AdminExecutiveReports'));

// ── Sprint 14D: Enterprise Recruitment & ATS ─────────────────────────────────
const AdminRecruitmentDashboard  = lazy(() => import('./pages/admin/AdminRecruitmentDashboard'));
const AdminJobOpenings           = lazy(() => import('./pages/admin/AdminJobOpenings'));
const AdminJobDetail             = lazy(() => import('./pages/admin/AdminJobDetail'));
const AdminCandidates            = lazy(() => import('./pages/admin/AdminCandidates'));
const AdminCandidateDetail       = lazy(() => import('./pages/admin/AdminCandidateDetail'));
const AdminApplications          = lazy(() => import('./pages/admin/AdminApplications'));
const AdminInterviewCalendar     = lazy(() => import('./pages/admin/AdminInterviewCalendar'));
const AdminInterviewFeedback     = lazy(() => import('./pages/admin/AdminInterviewFeedback'));
const AdminOfferLetters          = lazy(() => import('./pages/admin/AdminOfferLetters'));
const AdminBackgroundVerification = lazy(() => import('./pages/admin/AdminBackgroundVerification'));
const AdminTalentPool            = lazy(() => import('./pages/admin/AdminTalentPool'));
const AdminRecruitmentReports    = lazy(() => import('./pages/admin/AdminRecruitmentReports'));
const AdminRecruitmentSettings   = lazy(() => import('./pages/admin/AdminRecruitmentSettings'));

// ── Sprint 14E: Performance Management, Learning & ESS ───────────────────────
const AdminPerformanceDashboard  = lazy(() => import('./pages/admin/AdminPerformanceDashboard'));
const AdminGoals                 = lazy(() => import('./pages/admin/AdminGoals'));
const AdminGoalDetail            = lazy(() => import('./pages/admin/AdminGoalDetail'));
const AdminPerformanceReviews    = lazy(() => import('./pages/admin/AdminPerformanceReviews'));
const AdminKPIs                  = lazy(() => import('./pages/admin/AdminKPIs'));
const AdminAppraisals            = lazy(() => import('./pages/admin/AdminAppraisals'));
const AdminTrainingCourses       = lazy(() => import('./pages/admin/AdminTrainingCourses'));
const AdminLearningPaths         = lazy(() => import('./pages/admin/AdminLearningPaths'));
const AdminCertifications        = lazy(() => import('./pages/admin/AdminCertifications'));
const AdminCareerDevelopment     = lazy(() => import('./pages/admin/AdminCareerDevelopment'));
const AdminSuccessionPlanning        = lazy(() => import('./pages/admin/AdminSuccessionPlanning'));
const AdminPerformanceReports        = lazy(() => import('./pages/admin/AdminPerformanceReports'));
const AdminPerformanceAnnouncements  = lazy(() => import('./pages/admin/AdminPerformanceAnnouncements'));
const AdminRecognition               = lazy(() => import('./pages/admin/AdminRecognition'));
// Sprint 15A: Enterprise Project Management
const AdminProjectDashboard  = lazy(() => import('./pages/admin/AdminProjectDashboard'));
const AdminProjects          = lazy(() => import('./pages/admin/AdminProjects'));
const AdminProjectDetail     = lazy(() => import('./pages/admin/AdminProjectDetail'));
const AdminKanbanBoard       = lazy(() => import('./pages/admin/AdminKanbanBoard'));
const AdminGanttTimeline     = lazy(() => import('./pages/admin/AdminGanttTimeline'));
const AdminMilestones        = lazy(() => import('./pages/admin/AdminMilestones'));
const AdminProjectTasks      = lazy(() => import('./pages/admin/AdminProjectTasks'));
const AdminTimesheets        = lazy(() => import('./pages/admin/AdminTimesheets'));
const AdminProjectResources  = lazy(() => import('./pages/admin/AdminProjectResources'));
const AdminProjectRisks      = lazy(() => import('./pages/admin/AdminProjectRisks'));
const AdminProjectIssues     = lazy(() => import('./pages/admin/AdminProjectIssues'));
const AdminProjectReports    = lazy(() => import('./pages/admin/AdminProjectReports'));
const AdminProjectSettings   = lazy(() => import('./pages/admin/AdminProjectSettings'));
// ── Sprint 15B: Enterprise Project Portfolio Management (PPM) ────────────────
const AdminPortfolioDashboard  = lazy(() => import('./pages/admin/AdminPortfolioDashboard'));
const AdminPortfolios          = lazy(() => import('./pages/admin/AdminPortfolios'));
const AdminPortfolioDetail     = lazy(() => import('./pages/admin/AdminPortfolioDetail'));
const AdminPrograms            = lazy(() => import('./pages/admin/AdminPrograms'));
const AdminInitiatives         = lazy(() => import('./pages/admin/AdminInitiatives'));
const AdminResourceCapacity    = lazy(() => import('./pages/admin/AdminResourceCapacity'));
const AdminPortfolioExecutive  = lazy(() => import('./pages/admin/AdminPortfolioExecutive'));
const AdminPortfolioReports    = lazy(() => import('./pages/admin/AdminPortfolioReports'));
const AdminPortfolioFinance    = lazy(() => import('./pages/admin/AdminPortfolioFinance'));
// Sprint 15C: PMO Governance & Analytics
const AdminPMODashboard          = lazy(() => import('./pages/admin/AdminPMODashboard'));
const AdminPMOGovernance         = lazy(() => import('./pages/admin/AdminPMOGovernance'));
const AdminPMOCompliance         = lazy(() => import('./pages/admin/AdminPMOCompliance'));
const AdminPMOBusinessCase       = lazy(() => import('./pages/admin/AdminPMOBusinessCase'));
const AdminPMOInvestmentRequests = lazy(() => import('./pages/admin/AdminPMOInvestmentRequests'));
const AdminPMOCharters           = lazy(() => import('./pages/admin/AdminPMOCharters'));
const AdminPMOLessonsLearned     = lazy(() => import('./pages/admin/AdminPMOLessonsLearned'));
const AdminPMOTemplates          = lazy(() => import('./pages/admin/AdminPMOTemplates'));
const AdminPMODocuments          = lazy(() => import('./pages/admin/AdminPMODocuments'));
const AdminPMOAudit              = lazy(() => import('./pages/admin/AdminPMOAudit'));
const AdminPMOScorecard          = lazy(() => import('./pages/admin/AdminPMOScorecard'));
const AdminPMOAnalytics          = lazy(() => import('./pages/admin/AdminPMOAnalytics'));
// ── Sprint 15D: Workflow Automation & BPM ────────────────────────────────────
const AdminBPMDashboard          = lazy(() => import('./pages/admin/AdminBPMDashboard'));
const AdminWorkflowDesigner      = lazy(() => import('./pages/admin/AdminWorkflowDesigner'));
const AdminWorkflowTemplates     = lazy(() => import('./pages/admin/AdminWorkflowTemplates'));
const AdminWorkflowInstances     = lazy(() => import('./pages/admin/AdminWorkflowInstances'));
const AdminWorkflowApprovals     = lazy(() => import('./pages/admin/AdminWorkflowApprovals'));
const AdminWorkflowEscalations   = lazy(() => import('./pages/admin/AdminWorkflowEscalations'));
const AdminWorkflowSLA           = lazy(() => import('./pages/admin/AdminWorkflowSLA'));
const AdminWorkflowHistory       = lazy(() => import('./pages/admin/AdminWorkflowHistory'));
const AdminWorkflowAnalytics     = lazy(() => import('./pages/admin/AdminWorkflowAnalytics'));
const AdminWorkflowRules         = lazy(() => import('./pages/admin/AdminWorkflowRules'));
const AdminWorkflowTriggers      = lazy(() => import('./pages/admin/AdminWorkflowTriggers'));
const AdminWorkflowReports       = lazy(() => import('./pages/admin/AdminWorkflowReports'));
// ── Sprint 15E: Enterprise Document Management System (DMS) ─────────────────
const AdminDMSDashboard          = lazy(() => import('./pages/admin/AdminDMSDashboard'));
const AdminDocumentFolders       = lazy(() => import('./pages/admin/AdminDocumentFolders'));
const AdminDocumentLibrary       = lazy(() => import('./pages/admin/AdminDocumentLibrary'));
const AdminDocumentDetail        = lazy(() => import('./pages/admin/AdminDocumentDetail'));
const AdminKnowledgeBase         = lazy(() => import('./pages/admin/AdminKnowledgeBase'));
const AdminKnowledgeDetail       = lazy(() => import('./pages/admin/AdminKnowledgeDetail'));
const AdminDocumentTemplates     = lazy(() => import('./pages/admin/AdminDocumentTemplates'));
const AdminDocumentReviewQueue   = lazy(() => import('./pages/admin/AdminDocumentReviewQueue'));
const AdminDocumentRetention     = lazy(() => import('./pages/admin/AdminDocumentRetention'));
const AdminDocumentArchive       = lazy(() => import('./pages/admin/AdminDocumentArchive'));
const AdminDocumentReports       = lazy(() => import('./pages/admin/AdminDocumentReports'));
const AdminDocumentSettings      = lazy(() => import('./pages/admin/AdminDocumentSettings'));
// ── Sprint 16A: Enterprise Business Intelligence & Executive Analytics ────────
const AdminBIExecutiveDashboard  = lazy(() => import('./pages/admin/AdminBIExecutiveDashboard'));
const AdminBIExecutive           = lazy(() => import('./pages/admin/AdminBIExecutive'));
const AdminBIBoardReports        = lazy(() => import('./pages/admin/AdminBIBoardReports'));
const AdminBIDepartmentAnalytics = lazy(() => import('./pages/admin/AdminBIDepartmentAnalytics'));
const AdminBIKPIExplorer         = lazy(() => import('./pages/admin/AdminBIKPIExplorer'));
const AdminBITrendAnalytics      = lazy(() => import('./pages/admin/AdminBITrendAnalytics'));
const AdminBIBenchmark           = lazy(() => import('./pages/admin/AdminBIBenchmark'));
const AdminBIEnterpriseHealth    = lazy(() => import('./pages/admin/AdminBIEnterpriseHealth'));
const AdminBIReportBuilder       = lazy(() => import('./pages/admin/AdminBIReportBuilder'));
const AdminBIDashboardSettings   = lazy(() => import('./pages/admin/AdminBIDashboardSettings'));
// ── Sprint 16B: Enterprise AI Forecasting & Predictive Intelligence ───────────
const AdminAIDashboard           = lazy(() => import('./pages/admin/AdminAIDashboard'));
const AdminAIForecastCenter      = lazy(() => import('./pages/admin/AdminAIForecastCenter'));
const AdminAIPredictions         = lazy(() => import('./pages/admin/AdminAIPredictions'));
const AdminAIRecommendations     = lazy(() => import('./pages/admin/AdminAIRecommendations'));
const AdminAIAnomalyCenter       = lazy(() => import('./pages/admin/AdminAIAnomalyCenter'));
const AdminAIScenarioComparison  = lazy(() => import('./pages/admin/AdminAIScenarioComparison'));
const AdminAIForecastReports     = lazy(() => import('./pages/admin/AdminAIForecastReports'));
const AdminAIPredictionSettings  = lazy(() => import('./pages/admin/AdminAIPredictionSettings'));
// Sprint 16C — AI Copilot & Intelligent Automation
const AdminAICopilot             = lazy(() => import('./pages/admin/AdminAICopilot'));
const AdminAIChat                = lazy(() => import('./pages/admin/AdminAIChat'));
const AdminAutomationCenter      = lazy(() => import('./pages/admin/AdminAutomationCenter'));
const AdminCopilotRules          = lazy(() => import('./pages/admin/AdminCopilotRules'));
const AdminExecutiveBriefing     = lazy(() => import('./pages/admin/AdminExecutiveBriefing'));
const AdminAIInsights            = lazy(() => import('./pages/admin/AdminAIInsights'));
const AdminRecommendationCenter  = lazy(() => import('./pages/admin/AdminRecommendationCenter'));
const AdminKnowledgeAssistant    = lazy(() => import('./pages/admin/AdminKnowledgeAssistant'));
// ESS Portal
const EmployeeLogin              = lazy(() => import('./pages/employee/EmployeeLogin'));
const EmployeeLayout             = lazy(() => import('./pages/employee/EmployeeLayout'));
const ESSDashboard               = lazy(() => import('./pages/employee/ESSDashboard'));
const ESSMyAttendance            = lazy(() => import('./pages/employee/ESSMyAttendance'));
const ESSMyLeave                 = lazy(() => import('./pages/employee/ESSMyLeave'));
const ESSMyPayroll               = lazy(() => import('./pages/employee/ESSMyPayroll'));
const ESSMyPerformance           = lazy(() => import('./pages/employee/ESSMyPerformance'));
const ESSMyTraining              = lazy(() => import('./pages/employee/ESSMyTraining'));
const ESSAnnouncements           = lazy(() => import('./pages/employee/ESSAnnouncements'));
const ESSRecognition             = lazy(() => import('./pages/employee/ESSRecognition'));
const ESSFeedback                = lazy(() => import('./pages/employee/ESSFeedback'));

// ── Sprint 14C: Enterprise Payroll Management ─────────────────────────────────
const AdminPayrollDashboard  = lazy(() => import('./pages/admin/AdminPayrollDashboard'));
const AdminPayrollRuns       = lazy(() => import('./pages/admin/AdminPayrollRuns'));
const AdminSalaryStructures  = lazy(() => import('./pages/admin/AdminSalaryStructures'));
const AdminSalaryComponents  = lazy(() => import('./pages/admin/AdminSalaryComponents'));
const AdminEmployeeSalary    = lazy(() => import('./pages/admin/AdminEmployeeSalary'));
const AdminPayrollProcessing = lazy(() => import('./pages/admin/AdminPayrollProcessing'));
const AdminPayslips          = lazy(() => import('./pages/admin/AdminPayslips'));
const AdminLoans             = lazy(() => import('./pages/admin/AdminLoans'));
const AdminAdvances          = lazy(() => import('./pages/admin/AdminAdvances'));
const AdminBonuses           = lazy(() => import('./pages/admin/AdminBonuses'));
const AdminPayrollReports    = lazy(() => import('./pages/admin/AdminPayrollReports'));
const AdminPayrollSettings   = lazy(() => import('./pages/admin/AdminPayrollSettings'));

// ── Sprint 14B: Enterprise Attendance & Leave Management ─────────────────────
const AdminAttendanceDashboard = lazy(() => import('./pages/admin/AdminAttendanceDashboard'));
const AdminAttendanceRegister  = lazy(() => import('./pages/admin/AdminAttendanceRegister'));
const AdminAttendanceAdjustments = lazy(() => import('./pages/admin/AdminAttendanceAdjustments'));
const AdminAttendancePolicies  = lazy(() => import('./pages/admin/AdminAttendancePolicies'));
const AdminLeaveTypes          = lazy(() => import('./pages/admin/AdminLeaveTypes'));
const AdminLeaveRequests       = lazy(() => import('./pages/admin/AdminLeaveRequests'));
const AdminLeaveApprovals      = lazy(() => import('./pages/admin/AdminLeaveApprovals'));
const AdminLeaveBalances       = lazy(() => import('./pages/admin/AdminLeaveBalances'));
const AdminHolidays            = lazy(() => import('./pages/admin/AdminHolidays'));
const AdminAttendanceReports   = lazy(() => import('./pages/admin/AdminAttendanceReports'));
const AdminLeaveReports        = lazy(() => import('./pages/admin/AdminLeaveReports'));

// ── Sprint 14A: Enterprise HRMS Foundation ────────────────────────────────────
const AdminHRDashboard       = lazy(() => import('./pages/admin/AdminHRDashboard'));
const AdminEmployees         = lazy(() => import('./pages/admin/AdminEmployees'));
const AdminEmployeeDetail    = lazy(() => import('./pages/admin/AdminEmployeeDetail'));
const AdminDepartments       = lazy(() => import('./pages/admin/AdminDepartments'));
const AdminDesignations      = lazy(() => import('./pages/admin/AdminDesignations'));
const AdminOrganizationChart = lazy(() => import('./pages/admin/AdminOrganizationChart'));
const AdminEmployeeDocuments = lazy(() => import('./pages/admin/AdminEmployeeDocuments'));
const AdminTransfers         = lazy(() => import('./pages/admin/AdminTransfers'));
const AdminPromotions        = lazy(() => import('./pages/admin/AdminPromotions'));
const AdminProbation         = lazy(() => import('./pages/admin/AdminProbation'));
const AdminExits             = lazy(() => import('./pages/admin/AdminExits'));
const AdminHRReports         = lazy(() => import('./pages/admin/AdminHRReports'));

// ── Sprint 12B: Enterprise Production Planning & Scheduling ─────────────────
const AdminManufacturingPlanningDashboard = lazy(() => import('./pages/admin/AdminManufacturingPlanningDashboard'));
const AdminProductionPlans                = lazy(() => import('./pages/admin/AdminProductionPlans'));
const AdminProductionPlanDetail           = lazy(() => import('./pages/admin/AdminProductionPlanDetail'));
const AdminMasterSchedule                 = lazy(() => import('./pages/admin/AdminMasterSchedule'));
const AdminCapacityPlanning               = lazy(() => import('./pages/admin/AdminCapacityPlanning'));
const AdminMachineCalendar                = lazy(() => import('./pages/admin/AdminMachineCalendar'));
const AdminProductionCalendar             = lazy(() => import('./pages/admin/AdminProductionCalendar'));
const AdminPlanningScenarios              = lazy(() => import('./pages/admin/AdminPlanningScenarios'));
const AdminPlanningReports                = lazy(() => import('./pages/admin/AdminPlanningReports'));
const AdminPlanningSettings               = lazy(() => import('./pages/admin/AdminPlanningSettings'));
const AdminSchedulingBoard                = lazy(() => import('./pages/admin/AdminSchedulingBoard'));

// ── Sprint 11B: Customer Service Portal ──────────────────────────────────────
const CustomerServiceRequests  = lazy(() => import('./pages/customer/CustomerServiceRequests'));
const CustomerRaiseComplaint   = lazy(() => import('./pages/customer/CustomerRaiseComplaint'));
const CustomerTrackComplaint   = lazy(() => import('./pages/customer/CustomerTrackComplaint'));
const CustomerWarrantyStatus   = lazy(() => import('./pages/customer/CustomerWarrantyStatus'));
const CustomerAMCStatus        = lazy(() => import('./pages/customer/CustomerAMCStatus'));
const CustomerServiceHistory   = lazy(() => import('./pages/customer/CustomerServiceHistory'));
const CustomerFeedback         = lazy(() => import('./pages/customer/CustomerFeedback'));
const CustomerServiceDocuments = lazy(() => import('./pages/customer/CustomerServiceDocuments'));

// ── Sprint 11A: After Sales Service — Admin + Technician Portal pages ────────
const AdminServiceDashboard    = lazy(() => import('./pages/admin/AdminServiceDashboard'));
const AdminServiceRequests     = lazy(() => import('./pages/admin/AdminServiceRequests'));
const AdminServiceRequestDetail= lazy(() => import('./pages/admin/AdminServiceRequestDetail'));
const AdminTechnicians11A      = lazy(() => import('./pages/admin/AdminTechnicians'));
const AdminWarranty            = lazy(() => import('./pages/admin/AdminWarranty'));
const AdminSpareParts          = lazy(() => import('./pages/admin/AdminSpareParts'));
const AdminServiceReports      = lazy(() => import('./pages/admin/AdminServiceReports'));
const TechnicianLogin          = lazy(() => import('./pages/technician/TechnicianLogin'));
const TechnicianLayout         = lazy(() => import('./pages/technician/TechnicianLayout'));
const TechnicianDashboard      = lazy(() => import('./pages/technician/TechnicianDashboard'));
const TechnicianJobs           = lazy(() => import('./pages/technician/TechnicianJobs'));
const TechnicianJobDetail      = lazy(() => import('./pages/technician/TechnicianJobDetail'));
const TechnicianProfile        = lazy(() => import('./pages/technician/TechnicianProfile'));

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

// Warehouse route guard — reads warehouseAuth slice (completely isolated)
function WarehouseRoute({ children }) {
  const { token, warehouseUser } = useSelector(s => s.warehouseAuth);
  if (!token) return <Navigate to="/warehouse/login" replace />;
  if (warehouseUser?.status !== 'active') return <Navigate to="/warehouse/login" replace />;
  return children;
}

// Supplier route guard — reads supplierAuth slice (completely isolated, type:'supplier' JWT)
function SupplierRoute({ children }) {
  const { token, supplierUser } = useSelector(s => s.supplierAuth);
  if (!token) return <Navigate to="/supplier/login" replace />;
  if (supplierUser?.status !== 'active') return <Navigate to="/supplier/login" replace />;
  return children;
}

// Technician route guard — reads technicianAuth slice (type:'technician' JWT)
function TechnicianRoute({ children }) {
  const { token, technician } = useSelector(s => s.technicianAuth);
  if (!token) return <Navigate to="/technician/login" replace />;
  if (technician?.status !== 'active') return <Navigate to="/technician/login" replace />;
  return children;
}

// Engineer route guard — reads engineerAuth slice (type:'engineer' JWT, green portal)
function EngineerRoute({ children }) {
  const { token, engineer } = useSelector(s => s.engineerAuth);
  if (!token) return <Navigate to="/engineer/login" replace />;
  if (engineer?.status !== 'active') return <Navigate to="/engineer/login" replace />;
  return children;
}

// Employee route guard — reads employeeAuth slice (type:'employee' JWT, ESS portal)
function EmployeeRoute({ children }) {
  const { token } = useSelector(s => s.employeeAuth);
  if (!token) return <Navigate to="/employee/login" replace />;
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

          {/* Sprint 11B: Customer Service Portal */}
          <Route path="/my-service"                       element={<PrivateRoute><CustomerServiceRequests /></PrivateRoute>} />
          <Route path="/my-service/raise"                 element={<PrivateRoute><CustomerRaiseComplaint /></PrivateRoute>} />
          <Route path="/my-service/track/:id"             element={<PrivateRoute><CustomerTrackComplaint /></PrivateRoute>} />
          <Route path="/my-service/warranty"              element={<PrivateRoute><CustomerWarrantyStatus /></PrivateRoute>} />
          <Route path="/my-service/amc"                   element={<PrivateRoute><CustomerAMCStatus /></PrivateRoute>} />
          <Route path="/my-service/history"               element={<PrivateRoute><CustomerServiceHistory /></PrivateRoute>} />
          <Route path="/my-service/feedback/:id"          element={<PrivateRoute><CustomerFeedback /></PrivateRoute>} />
          <Route path="/my-service/documents"             element={<PrivateRoute><CustomerServiceDocuments /></PrivateRoute>} />

          {/* Sprint 11C: Product Registration */}
          <Route path="/my-products/register"             element={<PrivateRoute><CustomerProductRegistration /></PrivateRoute>} />
          <Route path="/my-products"                      element={<PrivateRoute><CustomerRegistrationHistory /></PrivateRoute>} />
          <Route path="/my-products/:id"                   element={<PrivateRoute><CustomerProductRegistrationDetail /></PrivateRoute>} />

          {/* Sprint 11C: Installation Requests */}
          <Route path="/my-installations/book"            element={<PrivateRoute><CustomerBookInstallation /></PrivateRoute>} />
          <Route path="/my-installations"                 element={<PrivateRoute><CustomerInstallations /></PrivateRoute>} />
          <Route path="/my-installations/:id"             element={<PrivateRoute><CustomerInstallationStatus /></PrivateRoute>} />
          <Route path="/my-installations/:id/feedback"    element={<PrivateRoute><CustomerInstallationFeedback /></PrivateRoute>} />

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

        {/* Sprint 10A: Warehouse Foundation */}
        <Route path="/admin/warehouse"                  element={<AdminRoute><AdminWarehouseDashboard /></AdminRoute>} />
        <Route path="/admin/warehouses"                 element={<AdminRoute><AdminWarehouses /></AdminRoute>} />
        <Route path="/admin/warehouses/:id"             element={<AdminRoute><AdminWarehouseDetail /></AdminRoute>} />
        <Route path="/admin/warehouse-zones"            element={<AdminRoute><AdminWarehouseZones /></AdminRoute>} />
        <Route path="/admin/warehouse-locations"        element={<AdminRoute><AdminWarehouseLocations /></AdminRoute>} />
        <Route path="/admin/warehouse-users"            element={<AdminRoute><AdminWarehouseUsers /></AdminRoute>} />
        <Route path="/admin/warehouse-settings"         element={<AdminRoute><AdminWarehouseSettings /></AdminRoute>} />

        {/* Sprint 10B: Inventory Management — Admin */}
        <Route path="/admin/inventory"                  element={<AdminRoute><AdminInventoryDashboard /></AdminRoute>} />
        <Route path="/admin/inventory/list"             element={<AdminRoute><AdminInventoryList /></AdminRoute>} />
        <Route path="/admin/inventory/transactions"     element={<AdminRoute><AdminInventoryTransactions /></AdminRoute>} />
        <Route path="/admin/inventory/grn"              element={<AdminRoute><AdminGRNList /></AdminRoute>} />
        <Route path="/admin/inventory/grn/:id"          element={<AdminRoute><AdminGRNDetail /></AdminRoute>} />
        <Route path="/admin/inventory/adjustments"      element={<AdminRoute><AdminStockAdjustment /></AdminRoute>} />
        <Route path="/admin/inventory/cycle-count"      element={<AdminRoute><AdminCycleCount /></AdminRoute>} />
        <Route path="/admin/inventory/batches"          element={<AdminRoute><AdminBatchManagement /></AdminRoute>} />
        <Route path="/admin/inventory/serials"          element={<AdminRoute><AdminSerialManagement /></AdminRoute>} />
        <Route path="/admin/inventory/reservations"     element={<AdminRoute><AdminReservationDashboard /></AdminRoute>} />
        <Route path="/admin/inventory/:id"              element={<AdminRoute><AdminInventoryDetail /></AdminRoute>} />

        {/* Sprint 10B: Warehouse Portal (isolated auth — type:'warehouse' JWT) */}
        <Route path="/warehouse/login" element={<PageWrapper><WarehouseLogin /></PageWrapper>} />
        <Route path="/warehouse" element={<WarehouseRoute><WarehouseLayout /></WarehouseRoute>}>
          <Route path="dashboard"         element={<WarehouseDashboard />} />
          <Route path="inventory"         element={<WarehouseInventoryLookup />} />
          <Route path="receive"           element={<WarehouseReceiveStock />} />
          <Route path="grn"               element={<WarehouseReceiveStock />} />
          <Route path="cycle-count"       element={<WarehouseCycleCount />} />
          <Route path="adjustments"       element={<WarehouseAdjustment />} />
          {/* Sprint 10D: Logistics */}
          <Route path="picking"           element={<WarehousePickingList />} />
          <Route path="packing"           element={<WarehousePacking />} />
          <Route path="dispatch"          element={<WarehouseDispatch />} />
          <Route path="transfers"         element={<WarehouseTransfers />} />
          <Route path="shipment-tracking" element={<WarehouseShipmentTracking />} />
          {/* Sprint 10E: Mobile Operations */}
          <Route path="mobile/dashboard"  element={<WarehouseMobileDashboard />} />
          <Route path="mobile/scan"       element={<WarehouseMobileScan />} />
          <Route path="mobile/putaway"    element={<WarehouseMobilePutaway />} />
          <Route path="mobile/bin-lookup" element={<WarehouseMobileBinLookup />} />
          <Route path="mobile/returns"    element={<WarehouseMobileReturns />} />
        </Route>

        {/* Sprint 10C: Procurement & Vendor Management — Admin */}
        <Route path="/admin/procurement"                     element={<AdminRoute><AdminVendorDashboard /></AdminRoute>} />
        <Route path="/admin/procurement/vendors"             element={<AdminRoute><AdminVendorList /></AdminRoute>} />
        <Route path="/admin/procurement/vendors/:id"         element={<AdminRoute><AdminVendorDetail /></AdminRoute>} />
        <Route path="/admin/procurement/vendor-performance"  element={<AdminRoute><AdminVendorPerformance /></AdminRoute>} />
        <Route path="/admin/procurement/requisitions"        element={<AdminRoute><AdminPurchaseRequisitions /></AdminRoute>} />
        <Route path="/admin/procurement/rfq"                 element={<AdminRoute><AdminRFQList /></AdminRoute>} />
        <Route path="/admin/procurement/rfq/:id"             element={<AdminRoute><AdminRFQDetail /></AdminRoute>} />
        <Route path="/admin/procurement/orders"              element={<AdminRoute><AdminPurchaseOrders /></AdminRoute>} />
        <Route path="/admin/procurement/orders/:id"          element={<AdminRoute><AdminPurchaseOrderDetail /></AdminRoute>} />
        <Route path="/admin/procurement/approvals"           element={<AdminRoute><AdminApprovalQueue /></AdminRoute>} />
        <Route path="/admin/procurement/reports"             element={<AdminRoute><AdminProcurementReports /></AdminRoute>} />

        {/* Sprint 10C: Supplier Portal (isolated auth — type:'supplier' JWT) */}
        <Route path="/supplier/login" element={<PageWrapper><SupplierLogin /></PageWrapper>} />
        <Route path="/supplier" element={<SupplierRoute><SupplierLayout /></SupplierRoute>}>
          <Route path="dashboard"     element={<SupplierDashboard />} />
          <Route path="orders"        element={<SupplierPurchaseOrders />} />
          <Route path="orders/:id"    element={<SupplierOrderDetail />} />
          <Route path="rfq"           element={<SupplierRFQs />} />
          <Route path="invoices"      element={<SupplierInvoices />} />
          <Route path="documents"     element={<SupplierDocuments />} />
          <Route path="notifications" element={<SupplierNotifications />} />
          <Route path="profile"       element={<SupplierProfile />} />
        </Route>

        {/* Sprint 10D: Logistics — Admin */}
        <Route path="/admin/logistics"                  element={<AdminRoute><AdminLogisticsDashboard /></AdminRoute>} />
        <Route path="/admin/logistics/dispatches"       element={<AdminRoute><AdminDispatchQueue /></AdminRoute>} />
        <Route path="/admin/logistics/dispatches/:id"   element={<AdminRoute><AdminDispatchQueue /></AdminRoute>} />
        <Route path="/admin/logistics/shipments"        element={<AdminRoute><AdminShipmentList /></AdminRoute>} />
        <Route path="/admin/logistics/shipments/:id"    element={<AdminRoute><AdminShipmentList /></AdminRoute>} />
        <Route path="/admin/logistics/couriers"         element={<AdminRoute><AdminCourierManagement /></AdminRoute>} />
        <Route path="/admin/logistics/transfers"        element={<AdminRoute><AdminStockTransfers /></AdminRoute>} />
        <Route path="/admin/logistics/challans"         element={<AdminRoute><AdminDeliveryChallans /></AdminRoute>} />

        {/* Sprint 10F: IoT & Industry 4.0 — Admin */}
        <Route path="/admin/iot"               element={<AdminRoute><AdminIoTDashboard /></AdminRoute>} />
        <Route path="/admin/iot/rfid"          element={<AdminRoute><AdminRFIDManagement /></AdminRoute>} />
        <Route path="/admin/iot/devices"       element={<AdminRoute><AdminWarehouseDevices /></AdminRoute>} />
        <Route path="/admin/iot/sensors"       element={<AdminRoute><AdminSensorDashboard /></AdminRoute>} />
        <Route path="/admin/iot/alerts"        element={<AdminRoute><AdminAlertCenter /></AdminRoute>} />
        <Route path="/admin/iot/automation"    element={<AdminRoute><AdminAutomationRules /></AdminRoute>} />
        <Route path="/admin/iot/replenishment" element={<AdminRoute><AdminReplenishmentDashboard /></AdminRoute>} />

        {/* Sprint 10E: Barcode & Scanning — Admin */}
        <Route path="/admin/barcodes"          element={<AdminRoute><AdminBarcodeDashboard /></AdminRoute>} />
        <Route path="/admin/barcodes/generate" element={<AdminRoute><AdminBarcodeGenerator /></AdminRoute>} />
        <Route path="/admin/barcodes/labels"   element={<AdminRoute><AdminLabelCenter /></AdminRoute>} />
        <Route path="/admin/warehouse-map"     element={<AdminRoute><AdminWarehouseMap /></AdminRoute>} />
        <Route path="/admin/bin-management"    element={<AdminRoute><AdminBinManagement /></AdminRoute>} />
        <Route path="/admin/scanner-activity"  element={<AdminRoute><AdminScannerActivity /></AdminRoute>} />
        <Route path="/admin/automation"        element={<AdminRoute><AdminAutomationDashboard /></AdminRoute>} />

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

        {/* Sprint 11A: After Sales Service — Admin pages */}
        <Route path="/admin/service"                     element={<AdminRoute><AdminServiceDashboard /></AdminRoute>} />
        <Route path="/admin/service/requests"            element={<AdminRoute><AdminServiceRequests /></AdminRoute>} />
        <Route path="/admin/service/requests/:id"        element={<AdminRoute><AdminServiceRequestDetail /></AdminRoute>} />
        <Route path="/admin/service/technicians"         element={<AdminRoute><AdminTechnicians11A /></AdminRoute>} />
        <Route path="/admin/service/warranty"            element={<AdminRoute><AdminWarranty /></AdminRoute>} />
        <Route path="/admin/service/spare-parts"         element={<AdminRoute><AdminSpareParts /></AdminRoute>} />
        <Route path="/admin/service/reports"             element={<AdminRoute><AdminServiceReports /></AdminRoute>} />

        {/* Sprint 11A: Technician Portal (isolated auth — type:'technician' JWT) */}
        <Route path="/technician/login" element={<PageWrapper><TechnicianLogin /></PageWrapper>} />
        <Route path="/technician" element={<TechnicianRoute><TechnicianLayout /></TechnicianRoute>}>
          <Route path="dashboard" element={<TechnicianDashboard />} />
          <Route path="jobs"      element={<TechnicianJobs />} />
          <Route path="jobs/:id"  element={<TechnicianJobDetail />} />
          <Route path="profile"   element={<TechnicianProfile />} />
        </Route>

        {/* Sprint 11C: Installation Management — Admin */}
        <Route path="/admin/installation"              element={<AdminRoute><AdminInstallationDashboard /></AdminRoute>} />
        <Route path="/admin/installation/requests"     element={<AdminRoute><AdminInstallationRequests /></AdminRoute>} />
        <Route path="/admin/installation/requests/:id" element={<AdminRoute><AdminInstallationRequestDetail /></AdminRoute>} />
        <Route path="/admin/installation-engineers"    element={<AdminRoute><AdminInstallationEngineers /></AdminRoute>} />
        <Route path="/admin/product-registrations"     element={<AdminRoute><AdminProductRegistrations /></AdminRoute>} />
        <Route path="/admin/installation/reports"      element={<AdminRoute><AdminInstallationReports /></AdminRoute>} />

        {/* Sprint 12A: Manufacturing ERP Foundation — Admin */}
        <Route path="/admin/manufacturing"               element={<AdminRoute><AdminManufacturingDashboard /></AdminRoute>} />
        <Route path="/admin/manufacturing/factories"     element={<AdminRoute><AdminFactories /></AdminRoute>} />
        <Route path="/admin/manufacturing/work-centers"  element={<AdminRoute><AdminWorkCenters /></AdminRoute>} />
        <Route path="/admin/manufacturing/machines"      element={<AdminRoute><AdminMachines /></AdminRoute>} />
        <Route path="/admin/manufacturing/shifts"        element={<AdminRoute><AdminShiftPlanner /></AdminRoute>} />
        <Route path="/admin/manufacturing/bom"           element={<AdminRoute><AdminBOMList /></AdminRoute>} />
        <Route path="/admin/manufacturing/bom/:id"       element={<AdminRoute><AdminBOMDetail /></AdminRoute>} />
        <Route path="/admin/manufacturing/orders"        element={<AdminRoute><AdminProductionOrders /></AdminRoute>} />
        <Route path="/admin/manufacturing/orders/:id"    element={<AdminRoute><AdminProductionOrderDetail /></AdminRoute>} />

        {/* Sprint 12B: Enterprise Production Planning & Scheduling — Admin */}
        <Route path="/admin/manufacturing/planning"                    element={<AdminRoute><AdminManufacturingPlanningDashboard /></AdminRoute>} />
        <Route path="/admin/manufacturing/planning/plans"              element={<AdminRoute><AdminProductionPlans /></AdminRoute>} />
        <Route path="/admin/manufacturing/planning/plans/:id"          element={<AdminRoute><AdminProductionPlanDetail /></AdminRoute>} />
        <Route path="/admin/manufacturing/planning/mps"                element={<AdminRoute><AdminMasterSchedule /></AdminRoute>} />
        <Route path="/admin/manufacturing/planning/capacity"           element={<AdminRoute><AdminCapacityPlanning /></AdminRoute>} />
        <Route path="/admin/manufacturing/planning/machine-cal"        element={<AdminRoute><AdminMachineCalendar /></AdminRoute>} />
        <Route path="/admin/manufacturing/planning/prod-cal"           element={<AdminRoute><AdminProductionCalendar /></AdminRoute>} />
        <Route path="/admin/manufacturing/planning/scenarios"          element={<AdminRoute><AdminPlanningScenarios /></AdminRoute>} />
        <Route path="/admin/manufacturing/planning/reports"            element={<AdminRoute><AdminPlanningReports /></AdminRoute>} />
        <Route path="/admin/manufacturing/planning/settings"           element={<AdminRoute><AdminPlanningSettings /></AdminRoute>} />
        <Route path="/admin/manufacturing/planning/scheduling"         element={<AdminRoute><AdminSchedulingBoard /></AdminRoute>} />

        {/* Sprint 12C: Enterprise MRP — Admin */}
        <Route path="/admin/mrp"                          element={<AdminRoute><AdminMRPDashboard /></AdminRoute>} />
        <Route path="/admin/mrp/runs"                     element={<AdminRoute><AdminMRPRuns /></AdminRoute>} />
        <Route path="/admin/mrp/runs/:id"                 element={<AdminRoute><AdminMRPRunDetail /></AdminRoute>} />
        <Route path="/admin/mrp/requirements"             element={<AdminRoute><AdminMaterialRequirements /></AdminRoute>} />
        <Route path="/admin/mrp/reservations"             element={<AdminRoute><AdminMRPReservations /></AdminRoute>} />
        <Route path="/admin/mrp/shortages"                element={<AdminRoute><AdminMRPShortages /></AdminRoute>} />
        <Route path="/admin/mrp/projections"              element={<AdminRoute><AdminInventoryProjection /></AdminRoute>} />
        <Route path="/admin/mrp/forecasts"                element={<AdminRoute><AdminDemandForecast /></AdminRoute>} />
        <Route path="/admin/mrp/purchase-suggestions"     element={<AdminRoute><AdminPurchaseSuggestions /></AdminRoute>} />
        <Route path="/admin/mrp/production-suggestions"   element={<AdminRoute><AdminProductionSuggestions /></AdminRoute>} />
        <Route path="/admin/mrp/safety-stock"             element={<AdminRoute><AdminSafetyStock /></AdminRoute>} />
        <Route path="/admin/mrp/reports"                  element={<AdminRoute><AdminMRPReports /></AdminRoute>} />

        {/* Sprint 12D: Enterprise MES */}
        <Route path="/admin/mes"                          element={<AdminRoute><AdminMESDashboard /></AdminRoute>} />
        <Route path="/admin/mes/work-orders"              element={<AdminRoute><AdminWorkOrders /></AdminRoute>} />
        <Route path="/admin/mes/work-orders/:id"          element={<AdminRoute><AdminWorkOrderDetail /></AdminRoute>} />
        <Route path="/admin/mes/operations"               element={<AdminRoute><AdminOperations /></AdminRoute>} />
        <Route path="/admin/mes/execution"                element={<AdminRoute><AdminProductionExecution /></AdminRoute>} />
        <Route path="/admin/mes/quality"                  element={<AdminRoute><AdminQualityInspection /></AdminRoute>} />
        <Route path="/admin/mes/quality-dashboard"        element={<AdminRoute><AdminQualityDashboard /></AdminRoute>} />
        <Route path="/admin/mes/downtime"                 element={<AdminRoute><AdminDowntimeDashboard /></AdminRoute>} />
        <Route path="/admin/mes/oee"                      element={<AdminRoute><AdminOEEDashboard /></AdminRoute>} />
        <Route path="/admin/mes/operators"                element={<AdminRoute><AdminOperatorManagement /></AdminRoute>} />
        <Route path="/admin/mes/attendance"               element={<AdminRoute><AdminOperatorAttendance /></AdminRoute>} />
        <Route path="/admin/mes/tools"                    element={<AdminRoute><AdminToolManagement /></AdminRoute>} />
        <Route path="/admin/mes/machine-runtime"          element={<AdminRoute><AdminMachineRuntime /></AdminRoute>} />
        <Route path="/admin/mes/events"                   element={<AdminRoute><AdminProductionEvents /></AdminRoute>} />
        <Route path="/admin/mes/scrap"                    element={<AdminRoute><AdminScrapManagement /></AdminRoute>} />
        <Route path="/admin/mes/rework"                   element={<AdminRoute><AdminReworkManagement /></AdminRoute>} />
        <Route path="/admin/mes/reports"                  element={<AdminRoute><AdminMESReports /></AdminRoute>} />

        {/* Sprint 12E: Enterprise QMS */}
        <Route path="/admin/qms"                          element={<AdminRoute><AdminQMSDashboard /></AdminRoute>} />
        <Route path="/admin/qms/inspection-plans"         element={<AdminRoute><AdminInspectionPlans /></AdminRoute>} />
        <Route path="/admin/qms/inspection-lots"          element={<AdminRoute><AdminInspectionLots /></AdminRoute>} />
        <Route path="/admin/qms/inspection-lots/:id"      element={<AdminRoute><AdminInspectionDetail /></AdminRoute>} />
        <Route path="/admin/qms/certificates"             element={<AdminRoute><AdminCertificates /></AdminRoute>} />
        <Route path="/admin/qms/capas"                    element={<AdminRoute><AdminCAPA /></AdminRoute>} />
        <Route path="/admin/qms/capas/:id"                element={<AdminRoute><AdminCAPADetail /></AdminRoute>} />
        <Route path="/admin/qms/non-conformance"          element={<AdminRoute><AdminNonConformance /></AdminRoute>} />
        <Route path="/admin/qms/audit-programs"           element={<AdminRoute><AdminAuditPrograms /></AdminRoute>} />
        <Route path="/admin/qms/audits"                   element={<AdminRoute><AdminAudits /></AdminRoute>} />
        <Route path="/admin/qms/calibration"              element={<AdminRoute><AdminCalibrationDashboard /></AdminRoute>} />
        <Route path="/admin/qms/gauges"                   element={<AdminRoute><AdminGaugeManagement /></AdminRoute>} />
        <Route path="/admin/qms/supplier-quality"         element={<AdminRoute><AdminSupplierQuality /></AdminRoute>} />
        <Route path="/admin/qms/reports"                  element={<AdminRoute><AdminQualityReports /></AdminRoute>} />
        <Route path="/admin/qms/documents"                element={<AdminRoute><AdminDocumentControl /></AdminRoute>} />

        {/* Sprint 12F: Enterprise Asset Management (EAM / CMMS) */}
        <Route path="/admin/eam"                          element={<AdminRoute><AdminEAMDashboard /></AdminRoute>} />
        <Route path="/admin/eam/assets"                   element={<AdminRoute><AdminAssets /></AdminRoute>} />
        <Route path="/admin/eam/assets/:id"               element={<AdminRoute><AdminAssetDetail /></AdminRoute>} />
        <Route path="/admin/eam/hierarchy"                element={<AdminRoute><AdminAssetHierarchy /></AdminRoute>} />
        <Route path="/admin/eam/maintenance-plans"        element={<AdminRoute><AdminMaintenancePlans /></AdminRoute>} />
        <Route path="/admin/eam/calendar"                 element={<AdminRoute><AdminMaintenanceCalendar /></AdminRoute>} />
        <Route path="/admin/eam/work-orders"              element={<AdminRoute><AdminMaintenanceWorkOrders /></AdminRoute>} />
        <Route path="/admin/eam/requests"                 element={<AdminRoute><AdminMaintenanceRequests /></AdminRoute>} />
        <Route path="/admin/eam/breakdowns"               element={<AdminRoute><AdminBreakdowns /></AdminRoute>} />
        <Route path="/admin/eam/meters"                   element={<AdminRoute><AdminMeters /></AdminRoute>} />
        <Route path="/admin/eam/condition-monitoring"     element={<AdminRoute><AdminConditionMonitoring /></AdminRoute>} />
        <Route path="/admin/eam/reports"                  element={<AdminRoute><AdminMaintenanceReports /></AdminRoute>} />
        <Route path="/admin/eam/analytics"                element={<AdminRoute><AdminMaintenanceAnalytics /></AdminRoute>} />
        <Route path="/admin/eam/warranties"               element={<AdminRoute><AdminAssetWarranty /></AdminRoute>} />
        <Route path="/admin/eam/inventory"                element={<AdminRoute><AdminMaintenanceInventory /></AdminRoute>} />
        <Route path="/admin/eam/contracts"                element={<AdminRoute><AdminMaintenanceContracts /></AdminRoute>} />

        {/* Sprint 13A: Enterprise Finance & General Ledger */}
        <Route path="/admin/finance"                        element={<AdminRoute><AdminFinanceDashboard /></AdminRoute>} />
        <Route path="/admin/finance/accounts"               element={<AdminRoute><AdminChartOfAccounts /></AdminRoute>} />
        <Route path="/admin/finance/account-groups"         element={<AdminRoute><AdminAccountGroups /></AdminRoute>} />
        <Route path="/admin/finance/journals"               element={<AdminRoute><AdminJournalEntries /></AdminRoute>} />
        <Route path="/admin/finance/journals/:id"           element={<AdminRoute><AdminJournalDetail /></AdminRoute>} />
        <Route path="/admin/finance/ledger"                 element={<AdminRoute><AdminGeneralLedger /></AdminRoute>} />
        <Route path="/admin/finance/fiscal-years"           element={<AdminRoute><AdminFiscalYears /></AdminRoute>} />
        <Route path="/admin/finance/periods"                element={<AdminRoute><AdminAccountingPeriods /></AdminRoute>} />
        <Route path="/admin/finance/cost-centers"           element={<AdminRoute><AdminCostCenters /></AdminRoute>} />
        <Route path="/admin/finance/profit-centers"         element={<AdminRoute><AdminProfitCenters /></AdminRoute>} />
        <Route path="/admin/finance/posting-rules"          element={<AdminRoute><AdminPostingRules /></AdminRoute>} />
        <Route path="/admin/finance/voucher-series"         element={<AdminRoute><AdminVoucherSeries /></AdminRoute>} />
        <Route path="/admin/finance/trial-balance"          element={<AdminRoute><AdminTrialBalance /></AdminRoute>} />
        <Route path="/admin/finance/balance-sheet"          element={<AdminRoute><AdminBalanceSheet /></AdminRoute>} />
        <Route path="/admin/finance/profit-loss"            element={<AdminRoute><AdminProfitAndLoss /></AdminRoute>} />
        <Route path="/admin/finance/cash-book"              element={<AdminRoute><AdminCashBook /></AdminRoute>} />
        <Route path="/admin/finance/bank-book"              element={<AdminRoute><AdminBankBook /></AdminRoute>} />
        <Route path="/admin/finance/settings"               element={<AdminRoute><AdminFinancialSettings /></AdminRoute>} />

        {/* Sprint 13B: Enterprise Accounts Payable */}
        <Route path="/admin/accounts-payable"                        element={<AdminRoute><AdminAccountsPayableDashboard /></AdminRoute>} />
        <Route path="/admin/accounts-payable/bills"                  element={<AdminRoute><AdminVendorBills /></AdminRoute>} />
        <Route path="/admin/accounts-payable/bills/:id"              element={<AdminRoute><AdminVendorBillDetail /></AdminRoute>} />
        <Route path="/admin/accounts-payable/payments"               element={<AdminRoute><AdminVendorPayments /></AdminRoute>} />
        <Route path="/admin/accounts-payable/payment-runs"           element={<AdminRoute><AdminPaymentRun /></AdminRoute>} />
        <Route path="/admin/accounts-payable/ledger"                 element={<AdminRoute><AdminVendorLedger /></AdminRoute>} />
        <Route path="/admin/accounts-payable/statements"             element={<AdminRoute><AdminVendorStatements /></AdminRoute>} />
        <Route path="/admin/accounts-payable/aging"                  element={<AdminRoute><AdminVendorAging /></AdminRoute>} />
        <Route path="/admin/accounts-payable/debit-notes"            element={<AdminRoute><AdminDebitNotes /></AdminRoute>} />
        <Route path="/admin/accounts-payable/credit-notes"           element={<AdminRoute><AdminCreditNotes /></AdminRoute>} />
        <Route path="/admin/accounts-payable/invoice-matching"       element={<AdminRoute><AdminInvoiceMatching /></AdminRoute>} />
        <Route path="/admin/accounts-payable/payment-advice"         element={<AdminRoute><AdminPaymentAdvice /></AdminRoute>} />
        <Route path="/admin/accounts-payable/reports"                element={<AdminRoute><AdminAccountsPayableReports /></AdminRoute>} />

        {/* Sprint 13C: Enterprise Accounts Receivable */}
        <Route path="/admin/accounts-receivable"                        element={<AdminRoute><AdminAccountsReceivableDashboard /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/invoices"               element={<AdminRoute><AdminCustomerInvoices /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/invoices/:id"           element={<AdminRoute><AdminCustomerInvoiceDetail /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/receipts"               element={<AdminRoute><AdminCustomerReceipts /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/allocations"            element={<AdminRoute><AdminReceiptAllocation /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/ledger"                 element={<AdminRoute><AdminCustomerLedger /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/statements"             element={<AdminRoute><AdminCustomerStatements /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/aging"                  element={<AdminRoute><AdminCustomerAging /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/collections"            element={<AdminRoute><AdminCollections /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/credit"                 element={<AdminRoute><AdminCreditManagement /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/promises"               element={<AdminRoute><AdminPromiseToPay /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/write-offs"             element={<AdminRoute><AdminWriteOffs /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/bad-debt"               element={<AdminRoute><AdminBadDebt /></AdminRoute>} />
        <Route path="/admin/accounts-receivable/reports"                element={<AdminRoute><AdminAccountsReceivableReports /></AdminRoute>} />

        {/* Sprint 13D: Enterprise Tax & Compliance Engine */}
        <Route path="/admin/tax"                          element={<AdminRoute><AdminTaxDashboard /></AdminRoute>} />
        <Route path="/admin/tax/codes"                    element={<AdminRoute><AdminTaxCodes /></AdminRoute>} />
        <Route path="/admin/tax/rates"                    element={<AdminRoute><AdminTaxRates /></AdminRoute>} />
        <Route path="/admin/tax/gst"                      element={<AdminRoute><AdminGSTDashboard /></AdminRoute>} />
        <Route path="/admin/tax/gst/returns"              element={<AdminRoute><AdminGSTReturns /></AdminRoute>} />
        <Route path="/admin/tax/gst/itc"                  element={<AdminRoute><AdminInputCredit /></AdminRoute>} />
        <Route path="/admin/tax/gst/output"               element={<AdminRoute><AdminOutputTax /></AdminRoute>} />
        <Route path="/admin/tax/tds"                      element={<AdminRoute><AdminTDSDashboard /></AdminRoute>} />
        <Route path="/admin/tax/tds/certificates"         element={<AdminRoute><AdminTDSCertificates /></AdminRoute>} />
        <Route path="/admin/tax/compliance"               element={<AdminRoute><AdminComplianceCalendar /></AdminRoute>} />
        <Route path="/admin/tax/einvoice"                 element={<AdminRoute><AdminEInvoice /></AdminRoute>} />
        <Route path="/admin/tax/ewaybill"                 element={<AdminRoute><AdminEWayBill /></AdminRoute>} />
        <Route path="/admin/tax/reports"                  element={<AdminRoute><AdminTaxReports /></AdminRoute>} />

        {/* Sprint 13E: Enterprise Banking & Treasury */}
        <Route path="/admin/banking"                              element={<AdminRoute><AdminBankingDashboard /></AdminRoute>} />
        <Route path="/admin/banking/banks"                        element={<AdminRoute><AdminBanks /></AdminRoute>} />
        <Route path="/admin/banking/accounts"                     element={<AdminRoute><AdminBankAccounts /></AdminRoute>} />
        <Route path="/admin/banking/statements"                   element={<AdminRoute><AdminBankStatements /></AdminRoute>} />
        <Route path="/admin/banking/reconciliation"               element={<AdminRoute><AdminReconciliation /></AdminRoute>} />
        <Route path="/admin/banking/cash-book"                    element={<AdminRoute><AdminBankCashBook /></AdminRoute>} />
        <Route path="/admin/banking/petty-cash"                   element={<AdminRoute><AdminPettyCash /></AdminRoute>} />
        <Route path="/admin/banking/cash-transfers"               element={<AdminRoute><AdminCashTransfers /></AdminRoute>} />
        <Route path="/admin/banking/cheque-books"                 element={<AdminRoute><AdminChequeBooks /></AdminRoute>} />
        <Route path="/admin/banking/treasury"                     element={<AdminRoute><AdminTreasury /></AdminRoute>} />
        <Route path="/admin/banking/cash-forecast"                element={<AdminRoute><AdminCashForecast /></AdminRoute>} />
        <Route path="/admin/banking/liquidity-forecast"           element={<AdminRoute><AdminLiquidityForecast /></AdminRoute>} />
        <Route path="/admin/banking/investments"                  element={<AdminRoute><AdminInvestments /></AdminRoute>} />
        <Route path="/admin/banking/fixed-deposits"               element={<AdminRoute><AdminFixedDeposits /></AdminRoute>} />
        <Route path="/admin/banking/bank-guarantees"              element={<AdminRoute><AdminBankGuarantees /></AdminRoute>} />
        <Route path="/admin/banking/letters-of-credit"            element={<AdminRoute><AdminLettersOfCredit /></AdminRoute>} />
        <Route path="/admin/banking/fx"                           element={<AdminRoute><AdminFXManagement /></AdminRoute>} />
        <Route path="/admin/banking/reports"                      element={<AdminRoute><AdminBankingReports /></AdminRoute>} />

        {/* Sprint 13F: CFO Dashboard & Financial Consolidation */}
        <Route path="/admin/cfo"                                  element={<AdminRoute><AdminCFODashboard /></AdminRoute>} />
        <Route path="/admin/cfo/budgets"                          element={<AdminRoute><AdminBudgets /></AdminRoute>} />
        <Route path="/admin/cfo/budgets/:id"                      element={<AdminRoute><AdminBudgetDetail /></AdminRoute>} />
        <Route path="/admin/cfo/forecasts"                        element={<AdminRoute><AdminForecasts /></AdminRoute>} />
        <Route path="/admin/cfo/forecasts/:id"                    element={<AdminRoute><AdminForecastDetail /></AdminRoute>} />
        <Route path="/admin/cfo/kpis"                             element={<AdminRoute><AdminFinancialKPIs /></AdminRoute>} />
        <Route path="/admin/cfo/cash-flow"                        element={<AdminRoute><AdminCashFlowDashboard /></AdminRoute>} />
        <Route path="/admin/cfo/profitability"                    element={<AdminRoute><AdminProfitabilityDashboard /></AdminRoute>} />
        <Route path="/admin/cfo/consolidation"                    element={<AdminRoute><AdminConsolidationDashboard /></AdminRoute>} />
        <Route path="/admin/cfo/board-reports"                    element={<AdminRoute><AdminBoardReports /></AdminRoute>} />
        <Route path="/admin/cfo/variance"                         element={<AdminRoute><AdminVarianceAnalysis /></AdminRoute>} />
        <Route path="/admin/cfo/alerts"                           element={<AdminRoute><AdminFinancialAlerts /></AdminRoute>} />
        <Route path="/admin/cfo/reports"                          element={<AdminRoute><AdminExecutiveReports /></AdminRoute>} />

        {/* Sprint 14A: Enterprise HRMS Foundation */}
        <Route path="/admin/hr"                        element={<AdminRoute><AdminHRDashboard /></AdminRoute>} />
        <Route path="/admin/hr/employees"              element={<AdminRoute><AdminEmployees /></AdminRoute>} />
        <Route path="/admin/hr/employees/:id"          element={<AdminRoute><AdminEmployeeDetail /></AdminRoute>} />
        <Route path="/admin/hr/departments"            element={<AdminRoute><AdminDepartments /></AdminRoute>} />
        <Route path="/admin/hr/designations"           element={<AdminRoute><AdminDesignations /></AdminRoute>} />
        <Route path="/admin/hr/org-chart"              element={<AdminRoute><AdminOrganizationChart /></AdminRoute>} />
        <Route path="/admin/hr/documents"              element={<AdminRoute><AdminEmployeeDocuments /></AdminRoute>} />
        <Route path="/admin/hr/transfers"              element={<AdminRoute><AdminTransfers /></AdminRoute>} />
        <Route path="/admin/hr/promotions"             element={<AdminRoute><AdminPromotions /></AdminRoute>} />
        <Route path="/admin/hr/probation"              element={<AdminRoute><AdminProbation /></AdminRoute>} />
        <Route path="/admin/hr/exits"                  element={<AdminRoute><AdminExits /></AdminRoute>} />
        <Route path="/admin/hr/reports"                element={<AdminRoute><AdminHRReports /></AdminRoute>} />
        <Route path="/admin/hr/attendance"             element={<AdminRoute><AdminAttendanceDashboard /></AdminRoute>} />
        <Route path="/admin/hr/attendance/register"    element={<AdminRoute><AdminAttendanceRegister /></AdminRoute>} />
        <Route path="/admin/hr/attendance/adjustments" element={<AdminRoute><AdminAttendanceAdjustments /></AdminRoute>} />
        <Route path="/admin/hr/attendance/policies"    element={<AdminRoute><AdminAttendancePolicies /></AdminRoute>} />
        <Route path="/admin/hr/leave/types"            element={<AdminRoute><AdminLeaveTypes /></AdminRoute>} />
        <Route path="/admin/hr/leave/requests"         element={<AdminRoute><AdminLeaveRequests /></AdminRoute>} />
        <Route path="/admin/hr/leave/approvals"        element={<AdminRoute><AdminLeaveApprovals /></AdminRoute>} />
        <Route path="/admin/hr/leave/balances"         element={<AdminRoute><AdminLeaveBalances /></AdminRoute>} />
        <Route path="/admin/hr/leave/holidays"         element={<AdminRoute><AdminHolidays /></AdminRoute>} />
        <Route path="/admin/hr/attendance/reports"     element={<AdminRoute><AdminAttendanceReports /></AdminRoute>} />
        <Route path="/admin/hr/leave/reports"          element={<AdminRoute><AdminLeaveReports /></AdminRoute>} />

        {/* Sprint 14C: Enterprise Payroll Management */}
        <Route path="/admin/hr/payroll"                       element={<AdminRoute><AdminPayrollDashboard /></AdminRoute>} />
        <Route path="/admin/hr/payroll/runs"                  element={<AdminRoute><AdminPayrollRuns /></AdminRoute>} />
        <Route path="/admin/hr/payroll/structures"            element={<AdminRoute><AdminSalaryStructures /></AdminRoute>} />
        <Route path="/admin/hr/payroll/components"            element={<AdminRoute><AdminSalaryComponents /></AdminRoute>} />
        <Route path="/admin/hr/payroll/employee-salary"       element={<AdminRoute><AdminEmployeeSalary /></AdminRoute>} />
        <Route path="/admin/hr/payroll/runs/:id/process"      element={<AdminRoute><AdminPayrollProcessing /></AdminRoute>} />
        <Route path="/admin/hr/payroll/payslips"              element={<AdminRoute><AdminPayslips /></AdminRoute>} />
        <Route path="/admin/hr/payroll/loans"                 element={<AdminRoute><AdminLoans /></AdminRoute>} />
        <Route path="/admin/hr/payroll/advances"              element={<AdminRoute><AdminAdvances /></AdminRoute>} />
        <Route path="/admin/hr/payroll/bonuses"               element={<AdminRoute><AdminBonuses /></AdminRoute>} />
        <Route path="/admin/hr/payroll/reports"               element={<AdminRoute><AdminPayrollReports /></AdminRoute>} />
        <Route path="/admin/hr/payroll/settings"              element={<AdminRoute><AdminPayrollSettings /></AdminRoute>} />

        {/* Sprint 14D: Enterprise Recruitment & ATS */}
        <Route path="/admin/hr/recruitment"                              element={<AdminRoute><AdminRecruitmentDashboard /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/jobs"                         element={<AdminRoute><AdminJobOpenings /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/jobs/:id"                     element={<AdminRoute><AdminJobDetail /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/candidates"                   element={<AdminRoute><AdminCandidates /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/candidates/:id"               element={<AdminRoute><AdminCandidateDetail /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/applications"                 element={<AdminRoute><AdminApplications /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/interviews"                   element={<AdminRoute><AdminInterviewCalendar /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/feedback"                     element={<AdminRoute><AdminInterviewFeedback /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/offers"                       element={<AdminRoute><AdminOfferLetters /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/bgv"                          element={<AdminRoute><AdminBackgroundVerification /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/talent-pool"                  element={<AdminRoute><AdminTalentPool /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/reports"                      element={<AdminRoute><AdminRecruitmentReports /></AdminRoute>} />
        <Route path="/admin/hr/recruitment/settings"                     element={<AdminRoute><AdminRecruitmentSettings /></AdminRoute>} />

        {/* Sprint 14E: Performance Management, Learning & ESS */}
        <Route path="/admin/hr/performance"                              element={<AdminRoute><AdminPerformanceDashboard /></AdminRoute>} />
        <Route path="/admin/hr/performance/goals"                        element={<AdminRoute><AdminGoals /></AdminRoute>} />
        <Route path="/admin/hr/performance/goals/:id"                    element={<AdminRoute><AdminGoalDetail /></AdminRoute>} />
        <Route path="/admin/hr/performance/reviews"                      element={<AdminRoute><AdminPerformanceReviews /></AdminRoute>} />
        <Route path="/admin/hr/performance/kpis"                         element={<AdminRoute><AdminKPIs /></AdminRoute>} />
        <Route path="/admin/hr/performance/appraisals"                   element={<AdminRoute><AdminAppraisals /></AdminRoute>} />
        <Route path="/admin/hr/performance/training"                     element={<AdminRoute><AdminTrainingCourses /></AdminRoute>} />
        <Route path="/admin/hr/performance/learning-paths"               element={<AdminRoute><AdminLearningPaths /></AdminRoute>} />
        <Route path="/admin/hr/performance/certifications"               element={<AdminRoute><AdminCertifications /></AdminRoute>} />
        <Route path="/admin/hr/performance/career"                       element={<AdminRoute><AdminCareerDevelopment /></AdminRoute>} />
        <Route path="/admin/hr/performance/succession"                   element={<AdminRoute><AdminSuccessionPlanning /></AdminRoute>} />
        <Route path="/admin/hr/performance/reports"                      element={<AdminRoute><AdminPerformanceReports /></AdminRoute>} />
        <Route path="/admin/hr/performance/announcements"                element={<AdminRoute><AdminPerformanceAnnouncements /></AdminRoute>} />
        <Route path="/admin/hr/performance/recognition"                  element={<AdminRoute><AdminRecognition /></AdminRoute>} />
        {/* Sprint 15A: Enterprise Project Management */}
        <Route path="/admin/projects"                element={<AdminRoute><AdminProjects /></AdminRoute>} />
        <Route path="/admin/projects/dashboard"      element={<AdminRoute><AdminProjectDashboard /></AdminRoute>} />
        <Route path="/admin/projects/:id"            element={<AdminRoute><AdminProjectDetail /></AdminRoute>} />
        <Route path="/admin/projects/:id/kanban"     element={<AdminRoute><AdminKanbanBoard /></AdminRoute>} />
        <Route path="/admin/projects/:id/gantt"      element={<AdminRoute><AdminGanttTimeline /></AdminRoute>} />
        <Route path="/admin/projects/milestones/all" element={<AdminRoute><AdminMilestones /></AdminRoute>} />
        <Route path="/admin/projects/tasks/all"      element={<AdminRoute><AdminProjectTasks /></AdminRoute>} />
        <Route path="/admin/projects/timesheets/all" element={<AdminRoute><AdminTimesheets /></AdminRoute>} />
        <Route path="/admin/projects/resources/all"  element={<AdminRoute><AdminProjectResources /></AdminRoute>} />
        <Route path="/admin/projects/risks/all"      element={<AdminRoute><AdminProjectRisks /></AdminRoute>} />
        <Route path="/admin/projects/issues/all"     element={<AdminRoute><AdminProjectIssues /></AdminRoute>} />
        <Route path="/admin/projects/reports"        element={<AdminRoute><AdminProjectReports /></AdminRoute>} />
        <Route path="/admin/projects/settings"       element={<AdminRoute><AdminProjectSettings /></AdminRoute>} />
        {/* Sprint 15B: Enterprise Project Portfolio Management */}
        <Route path="/admin/portfolio"                       element={<AdminRoute><AdminPortfolios /></AdminRoute>} />
        <Route path="/admin/portfolio/dashboard"             element={<AdminRoute><AdminPortfolioDashboard /></AdminRoute>} />
        <Route path="/admin/portfolio/executive"             element={<AdminRoute><AdminPortfolioExecutive /></AdminRoute>} />
        <Route path="/admin/portfolio/programs"              element={<AdminRoute><AdminPrograms /></AdminRoute>} />
        <Route path="/admin/portfolio/initiatives"           element={<AdminRoute><AdminInitiatives /></AdminRoute>} />
        <Route path="/admin/portfolio/resources"             element={<AdminRoute><AdminResourceCapacity /></AdminRoute>} />
        <Route path="/admin/portfolio/finance"               element={<AdminRoute><AdminPortfolioFinance /></AdminRoute>} />
        <Route path="/admin/portfolio/reports"               element={<AdminRoute><AdminPortfolioReports /></AdminRoute>} />
        <Route path="/admin/portfolio/:id"                   element={<AdminRoute><AdminPortfolioDetail /></AdminRoute>} />
        {/* Sprint 15C: PMO Governance & Analytics */}
        <Route path="/admin/pmo/dashboard"        element={<AdminRoute><AdminPMODashboard /></AdminRoute>} />
        <Route path="/admin/pmo/analytics"        element={<AdminRoute><AdminPMOAnalytics /></AdminRoute>} />
        <Route path="/admin/pmo/governance"       element={<AdminRoute><AdminPMOGovernance /></AdminRoute>} />
        <Route path="/admin/pmo/compliance"       element={<AdminRoute><AdminPMOCompliance /></AdminRoute>} />
        <Route path="/admin/pmo/business-cases"   element={<AdminRoute><AdminPMOBusinessCase /></AdminRoute>} />
        <Route path="/admin/pmo/investments"      element={<AdminRoute><AdminPMOInvestmentRequests /></AdminRoute>} />
        <Route path="/admin/pmo/charters"         element={<AdminRoute><AdminPMOCharters /></AdminRoute>} />
        <Route path="/admin/pmo/lessons"          element={<AdminRoute><AdminPMOLessonsLearned /></AdminRoute>} />
        <Route path="/admin/pmo/templates"        element={<AdminRoute><AdminPMOTemplates /></AdminRoute>} />
        <Route path="/admin/pmo/documents"        element={<AdminRoute><AdminPMODocuments /></AdminRoute>} />
        <Route path="/admin/pmo/audits"           element={<AdminRoute><AdminPMOAudit /></AdminRoute>} />
        <Route path="/admin/pmo/scorecards"       element={<AdminRoute><AdminPMOScorecard /></AdminRoute>} />
        {/* Sprint 15D: Workflow Automation & BPM */}
        <Route path="/admin/bpm/dashboard"         element={<AdminRoute><AdminBPMDashboard /></AdminRoute>} />
        <Route path="/admin/bpm/designer"          element={<AdminRoute><AdminWorkflowDesigner /></AdminRoute>} />
        <Route path="/admin/bpm/templates"         element={<AdminRoute><AdminWorkflowTemplates /></AdminRoute>} />
        <Route path="/admin/bpm/instances"         element={<AdminRoute><AdminWorkflowInstances /></AdminRoute>} />
        <Route path="/admin/bpm/approvals"         element={<AdminRoute><AdminWorkflowApprovals /></AdminRoute>} />
        <Route path="/admin/bpm/escalations"       element={<AdminRoute><AdminWorkflowEscalations /></AdminRoute>} />
        <Route path="/admin/bpm/sla"               element={<AdminRoute><AdminWorkflowSLA /></AdminRoute>} />
        <Route path="/admin/bpm/history"           element={<AdminRoute><AdminWorkflowHistory /></AdminRoute>} />
        <Route path="/admin/bpm/analytics"         element={<AdminRoute><AdminWorkflowAnalytics /></AdminRoute>} />
        <Route path="/admin/bpm/rules"             element={<AdminRoute><AdminWorkflowRules /></AdminRoute>} />
        <Route path="/admin/bpm/triggers"          element={<AdminRoute><AdminWorkflowTriggers /></AdminRoute>} />
        <Route path="/admin/bpm/reports"           element={<AdminRoute><AdminWorkflowReports /></AdminRoute>} />
        {/* Sprint 15E: Enterprise Document Management System */}
        <Route path="/admin/dms/dashboard"     element={<AdminRoute><AdminDMSDashboard /></AdminRoute>} />
        <Route path="/admin/dms/folders"       element={<AdminRoute><AdminDocumentFolders /></AdminRoute>} />
        <Route path="/admin/dms/library"       element={<AdminRoute><AdminDocumentLibrary /></AdminRoute>} />
        <Route path="/admin/dms/library/:id"   element={<AdminRoute><AdminDocumentDetail /></AdminRoute>} />
        <Route path="/admin/dms/knowledge"     element={<AdminRoute><AdminKnowledgeBase /></AdminRoute>} />
        <Route path="/admin/dms/knowledge/:id" element={<AdminRoute><AdminKnowledgeDetail /></AdminRoute>} />
        <Route path="/admin/dms/templates"     element={<AdminRoute><AdminDocumentTemplates /></AdminRoute>} />
        <Route path="/admin/dms/reviews"       element={<AdminRoute><AdminDocumentReviewQueue /></AdminRoute>} />
        <Route path="/admin/dms/retention"     element={<AdminRoute><AdminDocumentRetention /></AdminRoute>} />
        <Route path="/admin/dms/archive"       element={<AdminRoute><AdminDocumentArchive /></AdminRoute>} />
        <Route path="/admin/dms/reports"       element={<AdminRoute><AdminDocumentReports /></AdminRoute>} />
        <Route path="/admin/dms/settings"      element={<AdminRoute><AdminDocumentSettings /></AdminRoute>} />
        {/* Sprint 16A: Enterprise BI & Executive Analytics */}
        <Route path="/admin/bi-exec/dashboard"   element={<AdminRoute><AdminBIExecutiveDashboard /></AdminRoute>} />
        <Route path="/admin/bi-exec/executive"   element={<AdminRoute><AdminBIExecutive /></AdminRoute>} />
        <Route path="/admin/bi-exec/board"       element={<AdminRoute><AdminBIBoardReports /></AdminRoute>} />
        <Route path="/admin/bi-exec/department"  element={<AdminRoute><AdminBIDepartmentAnalytics /></AdminRoute>} />
        <Route path="/admin/bi-exec/kpis"        element={<AdminRoute><AdminBIKPIExplorer /></AdminRoute>} />
        <Route path="/admin/bi-exec/trends"      element={<AdminRoute><AdminBITrendAnalytics /></AdminRoute>} />
        <Route path="/admin/bi-exec/benchmark"   element={<AdminRoute><AdminBIBenchmark /></AdminRoute>} />
        <Route path="/admin/bi-exec/health"      element={<AdminRoute><AdminBIEnterpriseHealth /></AdminRoute>} />
        <Route path="/admin/bi-exec/reports"     element={<AdminRoute><AdminBIReportBuilder /></AdminRoute>} />
        <Route path="/admin/bi-exec/settings"    element={<AdminRoute><AdminBIDashboardSettings /></AdminRoute>} />
        {/* Sprint 16B: Enterprise AI Forecasting & Predictive Intelligence */}
        <Route path="/admin/ai/dashboard"    element={<AdminRoute><AdminAIDashboard /></AdminRoute>} />
        <Route path="/admin/ai/forecasts"    element={<AdminRoute><AdminAIForecastCenter /></AdminRoute>} />
        <Route path="/admin/ai/predictions"  element={<AdminRoute><AdminAIPredictions /></AdminRoute>} />
        <Route path="/admin/ai/recommendations" element={<AdminRoute><AdminAIRecommendations /></AdminRoute>} />
        <Route path="/admin/ai/anomalies"    element={<AdminRoute><AdminAIAnomalyCenter /></AdminRoute>} />
        <Route path="/admin/ai/scenarios"    element={<AdminRoute><AdminAIScenarioComparison /></AdminRoute>} />
        <Route path="/admin/ai/reports"      element={<AdminRoute><AdminAIForecastReports /></AdminRoute>} />
        <Route path="/admin/ai/settings"     element={<AdminRoute><AdminAIPredictionSettings /></AdminRoute>} />
        {/* Sprint 16C — AI Copilot */}
        <Route path="/admin/ai-copilot/dashboard"       element={<AdminRoute><AdminAICopilot /></AdminRoute>} />
        <Route path="/admin/ai-copilot/chat"            element={<AdminRoute><AdminAIChat /></AdminRoute>} />
        <Route path="/admin/ai-copilot/automation"      element={<AdminRoute><AdminAutomationCenter /></AdminRoute>} />
        <Route path="/admin/ai-copilot/rules"           element={<AdminRoute><AdminCopilotRules /></AdminRoute>} />
        <Route path="/admin/ai-copilot/briefing"        element={<AdminRoute><AdminExecutiveBriefing /></AdminRoute>} />
        <Route path="/admin/ai-copilot/insights"        element={<AdminRoute><AdminAIInsights /></AdminRoute>} />
        <Route path="/admin/ai-copilot/recommendations" element={<AdminRoute><AdminRecommendationCenter /></AdminRoute>} />
        <Route path="/admin/ai-copilot/knowledge"       element={<AdminRoute><AdminKnowledgeAssistant /></AdminRoute>} />
        {/* ESS Portal */}
        <Route path="/employee/login" element={<PageWrapper><EmployeeLogin /></PageWrapper>} />
        <Route path="/employee" element={<EmployeeRoute><EmployeeLayout /></EmployeeRoute>}>
          <Route path="dashboard"     element={<ESSDashboard />} />
          <Route path="attendance"    element={<ESSMyAttendance />} />
          <Route path="leave"         element={<ESSMyLeave />} />
          <Route path="payslips"      element={<ESSMyPayroll />} />
          <Route path="performance"   element={<ESSMyPerformance />} />
          <Route path="training"      element={<ESSMyTraining />} />
          <Route path="announcements" element={<ESSAnnouncements />} />
          <Route path="recognition"   element={<ESSRecognition />} />
          <Route path="feedback"      element={<ESSFeedback />} />
        </Route>

        {/* Sprint 11C: Installation Engineer Portal (isolated auth — type:'engineer' JWT, green) */}
        <Route path="/engineer/login" element={<PageWrapper><EngineerLogin /></PageWrapper>} />
        <Route path="/engineer" element={<EngineerRoute><EngineerLayout /></EngineerRoute>}>
          <Route path="dashboard" element={<EngineerDashboard />} />
          <Route path="jobs"      element={<EngineerInstallations />} />
          <Route path="jobs/:id"  element={<EngineerInstallationDetail />} />
          <Route path="route"     element={<EngineerRoutePlaceholder />} />
          <Route path="profile"   element={<EngineerProfile />} />
        </Route>

      </Routes>
    </Suspense>
    <CookieConsent />
    <MarketingPopup />
    <OfflineBanner />
    </>
  );
}
