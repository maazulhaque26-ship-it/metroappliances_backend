const express = require('express');
const router  = express.Router();

const { protect, admin, superAdmin, moderatorOrAbove, optionalAuth } = require('../middleware/auth');
const { upload, reviewUpload, categoryUpload, singleUpload } = require('../config/cloudinary');

const auth    = require('../controllers/authController');
const product = require('../controllers/productController');
const order   = require('../controllers/orderController');
const ctrl    = require('../controllers/controllers');
const sub     = require('../controllers/subscriberController');
const whyChoose = require('../controllers/whyChooseController');
const testimonial = require('../controllers/testimonialController');
const team = require('../controllers/teamController');
const banner = require('../controllers/bannerController');
const offer = require('../controllers/homepageOfferController');
const homepageContent = require('../controllers/homepageContentController');
const achievement     = require('../controllers/achievementController');
const achievementStat = require('../controllers/achievementStatController');
const gallery         = require('../controllers/galleryController');
const blog            = require('../controllers/blogController');
const loginSlider     = require('../controllers/loginSliderController');
// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/register',                  auth.register);
router.post('/auth/login',                     auth.login);
router.post('/auth/logout',                    auth.logout);
router.get( '/auth/me',                        protect, auth.getMe);
router.put( '/auth/profile',                   protect, auth.updateProfile);
router.put( '/auth/password',                  protect, auth.changePassword);
router.post('/auth/addresses',                 protect, auth.addAddress);
router.put( '/auth/addresses/:addressId',      protect, auth.updateAddress);
router.delete('/auth/addresses/:addressId',    protect, auth.deleteAddress);

// ─── Products ─────────────────────────────────────────────────────────────────
router.get( '/products',                       product.getProducts);
router.get( '/products/brands',                product.getBrands);
router.get( '/products/slug/:slug',            product.getProductBySlug);
router.get( '/products/id/:id',                product.getProductById);
router.get( '/products/:id/related',           product.getRelatedProducts);
router.get( '/admin/products',                 protect, admin, product.getAdminProducts);
router.post('/products',                       protect, admin, upload.any(), product.createProduct);
router.put( '/products/:id',                   protect, admin, upload.any(), product.updateProduct);
router.delete('/products/:id',                 protect, admin, product.deleteProduct);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get( '/categories',                     ctrl.getCategories);
router.get( '/categories/all',                 protect, admin, ctrl.getAllCategories);
router.get( '/categories/:slug',               ctrl.getCategoryBySlug);
router.post('/categories',                     protect, admin, categoryUpload.single('image'), ctrl.createCategory);
router.put( '/categories/:id',                 protect, admin, categoryUpload.single('image'), ctrl.updateCategory);
router.delete('/categories/:id',               protect, admin, ctrl.deleteCategory);

// ─── Cart ─────────────────────────────────────────────────────────────────────
router.get(   '/cart',                         protect, ctrl.getCart);
router.post(  '/cart',                         protect, ctrl.addToCart);
router.put(   '/cart/:itemId',                 protect, ctrl.updateCartItem);
router.delete('/cart/:itemId',                 protect, ctrl.removeFromCart);
router.delete('/cart',                         protect, ctrl.clearCart);

// ─── Wishlist ─────────────────────────────────────────────────────────────────
router.get( '/wishlist',                       protect, ctrl.getWishlist);
router.post('/wishlist',                       protect, ctrl.toggleWishlist);

// ─── Reviews (User) ───────────────────────────────────────────────────────────
router.get(   '/products/:productId/reviews',  ctrl.getProductReviews);
router.get(   '/products/:productId/my-review',protect, ctrl.getMyReview);
router.post(  '/products/:productId/reviews',  protect, reviewUpload.fields([{ name: 'images', maxCount: 4 }, { name: 'avatar', maxCount: 1 }]), ctrl.addReview);
router.put(   '/reviews/:id',                  protect, reviewUpload.fields([{ name: 'images', maxCount: 4 }, { name: 'avatar', maxCount: 1 }]), ctrl.updateReview);
router.delete('/reviews/:id',                  protect, ctrl.deleteReview);

// ─── Reviews (Admin / Moderator) ──────────────────────────────────────────────
router.get(   '/admin/reviews',                protect, moderatorOrAbove, ctrl.getAllReviews);
router.put(   '/admin/reviews/:id/status',     protect, moderatorOrAbove, ctrl.updateReviewStatus);
router.delete('/admin/reviews/:id',            protect, admin,            ctrl.adminDeleteReview);

// ─── Orders ───────────────────────────────────────────────────────────────────
router.post('/orders',                         protect, order.createOrder);
router.get( '/orders/my-orders',               protect, order.getMyOrders);
router.get( '/orders/:id',                     protect, order.getOrderById);
router.put( '/orders/:id/cancel',              protect, order.cancelOrder);

// ─── Coupons ──────────────────────────────────────────────────────────────────
router.post(  '/coupons/validate',             protect, ctrl.validateCoupon);
router.get(   '/admin/coupons',                protect, admin, ctrl.getCoupons);
router.post(  '/admin/coupons',                protect, admin, ctrl.createCoupon);
router.put(   '/admin/coupons/:id',            protect, admin, ctrl.updateCoupon);
router.delete('/admin/coupons/:id',            protect, admin, ctrl.deleteCoupon);

// ─── Stripe Payment ───────────────────────────────────────────────────────────
router.post('/payment/create-intent',          protect, ctrl.createPaymentIntent);

// ─── Admin: Orders ────────────────────────────────────────────────────────────
router.get('/admin/orders',                    protect, admin, order.getAllOrders);
router.put('/admin/orders/:id/status',         protect, admin, order.updateOrderStatus);

// ─── Admin: Stats ─────────────────────────────────────────────────────────────
router.get('/admin/stats',                     protect, admin, order.getDashboardStats);

// ─── Admin: Users (customers) ─────────────────────────────────────────────────
router.get('/admin/users',                     protect, admin, ctrl.getAdminUsers);
router.put('/admin/users/:id/toggle',          protect, admin, ctrl.toggleUserStatus);

// ─── Admin: Admin Management (super_admin) ────────────────────────────────────
router.get(   '/admin/admins',                 protect, superAdmin, ctrl.getAdminList);
router.post(  '/admin/admins',                 protect, superAdmin, ctrl.createAdminUser);
router.put(   '/admin/admins/:id/role',        protect, superAdmin, ctrl.updateAdminRole);
router.put(   '/admin/admins/:id/toggle',      protect, superAdmin, ctrl.toggleAdminStatus);
router.delete('/admin/admins/:id',             protect, superAdmin, ctrl.deleteAdminUser);

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get('/settings',                        ctrl.getSettings);
router.put('/admin/settings',                  protect, admin, singleUpload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }, { name: 'transparentLogo', maxCount: 1 }, { name: 'darkLogo', maxCount: 1 }, { name: 'lightLogo', maxCount: 1 }]), ctrl.updateSettings);

// ─── Newsletter Subscribers ───────────────────────────────────────────────────
router.post(  '/newsletter/subscribe',         sub.subscribe);
router.get(   '/admin/subscribers',            protect, admin, sub.getSubscribers);
router.get(   '/admin/subscribers/export',     protect, admin, sub.exportSubscribers);
router.delete('/admin/subscribers/:id',        protect, admin, sub.deleteSubscriber);

// ─── Why Choose Metro ─────────────────────────────────────────────────────────
router.get(   '/why-choose',                   whyChoose.getWhyChoose);
router.put(   '/admin/why-choose',             protect, admin, whyChoose.updateSection);
router.post(  '/admin/why-choose/cards',       protect, admin, singleUpload.single('image'), whyChoose.addCard);
router.put(   '/admin/why-choose/cards/reorder', protect, admin, whyChoose.reorderCards);
router.put(   '/admin/why-choose/cards/:id',   protect, admin, singleUpload.single('image'), whyChoose.updateCard);
router.delete('/admin/why-choose/cards/:id',   protect, admin, whyChoose.deleteCard);

// ─── Testimonials ─────────────────────────────────────────────────────────────
router.get(   '/testimonials',                 testimonial.getApprovedTestimonials);
router.post(  '/testimonials',                 singleUpload.single('image'), testimonial.submitTestimonial);
router.get(   '/admin/testimonials',           protect, admin, testimonial.getAllTestimonials);
router.put(   '/admin/testimonials/:id/status',protect, admin, testimonial.updateTestimonialStatus);
router.delete('/admin/testimonials/:id',       protect, admin, testimonial.deleteTestimonial);

// ─── Team ─────────────────────────────────────────────────────────────────────
router.get(   '/team',                         team.getPublicTeamMembers);
router.get(   '/admin/team',                   protect, admin, team.getAdminTeamMembers);
router.post(  '/admin/team',                   protect, admin, singleUpload.single('photo'), team.createTeamMember);
router.put(   '/admin/team/:id',               protect, admin, singleUpload.single('photo'), team.updateTeamMember);
router.delete('/admin/team/:id',               protect, admin, team.deleteTeamMember);

// ─── Banners ──────────────────────────────────────────────────────────────────
router.get(   '/banners',                      banner.getBanners);
router.post(  '/admin/banners',                protect, admin, singleUpload.single('image'), banner.createBanner);
router.put(   '/admin/banners/:id',            protect, admin, singleUpload.single('image'), banner.updateBanner);
router.delete('/admin/banners/:id',            protect, admin, banner.deleteBanner);

// ─── Limited Time Offers ──────────────────────────────────────────────────────
router.get(   '/homepage-offers',              offer.getOffers);
router.post(  '/admin/offers',                 protect, admin, singleUpload.single('image'), offer.createOffer);
router.put(   '/admin/offers/:id',             protect, admin, singleUpload.single('image'), offer.updateOffer);
router.delete('/admin/offers/:id',             protect, admin, offer.deleteOffer);

// ─── Homepage Content (combined banners + offers, single fetch) ──────────────
router.get(   '/homepage-content',             homepageContent.getHomepageContent);

// ─── Image Upload (generic) ───────────────────────────────────────────────────
router.post('/upload', protect, admin, singleUpload.single('image'), ctrl.uploadImage);

// ─── Achievements ─────────────────────────────────────────────────────────────
router.get(   '/achievements',                   achievement.getAchievements);
router.get(   '/admin/achievements',             protect, admin, achievement.getAdminAchievements);
router.post(  '/admin/achievements',             protect, admin, singleUpload.single('image'), achievement.createAchievement);
router.put(   '/admin/achievements/reorder',     protect, admin, achievement.reorderAchievements);
router.put(   '/admin/achievements/:id',         protect, admin, singleUpload.single('image'), achievement.updateAchievement);
router.put(   '/admin/achievements/:id/toggle',  protect, admin, achievement.toggleAchievement);
router.delete('/admin/achievements/:id',         protect, admin, achievement.deleteAchievement);

// ─── Gallery ──────────────────────────────────────────────────────────────────
router.get(   '/gallery',                  gallery.getGallery);
router.get(   '/admin/gallery',            protect, admin, gallery.getAdminGallery);
router.post(  '/admin/gallery',            protect, admin, singleUpload.single('image'), gallery.createGalleryImage);
router.put(   '/admin/gallery/reorder',    protect, admin, gallery.reorderGallery);
router.put(   '/admin/gallery/:id',        protect, admin, singleUpload.single('image'), gallery.updateGalleryImage);
router.put(   '/admin/gallery/:id/toggle', protect, admin, gallery.toggleGalleryImage);
router.delete('/admin/gallery/:id',        protect, admin, gallery.deleteGalleryImage);

// ─── Blogs ────────────────────────────────────────────────────────────────────
router.get(   '/blogs',              blog.getBlogs);
router.get(   '/blogs/:slug',        blog.getBlogBySlug);
router.get(   '/admin/blogs',        protect, admin, blog.getAdminBlogs);
router.post(  '/admin/blogs',        protect, admin, singleUpload.single('image'), blog.createBlog);
router.put(   '/admin/blogs/:id',    protect, admin, singleUpload.single('image'), blog.updateBlog);
router.put(   '/admin/blogs/:id/toggle', protect, admin, blog.toggleBlog);
router.delete('/admin/blogs/:id',    protect, admin, blog.deleteBlog);

// ─── Achievement Stats ────────────────────────────────────────────────────────
router.get(   '/achievement-stats',                   achievementStat.getAchievementStats);
router.get(   '/admin/achievement-stats',             protect, admin, achievementStat.getAdminAchievementStats);
router.post(  '/admin/achievement-stats',             protect, admin, achievementStat.createAchievementStat);
router.put(   '/admin/achievement-stats/reorder',     protect, admin, achievementStat.reorderAchievementStats);
router.put(   '/admin/achievement-stats/:id',         protect, admin, achievementStat.updateAchievementStat);
router.put(   '/admin/achievement-stats/:id/toggle',  protect, admin, achievementStat.toggleAchievementStat);
router.delete('/admin/achievement-stats/:id',         protect, admin, achievementStat.deleteAchievementStat);

// ─── Login Page Slider ────────────────────────────────────────────────────────
router.get(   '/login-slides',                        loginSlider.getLoginSlides);
router.get(   '/admin/login-slides',                  protect, admin, loginSlider.getAdminLoginSlides);
router.post(  '/admin/login-slides',                  protect, admin, singleUpload.single('image'), loginSlider.createLoginSlide);
router.put(   '/admin/login-slides/reorder',          protect, admin, loginSlider.reorderLoginSlides);
router.put(   '/admin/login-slides/:id',              protect, admin, singleUpload.single('image'), loginSlider.updateLoginSlide);
router.put(   '/admin/login-slides/:id/toggle',       protect, admin, loginSlider.toggleLoginSlide);
router.delete('/admin/login-slides/:id',              protect, admin, loginSlider.deleteLoginSlide);

// ─── Announcement Bar (Sprint 8) ──────────────────────────────────────────────
const announcement = require('../controllers/announcementController');
router.get(   '/announcements',                  announcement.getLiveAnnouncements);
router.get(   '/admin/announcements',            protect, admin, announcement.getAll);
router.post(  '/admin/announcements',            protect, admin, announcement.create);
router.put(   '/admin/announcements/:id',        protect, admin, announcement.update);
router.put(   '/admin/announcements/:id/toggle', protect, admin, announcement.toggle);
router.delete('/admin/announcements/:id',        protect, admin, announcement.remove);

// ─── Marketing Popups (Sprint 8) ──────────────────────────────────────────────
const popup = require('../controllers/popupController');
router.get(   '/popups',                  popup.getLivePopups);
router.get(   '/admin/popups',            protect, admin, popup.getAll);
router.post(  '/admin/popups',            protect, admin, singleUpload.single('image'), popup.create);
router.put(   '/admin/popups/:id',        protect, admin, singleUpload.single('image'), popup.update);
router.put(   '/admin/popups/:id/toggle', protect, admin, popup.toggle);
router.delete('/admin/popups/:id',        protect, admin, popup.remove);

// ─── Flash Sales (Sprint 8) ───────────────────────────────────────────────────
const flashSale = require('../controllers/flashSaleController');
router.get(   '/flash-sale/active',          flashSale.getActiveSale);
router.get(   '/admin/flash-sales',          protect, admin, flashSale.getAll);
router.get(   '/admin/flash-sales/:id',      protect, admin, flashSale.getOne);
router.post(  '/admin/flash-sales',          protect, admin, flashSale.create);
router.put(   '/admin/flash-sales/:id',      protect, admin, flashSale.update);
router.put(   '/admin/flash-sales/:id/toggle', protect, admin, flashSale.toggle);
router.delete('/admin/flash-sales/:id',      protect, admin, flashSale.remove);

// ─── Promotional Sections (Sprint 8) ─────────────────────────────────────────
const promoSection = require('../controllers/promotionalSectionController');
router.get(   '/promo-sections',                      promoSection.getActiveSections);
router.get(   '/admin/promo-sections',                protect, admin, promoSection.getAll);
router.post(  '/admin/promo-sections',                protect, admin, promoSection.create);
router.put(   '/admin/promo-sections/reorder',        protect, admin, promoSection.reorder);
router.put(   '/admin/promo-sections/:id',            protect, admin, promoSection.update);
router.put(   '/admin/promo-sections/:id/toggle',     protect, admin, promoSection.toggle);
router.delete('/admin/promo-sections/:id',            protect, admin, promoSection.remove);

// ─── Campaign Manager (Sprint 8) ──────────────────────────────────────────────
const campaign = require('../controllers/campaignController');
router.get(   '/campaigns',                  campaign.getActiveCampaigns);
router.get(   '/admin/campaigns',            protect, admin, campaign.getAll);
router.post(  '/admin/campaigns',            protect, admin, singleUpload.single('banner'), campaign.create);
router.put(   '/admin/campaigns/:id',        protect, admin, singleUpload.single('banner'), campaign.update);
router.put(   '/admin/campaigns/:id/toggle', protect, admin, campaign.toggle);
router.delete('/admin/campaigns/:id',        protect, admin, campaign.remove);

// ─── Notifications (Sprint 8) ─────────────────────────────────────────────────
const notif = require('../controllers/notificationController');
router.get(   '/notifications',              protect, notif.getMyNotifications);
router.put(   '/notifications/:id/read',     protect, notif.markRead);
router.put(   '/notifications/read-all',     protect, notif.markAllRead);
router.get(   '/admin/notifications',        protect, admin, notif.getAll);
router.post(  '/admin/notifications/broadcast', protect, admin, notif.broadcast);
router.delete('/admin/notifications/:id',    protect, admin, notif.remove);

// ─── Dealer Portal — Sprint 9A ────────────────────────────────────────────────
// Completely isolated from customer auth. Dealer JWT has type:'dealer' payload.
const dealerAuth = require('../controllers/dealerAuthController');
const dealer     = require('../controllers/dealerController');
const { protectDealer } = require('../middleware/dealerAuth');
const { dealerUpload }  = require('../config/cloudinary');

// Public dealer auth (rate-limited in server.js)
router.post('/dealer/auth/register',              dealerAuth.register);
router.post('/dealer/auth/login',                 dealerAuth.login);
router.post('/dealer/auth/logout',                dealerAuth.logout);
router.post('/dealer/auth/forgot-password',       dealerAuth.forgotPassword);
router.put( '/dealer/auth/reset-password/:token', dealerAuth.resetPassword);

// Protected dealer self-service
router.get( '/dealer/auth/me',              protectDealer, dealerAuth.getMe);
router.put( '/dealer/auth/profile',         protectDealer, dealerAuth.updateProfile);
router.put( '/dealer/auth/change-password', protectDealer, dealerAuth.changePassword);
router.post('/dealer/documents/:docType',   protectDealer, dealerUpload.single('file'), dealerAuth.uploadDocument);

// Admin: Dealer management (uses existing admin auth — no changes to protect/admin middleware)
router.get(   '/admin/dealers',               protect, admin, dealer.getDealers);
router.get(   '/admin/dealers/stats',         protect, admin, dealer.getDealerStats);
router.get(   '/admin/dealers/:id',           protect, admin, dealer.getDealerById);
router.put(   '/admin/dealers/:id/approve',   protect, admin, dealer.approveDealer);
router.put(   '/admin/dealers/:id/reject',    protect, admin, dealer.rejectDealer);
router.put(   '/admin/dealers/:id/suspend',   protect, admin, dealer.suspendDealer);
router.put(   '/admin/dealers/:id/activate',  protect, admin, dealer.activateDealer);
router.put(   '/admin/dealers/:id/remarks',   protect, admin, dealer.updateRemarks);
router.delete('/admin/dealers/:id',           protect, admin, dealer.softDeleteDealer);

// ─── Dealer Portal — Sprint 9B ────────────────────────────────────────────────
const dealerDashboard    = require('../controllers/dealerDashboardController');
const dealerProduct      = require('../controllers/dealerProductController');
const dealerCart         = require('../controllers/dealerCartController');
const dealerOrder        = require('../controllers/dealerOrderController');
const dealerNotif        = require('../controllers/dealerNotificationController');
const dealerPricingAdmin = require('../controllers/dealerPricingAdminController');
const { requireApproved } = require('../middleware/dealerAuth');

// Dealer dashboard (requires login, not approval check — shows status to pending dealers too)
router.get('/dealer/dashboard', protectDealer, dealerDashboard.getDashboard);

// Dealer product catalog (requires approved)
router.get('/dealer/products/filters',  protectDealer, requireApproved, dealerProduct.getDealerProductFilters);
router.get('/dealer/products',          protectDealer, requireApproved, dealerProduct.getDealerProducts);
router.get('/dealer/products/:slug',    protectDealer, requireApproved, dealerProduct.getDealerProductBySlug);

// Dealer cart (requires approved)
router.get(   '/dealer/cart',           protectDealer, requireApproved, dealerCart.getCart);
router.post(  '/dealer/cart',           protectDealer, requireApproved, dealerCart.addToCart);
router.put(   '/dealer/cart/:itemId',   protectDealer, requireApproved, dealerCart.updateCartItem);
router.delete('/dealer/cart/:itemId',   protectDealer, requireApproved, dealerCart.removeFromCart);
router.delete('/dealer/cart',           protectDealer, requireApproved, dealerCart.clearCart);

// Dealer orders (requires approved)
router.post('/dealer/orders',                protectDealer, requireApproved, dealerOrder.createOrder);
router.get( '/dealer/orders',                protectDealer, requireApproved, dealerOrder.getMyOrders);
router.get( '/dealer/orders/:id',            protectDealer, requireApproved, dealerOrder.getOrderById);
router.post('/dealer/orders/:id/cancel',     protectDealer, requireApproved, dealerOrder.cancelOrder);

// Dealer notifications (requires login only, not approval)
router.get('/dealer/notifications',                  protectDealer, dealerNotif.getMyNotifications);
router.get('/dealer/notifications/unread-count',     protectDealer, dealerNotif.getUnreadCount);
router.put('/dealer/notifications/mark-all-read',    protectDealer, dealerNotif.markAllRead);
router.put('/dealer/notifications/:id/read',         protectDealer, dealerNotif.markRead);

// Admin: Dealer Pricing Management
router.get(  '/admin/dealer-pricing',                  protect, admin, dealerPricingAdmin.getAllPricings);
router.get(  '/admin/dealer-pricing/:productId',       protect, admin, dealerPricingAdmin.getPricingByProduct);
router.post( '/admin/dealer-pricing',                  protect, admin, dealerPricingAdmin.upsertPricing);
router.delete('/admin/dealer-pricing/:id',             protect, admin, dealerPricingAdmin.deletePricing);
router.patch('/admin/dealer-pricing/:id/visibility',   protect, admin, dealerPricingAdmin.toggleVisibility);

// Admin: Dealer Orders
router.get( '/admin/dealer-orders',                    protect, admin, dealerOrder.getAllDealerOrders);
router.put( '/admin/dealer-orders/:id/status',         protect, admin, dealerOrder.updateOrderStatus);
router.post('/admin/dealer-orders/:id/approve',        protect, admin, dealerOrder.approveDealerOrder);
router.post('/admin/dealer-orders/bulk-approve',       protect, admin, dealerOrder.bulkApproveDealerOrders);

// Admin: Dealer Notifications broadcast
router.post('/admin/dealer-notifications/broadcast',   protect, admin, dealerNotif.broadcastToDealer);

// ─── Dealer Finance Layer — Sprint 9C ─────────────────────────────────────────
const finSummary    = require('../controllers/dealerFinanceSummaryController');
const dealerWallet  = require('../controllers/dealerWalletController');
const dealerLedger  = require('../controllers/dealerLedgerController');
const dealerInvoice = require('../controllers/dealerInvoiceController');
const dealerPayment = require('../controllers/dealerPaymentController');
const dealerCredit  = require('../controllers/dealerCreditController');

// Dealer: Finance summary (accessible to all logged-in dealers)
router.get('/dealer/finance/summary', protectDealer, finSummary.getFinanceSummary);

// Dealer: Wallet (approved only)
router.get('/dealer/finance/wallet',                      protectDealer, requireApproved, dealerWallet.getMyWallet);
router.get('/dealer/finance/wallet/transactions',         protectDealer, requireApproved, dealerWallet.getMyTransactions);

// Dealer: Ledger (approved only)
router.get('/dealer/finance/ledger',                      protectDealer, requireApproved, dealerLedger.getMyLedger);
router.get('/dealer/finance/ledger/export',               protectDealer, requireApproved, dealerLedger.exportLedger);

// Dealer: Invoices (approved only)
router.get('/dealer/finance/invoices',                    protectDealer, requireApproved, dealerInvoice.getMyInvoices);
router.get('/dealer/finance/invoices/:id',                protectDealer, requireApproved, dealerInvoice.getInvoiceById);

// Dealer: Payments (approved only)
router.get('/dealer/finance/payments',                    protectDealer, requireApproved, dealerPayment.getMyPayments);
router.get('/dealer/finance/payments/:id',                protectDealer, requireApproved, dealerPayment.getPaymentById);

// Dealer: Credit (approved only)
router.get('/dealer/finance/credit',                      protectDealer, requireApproved, dealerCredit.getMyCredit);

// Dealer: Credit Notes (approved only)
router.get('/dealer/finance/credit-notes',                protectDealer, requireApproved, dealerCredit.getMyCreditNotes);
router.get('/dealer/finance/credit-notes/:id',            protectDealer, requireApproved, dealerCredit.getCreditNoteById);

// Admin: Finance — Wallets
router.get( '/admin/dealer-finance/wallets',                    protect, admin, dealerWallet.getAllWallets);
router.get( '/admin/dealer-finance/wallets/:dealerId',          protect, admin, dealerWallet.getDealerWallet);
router.post('/admin/dealer-finance/wallets/:dealerId/topup',    protect, admin, dealerWallet.topupWallet);
router.post('/admin/dealer-finance/wallets/:dealerId/deduct',   protect, admin, dealerWallet.deductWallet);

// Admin: Finance — Ledger
router.get( '/admin/dealer-finance/ledger/:dealerId',           protect, admin, dealerLedger.getDealerLedger);
router.post('/admin/dealer-finance/ledger/:dealerId/entry',     protect, admin, dealerLedger.addManualEntry);

// Admin: Finance — Invoices
router.get( '/admin/dealer-finance/invoices',                   protect, admin, dealerInvoice.getAllInvoices);
router.get( '/admin/dealer-finance/invoices/:id',               protect, admin, dealerInvoice.getAdminInvoiceById);
router.post('/admin/dealer-finance/invoices',                   protect, admin, dealerInvoice.createInvoice);
router.put( '/admin/dealer-finance/invoices/:id/status',        protect, admin, dealerInvoice.updateInvoiceStatus);

// Admin: Finance — Payments
router.get( '/admin/dealer-finance/payments',                   protect, admin, dealerPayment.getAllPayments);
router.post('/admin/dealer-finance/payments',                   protect, admin, dealerPayment.createPayment);
router.post('/admin/dealer-finance/payments/:id/verify',        protect, admin, dealerPayment.verifyPayment);
router.post('/admin/dealer-finance/payments/:id/reject',        protect, admin, dealerPayment.rejectPayment);

// Admin: Finance — Credit
router.get( '/admin/dealer-finance/credits',                    protect, admin, dealerCredit.getAllCredits);
router.get( '/admin/dealer-finance/credits/:dealerId',          protect, admin, dealerCredit.getDealerCredit);
router.post('/admin/dealer-finance/credits/:dealerId/set',      protect, admin, dealerCredit.setCredit);
router.post('/admin/dealer-finance/credits/:dealerId/hold',     protect, admin, dealerCredit.holdCredit);
router.post('/admin/dealer-finance/credits/:dealerId/release',  protect, admin, dealerCredit.releaseCredit);

// Admin: Finance — Credit Notes
router.get( '/admin/dealer-finance/credit-notes',               protect, admin, dealerCredit.getAllCreditNotes);
router.post('/admin/dealer-finance/credit-notes',               protect, admin, dealerCredit.createCreditNote);
router.post('/admin/dealer-finance/credit-notes/:id/approve',   protect, admin, dealerCredit.approveCreditNote);
router.post('/admin/dealer-finance/credit-notes/:id/apply',     protect, admin, dealerCredit.applyCreditNote);
router.post('/admin/dealer-finance/credit-notes/:id/reject',    protect, admin, dealerCredit.rejectCreditNote);

// ─── Sales Agent Ecosystem — Sprint 9D ───────────────────────────────────────
const agentAuth    = require('../controllers/salesAgentAuthController');
const agentMgmt    = require('../controllers/salesAgentController');
const territory    = require('../controllers/territoryController');
const lead         = require('../controllers/leadController');
const visitReport  = require('../controllers/visitReportController');
const task         = require('../controllers/taskController');
const agentDash    = require('../controllers/agentDashboardController');
const assignment   = require('../controllers/assignmentController');
const { protectAgent } = require('../middleware/agentAuth');

// ── Agent auth (public) ───────────────────────────────────────────────────────
router.post('/agent/auth/login',          agentAuth.login);
router.post('/agent/auth/logout',         agentAuth.logout);

// ── Agent self-service (protected) ───────────────────────────────────────────
router.get('/agent/auth/me',              protectAgent, agentAuth.getMe);
router.put('/agent/auth/profile',         protectAgent, agentAuth.updateProfile);
router.put('/agent/auth/change-password', protectAgent, agentAuth.changePassword);

// ── Agent dashboard ───────────────────────────────────────────────────────────
router.get('/agent/dashboard',            protectAgent, agentDash.getAgentDashboard);
router.get('/agent/dealers',              protectAgent, agentDash.getAssignedDealers);

// ── Agent: Leads ──────────────────────────────────────────────────────────────
router.get(   '/agent/leads',             protectAgent, lead.getLeads);
router.post(  '/agent/leads',             protectAgent, lead.createLead);
router.get(   '/agent/leads/:id',         protectAgent, lead.getLeadById);
router.put(   '/agent/leads/:id',         protectAgent, lead.updateLead);
router.post(  '/agent/leads/:id/stage',   protectAgent, lead.changeStage);
router.post(  '/agent/leads/:id/notes',   protectAgent, lead.addNote);

// ── Agent: Visit Reports ──────────────────────────────────────────────────────
router.get(   '/agent/visits',            protectAgent, visitReport.getVisitReports);
router.post(  '/agent/visits',            protectAgent, visitReport.createVisit);
router.get(   '/agent/visits/:id',        protectAgent, visitReport.getVisitById);
router.put(   '/agent/visits/:id',        protectAgent, visitReport.updateVisit);
router.post(  '/agent/visits/:id/checkin',  protectAgent, visitReport.checkIn);
router.post(  '/agent/visits/:id/checkout', protectAgent, visitReport.checkOut);

// ── Agent: Tasks ──────────────────────────────────────────────────────────────
router.get(   '/agent/tasks',             protectAgent, task.getTasks);
router.post(  '/agent/tasks',             protectAgent, task.createTask);
router.get(   '/agent/tasks/:id',         protectAgent, task.getTaskById);
router.put(   '/agent/tasks/:id',         protectAgent, task.updateTask);
router.post(  '/agent/tasks/:id/complete',protectAgent, task.completeTask);
router.delete('/agent/tasks/:id',         protectAgent, task.deleteTask);

// ── Admin: Sales Agents ───────────────────────────────────────────────────────
router.get(   '/admin/sales-agents',               protect, admin, agentMgmt.getAgents);
router.post(  '/admin/sales-agents',               protect, admin, agentMgmt.createAgent);
router.get(   '/admin/sales-agents/:id',           protect, admin, agentMgmt.getAgentById);
router.put(   '/admin/sales-agents/:id',           protect, admin, agentMgmt.updateAgent);
router.put(   '/admin/sales-agents/:id/toggle',    protect, admin, agentMgmt.toggleAgentStatus);
router.delete('/admin/sales-agents/:id',           protect, admin, agentMgmt.deleteAgent);
router.put(   '/admin/sales-agents/:id/password',  protect, admin, agentMgmt.resetAgentPassword);

// ── Admin: Territories ────────────────────────────────────────────────────────
router.get(   '/admin/territories',                protect, admin, territory.getTerritories);
router.post(  '/admin/territories',                protect, admin, territory.createTerritory);
router.get(   '/admin/territories/:id',            protect, admin, territory.getTerritoryById);
router.put(   '/admin/territories/:id',            protect, admin, territory.updateTerritory);
router.delete('/admin/territories/:id',            protect, admin, territory.deleteTerritory);
router.post(  '/admin/territories/:id/assign-agent',  protect, admin, territory.assignAgent);
router.post(  '/admin/territories/:id/assign-dealer', protect, admin, territory.assignDealer);

// ── Admin: Leads ──────────────────────────────────────────────────────────────
router.get(   '/admin/leads',             protect, admin, lead.getLeads);
router.post(  '/admin/leads',             protect, admin, lead.createLead);
router.get(   '/admin/leads/:id',         protect, admin, lead.getLeadById);
router.put(   '/admin/leads/:id',         protect, admin, lead.updateLead);
router.post(  '/admin/leads/:id/stage',   protect, admin, lead.changeStage);
router.post(  '/admin/leads/:id/notes',   protect, admin, lead.addNote);
router.delete('/admin/leads/:id',         protect, admin, lead.deleteLead);

// ── Admin: Visit Reports ──────────────────────────────────────────────────────
router.get(   '/admin/visit-reports',     protect, admin, visitReport.getVisitReports);
router.get(   '/admin/visit-reports/:id', protect, admin, visitReport.getVisitById);
router.delete('/admin/visit-reports/:id', protect, admin, visitReport.deleteVisit);

// ── Admin: Tasks ──────────────────────────────────────────────────────────────
router.get(   '/admin/tasks',             protect, admin, task.getTasks);
router.post(  '/admin/tasks',             protect, admin, task.createTask);
router.get(   '/admin/tasks/:id',         protect, admin, task.getTaskById);
router.put(   '/admin/tasks/:id',         protect, admin, task.updateTask);
router.delete('/admin/tasks/:id',         protect, admin, task.deleteTask);

// ── Admin: Agent Assignments ──────────────────────────────────────────────────
router.get(   '/admin/assignments',                protect, admin, assignment.getAssignments);
router.post(  '/admin/assignments',                protect, admin, assignment.createAssignment);
router.post(  '/admin/assignments/:id/transfer',   protect, admin, assignment.transferAssignment);
router.put(   '/admin/assignments/:id/deactivate', protect, admin, assignment.deactivateAssignment);

// ── Sprint 9E: BI & Analytics ─────────────────────────────────────────────────
const bi     = require('../controllers/biController');
const target = require('../controllers/targetController');

router.get('/admin/bi/overview',              protect, admin, bi.getOverview);
router.get('/admin/bi/revenue',               protect, admin, bi.getRevenue);
router.get('/admin/bi/agents',                protect, admin, bi.getAgentPerformance);
router.get('/admin/bi/dealers',               protect, admin, bi.getDealerAnalytics);
router.get('/admin/bi/territories',           protect, admin, bi.getTerritoryAnalytics);
router.get('/admin/bi/leads',                 protect, admin, bi.getLeadFunnel);
router.get('/admin/bi/export/:type',          protect, admin, bi.exportData);

router.get(   '/admin/bi/targets',                  protect, admin, target.getTargets);
router.post(  '/admin/bi/targets',                  protect, admin, target.createTarget);
router.put(   '/admin/bi/targets/:id',              protect, admin, target.updateTarget);
router.delete('/admin/bi/targets/:id',              protect, admin, target.deleteTarget);
router.get(   '/admin/bi/targets/:id/achievement',  protect, admin, target.getAchievement);

// ── Sprint 10A: Warehouse Foundation ──────────────────────────────────────────
const warehouse         = require('../controllers/warehouseController');
const warehouseZone     = require('../controllers/warehouseZoneController');
const warehouseLocation = require('../controllers/warehouseLocationController');
const warehouseUser     = require('../controllers/warehouseUserController');
const warehouseSettings = require('../controllers/warehouseSettingsController');
const { protectWarehouse } = require('../middleware/warehouseAuth');

// Admin: Warehouse management
router.get(   '/admin/warehouse/dashboard',              protect, admin, warehouse.getWarehouseDashboard);
router.get(   '/admin/warehouses',                       protect, admin, warehouse.getWarehouses);
router.post(  '/admin/warehouses',                       protect, admin, warehouse.createWarehouse);
router.get(   '/admin/warehouses/:id',                   protect, admin, warehouse.getWarehouseById);
router.put(   '/admin/warehouses/:id',                   protect, admin, warehouse.updateWarehouse);
router.delete('/admin/warehouses/:id',                   protect, admin, warehouse.deleteWarehouse);

// Admin: Zones
router.get(   '/admin/warehouse-zones',                  protect, admin, warehouseZone.getZones);
router.post(  '/admin/warehouse-zones',                  protect, admin, warehouseZone.createZone);
router.get(   '/admin/warehouse-zones/:id',              protect, admin, warehouseZone.getZoneById);
router.put(   '/admin/warehouse-zones/:id',              protect, admin, warehouseZone.updateZone);
router.put(   '/admin/warehouse-zones/:id/toggle',       protect, admin, warehouseZone.toggleZone);
router.delete('/admin/warehouse-zones/:id',              protect, admin, warehouseZone.deleteZone);

// Admin: Storage locations
router.get(   '/admin/warehouse-locations',              protect, admin, warehouseLocation.getLocations);
router.post(  '/admin/warehouse-locations',              protect, admin, warehouseLocation.createLocation);
router.post(  '/admin/warehouse-locations/bulk',         protect, admin, warehouseLocation.bulkCreateLocations);
router.get(   '/admin/warehouse-locations/:id',          protect, admin, warehouseLocation.getLocationById);
router.put(   '/admin/warehouse-locations/:id',          protect, admin, warehouseLocation.updateLocation);
router.delete('/admin/warehouse-locations/:id',          protect, admin, warehouseLocation.deleteLocation);

// Admin: Warehouse users
router.get(   '/admin/warehouse-users',                  protect, admin, warehouseUser.getWarehouseUsers);
router.post(  '/admin/warehouse-users',                  protect, admin, warehouseUser.createWarehouseUser);
router.get(   '/admin/warehouse-users/:id',              protect, admin, warehouseUser.getWarehouseUserById);
router.put(   '/admin/warehouse-users/:id',              protect, admin, warehouseUser.updateWarehouseUser);
router.put(   '/admin/warehouse-users/:id/toggle',       protect, admin, warehouseUser.toggleWarehouseUserStatus);
router.delete('/admin/warehouse-users/:id',              protect, admin, warehouseUser.deleteWarehouseUser);
router.put(   '/admin/warehouse-users/:id/password',     protect, admin, warehouseUser.resetWarehouseUserPassword);

// Admin: Warehouse settings (per warehouse)
router.get(   '/admin/warehouse-settings/:warehouseId',  protect, admin, warehouseSettings.getSettings);
router.put(   '/admin/warehouse-settings/:warehouseId',  protect, admin, warehouseSettings.updateSettings);

// Warehouse user portal (isolated auth — type:'warehouse' JWT)
router.post('/warehouse/auth/login',           warehouseUser.login);
router.post('/warehouse/auth/logout',          warehouseUser.logout);
router.get( '/warehouse/auth/me',              protectWarehouse, warehouseUser.getMe);
router.put( '/warehouse/auth/change-password', protectWarehouse, warehouseUser.changePassword);

// ── Sprint 10B: Inventory Management ─────────────────────────────────────────
const grn             = require('../controllers/grnController');
const inventory       = require('../controllers/inventoryController');
const invTxn          = require('../controllers/inventoryTransactionController');
const batch           = require('../controllers/batchController');
const serial          = require('../controllers/serialController');
const stockAdj        = require('../controllers/stockAdjustmentController');
const cycleCount      = require('../controllers/cycleCountController');
const stockRes        = require('../controllers/stockReservationController');
const { requireWarehouseRole } = require('../middleware/warehouseAuth');

// Admin: GRN
router.get(  '/admin/grn',                           protect, admin, grn.getGRNs);
router.post( '/admin/grn',                           protect, admin, grn.createGRN);
router.get(  '/admin/grn/stats',                     protect, admin, grn.getGRNStats);
router.get(  '/admin/grn/:id',                       protect, admin, grn.getGRNById);
router.put(  '/admin/grn/:id',                       protect, admin, grn.updateGRN);
router.put(  '/admin/grn/:id/submit',                protect, admin, grn.submitGRN);
router.put(  '/admin/grn/:id/start-receiving',       protect, admin, grn.startReceiving);
router.put(  '/admin/grn/:id/quality-check',         protect, admin, grn.qualityCheck);
router.put(  '/admin/grn/:id/complete',              protect, admin, grn.completeGRN);
router.put(  '/admin/grn/:id/cancel',                protect, admin, grn.cancelGRN);

// Admin: Inventory
router.get(  '/admin/inventory/dashboard',           protect, admin, inventory.getDashboard);
router.get(  '/admin/inventory/low-stock',           protect, admin, inventory.getLowStock);
router.get(  '/admin/inventory/out-of-stock',        protect, admin, inventory.getOutOfStock);
router.get(  '/admin/inventory/valuation',           protect, admin, inventory.getValuation);
router.get(  '/admin/inventory',                     protect, admin, inventory.getInventory);
router.get(  '/admin/inventory/:id',                 protect, admin, inventory.getInventoryById);
router.put(  '/admin/inventory/:id/thresholds',      protect, admin, inventory.updateThresholds);

// Admin: Inventory Transactions
router.get(  '/admin/inventory/transactions',        protect, admin, invTxn.getTransactions);
router.get(  '/admin/inventory/transactions/stock-ledger', protect, admin, invTxn.getStockLedger);
router.get(  '/admin/inventory/transactions/movement-report', protect, admin, invTxn.getMovementReport);
router.get(  '/admin/inventory/transactions/:id',    protect, admin, invTxn.getTransactionById);

// Admin: Batches
router.get(  '/admin/inventory/batches/expiring',    protect, admin, batch.getExpiringBatches);
router.get(  '/admin/inventory/batches',             protect, admin, batch.getBatches);
router.post( '/admin/inventory/batches',             protect, admin, batch.createBatch);
router.get(  '/admin/inventory/batches/:id',         protect, admin, batch.getBatchById);
router.put(  '/admin/inventory/batches/:id',         protect, admin, batch.updateBatch);

// Admin: Serial Numbers
router.get(  '/admin/inventory/serials/by-product',  protect, admin, serial.getSerialsByProduct);
router.get(  '/admin/inventory/serials',             protect, admin, serial.getSerials);
router.post( '/admin/inventory/serials',             protect, admin, serial.createSerial);
router.get(  '/admin/inventory/serials/:id',         protect, admin, serial.getSerialById);
router.put(  '/admin/inventory/serials/:id',         protect, admin, serial.updateSerial);

// Admin: Stock Adjustments
router.get(  '/admin/inventory/adjustments',         protect, admin, stockAdj.getAdjustments);
router.post( '/admin/inventory/adjustments',         protect, admin, stockAdj.createAdjustment);
router.get(  '/admin/inventory/adjustments/:id',     protect, admin, stockAdj.getAdjustmentById);
router.put(  '/admin/inventory/adjustments/:id/approve', protect, admin, stockAdj.approveAdjustment);
router.put(  '/admin/inventory/adjustments/:id/reject',  protect, admin, stockAdj.rejectAdjustment);

// Admin: Cycle Counts
router.get(  '/admin/inventory/cycle-counts',        protect, admin, cycleCount.getCycleCounts);
router.post( '/admin/inventory/cycle-counts',        protect, admin, cycleCount.createCycleCount);
router.get(  '/admin/inventory/cycle-counts/:id',    protect, admin, cycleCount.getCycleCountById);
router.put(  '/admin/inventory/cycle-counts/:id/start',    protect, admin, cycleCount.startCycleCount);
router.put(  '/admin/inventory/cycle-counts/:id/items',    protect, admin, cycleCount.updateItems);
router.put(  '/admin/inventory/cycle-counts/:id/complete', protect, admin, cycleCount.completeCycleCount);
router.put(  '/admin/inventory/cycle-counts/:id/approve',  protect, admin, cycleCount.approveCycleCount);

// Admin: Stock Reservations
router.get(  '/admin/inventory/reservations/dashboard', protect, admin, stockRes.getReservationDashboard);
router.get(  '/admin/inventory/reservations',        protect, admin, stockRes.getReservations);
router.post( '/admin/inventory/reservations',        protect, admin, stockRes.createReservation);
router.put(  '/admin/inventory/reservations/:id/release',  protect, admin, stockRes.releaseReservation);
router.put(  '/admin/inventory/reservations/:id/fulfill',  protect, admin, stockRes.fulfillReservation);

// Warehouse portal: Inventory
router.get(  '/warehouse/inventory',                 protectWarehouse, inventory.warehouseGetInventory);

// Warehouse portal: GRN
router.get(  '/warehouse/grn',                       protectWarehouse, grn.warehouseGetGRNs);
router.put(  '/warehouse/grn/:id/complete',          protectWarehouse, grn.warehouseCompleteGRN);

// Warehouse portal: Stock Adjustments
router.post( '/warehouse/adjustments',               protectWarehouse, stockAdj.warehouseCreateAdjustment);
router.get(  '/warehouse/adjustments',               protectWarehouse, stockAdj.getAdjustments);

// Warehouse portal: Cycle Counts
router.get(  '/warehouse/cycle-counts',              protectWarehouse, cycleCount.warehouseGetCycleCounts);
router.put(  '/warehouse/cycle-counts/:id/items',    protectWarehouse, cycleCount.warehouseUpdateCycleCount);

// ── Sprint 9F: Audit Log ──────────────────────────────────────────────────────
const audit    = require('../controllers/auditController');
const AuditLog = require('../models/AuditLog');

router.get('/admin/audit-logs',                          protect, admin, audit.getLogs);
router.get('/admin/audit-logs/meta',                     protect, admin, audit.getMeta);
router.get('/admin/audit-logs/entity/:entity/:entityId', protect, admin, audit.getEntityTimeline);

// Global admin mutation interceptor — fires after auth, records all non-GET admin actions.
// Wraps res.json with setImmediate so it never blocks the response to the client.
router.use('/admin', (req, res, next) => {
  if (!req.user || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (body?.success !== false) {
      setImmediate(async () => {
        try {
          const segments = req.path.replace(/^\//, '').split('/').filter(Boolean);
          const entity   = (segments[0] || 'unknown').replace(/-/g, '_');
          const action   = `${req.method}_${entity.toUpperCase()}`;
          await AuditLog.create({
            admin:       req.user._id,
            adminName:   req.user.name  || '',
            adminEmail:  req.user.email || '',
            adminRole:   req.user.role  || '',
            action,
            entity,
            entityId:    req.params.id || undefined,
            entityLabel: String(body?.data?.name || body?.data?.email || body?.data?.businessName || req.params.id || '').slice(0, 200),
            changes:     { before: null, after: body?.data || null },
            ip:          String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim().slice(0, 100),
            userAgent:   String(req.get('User-Agent') || '').slice(0, 300),
          });
        } catch (_) { /* audit errors never surface to client */ }
      });
    }
    return originalJson(body);
  };
  next();
});

module.exports = router;
