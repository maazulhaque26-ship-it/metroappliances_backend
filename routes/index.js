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
// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/auth/register',                  auth.register);
router.post('/auth/login',                     auth.login);
router.post('/auth/logout',                    auth.logout);
router.get( '/auth/me',                        protect, auth.getMe);
router.put( '/auth/profile',                   protect, auth.updateProfile);
router.put( '/auth/password',                  protect, auth.changePassword);
router.post('/auth/addresses',                 protect, auth.addAddress);
router.put( '/auth/addresses/:addressId',      protect, auth.updateAddress);
router.delete('/auth/addresses/:addressId',    protect, auth.deleteAddress);

// â”€â”€â”€ Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get( '/products',                       product.getProducts);
router.get( '/products/brands',                product.getBrands);
router.get( '/products/slug/:slug',            product.getProductBySlug);
router.get( '/products/id/:id',                product.getProductById);
router.get( '/products/:id/related',           product.getRelatedProducts);
router.get( '/admin/products',                 protect, admin, product.getAdminProducts);
router.post('/products',                       protect, admin, upload.any(), product.createProduct);
router.put( '/products/:id',                   protect, admin, upload.any(), product.updateProduct);
router.delete('/products/:id',                 protect, admin, product.deleteProduct);

// â”€â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get( '/categories',                     ctrl.getCategories);
router.get( '/categories/all',                 protect, admin, ctrl.getAllCategories);
router.get( '/categories/:slug',               ctrl.getCategoryBySlug);
router.post('/categories',                     protect, admin, categoryUpload.single('image'), ctrl.createCategory);
router.put( '/categories/:id',                 protect, admin, categoryUpload.single('image'), ctrl.updateCategory);
router.delete('/categories/:id',               protect, admin, ctrl.deleteCategory);

// â”€â”€â”€ Cart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/cart',                         protect, ctrl.getCart);
router.post(  '/cart',                         protect, ctrl.addToCart);
router.put(   '/cart/:itemId',                 protect, ctrl.updateCartItem);
router.delete('/cart/:itemId',                 protect, ctrl.removeFromCart);
router.delete('/cart',                         protect, ctrl.clearCart);

// â”€â”€â”€ Wishlist â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get( '/wishlist',                       protect, ctrl.getWishlist);
router.post('/wishlist',                       protect, ctrl.toggleWishlist);

// â”€â”€â”€ Reviews (User) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/products/:productId/reviews',  ctrl.getProductReviews);
router.get(   '/products/:productId/my-review',protect, ctrl.getMyReview);
router.post(  '/products/:productId/reviews',  protect, reviewUpload.fields([{ name: 'images', maxCount: 4 }, { name: 'avatar', maxCount: 1 }]), ctrl.addReview);
router.put(   '/reviews/:id',                  protect, reviewUpload.fields([{ name: 'images', maxCount: 4 }, { name: 'avatar', maxCount: 1 }]), ctrl.updateReview);
router.delete('/reviews/:id',                  protect, ctrl.deleteReview);

// â”€â”€â”€ Reviews (Admin / Moderator) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/reviews',                protect, moderatorOrAbove, ctrl.getAllReviews);
router.put(   '/admin/reviews/:id/status',     protect, moderatorOrAbove, ctrl.updateReviewStatus);
router.delete('/admin/reviews/:id',            protect, admin,            ctrl.adminDeleteReview);

// â”€â”€â”€ Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/orders',                         protect, order.createOrder);
router.get( '/orders/my-orders',               protect, order.getMyOrders);
router.get( '/orders/:id',                     protect, order.getOrderById);
router.put( '/orders/:id/cancel',              protect, order.cancelOrder);

// â”€â”€â”€ Coupons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post(  '/coupons/validate',             protect, ctrl.validateCoupon);
router.get(   '/admin/coupons',                protect, admin, ctrl.getCoupons);
router.post(  '/admin/coupons',                protect, admin, ctrl.createCoupon);
router.put(   '/admin/coupons/:id',            protect, admin, ctrl.updateCoupon);
router.delete('/admin/coupons/:id',            protect, admin, ctrl.deleteCoupon);

// â”€â”€â”€ Stripe Payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/payment/create-intent',          protect, ctrl.createPaymentIntent);

// â”€â”€â”€ Admin: Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/orders',                    protect, admin, order.getAllOrders);
router.put('/admin/orders/:id/status',         protect, admin, order.updateOrderStatus);

// â”€â”€â”€ Admin: Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/stats',                     protect, admin, order.getDashboardStats);

// â”€â”€â”€ Admin: Users (customers) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/users',                     protect, admin, ctrl.getAdminUsers);
router.put('/admin/users/:id/toggle',          protect, admin, ctrl.toggleUserStatus);

// â”€â”€â”€ Admin: Admin Management (super_admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/admins',                 protect, superAdmin, ctrl.getAdminList);
router.post(  '/admin/admins',                 protect, superAdmin, ctrl.createAdminUser);
router.put(   '/admin/admins/:id/role',        protect, superAdmin, ctrl.updateAdminRole);
router.put(   '/admin/admins/:id/toggle',      protect, superAdmin, ctrl.toggleAdminStatus);
router.delete('/admin/admins/:id',             protect, superAdmin, ctrl.deleteAdminUser);

// â”€â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/settings',                        ctrl.getSettings);
router.put('/admin/settings',                  protect, admin, singleUpload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }, { name: 'transparentLogo', maxCount: 1 }, { name: 'darkLogo', maxCount: 1 }, { name: 'lightLogo', maxCount: 1 }]), ctrl.updateSettings);

// â”€â”€â”€ Newsletter Subscribers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post(  '/newsletter/subscribe',         sub.subscribe);
router.get(   '/admin/subscribers',            protect, admin, sub.getSubscribers);
router.get(   '/admin/subscribers/export',     protect, admin, sub.exportSubscribers);
router.delete('/admin/subscribers/:id',        protect, admin, sub.deleteSubscriber);

// â”€â”€â”€ Why Choose Metro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/why-choose',                   whyChoose.getWhyChoose);
router.put(   '/admin/why-choose',             protect, admin, whyChoose.updateSection);
router.post(  '/admin/why-choose/cards',       protect, admin, singleUpload.single('image'), whyChoose.addCard);
router.put(   '/admin/why-choose/cards/reorder', protect, admin, whyChoose.reorderCards);
router.put(   '/admin/why-choose/cards/:id',   protect, admin, singleUpload.single('image'), whyChoose.updateCard);
router.delete('/admin/why-choose/cards/:id',   protect, admin, whyChoose.deleteCard);

// â”€â”€â”€ Testimonials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/testimonials',                 testimonial.getApprovedTestimonials);
router.post(  '/testimonials',                 singleUpload.single('image'), testimonial.submitTestimonial);
router.get(   '/admin/testimonials',           protect, admin, testimonial.getAllTestimonials);
router.put(   '/admin/testimonials/:id/status',protect, admin, testimonial.updateTestimonialStatus);
router.delete('/admin/testimonials/:id',       protect, admin, testimonial.deleteTestimonial);

// â”€â”€â”€ Team â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/team',                         team.getPublicTeamMembers);
router.get(   '/admin/team',                   protect, admin, team.getAdminTeamMembers);
router.post(  '/admin/team',                   protect, admin, singleUpload.single('photo'), team.createTeamMember);
router.put(   '/admin/team/:id',               protect, admin, singleUpload.single('photo'), team.updateTeamMember);
router.delete('/admin/team/:id',               protect, admin, team.deleteTeamMember);

// â”€â”€â”€ Banners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/banners',                      banner.getBanners);
router.post(  '/admin/banners',                protect, admin, singleUpload.single('image'), banner.createBanner);
router.put(   '/admin/banners/:id',            protect, admin, singleUpload.single('image'), banner.updateBanner);
router.delete('/admin/banners/:id',            protect, admin, banner.deleteBanner);

// â”€â”€â”€ Limited Time Offers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/homepage-offers',              offer.getOffers);
router.post(  '/admin/offers',                 protect, admin, singleUpload.single('image'), offer.createOffer);
router.put(   '/admin/offers/:id',             protect, admin, singleUpload.single('image'), offer.updateOffer);
router.delete('/admin/offers/:id',             protect, admin, offer.deleteOffer);

// â”€â”€â”€ Homepage Content (combined banners + offers, single fetch) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/homepage-content',             homepageContent.getHomepageContent);

// â”€â”€â”€ Image Upload (generic) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/upload', protect, admin, singleUpload.single('image'), ctrl.uploadImage);

// â”€â”€â”€ Achievements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/achievements',                   achievement.getAchievements);
router.get(   '/admin/achievements',             protect, admin, achievement.getAdminAchievements);
router.post(  '/admin/achievements',             protect, admin, singleUpload.single('image'), achievement.createAchievement);
router.put(   '/admin/achievements/reorder',     protect, admin, achievement.reorderAchievements);
router.put(   '/admin/achievements/:id',         protect, admin, singleUpload.single('image'), achievement.updateAchievement);
router.put(   '/admin/achievements/:id/toggle',  protect, admin, achievement.toggleAchievement);
router.delete('/admin/achievements/:id',         protect, admin, achievement.deleteAchievement);

// â”€â”€â”€ Gallery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/gallery',                  gallery.getGallery);
router.get(   '/admin/gallery',            protect, admin, gallery.getAdminGallery);
router.post(  '/admin/gallery',            protect, admin, singleUpload.single('image'), gallery.createGalleryImage);
router.put(   '/admin/gallery/reorder',    protect, admin, gallery.reorderGallery);
router.put(   '/admin/gallery/:id',        protect, admin, singleUpload.single('image'), gallery.updateGalleryImage);
router.put(   '/admin/gallery/:id/toggle', protect, admin, gallery.toggleGalleryImage);
router.delete('/admin/gallery/:id',        protect, admin, gallery.deleteGalleryImage);

// â”€â”€â”€ Blogs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/blogs',              blog.getBlogs);
router.get(   '/blogs/:slug',        blog.getBlogBySlug);
router.get(   '/admin/blogs',        protect, admin, blog.getAdminBlogs);
router.post(  '/admin/blogs',        protect, admin, singleUpload.single('image'), blog.createBlog);
router.put(   '/admin/blogs/:id',    protect, admin, singleUpload.single('image'), blog.updateBlog);
router.put(   '/admin/blogs/:id/toggle', protect, admin, blog.toggleBlog);
router.delete('/admin/blogs/:id',    protect, admin, blog.deleteBlog);

// â”€â”€â”€ Achievement Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/achievement-stats',                   achievementStat.getAchievementStats);
router.get(   '/admin/achievement-stats',             protect, admin, achievementStat.getAdminAchievementStats);
router.post(  '/admin/achievement-stats',             protect, admin, achievementStat.createAchievementStat);
router.put(   '/admin/achievement-stats/reorder',     protect, admin, achievementStat.reorderAchievementStats);
router.put(   '/admin/achievement-stats/:id',         protect, admin, achievementStat.updateAchievementStat);
router.put(   '/admin/achievement-stats/:id/toggle',  protect, admin, achievementStat.toggleAchievementStat);
router.delete('/admin/achievement-stats/:id',         protect, admin, achievementStat.deleteAchievementStat);

// â”€â”€â”€ Login Page Slider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/login-slides',                        loginSlider.getLoginSlides);
router.get(   '/admin/login-slides',                  protect, admin, loginSlider.getAdminLoginSlides);
router.post(  '/admin/login-slides',                  protect, admin, singleUpload.single('image'), loginSlider.createLoginSlide);
router.put(   '/admin/login-slides/reorder',          protect, admin, loginSlider.reorderLoginSlides);
router.put(   '/admin/login-slides/:id',              protect, admin, singleUpload.single('image'), loginSlider.updateLoginSlide);
router.put(   '/admin/login-slides/:id/toggle',       protect, admin, loginSlider.toggleLoginSlide);
router.delete('/admin/login-slides/:id',              protect, admin, loginSlider.deleteLoginSlide);

// â”€â”€â”€ Announcement Bar (Sprint 8) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const announcement = require('../controllers/announcementController');
router.get(   '/announcements',                  announcement.getLiveAnnouncements);
router.get(   '/admin/announcements',            protect, admin, announcement.getAll);
router.post(  '/admin/announcements',            protect, admin, announcement.create);
router.put(   '/admin/announcements/:id',        protect, admin, announcement.update);
router.put(   '/admin/announcements/:id/toggle', protect, admin, announcement.toggle);
router.delete('/admin/announcements/:id',        protect, admin, announcement.remove);

// â”€â”€â”€ Marketing Popups (Sprint 8) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const popup = require('../controllers/popupController');
router.get(   '/popups',                  popup.getLivePopups);
router.get(   '/admin/popups',            protect, admin, popup.getAll);
router.post(  '/admin/popups',            protect, admin, singleUpload.single('image'), popup.create);
router.put(   '/admin/popups/:id',        protect, admin, singleUpload.single('image'), popup.update);
router.put(   '/admin/popups/:id/toggle', protect, admin, popup.toggle);
router.delete('/admin/popups/:id',        protect, admin, popup.remove);

// â”€â”€â”€ Flash Sales (Sprint 8) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const flashSale = require('../controllers/flashSaleController');
router.get(   '/flash-sale/active',          flashSale.getActiveSale);
router.get(   '/admin/flash-sales',          protect, admin, flashSale.getAll);
router.get(   '/admin/flash-sales/:id',      protect, admin, flashSale.getOne);
router.post(  '/admin/flash-sales',          protect, admin, flashSale.create);
router.put(   '/admin/flash-sales/:id',      protect, admin, flashSale.update);
router.put(   '/admin/flash-sales/:id/toggle', protect, admin, flashSale.toggle);
router.delete('/admin/flash-sales/:id',      protect, admin, flashSale.remove);

// â”€â”€â”€ Promotional Sections (Sprint 8) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const promoSection = require('../controllers/promotionalSectionController');
router.get(   '/promo-sections',                      promoSection.getActiveSections);
router.get(   '/admin/promo-sections',                protect, admin, promoSection.getAll);
router.post(  '/admin/promo-sections',                protect, admin, promoSection.create);
router.put(   '/admin/promo-sections/reorder',        protect, admin, promoSection.reorder);
router.put(   '/admin/promo-sections/:id',            protect, admin, promoSection.update);
router.put(   '/admin/promo-sections/:id/toggle',     protect, admin, promoSection.toggle);
router.delete('/admin/promo-sections/:id',            protect, admin, promoSection.remove);

// â”€â”€â”€ Campaign Manager (Sprint 8) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const campaign = require('../controllers/campaignController');
router.get(   '/campaigns',                  campaign.getActiveCampaigns);
router.get(   '/admin/campaigns',            protect, admin, campaign.getAll);
router.post(  '/admin/campaigns',            protect, admin, singleUpload.single('banner'), campaign.create);
router.put(   '/admin/campaigns/:id',        protect, admin, singleUpload.single('banner'), campaign.update);
router.put(   '/admin/campaigns/:id/toggle', protect, admin, campaign.toggle);
router.delete('/admin/campaigns/:id',        protect, admin, campaign.remove);

// â”€â”€â”€ Notifications (Sprint 8) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const notif = require('../controllers/notificationController');
router.get(   '/notifications',              protect, notif.getMyNotifications);
router.put(   '/notifications/:id/read',     protect, notif.markRead);
router.put(   '/notifications/read-all',     protect, notif.markAllRead);
router.get(   '/admin/notifications',        protect, admin, notif.getAll);
router.post(  '/admin/notifications/broadcast', protect, admin, notif.broadcast);
router.delete('/admin/notifications/:id',    protect, admin, notif.remove);

// â”€â”€â”€ Dealer Portal â€” Sprint 9A â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// Admin: Dealer management (uses existing admin auth â€” no changes to protect/admin middleware)
router.get(   '/admin/dealers',               protect, admin, dealer.getDealers);
router.get(   '/admin/dealers/stats',         protect, admin, dealer.getDealerStats);
router.get(   '/admin/dealers/:id',           protect, admin, dealer.getDealerById);
router.put(   '/admin/dealers/:id/approve',   protect, admin, dealer.approveDealer);
router.put(   '/admin/dealers/:id/reject',    protect, admin, dealer.rejectDealer);
router.put(   '/admin/dealers/:id/suspend',   protect, admin, dealer.suspendDealer);
router.put(   '/admin/dealers/:id/activate',  protect, admin, dealer.activateDealer);
router.put(   '/admin/dealers/:id/remarks',   protect, admin, dealer.updateRemarks);
router.delete('/admin/dealers/:id',           protect, admin, dealer.softDeleteDealer);

// â”€â”€â”€ Dealer Portal â€” Sprint 9B â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const dealerDashboard    = require('../controllers/dealerDashboardController');
const dealerProduct      = require('../controllers/dealerProductController');
const dealerCart         = require('../controllers/dealerCartController');
const dealerOrder        = require('../controllers/dealerOrderController');
const dealerNotif        = require('../controllers/dealerNotificationController');
const dealerPricingAdmin = require('../controllers/dealerPricingAdminController');
const { requireApproved } = require('../middleware/dealerAuth');

// Dealer dashboard (requires login, not approval check â€” shows status to pending dealers too)
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

// â”€â”€â”€ Dealer Finance Layer â€” Sprint 9C â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// Admin: Finance â€” Wallets
router.get( '/admin/dealer-finance/wallets',                    protect, admin, dealerWallet.getAllWallets);
router.get( '/admin/dealer-finance/wallets/:dealerId',          protect, admin, dealerWallet.getDealerWallet);
router.post('/admin/dealer-finance/wallets/:dealerId/topup',    protect, admin, dealerWallet.topupWallet);
router.post('/admin/dealer-finance/wallets/:dealerId/deduct',   protect, admin, dealerWallet.deductWallet);

// Admin: Finance â€” Ledger
router.get( '/admin/dealer-finance/ledger/:dealerId',           protect, admin, dealerLedger.getDealerLedger);
router.post('/admin/dealer-finance/ledger/:dealerId/entry',     protect, admin, dealerLedger.addManualEntry);

// Admin: Finance â€” Invoices
router.get( '/admin/dealer-finance/invoices',                   protect, admin, dealerInvoice.getAllInvoices);
router.get( '/admin/dealer-finance/invoices/:id',               protect, admin, dealerInvoice.getAdminInvoiceById);
router.post('/admin/dealer-finance/invoices',                   protect, admin, dealerInvoice.createInvoice);
router.put( '/admin/dealer-finance/invoices/:id/status',        protect, admin, dealerInvoice.updateInvoiceStatus);

// Admin: Finance â€” Payments
router.get( '/admin/dealer-finance/payments',                   protect, admin, dealerPayment.getAllPayments);
router.post('/admin/dealer-finance/payments',                   protect, admin, dealerPayment.createPayment);
router.post('/admin/dealer-finance/payments/:id/verify',        protect, admin, dealerPayment.verifyPayment);
router.post('/admin/dealer-finance/payments/:id/reject',        protect, admin, dealerPayment.rejectPayment);

// Admin: Finance â€” Credit
router.get( '/admin/dealer-finance/credits',                    protect, admin, dealerCredit.getAllCredits);
router.get( '/admin/dealer-finance/credits/:dealerId',          protect, admin, dealerCredit.getDealerCredit);
router.post('/admin/dealer-finance/credits/:dealerId/set',      protect, admin, dealerCredit.setCredit);
router.post('/admin/dealer-finance/credits/:dealerId/hold',     protect, admin, dealerCredit.holdCredit);
router.post('/admin/dealer-finance/credits/:dealerId/release',  protect, admin, dealerCredit.releaseCredit);

// Admin: Finance â€” Credit Notes
router.get( '/admin/dealer-finance/credit-notes',               protect, admin, dealerCredit.getAllCreditNotes);
router.post('/admin/dealer-finance/credit-notes',               protect, admin, dealerCredit.createCreditNote);
router.post('/admin/dealer-finance/credit-notes/:id/approve',   protect, admin, dealerCredit.approveCreditNote);
router.post('/admin/dealer-finance/credit-notes/:id/apply',     protect, admin, dealerCredit.applyCreditNote);
router.post('/admin/dealer-finance/credit-notes/:id/reject',    protect, admin, dealerCredit.rejectCreditNote);

// â”€â”€â”€ Sales Agent Ecosystem â€” Sprint 9D â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const agentAuth    = require('../controllers/salesAgentAuthController');
const agentMgmt    = require('../controllers/salesAgentController');
const territory    = require('../controllers/territoryController');
const lead         = require('../controllers/leadController');
const visitReport  = require('../controllers/visitReportController');
const task         = require('../controllers/taskController');
const agentDash    = require('../controllers/agentDashboardController');
const assignment   = require('../controllers/assignmentController');
const { protectAgent } = require('../middleware/agentAuth');

// â”€â”€ Agent auth (public) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/agent/auth/login',          agentAuth.login);
router.post('/agent/auth/logout',         agentAuth.logout);

// â”€â”€ Agent self-service (protected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/agent/auth/me',              protectAgent, agentAuth.getMe);
router.put('/agent/auth/profile',         protectAgent, agentAuth.updateProfile);
router.put('/agent/auth/change-password', protectAgent, agentAuth.changePassword);

// â”€â”€ Agent dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/agent/dashboard',            protectAgent, agentDash.getAgentDashboard);
router.get('/agent/dealers',              protectAgent, agentDash.getAssignedDealers);

// â”€â”€ Agent: Leads â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/agent/leads',             protectAgent, lead.getLeads);
router.post(  '/agent/leads',             protectAgent, lead.createLead);
router.get(   '/agent/leads/:id',         protectAgent, lead.getLeadById);
router.put(   '/agent/leads/:id',         protectAgent, lead.updateLead);
router.post(  '/agent/leads/:id/stage',   protectAgent, lead.changeStage);
router.post(  '/agent/leads/:id/notes',   protectAgent, lead.addNote);

// â”€â”€ Agent: Visit Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/agent/visits',            protectAgent, visitReport.getVisitReports);
router.post(  '/agent/visits',            protectAgent, visitReport.createVisit);
router.get(   '/agent/visits/:id',        protectAgent, visitReport.getVisitById);
router.put(   '/agent/visits/:id',        protectAgent, visitReport.updateVisit);
router.post(  '/agent/visits/:id/checkin',  protectAgent, visitReport.checkIn);
router.post(  '/agent/visits/:id/checkout', protectAgent, visitReport.checkOut);

// â”€â”€ Agent: Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/agent/tasks',             protectAgent, task.getTasks);
router.post(  '/agent/tasks',             protectAgent, task.createTask);
router.get(   '/agent/tasks/:id',         protectAgent, task.getTaskById);
router.put(   '/agent/tasks/:id',         protectAgent, task.updateTask);
router.post(  '/agent/tasks/:id/complete',protectAgent, task.completeTask);
router.delete('/agent/tasks/:id',         protectAgent, task.deleteTask);

// â”€â”€ Admin: Sales Agents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/sales-agents',               protect, admin, agentMgmt.getAgents);
router.post(  '/admin/sales-agents',               protect, admin, agentMgmt.createAgent);
router.get(   '/admin/sales-agents/:id',           protect, admin, agentMgmt.getAgentById);
router.put(   '/admin/sales-agents/:id',           protect, admin, agentMgmt.updateAgent);
router.put(   '/admin/sales-agents/:id/toggle',    protect, admin, agentMgmt.toggleAgentStatus);
router.delete('/admin/sales-agents/:id',           protect, admin, agentMgmt.deleteAgent);
router.put(   '/admin/sales-agents/:id/password',  protect, admin, agentMgmt.resetAgentPassword);

// â”€â”€ Admin: Territories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/territories',                protect, admin, territory.getTerritories);
router.post(  '/admin/territories',                protect, admin, territory.createTerritory);
router.get(   '/admin/territories/:id',            protect, admin, territory.getTerritoryById);
router.put(   '/admin/territories/:id',            protect, admin, territory.updateTerritory);
router.delete('/admin/territories/:id',            protect, admin, territory.deleteTerritory);
router.post(  '/admin/territories/:id/assign-agent',  protect, admin, territory.assignAgent);
router.post(  '/admin/territories/:id/assign-dealer', protect, admin, territory.assignDealer);

// â”€â”€ Admin: Leads â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/leads',             protect, admin, lead.getLeads);
router.post(  '/admin/leads',             protect, admin, lead.createLead);
router.get(   '/admin/leads/:id',         protect, admin, lead.getLeadById);
router.put(   '/admin/leads/:id',         protect, admin, lead.updateLead);
router.post(  '/admin/leads/:id/stage',   protect, admin, lead.changeStage);
router.post(  '/admin/leads/:id/notes',   protect, admin, lead.addNote);
router.delete('/admin/leads/:id',         protect, admin, lead.deleteLead);

// â”€â”€ Admin: Visit Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/visit-reports',     protect, admin, visitReport.getVisitReports);
router.get(   '/admin/visit-reports/:id', protect, admin, visitReport.getVisitById);
router.delete('/admin/visit-reports/:id', protect, admin, visitReport.deleteVisit);

// â”€â”€ Admin: Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/tasks',             protect, admin, task.getTasks);
router.post(  '/admin/tasks',             protect, admin, task.createTask);
router.get(   '/admin/tasks/:id',         protect, admin, task.getTaskById);
router.put(   '/admin/tasks/:id',         protect, admin, task.updateTask);
router.delete('/admin/tasks/:id',         protect, admin, task.deleteTask);

// â”€â”€ Admin: Agent Assignments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/assignments',                protect, admin, assignment.getAssignments);
router.post(  '/admin/assignments',                protect, admin, assignment.createAssignment);
router.post(  '/admin/assignments/:id/transfer',   protect, admin, assignment.transferAssignment);
router.put(   '/admin/assignments/:id/deactivate', protect, admin, assignment.deactivateAssignment);

// â”€â”€ Sprint 9E: BI & Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Sprint 10A: Warehouse Foundation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// Warehouse user portal (isolated auth â€” type:'warehouse' JWT)
router.post('/warehouse/auth/login',           warehouseUser.login);
router.post('/warehouse/auth/logout',          warehouseUser.logout);
router.get( '/warehouse/auth/me',              protectWarehouse, warehouseUser.getMe);
router.put( '/warehouse/auth/change-password', protectWarehouse, warehouseUser.changePassword);

// â”€â”€ Sprint 10B: Inventory Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Sprint 10C: Procurement & Vendor Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const vendorCtrl    = require('../controllers/vendorController');
const supplierAuth  = require('../controllers/supplierAuthController');
const prCtrl        = require('../controllers/purchaseRequisitionController');
const rfqCtrl       = require('../controllers/rfqController');
const poCtrl        = require('../controllers/purchaseOrderController');
const procDash      = require('../controllers/procurementDashboardController');
const procReport    = require('../controllers/procurementReportController');
const supplierPortal = require('../controllers/supplierPortalController');
const { protectSupplier } = require('../middleware/supplierAuth');

// Admin â€” Vendor Management
router.get(  '/admin/vendors',                           protect, admin, vendorCtrl.getVendors);
router.post( '/admin/vendors',                           protect, admin, vendorCtrl.createVendor);
router.get(  '/admin/vendors/dashboard',                 protect, admin, procDash.getDashboard);
router.get(  '/admin/vendors/approval-queue',            protect, admin, procDash.getApprovalQueue);
router.get(  '/admin/vendors/:id',                       protect, admin, vendorCtrl.getVendorById);
router.put(  '/admin/vendors/:id',                       protect, admin, vendorCtrl.updateVendor);
router.delete('/admin/vendors/:id',                      protect, admin, vendorCtrl.deleteVendor);
router.put(  '/admin/vendors/:id/approve',               protect, admin, vendorCtrl.approveVendor);
router.put(  '/admin/vendors/:id/blacklist',             protect, admin, vendorCtrl.blacklistVendor);
router.get(  '/admin/vendors/:id/performance',           protect, admin, vendorCtrl.getVendorPerformance);
router.post( '/admin/vendors/:id/contacts',              protect, admin, vendorCtrl.addContact);
router.post( '/admin/vendors/:id/addresses',             protect, admin, vendorCtrl.addAddress);
router.post( '/admin/vendors/:id/bank-accounts',         protect, admin, vendorCtrl.addBankAccount);
router.post( '/admin/vendors/:id/documents',             protect, admin, vendorCtrl.addDocument);
router.put(  '/admin/vendors/:id/documents/:docId/verify', protect, admin, vendorCtrl.verifyDocument);
router.post( '/admin/vendors/:id/contracts',             protect, admin, vendorCtrl.addContract);
router.post( '/admin/vendors/:id/ratings',               protect, admin, vendorCtrl.addRating);
router.post( '/admin/vendors/:id/categories',            protect, admin, vendorCtrl.addCategory);

// Admin â€” Supplier Portal Users
router.get(  '/admin/supplier-users',                    protect, admin, supplierAuth.getSupplierUsers);
router.post( '/admin/supplier-users',                    protect, admin, supplierAuth.createSupplierUser);
router.put(  '/admin/supplier-users/:userId',            protect, admin, supplierAuth.updateSupplierUser);

// Admin â€” Purchase Requisitions
router.get(  '/admin/procurement/requisitions',          protect, admin, prCtrl.getRequisitions);
router.post( '/admin/procurement/requisitions',          protect, admin, prCtrl.createRequisition);
router.get(  '/admin/procurement/requisitions/:id',      protect, admin, prCtrl.getRequisitionById);
router.put(  '/admin/procurement/requisitions/:id',      protect, admin, prCtrl.updateRequisition);
router.put(  '/admin/procurement/requisitions/:id/submit',  protect, admin, prCtrl.submitRequisition);
router.put(  '/admin/procurement/requisitions/:id/approve', protect, admin, prCtrl.approveRequisition);
router.put(  '/admin/procurement/requisitions/:id/reject',  protect, admin, prCtrl.rejectRequisition);
router.put(  '/admin/procurement/requisitions/:id/cancel',  protect, admin, prCtrl.cancelRequisition);

// Admin â€” RFQ
router.get(  '/admin/procurement/rfq',                   protect, admin, rfqCtrl.getRFQs);
router.post( '/admin/procurement/rfq',                   protect, admin, rfqCtrl.createRFQ);
router.get(  '/admin/procurement/rfq/:id',               protect, admin, rfqCtrl.getRFQById);
router.put(  '/admin/procurement/rfq/:id',               protect, admin, rfqCtrl.updateRFQ);
router.put(  '/admin/procurement/rfq/:id/publish',       protect, admin, rfqCtrl.publishRFQ);
router.put(  '/admin/procurement/rfq/:id/close',         protect, admin, rfqCtrl.closeRFQ);
router.put(  '/admin/procurement/rfq/:id/cancel',        protect, admin, rfqCtrl.cancelRFQ);
router.put(  '/admin/procurement/rfq/:id/award/:vendorId', protect, admin, rfqCtrl.awardRFQ);
router.put(  '/admin/procurement/rfq/:id/quotations/:vendorId', protect, admin, rfqCtrl.recordQuotation);

// Admin â€” Purchase Orders
router.get(  '/admin/procurement/orders',                protect, admin, poCtrl.getPOs);
router.post( '/admin/procurement/orders',                protect, admin, poCtrl.createPO);
router.get(  '/admin/procurement/orders/:id',            protect, admin, poCtrl.getPOById);
router.put(  '/admin/procurement/orders/:id',            protect, admin, poCtrl.updatePO);
router.put(  '/admin/procurement/orders/:id/submit',     protect, admin, poCtrl.submitPO);
router.put(  '/admin/procurement/orders/:id/approve',    protect, admin, poCtrl.approvePO);
router.put(  '/admin/procurement/orders/:id/reject',     protect, admin, poCtrl.rejectPO);
router.put(  '/admin/procurement/orders/:id/release',    protect, admin, poCtrl.releasePO);
router.put(  '/admin/procurement/orders/:id/send',       protect, admin, poCtrl.sendPO);
router.put(  '/admin/procurement/orders/:id/cancel',     protect, admin, poCtrl.cancelPO);
router.put(  '/admin/procurement/orders/:id/complete',   protect, admin, poCtrl.completePO);

// Admin â€” Procurement Reports
router.get(  '/admin/procurement/reports/spend',             protect, admin, procReport.getSpendReport);
router.get(  '/admin/procurement/reports/vendor-performance',protect, admin, procReport.getVendorPerformanceReport);
router.get(  '/admin/procurement/reports/open-orders',       protect, admin, procReport.getOpenOrdersReport);
router.get(  '/admin/procurement/reports/delivery-delays',   protect, admin, procReport.getDeliveryDelaysReport);
router.get(  '/admin/procurement/reports/supplier-ratings',  protect, admin, procReport.getSupplierRatingsReport);

// Supplier Portal â€” Auth (public)
router.post( '/supplier/auth/login',                     supplierAuth.login);
router.post( '/supplier/auth/logout',                    supplierAuth.logout);
router.get(  '/supplier/auth/me',                        protectSupplier, supplierAuth.me);

// Supplier Portal â€” Dashboard
router.get(  '/supplier/dashboard',                      protectSupplier, supplierPortal.getDashboard);

// Supplier Portal â€” Purchase Orders
router.get(  '/supplier/orders',                         protectSupplier, supplierPortal.getMyOrders);
router.get(  '/supplier/orders/:id',                     protectSupplier, supplierPortal.getOrderDetail);
router.put(  '/supplier/orders/:id/acknowledge',         protectSupplier, supplierPortal.acknowledgeOrder);
router.put(  '/supplier/orders/:id/accept',              protectSupplier, supplierPortal.acceptOrder);
router.put(  '/supplier/orders/:id/reject',              protectSupplier, supplierPortal.rejectOrder);

// Supplier Portal â€” RFQ
router.get(  '/supplier/rfq',                            protectSupplier, supplierPortal.getMyRFQs);
router.put(  '/supplier/rfq/:id/quote',                  protectSupplier, rfqCtrl.supplierSubmitQuote);

// Supplier Portal â€” Profile
router.get(  '/supplier/profile',                        protectSupplier, supplierPortal.getProfile);
router.put(  '/supplier/profile',                        protectSupplier, supplierPortal.updateProfile);

// â”€â”€ Sprint 9F: Audit Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const audit    = require('../controllers/auditController');
const AuditLog = require('../models/AuditLog');

router.get('/admin/audit-logs',                          protect, admin, audit.getLogs);
router.get('/admin/audit-logs/meta',                     protect, admin, audit.getMeta);
router.get('/admin/audit-logs/entity/:entity/:entityId', protect, admin, audit.getEntityTimeline);

// Global admin mutation interceptor â€” fires after auth, records all non-GET admin actions.
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

// â”€â”€ Sprint 10D: Enterprise Dispatch & Logistics Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const dispatch        = require('../controllers/dispatchController');
const shipment        = require('../controllers/shipmentController');
const stockTransfer   = require('../controllers/stockTransferController');
const challan         = require('../controllers/deliveryChallanController');
const logisticsDash   = require('../controllers/logisticsDashboardController');

// Admin â€” Logistics Dashboard & Reports
router.get(  '/admin/logistics/dashboard',              protect, admin, logisticsDash.getDashboard);
router.get(  '/admin/logistics/reports',                protect, admin, logisticsDash.getLogisticsReports);

// Admin â€” Dispatch Management
router.get(  '/admin/logistics/dispatches',             protect, admin, dispatch.listDispatches);
router.post( '/admin/logistics/dispatches',             protect, admin, dispatch.createDispatch);
router.get(  '/admin/logistics/dispatches/:id',         protect, admin, dispatch.getDispatchById);
router.put(  '/admin/logistics/dispatches/:id/assign-picker', protect, admin, dispatch.assignPicker);
router.put(  '/admin/logistics/dispatches/:id/status',  protect, admin, dispatch.updateDispatchStatus);
router.put(  '/admin/logistics/dispatches/:id/cancel',  protect, admin, dispatch.cancelDispatch);

// Admin â€” Shipment Management
router.get(  '/admin/logistics/shipments',              protect, admin, shipment.getShipments);
router.post( '/admin/logistics/shipments',              protect, admin, shipment.createShipment);
router.get(  '/admin/logistics/shipments/:id',          protect, admin, shipment.getShipmentById);
router.put(  '/admin/logistics/shipments/:id/status',   protect, admin, shipment.updateShipmentStatus);
router.post( '/admin/logistics/shipments/:id/tracking-event', protect, admin, shipment.addTrackingEvent);

// Admin â€” Courier Management
router.get(  '/admin/logistics/couriers',               protect, admin, shipment.getCouriers);
router.post( '/admin/logistics/couriers',               protect, admin, shipment.createCourier);
router.get(  '/admin/logistics/couriers/:id',           protect, admin, shipment.getCourierById);
router.put(  '/admin/logistics/couriers/:id',           protect, admin, shipment.updateCourier);
router.delete('/admin/logistics/couriers/:id',          protect, admin, shipment.deleteCourier);

// Admin â€” Stock Transfers
router.get(  '/admin/logistics/transfers',              protect, admin, stockTransfer.getTransfers);
router.post( '/admin/logistics/transfers',              protect, admin, stockTransfer.createTransfer);
router.get(  '/admin/logistics/transfers/:id',          protect, admin, stockTransfer.getTransferById);
router.put(  '/admin/logistics/transfers/:id/submit',   protect, admin, stockTransfer.submitTransfer);
router.put(  '/admin/logistics/transfers/:id/approve',  protect, admin, stockTransfer.approveTransfer);
router.put(  '/admin/logistics/transfers/:id/reject',   protect, admin, stockTransfer.rejectTransfer);
router.put(  '/admin/logistics/transfers/:id/complete', protect, admin, stockTransfer.completeTransfer);
router.put(  '/admin/logistics/transfers/:id/cancel',   protect, admin, stockTransfer.cancelTransfer);

// Admin â€” Delivery Challans
router.get(  '/admin/logistics/challans',               protect, admin, challan.getChallans);
router.post( '/admin/logistics/challans/generate',      protect, admin, challan.generateChallan);
router.get(  '/admin/logistics/challans/:id',           protect, admin, challan.getChallanById);
router.put(  '/admin/logistics/challans/:id',           protect, admin, challan.updateChallan);

// Warehouse portal â€” Picking Lists
router.get(  '/warehouse/picking-lists',                protectWarehouse, dispatch.warehouseGetPickingLists);
router.get(  '/warehouse/picking-lists/:id',            protectWarehouse, dispatch.warehouseGetPickingList);
router.put(  '/warehouse/picking-lists/:id/start',      protectWarehouse, dispatch.warehouseStartPicking);
router.put(  '/warehouse/picking-lists/:id/items',      protectWarehouse, dispatch.warehouseUpdatePickedQty);
router.put(  '/warehouse/picking-lists/:id/complete',   protectWarehouse, dispatch.warehouseCompletePicking);

// Warehouse portal â€” Packing
router.post( '/warehouse/packages',                     protectWarehouse, dispatch.warehouseCreatePackage);
router.get(  '/warehouse/dispatches/ready',             protectWarehouse, dispatch.warehouseGetReadyDispatches);

// Warehouse portal â€” Shipment Tracking
router.get(  '/warehouse/shipments',                    protectWarehouse, shipment.warehouseGetShipments);
router.get(  '/warehouse/shipments/:id/tracking',       protectWarehouse, shipment.warehouseGetShipmentTracking);

// Warehouse portal â€” Stock Transfers
router.get(  '/warehouse/transfers',                    protectWarehouse, stockTransfer.warehouseGetTransfers);
router.put(  '/warehouse/transfers/:id/ship',           protectWarehouse, stockTransfer.warehouseShipTransfer);
router.put(  '/warehouse/transfers/:id/receive',        protectWarehouse, stockTransfer.warehouseReceiveTransfer);

// â”€â”€ Sprint 10E: Barcode & Scanning Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const barcodeCtrl    = require('../controllers/barcodeController');
const scanCtrl       = require('../controllers/scanController');
const putawayCtrl    = require('../controllers/putawayController');
const warehouseMap   = require('../controllers/warehouseMapController');

// Admin â€” Barcode Engine
router.get(  '/admin/barcodes',                          protect, admin, barcodeCtrl.getBarcodes);
router.post( '/admin/barcodes/generate',                 protect, admin, barcodeCtrl.generateBarcode);
router.post( '/admin/barcodes/assign',                   protect, admin, barcodeCtrl.assignBarcode);
router.post( '/admin/barcodes/validate',                 protect, admin, barcodeCtrl.validateBarcode);
router.post( '/admin/barcodes/qr',                       protect, admin, barcodeCtrl.generateQR);
router.get(  '/admin/barcodes/stats',                    protect, admin, barcodeCtrl.getBarcodeStats);
router.get(  '/admin/barcodes/lookup/:value',            protect, admin, barcodeCtrl.lookupBarcode);
router.get(  '/admin/barcodes/entity/:entityType/:entityId', protect, admin, barcodeCtrl.getBarcodesByEntity);
router.put(  '/admin/barcodes/:id/deactivate',           protect, admin, barcodeCtrl.deactivateBarcode);
router.post( '/admin/barcodes/:id/print',                protect, admin, barcodeCtrl.recordPrint);

// Admin â€” Scanner Activity
router.get(  '/admin/scan-logs',                         protect, admin, scanCtrl.getScanLogs);
router.get(  '/admin/scan-logs/activity',                protect, admin, scanCtrl.getScanActivity);
router.get(  '/admin/scan-logs/report',                  protect, admin, scanCtrl.getScanReport);
router.post( '/admin/scan-logs/scan',                    protect, admin, scanCtrl.processScan);

// Admin â€” Warehouse Map
router.get(  '/admin/warehouse-map/:warehouseId',        protect, admin, warehouseMap.getWarehouseMapData);
router.get(  '/admin/warehouse-map/:warehouseId/search', protect, admin, warehouseMap.searchBin);
router.get(  '/admin/warehouse-map/:warehouseId/utilization', protect, admin, warehouseMap.getBinUtilizationReport);

// Admin â€” Smart Putaway
router.post( '/admin/putaway/recommend',                 protect, admin, putawayCtrl.getPutawayRecommendations);
router.post( '/admin/putaway/confirm',                   protect, admin, putawayCtrl.confirmPutaway);
router.get(  '/admin/putaway/bin/:binId',                protect, admin, putawayCtrl.getBinContents);

// Warehouse portal â€” Scanner
router.post( '/warehouse/scan',                          protectWarehouse, scanCtrl.warehouseScan);
router.get(  '/warehouse/scan-logs',                     protectWarehouse, scanCtrl.getScanLogs);

// Warehouse portal â€” Putaway
router.post( '/warehouse/putaway/recommend',             protectWarehouse, putawayCtrl.getPutawayRecommendations);
router.post( '/warehouse/putaway/confirm',               protectWarehouse, putawayCtrl.confirmPutaway);
router.get(  '/warehouse/putaway/bin/:binId',            protectWarehouse, putawayCtrl.getBinContents);

// Warehouse portal â€” Bin Lookup
router.get(  '/warehouse/bins/:warehouseId/search',      protectWarehouse, warehouseMap.searchBin);
router.get(  '/warehouse/bins/:binId/contents',          protectWarehouse, putawayCtrl.getBinContents);

// Warehouse portal â€” Barcode lookup
router.get(  '/warehouse/barcodes/lookup/:value',        protectWarehouse, barcodeCtrl.lookupBarcode);
router.post( '/warehouse/barcodes/validate',             protectWarehouse, barcodeCtrl.validateBarcode);

// Public barcode lookup (for QR code scan from product packaging â€” no auth required)
router.get(  '/barcode/lookup/:value',                   barcodeCtrl.lookupBarcode);

// â”€â”€ Sprint 10F: IoT & Industry 4.0 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const rfidCtrl         = require('../controllers/rfidController');
const deviceCtrl       = require('../controllers/deviceController');
const sensorCtrl       = require('../controllers/sensorController');
const alertCtrl        = require('../controllers/alertController');
const voiceCtrl        = require('../controllers/voicePickingController');
const replenCtrl       = require('../controllers/replenishmentController');
const liveDashCtrl     = require('../controllers/liveDashboardController');
const iotReportCtrl    = require('../controllers/iotReportController');

// Admin â€” RFID Tags
router.get(  '/admin/rfid/tags',                         protect, admin, rfidCtrl.getTags);
router.post( '/admin/rfid/tags',                         protect, admin, rfidCtrl.registerTag);
router.put(  '/admin/rfid/tags/:id/assign',              protect, admin, rfidCtrl.assignTag);
router.put(  '/admin/rfid/tags/:id/replace',             protect, admin, rfidCtrl.replaceTag);
router.get(  '/admin/rfid/tags/:id/history',             protect, admin, rfidCtrl.getRFIDHistory);

// Admin â€” RFID Readers
router.get(  '/admin/rfid/readers',                      protect, admin, rfidCtrl.getReaders);
router.post( '/admin/rfid/readers',                      protect, admin, rfidCtrl.createReader);
router.put(  '/admin/rfid/readers/:id/status',           protect, admin, rfidCtrl.updateReaderStatus);

// Admin â€” RFID Scans & Analytics
router.post( '/admin/rfid/bulk-scan',                    protect, admin, rfidCtrl.bulkScan);
router.get(  '/admin/rfid/inventory-count',              protect, admin, rfidCtrl.getInventoryCount);
router.get(  '/admin/rfid/conflicts',                    protect, admin, rfidCtrl.detectConflicts);
router.get(  '/admin/rfid/stats',                        protect, admin, rfidCtrl.getRFIDStats);

// Admin â€” Warehouse Devices
router.get(  '/admin/devices',                           protect, admin, deviceCtrl.getDevices);
router.post( '/admin/devices',                           protect, admin, deviceCtrl.registerDevice);
router.get(  '/admin/devices/stats',                     protect, admin, deviceCtrl.getDeviceStats);
router.get(  '/admin/devices/:id',                       protect, admin, deviceCtrl.getDevice);
router.put(  '/admin/devices/:id',                       protect, admin, deviceCtrl.updateDevice);
router.delete('/admin/devices/:id',                      protect, admin, deviceCtrl.deleteDevice);
router.post( '/admin/devices/:id/health',                protect, admin, deviceCtrl.recordHealth);
router.get(  '/admin/devices/:id/health-history',        protect, admin, deviceCtrl.getHealthHistory);
router.put(  '/admin/devices/:id/assign',                protect, admin, deviceCtrl.assignDevice);
router.put(  '/admin/devices/:id/unassign',              protect, admin, deviceCtrl.unassignDevice);

// Admin â€” Sensors
router.get(  '/admin/sensors',                           protect, admin, sensorCtrl.getSensors);
router.post( '/admin/sensors',                           protect, admin, sensorCtrl.registerSensor);
router.get(  '/admin/sensors/stats',                     protect, admin, sensorCtrl.getSensorStats);
router.get(  '/admin/sensors/readings',                  protect, admin, sensorCtrl.getReadings);
router.get(  '/admin/sensors/warehouse/:warehouseId/by-zone', protect, admin, sensorCtrl.getSensorsByZone);
router.put(  '/admin/sensors/:id',                       protect, admin, sensorCtrl.updateSensor);
router.post( '/admin/sensors/:id/reading',               protect, admin, sensorCtrl.recordReading);
router.get(  '/admin/sensors/:id/history',               protect, admin, sensorCtrl.getSensorHistory);
router.put(  '/admin/sensors/:id/calibrate',             protect, admin, sensorCtrl.calibrateSensor);

// Admin â€” Alerts
router.get(  '/admin/alerts',                            protect, admin, alertCtrl.getAlerts);
router.post( '/admin/alerts',                            protect, admin, alertCtrl.createAlert);
router.get(  '/admin/alerts/stats',                      protect, admin, alertCtrl.getAlertStats);
router.get(  '/admin/alerts/history',                    protect, admin, alertCtrl.getAlertHistory);
router.put(  '/admin/alerts/:id/acknowledge',            protect, admin, alertCtrl.acknowledgeAlert);
router.put(  '/admin/alerts/:id/resolve',                protect, admin, alertCtrl.resolveAlert);
router.put(  '/admin/alerts/:id/dismiss',                protect, admin, alertCtrl.dismissAlert);

// Admin â€” Voice Picking Sessions
router.get(  '/admin/voice-sessions',                    protect, admin, voiceCtrl.getSessions);
router.get(  '/admin/voice-sessions/:id',                protect, admin, voiceCtrl.getSession);
router.get(  '/admin/voice-sessions/:id/logs',           protect, admin, voiceCtrl.getSessionLogs);

// Admin â€” Replenishment
router.get(  '/admin/replenishment/tasks',               protect, admin, replenCtrl.getTasks);
router.post( '/admin/replenishment/generate',            protect, admin, replenCtrl.generateTasks);
router.get(  '/admin/replenishment/stats',               protect, admin, replenCtrl.getReplenishmentStats);
router.get(  '/admin/replenishment/recommendations',     protect, admin, replenCtrl.getRecommendations);
router.get(  '/admin/replenishment/tasks/:id',           protect, admin, replenCtrl.getTask);
router.put(  '/admin/replenishment/tasks/:id/approve',   protect, admin, replenCtrl.approveTask);
router.put(  '/admin/replenishment/tasks/:id',           protect, admin, replenCtrl.updateTask);
router.put(  '/admin/replenishment/tasks/:id/cancel',    protect, admin, replenCtrl.cancelTask);

// Admin â€” Live Dashboard
router.get(  '/admin/iot/dashboard',                     protect, admin, liveDashCtrl.getDashboardData);
router.get(  '/admin/iot/inventory-movement',            protect, admin, liveDashCtrl.getInventoryMovement);
router.get(  '/admin/iot/device-health',                 protect, admin, liveDashCtrl.getDeviceHealth);
router.get(  '/admin/iot/rfid-activity',                 protect, admin, liveDashCtrl.getRFIDActivity);
router.get(  '/admin/iot/active-alerts',                 protect, admin, liveDashCtrl.getActiveAlerts);
router.get(  '/admin/iot/queue-status',                  protect, admin, liveDashCtrl.getQueueStatus);
router.get(  '/admin/iot/occupancy',                     protect, admin, liveDashCtrl.getWarehouseOccupancy);

// Admin â€” IoT Reports
router.get(  '/admin/iot/reports/rfid-accuracy',         protect, admin, iotReportCtrl.getRFIDAccuracyReport);
router.get(  '/admin/iot/reports/efficiency',            protect, admin, iotReportCtrl.getWarehouseEfficiencyReport);
router.get(  '/admin/iot/reports/device-uptime',         protect, admin, iotReportCtrl.getDeviceUptimeReport);
router.get(  '/admin/iot/reports/alert-history',         protect, admin, iotReportCtrl.getAlertHistoryReport);
router.get(  '/admin/iot/reports/sensor-history',        protect, admin, iotReportCtrl.getSensorHistoryReport);
router.get(  '/admin/iot/reports/replenishment',         protect, admin, iotReportCtrl.getReplenishmentReport);
router.get(  '/admin/iot/reports/voice-picking',         protect, admin, iotReportCtrl.getVoicePickingReport);

// Warehouse portal â€” RFID (handheld readers send scans here)
router.post( '/warehouse/rfid/bulk-scan',                protectWarehouse, rfidCtrl.bulkScan);
router.get(  '/warehouse/rfid/tags',                     protectWarehouse, rfidCtrl.getTags);

// Warehouse portal â€” Device heartbeat
router.post( '/warehouse/devices/:id/health',            protectWarehouse, deviceCtrl.recordHealth);
router.get(  '/warehouse/devices',                       protectWarehouse, deviceCtrl.getDevices);

// Warehouse portal â€” Voice Picking
router.post( '/warehouse/voice/start',                   protectWarehouse, voiceCtrl.startSession);
router.get(  '/warehouse/voice/:id',                     protectWarehouse, voiceCtrl.getSession);
router.post( '/warehouse/voice/:id/next',                protectWarehouse, voiceCtrl.nextItem);
router.post( '/warehouse/voice/:id/confirm',             protectWarehouse, voiceCtrl.confirmPick);
router.post( '/warehouse/voice/:id/skip',                protectWarehouse, voiceCtrl.skipItem);
router.post( '/warehouse/voice/:id/repeat',              protectWarehouse, voiceCtrl.repeatInstruction);
router.post( '/warehouse/voice/:id/complete',            protectWarehouse, voiceCtrl.completeSession);

// Warehouse portal â€” Replenishment tasks
router.get(  '/warehouse/replenishment/tasks',           protectWarehouse, replenCtrl.getTasks);
router.get(  '/warehouse/replenishment/tasks/:id',       protectWarehouse, replenCtrl.getTask);

// Warehouse portal â€” Alerts
router.get(  '/warehouse/alerts',                        protectWarehouse, alertCtrl.getAlerts);

// â”€â”€â”€ Sprint 11A: After Sales Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const { protectTechnician } = require('../middleware/technicianAuth');
const techAuthCtrl    = require('../controllers/technicianAuthController');
const techCtrl        = require('../controllers/technicianController');
const srCtrl          = require('../controllers/serviceRequestController');
const warrantyCtrl    = require('../controllers/warrantyController');
const spareCtrl       = require('../controllers/sparePartController');
const dispatchCtrl    = require('../controllers/serviceDispatchController');
const svcReportCtrl   = require('../controllers/serviceReportController');
const { serviceUpload } = require('../config/cloudinary');

// Technician Auth
router.post('/technician/auth/login',                    techAuthCtrl.loginTechnician);
router.get( '/technician/auth/me',                       protectTechnician, techAuthCtrl.getTechnicianProfile);
router.put( '/technician/auth/profile',                  protectTechnician, techAuthCtrl.updateTechnicianProfile);
router.put( '/technician/auth/availability',             protectTechnician, techAuthCtrl.updateAvailability);
router.put( '/technician/auth/location',                 protectTechnician, techAuthCtrl.updateLocation);

// Technician Portal â€” Jobs
router.get( '/technician/jobs',                          protectTechnician, srCtrl.getTechnicianJobs);
router.get( '/technician/jobs/:id',                      protectTechnician, srCtrl.getTechnicianJobDetail);
router.put( '/technician/jobs/:id/status',               protectTechnician, srCtrl.updateJobStatus);
router.post('/technician/jobs/:id/photos',               protectTechnician, srCtrl.uploadJobPhotos);
router.post('/technician/jobs/:id/signature',            protectTechnician, srCtrl.saveCustomerSignature);

// Technician Portal â€” Spare Parts
router.post('/technician/parts/:id/consume',             protectTechnician, spareCtrl.consumePart);

// Admin â€” Technician Management
router.post('/admin/technicians',                        protect, admin, techCtrl.createTechnician);
router.get( '/admin/technicians',                        protect, admin, techCtrl.getTechnicians);
router.get( '/admin/technicians/stats',                  protect, admin, techCtrl.getTechnicianStats);
router.get( '/admin/technicians/:id',                    protect, admin, techCtrl.getTechnician);
router.put( '/admin/technicians/:id',                    protect, admin, techCtrl.updateTechnician);
router.delete('/admin/technicians/:id',                  protect, admin, techCtrl.deleteTechnician);
router.post('/admin/technicians/:id/reset-password',     protect, admin, techCtrl.resetTechnicianPassword);
router.post('/admin/technicians/:id/token',              protect, superAdmin, techCtrl.generateTechnicianToken);
router.get( '/admin/technicians/:id/workload',           protect, admin, techCtrl.getTechnicianWorkload);

// Admin â€” Service Requests
router.get( '/admin/service/dashboard',                  protect, admin, srCtrl.getServiceDashboard);
router.get( '/admin/service/requests',                   protect, admin, srCtrl.getServiceRequests);
router.get( '/admin/service/requests/:id',               protect, admin, srCtrl.getServiceRequest);
router.put( '/admin/service/requests/:id/status',        protect, admin, srCtrl.updateServiceRequestStatus);
router.put( '/admin/service/requests/:id/assign',        protect, admin, srCtrl.assignTechnician);
router.put( '/admin/service/requests/:id/escalate',      protect, admin, srCtrl.escalateServiceRequest);
router.post('/admin/service/requests/:id/comment',       protect, admin, srCtrl.addComment);

// Admin â€” Dispatch
router.get( '/admin/service/dispatch/board',             protect, admin, dispatchCtrl.getDispatchBoard);
router.get( '/admin/service/dispatch/:serviceRequestId/recommendations', protect, admin, dispatchCtrl.getDispatchRecommendations);
router.post('/admin/service/dispatch/:serviceRequestId/auto-assign',     protect, admin, dispatchCtrl.autoAssign);

// Admin â€” Warranty
router.post('/admin/warranty',                           protect, admin, warrantyCtrl.createWarranty);
router.get( '/admin/warranty',                           protect, admin, warrantyCtrl.getWarranties);
router.get( '/admin/warranty/stats',                     protect, admin, warrantyCtrl.getWarrantyStats);
router.get( '/admin/warranty/:id',                       protect, admin, warrantyCtrl.getWarranty);
router.put( '/admin/warranty/:id/activate',              protect, admin, warrantyCtrl.activateWarranty);
router.put( '/admin/warranty/:id/transfer',              protect, admin, warrantyCtrl.transferWarranty);
router.put( '/admin/warranty/:id/void',                  protect, admin, warrantyCtrl.voidWarranty);

// Admin â€” AMC Contracts
router.post('/admin/amc',                                protect, admin, warrantyCtrl.createAMC);
router.get( '/admin/amc',                                protect, admin, warrantyCtrl.getAMCContracts);
router.get( '/admin/amc/stats',                          protect, admin, warrantyCtrl.getAMCStats);
router.get( '/admin/amc/:id',                            protect, admin, warrantyCtrl.getAMCContract);
router.put( '/admin/amc/:id/activate',                   protect, admin, warrantyCtrl.activateAMC);
router.post('/admin/amc/:id/visit',                      protect, admin, warrantyCtrl.scheduleAMCVisit);

// Admin â€” Spare Parts
router.post('/admin/spare-parts',                        protect, admin, spareCtrl.createSparePart);
router.get( '/admin/spare-parts',                        protect, admin, spareCtrl.getSpareParts);
router.get( '/admin/spare-parts/stats',                  protect, admin, spareCtrl.getSparePartStats);
router.get( '/admin/spare-parts/categories',             protect, admin, spareCtrl.getCategories);
router.get( '/admin/spare-parts/:id',                    protect, admin, spareCtrl.getSparePart);
router.put( '/admin/spare-parts/:id',                    protect, admin, spareCtrl.updateSparePart);
router.delete('/admin/spare-parts/:id',                  protect, admin, spareCtrl.deleteSparePart);
router.put( '/admin/spare-parts/:id/stock',              protect, admin, spareCtrl.adjustStock);

// Admin â€” Service Reports
router.get( '/admin/service/reports/summary',            protect, admin, svcReportCtrl.getServiceSummaryReport);
router.get( '/admin/service/reports/technician-performance', protect, admin, svcReportCtrl.getTechnicianPerformanceReport);
router.get( '/admin/service/reports/ftfr',               protect, admin, svcReportCtrl.getFTFRReport);
router.get( '/admin/service/reports/warranty-claims',    protect, admin, svcReportCtrl.getWarrantyClaimsReport);
router.get( '/admin/service/reports/csat',               protect, admin, svcReportCtrl.getCSATReport);
router.get( '/admin/service/reports/parts-consumption',  protect, admin, svcReportCtrl.getPartsConsumptionReport);
router.get( '/admin/service/reports/sla',                protect, admin, svcReportCtrl.getSLAReport);
router.get( '/admin/service/reports/amc-revenue',        protect, admin, svcReportCtrl.getAMCRevenueReport);

// Customer â€” Service Requests
router.post('/service/requests',                         protect, srCtrl.raiseServiceRequest);
router.get( '/service/requests',                         protect, srCtrl.getMyServiceRequests);
router.get( '/service/requests/:id',                     protect, srCtrl.trackServiceRequest);
router.post('/service/requests/:id/feedback',            protect, srCtrl.submitFeedback);
router.post('/service/requests/:id/attachment',          protect, serviceUpload.single('file'), srCtrl.uploadAttachment);

// Customer â€” generic file upload (returns Cloudinary URL; used by frontend before associating)
router.post('/service/file-upload', protect, serviceUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: req.file.path, filename: req.file.originalname });
});

// Customer â€” Warranty & AMC status
router.get( '/service/warranty',                         protect, warrantyCtrl.getMyWarranties);
router.get( '/service/warranty/check/:serialNumber',     protect, warrantyCtrl.checkWarrantyBySerial);
router.get( '/service/amc',                              protect, warrantyCtrl.getMyAMCContracts);

// Technician â€” photo upload via Cloudinary
router.post('/technician/jobs/:id/photo-upload',         protectTechnician, serviceUpload.single('file'), srCtrl.uploadTechnicianPhoto);

// â”€â”€â”€ Sprint 11C: Product Registration + Installation Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const { protectEngineer }  = require('../middleware/engineerAuth');
const engAuthCtrl   = require('../controllers/installationEngineerAuthController');
const engAdminCtrl  = require('../controllers/installationEngineerController');
const prodRegCtrl   = require('../controllers/productRegistrationController');
const installCtrl   = require('../controllers/installationRequestController');
const installDispatch = require('../controllers/installationDispatchController');
const installPortal = require('../controllers/installationPortalController');

// Customer â€” Product Registration
router.post('/product-registrations',                    protect, prodRegCtrl.registerProduct);
router.get( '/product-registrations',                    protect, prodRegCtrl.getMyRegistrations);
router.get( '/product-registrations/:id',                protect, prodRegCtrl.getMyRegistration);

// Customer â€” Installation Requests
router.post('/installation/requests',                    protect, installCtrl.bookInstallation);
router.get( '/installation/requests',                    protect, installCtrl.getMyInstallations);
router.get( '/installation/requests/:id',                protect, installCtrl.trackInstallation);
router.post('/installation/requests/:id/feedback',       protect, installCtrl.submitInstallationFeedback);
router.post('/installation/requests/:id/location-photo', protect, serviceUpload.single('file'), installCtrl.uploadLocationPhoto);

// Engineer Auth (7th JWT stack â€” type:'engineer')
router.post('/engineer/auth/login',                      engAuthCtrl.loginEngineer);
router.get( '/engineer/auth/me',                         protectEngineer, engAuthCtrl.getEngineerProfile);
router.put( '/engineer/auth/profile',                    protectEngineer, engAuthCtrl.updateEngineerProfile);
router.put( '/engineer/auth/availability',               protectEngineer, engAuthCtrl.updateAvailability);
router.put( '/engineer/auth/location',                   protectEngineer, engAuthCtrl.updateLocation);

// Engineer Portal â€” Jobs
router.get( '/engineer/jobs',                            protectEngineer, installPortal.getEngineerJobs);
router.get( '/engineer/dashboard',                       protectEngineer, installPortal.getEngineerDashboard);
router.get( '/engineer/jobs/:id',                        protectEngineer, installPortal.getEngineerJobDetail);
router.put( '/engineer/jobs/:id/status',                 protectEngineer, installPortal.updateJobStatus);
router.put( '/engineer/jobs/:id/checklist',              protectEngineer, installPortal.updateChecklist);
router.post('/engineer/jobs/:id/photo',                  protectEngineer, serviceUpload.single('file'), installPortal.uploadJobPhoto);
router.post('/engineer/jobs/:id/signature',              protectEngineer, installPortal.saveSignature);
router.put( '/engineer/jobs/:id/demo',                   protectEngineer, installPortal.saveDemoNotes);

// Admin â€” Installation Engineers
router.post('/admin/installation-engineers',             protect, admin, engAdminCtrl.createEngineer);
router.get( '/admin/installation-engineers',             protect, admin, engAdminCtrl.getEngineers);
router.get( '/admin/installation-engineers/stats',       protect, admin, engAdminCtrl.getEngineerStats);
router.get( '/admin/installation-engineers/:id',         protect, admin, engAdminCtrl.getEngineer);
router.put( '/admin/installation-engineers/:id',         protect, admin, engAdminCtrl.updateEngineer);
router.delete('/admin/installation-engineers/:id',       protect, admin, engAdminCtrl.deleteEngineer);
router.post('/admin/installation-engineers/:id/reset-password', protect, admin, engAdminCtrl.resetEngineerPassword);
router.post('/admin/installation-engineers/:id/token',   protect, superAdmin, engAdminCtrl.generateEngineerToken);
router.get( '/admin/installation-engineers/:id/workload', protect, admin, engAdminCtrl.getEngineerWorkload);

// Admin â€” Installation Requests
router.get( '/admin/installation/dashboard',             protect, admin, installCtrl.getInstallationDashboard);
router.get( '/admin/installation/requests',              protect, admin, installCtrl.getAdminInstallations);
router.get( '/admin/installation/requests/:id',          protect, admin, installCtrl.getAdminInstallation);
router.put( '/admin/installation/requests/:id/status',   protect, admin, installCtrl.updateInstallationStatus);
router.put( '/admin/installation/requests/:id/assign',   protect, admin, installCtrl.assignEngineer);
router.get( '/admin/installation/reports',               protect, admin, installCtrl.getInstallationReports);

// Admin â€” Installation Dispatch
router.get( '/admin/installation/dispatch/:requestId/recommendations', protect, admin, installDispatch.getDispatchRecommendations);
router.post('/admin/installation/dispatch/:requestId/auto-assign',     protect, admin, installDispatch.autoAssign);

// Admin â€” Product Registrations
router.get( '/admin/product-registrations',              protect, admin, prodRegCtrl.getAllRegistrations);
router.get( '/admin/product-registrations/stats',        protect, admin, prodRegCtrl.getRegistrationStats);
router.get( '/admin/product-registrations/:id',          protect, admin, prodRegCtrl.getRegistration);
router.put( '/admin/product-registrations/:id/verify',   protect, admin, prodRegCtrl.verifyRegistration);
router.put( '/admin/product-registrations/:id/invalidate', protect, admin, prodRegCtrl.invalidateRegistration);
router.put( '/admin/product-registrations/:id/activate-warranty', protect, admin, prodRegCtrl.activateWarrantyForRegistration);
router.put( '/admin/product-registrations/:id/transfer', protect, admin, prodRegCtrl.transferOwnership);

// â”€â”€â”€ Sprint 12A: Manufacturing ERP Foundation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const factoryCtrl    = require('../controllers/factoryController');
const workCenterCtrl = require('../controllers/workCenterController');
const machineCtrl    = require('../controllers/machineController');
const shiftCtrl      = require('../controllers/shiftController');
const bomCtrl        = require('../controllers/bomController');
const prodCtrl       = require('../controllers/productionController');
const prodDashCtrl   = require('../controllers/productionDashboardController');

// Manufacturing Dashboard
router.get( '/admin/manufacturing/dashboard',         protect, admin, prodDashCtrl.getDashboard);
router.get( '/admin/manufacturing/trend',             protect, admin, prodDashCtrl.getProductionTrend);
router.get( '/admin/manufacturing/oee',               protect, admin, prodDashCtrl.getOEEReport);
router.get( '/admin/manufacturing/shift-performance', protect, admin, prodDashCtrl.getShiftPerformance);

// Factories
router.post(   '/admin/factories',     protect, admin, factoryCtrl.createFactory);
router.get(    '/admin/factories',     protect, admin, factoryCtrl.getFactories);
router.get(    '/admin/factories/:id', protect, admin, factoryCtrl.getFactory);
router.put(    '/admin/factories/:id', protect, admin, factoryCtrl.updateFactory);
router.delete( '/admin/factories/:id', protect, admin, factoryCtrl.deleteFactory);

// Work Centers
router.post(   '/admin/work-centers',      protect, admin, workCenterCtrl.createWorkCenter);
router.get(    '/admin/work-centers',      protect, admin, workCenterCtrl.getWorkCenters);
router.get(    '/admin/work-centers/:id',  protect, admin, workCenterCtrl.getWorkCenter);
router.put(    '/admin/work-centers/:id',  protect, admin, workCenterCtrl.updateWorkCenter);
router.delete( '/admin/work-centers/:id',  protect, admin, workCenterCtrl.deleteWorkCenter);

// Machines
router.post(   '/admin/machines',                  protect, admin, machineCtrl.createMachine);
router.get(    '/admin/machines',                  protect, admin, machineCtrl.getMachines);
router.get(    '/admin/machines/:id',              protect, admin, machineCtrl.getMachine);
router.put(    '/admin/machines/:id',              protect, admin, machineCtrl.updateMachine);
router.delete( '/admin/machines/:id',              protect, admin, machineCtrl.deleteMachine);
router.patch(  '/admin/machines/:id/status',       protect, admin, machineCtrl.updateMachineStatus);
router.post(   '/admin/machines/:id/maintenance',  protect, admin, machineCtrl.logMaintenance);

// Shifts
router.post(   '/admin/shifts',     protect, admin, shiftCtrl.createShift);
router.get(    '/admin/shifts',     protect, admin, shiftCtrl.getShifts);
router.get(    '/admin/shifts/:id', protect, admin, shiftCtrl.getShift);
router.put(    '/admin/shifts/:id', protect, admin, shiftCtrl.updateShift);
router.delete( '/admin/shifts/:id', protect, admin, shiftCtrl.deleteShift);

// Bill of Materials
router.post(   '/admin/bom',                    protect, admin, bomCtrl.createBOM);
router.get(    '/admin/bom',                    protect, admin, bomCtrl.getBOMs);
router.get(    '/admin/bom/product/:productId', protect, admin, bomCtrl.getBOMByProduct);
router.get(    '/admin/bom/:id',                protect, admin, bomCtrl.getBOM);
router.put(    '/admin/bom/:id',                protect, admin, bomCtrl.updateBOM);
router.delete( '/admin/bom/:id',                protect, admin, bomCtrl.deleteBOM);
router.patch(  '/admin/bom/:id/approve',        protect, admin, bomCtrl.approveBOM);
router.post(   '/admin/bom/:id/clone',          protect, admin, bomCtrl.cloneBOM);

// Production Orders
router.post(   '/admin/production-orders',                       protect, admin, prodCtrl.createOrder);
router.get(    '/admin/production-orders',                       protect, admin, prodCtrl.getOrders);
router.get(    '/admin/production-orders/:id',                   protect, admin, prodCtrl.getOrder);
router.put(    '/admin/production-orders/:id',                   protect, admin, prodCtrl.updateOrder);
router.delete( '/admin/production-orders/:id',                   protect, admin, prodCtrl.deleteOrder);
router.patch(  '/admin/production-orders/:id/start',             protect, admin, prodCtrl.startOrder);
router.patch(  '/admin/production-orders/:id/pause',             protect, admin, prodCtrl.pauseOrder);
router.patch(  '/admin/production-orders/:id/complete',          protect, admin, prodCtrl.completeOrder);
router.patch(  '/admin/production-orders/:id/cancel',            protect, admin, prodCtrl.cancelOrder);
router.post(   '/admin/production-orders/:id/batches',           protect, admin, prodCtrl.createBatch);
router.put(    '/admin/production-orders/:id/batches/:batchId',  protect, admin, prodCtrl.updateBatch);

// â”€â”€â”€ Sprint 12B: Enterprise Production Planning & Scheduling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const planCtrl      = require('../controllers/productionPlanController');
const capPlanCtrl   = require('../controllers/capacityPlanController');
const calCtrl       = require('../controllers/calendarController');
const planDashCtrl  = require('../controllers/planningDashboardController');

// Planning Dashboard & Forecasts
router.get( '/admin/planning/dashboard',            protect, admin, planDashCtrl.getDashboard);
router.get( '/admin/planning/schedule-adherence',   protect, admin, planDashCtrl.getScheduleAdherence);
router.get( '/admin/planning/capacity-forecast',    protect, admin, planDashCtrl.getCapacityForecast);
router.get( '/admin/planning/resource-utilization', protect, admin, planDashCtrl.getResourceUtilization);

// Production Plans
router.post(   '/admin/production-plans',              protect, admin, planCtrl.createPlan);
router.get(    '/admin/production-plans',              protect, admin, planCtrl.getPlans);
router.get(    '/admin/production-plans/:id',          protect, admin, planCtrl.getPlan);
router.put(    '/admin/production-plans/:id',          protect, admin, planCtrl.updatePlan);
router.delete( '/admin/production-plans/:id',          protect, admin, planCtrl.deletePlan);
router.patch(  '/admin/production-plans/:id/submit',   protect, admin, planCtrl.submitPlan);
router.patch(  '/admin/production-plans/:id/review',   protect, admin, planCtrl.reviewPlan);
router.patch(  '/admin/production-plans/:id/approve',  protect, admin, planCtrl.approvePlan);
router.patch(  '/admin/production-plans/:id/release',  protect, admin, planCtrl.releasePlan);
router.patch(  '/admin/production-plans/:id/cancel',   protect, admin, planCtrl.cancelPlan);
router.post(   '/admin/production-plans/:id/clone',    protect, admin, planCtrl.clonePlan);

// Capacity Planning
router.get(  '/admin/capacity-planning/analysis',         protect, admin, capPlanCtrl.getCapacityAnalysis);
router.get(  '/admin/capacity-planning/factory/:factoryId', protect, admin, capPlanCtrl.getFactoryCapacity);
router.get(  '/admin/capacity-planning/bottlenecks',      protect, admin, capPlanCtrl.getBottlenecks);
router.get(  '/admin/capacity-planning',                  protect, admin, capPlanCtrl.getCapacityPlans);
router.post( '/admin/capacity-planning',                  protect, admin, capPlanCtrl.createCapacityPlan);
router.put(  '/admin/capacity-planning/:id',              protect, admin, capPlanCtrl.updateCapacityPlan);

// Machine Calendar
router.get(  '/admin/machine-calendar',       protect, admin, calCtrl.getMachineCalendar);
router.get(  '/admin/machine-calendar/bulk',  protect, admin, calCtrl.getMachineCalendarBulk);
router.post( '/admin/machine-calendar',       protect, admin, calCtrl.setMachineAvailability);

// Production Calendar
router.get(  '/admin/production-calendar',           protect, admin, calCtrl.getProductionCalendar);
router.post( '/admin/production-calendar',           protect, admin, calCtrl.setProductionDay);
router.post( '/admin/production-calendar/generate',  protect, admin, calCtrl.generateCalendar);

// Holiday Calendar
router.get(    '/admin/holidays',      protect, admin, calCtrl.getHolidays);
router.post(   '/admin/holidays',      protect, admin, calCtrl.createHoliday);
router.put(    '/admin/holidays/:id',  protect, admin, calCtrl.updateHoliday);
router.delete( '/admin/holidays/:id',  protect, admin, calCtrl.deleteHoliday);

// Planning Constraints
router.get(    '/admin/planning-constraints',      protect, admin, calCtrl.getConstraints);
router.post(   '/admin/planning-constraints',      protect, admin, calCtrl.createConstraint);
router.put(    '/admin/planning-constraints/:id',  protect, admin, calCtrl.updateConstraint);
router.delete( '/admin/planning-constraints/:id',  protect, admin, calCtrl.deleteConstraint);

// Planning Scenarios
router.get(    '/admin/planning-scenarios',      protect, admin, planDashCtrl.getScenarios);
router.post(   '/admin/planning-scenarios',      protect, admin, planDashCtrl.createScenario);
router.put(    '/admin/planning-scenarios/:id',  protect, admin, planDashCtrl.updateScenario);
router.delete( '/admin/planning-scenarios/:id',  protect, admin, planDashCtrl.deleteScenario);

// â”€â”€â”€ Sprint 12C: Enterprise MRP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const mrpCtrl        = require('../controllers/mrpController');
const matReqCtrl     = require('../controllers/materialRequirementController');
const mrpResCtrl     = require('../controllers/mrpReservationController');
const forecastCtrl   = require('../controllers/forecastController');
const projCtrl       = require('../controllers/inventoryProjectionController');
const shortageCtrl   = require('../controllers/shortageController');
const recCtrl        = require('../controllers/recommendationController');
const mrpDashCtrl    = require('../controllers/mrpDashboardController');
const ssCtrl         = require('../controllers/safetyStockController');

// MRP Dashboard & Reports
router.get( '/admin/mrp/dashboard',                  protect, admin, mrpDashCtrl.getDashboard);
router.get( '/admin/mrp/reports/shortages',          protect, admin, mrpDashCtrl.getShortageReport);
router.get( '/admin/mrp/reports/inventory-risk',     protect, admin, mrpDashCtrl.getInventoryRiskReport);
router.get( '/admin/mrp/reports/forecast-accuracy',  protect, admin, mrpDashCtrl.getForecastAccuracyReport);

// MRP Runs
router.post(  '/admin/mrp/runs',            protect, admin, mrpCtrl.runMRP);
router.get(   '/admin/mrp/runs',            protect, admin, mrpCtrl.getMRPRuns);
router.get(   '/admin/mrp/runs/:id',        protect, admin, mrpCtrl.getMRPRun);
router.patch( '/admin/mrp/runs/:id/cancel', protect, admin, mrpCtrl.cancelRun);

// Material Requirements
router.get( '/admin/mrp/requirements',                         protect, admin, matReqCtrl.getRequirements);
router.get( '/admin/mrp/requirements/:id',                     protect, admin, matReqCtrl.getRequirement);
router.get( '/admin/mrp/runs/:mrpRunId/requirements',          protect, admin, matReqCtrl.getRequirementsByRun);

// MRP Reservations
router.get(   '/admin/mrp/reservations',            protect, admin, mrpResCtrl.getReservations);
router.get(   '/admin/mrp/reservations/:id',        protect, admin, mrpResCtrl.getReservation);
router.patch( '/admin/mrp/reservations/:id/release',protect, admin, mrpResCtrl.releaseReservation);

// Shortages
router.get(   '/admin/mrp/shortages',              protect, admin, shortageCtrl.getShortages);
router.get(   '/admin/mrp/shortages/:id',          protect, admin, shortageCtrl.getShortage);
router.patch( '/admin/mrp/shortages/:id/resolve',  protect, admin, shortageCtrl.resolveShortage);
router.patch( '/admin/mrp/shortages/:id/ignore',   protect, admin, shortageCtrl.ignoreShortage);

// Recommendations
router.get(   '/admin/mrp/recommendations',              protect, admin, recCtrl.getRecommendations);
router.get(   '/admin/mrp/recommendations/:id',          protect, admin, recCtrl.getRecommendation);
router.patch( '/admin/mrp/recommendations/:id/accept',   protect, admin, recCtrl.acceptRecommendation);
router.patch( '/admin/mrp/recommendations/:id/reject',   protect, admin, recCtrl.rejectRecommendation);

// Purchase Suggestions
router.get(   '/admin/mrp/purchase-suggestions',              protect, admin, recCtrl.getPurchaseSuggestions);
router.patch( '/admin/mrp/purchase-suggestions/:id/approve',  protect, admin, recCtrl.approvePurchaseSuggestion);
router.patch( '/admin/mrp/purchase-suggestions/:id/reject',   protect, admin, recCtrl.rejectPurchaseSuggestion);

// Demand Forecasts
router.get(    '/admin/mrp/forecasts',              protect, admin, forecastCtrl.getForecasts);
router.post(   '/admin/mrp/forecasts',              protect, admin, forecastCtrl.createForecast);
router.get(    '/admin/mrp/forecasts/:id',          protect, admin, forecastCtrl.getForecast);
router.put(    '/admin/mrp/forecasts/:id',          protect, admin, forecastCtrl.updateForecast);
router.patch(  '/admin/mrp/forecasts/:id/approve',  protect, admin, forecastCtrl.approveForecast);
router.delete( '/admin/mrp/forecasts/:id',          protect, admin, forecastCtrl.deleteForecast);

// Inventory Projections
router.get( '/admin/mrp/projections',                    protect, admin, projCtrl.getProjections);
router.get( '/admin/mrp/projections/:id',                protect, admin, projCtrl.getProjection);
router.get( '/admin/mrp/runs/:mrpRunId/projections',     protect, admin, projCtrl.getProjectionsByRun);

// Safety Stock Rules
router.get(    '/admin/mrp/safety-stock',      protect, admin, ssCtrl.getRules);
router.post(   '/admin/mrp/safety-stock',      protect, admin, ssCtrl.createRule);
router.get(    '/admin/mrp/safety-stock/:id',  protect, admin, ssCtrl.getRule);
router.put(    '/admin/mrp/safety-stock/:id',  protect, admin, ssCtrl.updateRule);
router.delete( '/admin/mrp/safety-stock/:id',  protect, admin, ssCtrl.deleteRule);

// â”€â”€â”€ Sprint 12D: Enterprise MES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const woCtrl       = require('../controllers/workOrderController');
const execCtrl     = require('../controllers/executionController');
const qualCtrl     = require('../controllers/qualityController');
const oeeCtrl      = require('../controllers/oeeController');
const dtCtrl       = require('../controllers/downtimeController');
const toolCtrl     = require('../controllers/toolController');
const opCtrl       = require('../controllers/operatorController');
const laborCtrl    = require('../controllers/laborController');
const mesDashCtrl  = require('../controllers/mesDashboardController');

// MES Dashboard & Reports
router.get( '/admin/mes/dashboard',                protect, admin, mesDashCtrl.getDashboard);
router.get( '/admin/mes/reports/production-trend', protect, admin, mesDashCtrl.getProductionTrend);
router.get( '/admin/mes/reports/oee-trend',        protect, admin, mesDashCtrl.getOEETrend);
router.get( '/admin/mes/reports/downtime-analysis',protect, admin, mesDashCtrl.getDowntimeAnalysis);
router.get( '/admin/mes/reports/quality-trend',    protect, admin, mesDashCtrl.getQualityTrend);
router.get( '/admin/mes/reports/labor',            protect, admin, mesDashCtrl.getLaborReport);
router.get( '/admin/mes/events',                   protect, admin, mesDashCtrl.getProductionEvents);

// Work Orders
router.get(    '/admin/mes/work-orders',                       protect, admin, woCtrl.getWorkOrders);
router.post(   '/admin/mes/work-orders',                       protect, admin, woCtrl.createWorkOrder);
router.get(    '/admin/mes/work-orders/:id',                   protect, admin, woCtrl.getWorkOrder);
router.put(    '/admin/mes/work-orders/:id',                   protect, admin, woCtrl.updateWorkOrder);
router.delete( '/admin/mes/work-orders/:id',                   protect, admin, woCtrl.deleteWorkOrder);
router.patch(  '/admin/mes/work-orders/:id/release',           protect, admin, woCtrl.releaseWorkOrder);
router.patch(  '/admin/mes/work-orders/:id/start',             protect, admin, woCtrl.startWorkOrder);
router.patch(  '/admin/mes/work-orders/:id/pause',             protect, admin, woCtrl.pauseWorkOrder);
router.patch(  '/admin/mes/work-orders/:id/complete',          protect, admin, woCtrl.completeWorkOrder);
router.patch(  '/admin/mes/work-orders/:id/cancel',            protect, admin, woCtrl.cancelWorkOrder);

// Work Order Operations
router.post( '/admin/mes/work-orders/:id/operations',                    protect, admin, woCtrl.createOperation);
router.put(  '/admin/mes/work-orders/:id/operations/:opId',              protect, admin, woCtrl.updateOperation);
router.patch('/admin/mes/work-orders/:id/operations/:opId/complete',     protect, admin, woCtrl.completeOperation);

// Production Execution
router.get(  '/admin/mes/executions',                  protect, admin, execCtrl.getExecutions);
router.post( '/admin/mes/executions/start',            protect, admin, execCtrl.startExecution);
router.get(  '/admin/mes/executions/:id',              protect, admin, execCtrl.getExecution);
router.put(  '/admin/mes/executions/:id',              protect, admin, execCtrl.updateExecution);
router.patch('/admin/mes/executions/:id/pause',        protect, admin, execCtrl.pauseExecution);
router.patch('/admin/mes/executions/:id/complete',     protect, admin, execCtrl.completeExecution);

// Operation Executions
router.get(  '/admin/mes/operation-executions',        protect, admin, execCtrl.getOperationExecutions);
router.post( '/admin/mes/operation-executions',        protect, admin, execCtrl.recordOperationExecution);

// Quality â€“ Inspections
router.get(    '/admin/mes/quality/inspections',       protect, admin, qualCtrl.getInspections);
router.post(   '/admin/mes/quality/inspections',       protect, admin, qualCtrl.createInspection);
router.get(    '/admin/mes/quality/inspections/:id',   protect, admin, qualCtrl.getInspection);
router.put(    '/admin/mes/quality/inspections/:id',   protect, admin, qualCtrl.updateInspection);
router.delete( '/admin/mes/quality/inspections/:id',   protect, admin, qualCtrl.deleteInspection);

// Quality â€“ Checkpoints
router.get(    '/admin/mes/quality/checkpoints',       protect, admin, qualCtrl.getCheckpoints);
router.post(   '/admin/mes/quality/checkpoints',       protect, admin, qualCtrl.createCheckpoint);
router.put(    '/admin/mes/quality/checkpoints/:id',   protect, admin, qualCtrl.updateCheckpoint);
router.delete( '/admin/mes/quality/checkpoints/:id',   protect, admin, qualCtrl.deleteCheckpoint);

// Quality â€“ Defects
router.get( '/admin/mes/quality/defects',              protect, admin, qualCtrl.getDefects);
router.post('/admin/mes/quality/defects',              protect, admin, qualCtrl.createDefect);
router.get( '/admin/mes/quality/defects/:id',          protect, admin, qualCtrl.getDefect);
router.put( '/admin/mes/quality/defects/:id',          protect, admin, qualCtrl.updateDefect);

// Quality â€“ Scrap
router.get( '/admin/mes/quality/scrap',                protect, admin, qualCtrl.getScrap);
router.post('/admin/mes/quality/scrap',                protect, admin, qualCtrl.createScrap);
router.put( '/admin/mes/quality/scrap/:id',            protect, admin, qualCtrl.updateScrap);

// Quality â€“ Rework
router.get( '/admin/mes/quality/rework',               protect, admin, qualCtrl.getRework);
router.post('/admin/mes/quality/rework',               protect, admin, qualCtrl.createRework);
router.put( '/admin/mes/quality/rework/:id',           protect, admin, qualCtrl.updateRework);

// OEE
router.get(  '/admin/mes/oee',                         protect, admin, oeeCtrl.getOEERecords);
router.post( '/admin/mes/oee',                         protect, admin, oeeCtrl.recordOEE);
router.get(  '/admin/mes/oee/summary',                 protect, admin, oeeCtrl.getOEESummary);
router.get(  '/admin/mes/oee/:id',                     protect, admin, oeeCtrl.getOEERecord);

// Machine Runtime
router.get( '/admin/mes/machine-runtime',              protect, admin, oeeCtrl.getMachineRuntimes);
router.get( '/admin/mes/machine-runtime/:id',          protect, admin, oeeCtrl.getMachineRuntime);
router.put( '/admin/mes/machine-runtime/:id',          protect, admin, oeeCtrl.updateMachineRuntime);

// Downtime
router.get(    '/admin/mes/downtime',                         protect, admin, dtCtrl.getDowntimes);
router.post(   '/admin/mes/downtime',                         protect, admin, dtCtrl.createDowntime);
router.get(    '/admin/mes/downtime/:id',                     protect, admin, dtCtrl.getDowntime);
router.patch(  '/admin/mes/downtime/:id/resolve',             protect, admin, dtCtrl.resolveDowntime);
router.delete( '/admin/mes/downtime/:id',                     protect, admin, dtCtrl.deleteDowntime);

// Downtime Reasons
router.get(    '/admin/mes/downtime-reasons',          protect, admin, dtCtrl.getDowntimeReasons);
router.post(   '/admin/mes/downtime-reasons',          protect, admin, dtCtrl.createDowntimeReason);
router.put(    '/admin/mes/downtime-reasons/:id',      protect, admin, dtCtrl.updateDowntimeReason);
router.delete( '/admin/mes/downtime-reasons/:id',      protect, admin, dtCtrl.deleteDowntimeReason);

// Maintenance Triggers
router.get(    '/admin/mes/maintenance-triggers',      protect, admin, dtCtrl.getMaintenanceTriggers);
router.post(   '/admin/mes/maintenance-triggers',      protect, admin, dtCtrl.createMaintenanceTrigger);
router.get(    '/admin/mes/maintenance-triggers/:id',  protect, admin, dtCtrl.getMaintenanceTrigger);
router.put(    '/admin/mes/maintenance-triggers/:id',  protect, admin, dtCtrl.updateMaintenanceTrigger);
router.delete( '/admin/mes/maintenance-triggers/:id',  protect, admin, dtCtrl.deleteMaintenanceTrigger);

// Tools
router.get(    '/admin/mes/tools',                     protect, admin, toolCtrl.getTools);
router.post(   '/admin/mes/tools',                     protect, admin, toolCtrl.createTool);
router.get(    '/admin/mes/tools/:id',                 protect, admin, toolCtrl.getTool);
router.put(    '/admin/mes/tools/:id',                 protect, admin, toolCtrl.updateTool);
router.delete( '/admin/mes/tools/:id',                 protect, admin, toolCtrl.deleteTool);

// Tool Usage
router.get(  '/admin/mes/tool-usage',                  protect, admin, toolCtrl.getToolUsages);
router.post( '/admin/mes/tool-usage/start',            protect, admin, toolCtrl.startToolUsage);
router.patch('/admin/mes/tool-usage/:id/end',          protect, admin, toolCtrl.endToolUsage);

// Tool Calibration
router.get( '/admin/mes/tool-calibrations',            protect, admin, toolCtrl.getCalibrations);
router.post('/admin/mes/tool-calibrations',            protect, admin, toolCtrl.createCalibration);

// Operators â€“ Shifts
router.get(    '/admin/mes/operator-shifts',           protect, admin, opCtrl.getShiftAssignments);
router.post(   '/admin/mes/operator-shifts',           protect, admin, opCtrl.assignShift);
router.put(    '/admin/mes/operator-shifts/:id',       protect, admin, opCtrl.updateShiftAssignment);
router.delete( '/admin/mes/operator-shifts/:id',       protect, admin, opCtrl.deleteShiftAssignment);

// Operators â€“ Attendance
router.get(  '/admin/mes/attendance',                  protect, admin, opCtrl.getAttendance);
router.post( '/admin/mes/attendance',                  protect, admin, opCtrl.recordAttendance);
router.patch('/admin/mes/attendance/:id/clock-out',    protect, admin, opCtrl.clockOut);

// Operators â€“ Skills
router.get(    '/admin/mes/operator-skills',           protect, admin, opCtrl.getSkills);
router.post(   '/admin/mes/operator-skills',           protect, admin, opCtrl.addSkill);
router.put(    '/admin/mes/operator-skills/:id',       protect, admin, opCtrl.updateSkill);
router.delete( '/admin/mes/operator-skills/:id',       protect, admin, opCtrl.deleteSkill);

// Labor Tracking
router.get(    '/admin/mes/labor',                     protect, admin, laborCtrl.getLaborEntries);
router.post(   '/admin/mes/labor',                     protect, admin, laborCtrl.createLaborEntry);
router.get(    '/admin/mes/labor/summary',             protect, admin, laborCtrl.getLaborSummary);
router.get(    '/admin/mes/labor/:id',                 protect, admin, laborCtrl.getLaborEntry);
router.put(    '/admin/mes/labor/:id',                 protect, admin, laborCtrl.updateLaborEntry);
router.delete( '/admin/mes/labor/:id',                 protect, admin, laborCtrl.deleteLaborEntry);

// â”€â”€ Sprint 12E: Enterprise QMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const inspCtrl   = require('../controllers/inspectionPlanController');
const capaCtrl   = require('../controllers/capaController');
const qmsAuditCtrl = require('../controllers/qmsAuditController');
const gaugeCtrl  = require('../controllers/gaugeController');
const sqCtrl     = require('../controllers/supplierQualityController');
const certCtrl   = require('../controllers/certificateController');
const qmsDashCtrl = require('../controllers/qmsDashboardController');
const docCtrl    = require('../controllers/documentController');

// QMS Dashboard
router.get('/admin/qms/dashboard',               protect, admin, qmsDashCtrl.getDashboard);
router.get('/admin/qms/dashboard/inspection-trend', protect, admin, qmsDashCtrl.getInspectionTrend);
router.get('/admin/qms/dashboard/capa-trend',    protect, admin, qmsDashCtrl.getCAPATrend);
router.get('/admin/qms/dashboard/ncr-analysis',  protect, admin, qmsDashCtrl.getNCRAnalysis);
router.get('/admin/qms/dashboard/audit-summary', protect, admin, qmsDashCtrl.getAuditSummary);
router.get('/admin/qms/dashboard/calibration-summary', protect, admin, qmsDashCtrl.getCalibrationSummary);
router.get('/admin/qms/dashboard/supplier-quality-summary', protect, admin, qmsDashCtrl.getSupplierQualitySummary);

// Inspection Plans
router.get(    '/admin/qms/inspection-plans',              protect, admin, inspCtrl.getInspectionPlans);
router.post(   '/admin/qms/inspection-plans',              protect, admin, inspCtrl.createInspectionPlan);
router.get(    '/admin/qms/inspection-plans/:id',          protect, admin, inspCtrl.getInspectionPlan);
router.put(    '/admin/qms/inspection-plans/:id',          protect, admin, inspCtrl.updateInspectionPlan);
router.delete( '/admin/qms/inspection-plans/:id',          protect, admin, inspCtrl.deleteInspectionPlan);

// Inspection Characteristics (nested under plans)
router.get(    '/admin/qms/inspection-plans/:planId/characteristics', protect, admin, inspCtrl.getCharacteristics);
router.post(   '/admin/qms/inspection-plans/:planId/characteristics', protect, admin, inspCtrl.createCharacteristic);
router.put(    '/admin/qms/inspection-plans/:planId/characteristics/:charId', protect, admin, inspCtrl.updateCharacteristic);
router.delete( '/admin/qms/inspection-plans/:planId/characteristics/:charId', protect, admin, inspCtrl.deleteCharacteristic);

// Inspection Methods
router.get(    '/admin/qms/inspection-methods',            protect, admin, inspCtrl.getInspectionMethods);
router.post(   '/admin/qms/inspection-methods',            protect, admin, inspCtrl.createInspectionMethod);
router.put(    '/admin/qms/inspection-methods/:id',        protect, admin, inspCtrl.updateInspectionMethod);
router.delete( '/admin/qms/inspection-methods/:id',        protect, admin, inspCtrl.deleteInspectionMethod);

// Inspection Lots
router.get(    '/admin/qms/inspection-lots',               protect, admin, inspCtrl.getInspectionLots);
router.post(   '/admin/qms/inspection-lots',               protect, admin, inspCtrl.createInspectionLot);
router.get(    '/admin/qms/inspection-lots/:id',           protect, admin, inspCtrl.getInspectionLot);
router.put(    '/admin/qms/inspection-lots/:id',           protect, admin, inspCtrl.updateInspectionLot);
router.delete( '/admin/qms/inspection-lots/:id',           protect, admin, inspCtrl.deleteInspectionLot);

// Inspection Results
router.post(   '/admin/qms/inspection-results',            protect, admin, inspCtrl.createInspectionResult);
router.put(    '/admin/qms/inspection-results/:id',        protect, admin, inspCtrl.updateInspectionResult);
router.delete( '/admin/qms/inspection-results/:id',        protect, admin, inspCtrl.deleteInspectionResult);

// Quality Certificates
router.get(    '/admin/qms/certificates',                  protect, admin, certCtrl.getCertificates);
router.post(   '/admin/qms/certificates',                  protect, admin, certCtrl.createCertificate);
router.get(    '/admin/qms/certificates/:id',              protect, admin, certCtrl.getCertificate);
router.put(    '/admin/qms/certificates/:id',              protect, admin, certCtrl.updateCertificate);
router.delete( '/admin/qms/certificates/:id',              protect, admin, certCtrl.deleteCertificate);
router.patch(  '/admin/qms/certificates/:id/issue',        protect, admin, certCtrl.issueCertificate);
router.patch(  '/admin/qms/certificates/:id/revoke',       protect, admin, certCtrl.revokeCertificate);

// CAPA
router.get(    '/admin/qms/capas',                         protect, admin, capaCtrl.getCAPAs);
router.post(   '/admin/qms/capas',                         protect, admin, capaCtrl.createCAPA);
router.get(    '/admin/qms/capas/:id',                     protect, admin, capaCtrl.getCAPA);
router.put(    '/admin/qms/capas/:id',                     protect, admin, capaCtrl.updateCAPA);
router.delete( '/admin/qms/capas/:id',                     protect, admin, capaCtrl.deleteCAPA);

// NC Reports
router.get(    '/admin/qms/nc-reports',                    protect, admin, capaCtrl.getNCReports);
router.post(   '/admin/qms/nc-reports',                    protect, admin, capaCtrl.createNCReport);
router.get(    '/admin/qms/nc-reports/:id',                protect, admin, capaCtrl.getNCReport);
router.put(    '/admin/qms/nc-reports/:id',                protect, admin, capaCtrl.updateNCReport);
router.delete( '/admin/qms/nc-reports/:id',                protect, admin, capaCtrl.deleteNCReport);

// Root Cause Analysis
router.get(  '/admin/qms/rca',                             protect, admin, capaCtrl.getRCAs);
router.post( '/admin/qms/rca',                             protect, admin, capaCtrl.createRCA);
router.put(  '/admin/qms/rca/:id',                         protect, admin, capaCtrl.updateRCA);

// Corrective Actions
router.get(  '/admin/qms/corrective-actions',              protect, admin, capaCtrl.getCorrectiveActions);
router.post( '/admin/qms/corrective-actions',              protect, admin, capaCtrl.createCorrectiveAction);
router.put(  '/admin/qms/corrective-actions/:id',          protect, admin, capaCtrl.updateCorrectiveAction);

// Preventive Actions
router.get(  '/admin/qms/preventive-actions',              protect, admin, capaCtrl.getPreventiveActions);
router.post( '/admin/qms/preventive-actions',              protect, admin, capaCtrl.createPreventiveAction);
router.put(  '/admin/qms/preventive-actions/:id',          protect, admin, capaCtrl.updatePreventiveAction);

// Audit Programs
router.get(    '/admin/qms/audit-programs',                protect, admin, qmsAuditCtrl.getAuditPrograms);
router.post(   '/admin/qms/audit-programs',                protect, admin, qmsAuditCtrl.createAuditProgram);
router.get(    '/admin/qms/audit-programs/:id',            protect, admin, qmsAuditCtrl.getAuditProgram);
router.put(    '/admin/qms/audit-programs/:id',            protect, admin, qmsAuditCtrl.updateAuditProgram);
router.delete( '/admin/qms/audit-programs/:id',            protect, admin, qmsAuditCtrl.deleteAuditProgram);

// Quality Audits
router.get(    '/admin/qms/audits',                        protect, admin, qmsAuditCtrl.getQualityAudits);
router.post(   '/admin/qms/audits',                        protect, admin, qmsAuditCtrl.createQualityAudit);
router.get(    '/admin/qms/audits/:id',                    protect, admin, qmsAuditCtrl.getQualityAudit);
router.put(    '/admin/qms/audits/:id',                    protect, admin, qmsAuditCtrl.updateQualityAudit);
router.delete( '/admin/qms/audits/:id',                    protect, admin, qmsAuditCtrl.deleteQualityAudit);

// Audit Findings
router.get(    '/admin/qms/audit-findings',                protect, admin, qmsAuditCtrl.getAuditFindings);
router.post(   '/admin/qms/audit-findings',                protect, admin, qmsAuditCtrl.createAuditFinding);
router.put(    '/admin/qms/audit-findings/:id',            protect, admin, qmsAuditCtrl.updateAuditFinding);
router.delete( '/admin/qms/audit-findings/:id',            protect, admin, qmsAuditCtrl.deleteAuditFinding);

// Gauges
router.get(    '/admin/qms/gauges',                        protect, admin, gaugeCtrl.getGauges);
router.post(   '/admin/qms/gauges',                        protect, admin, gaugeCtrl.createGauge);
router.get(    '/admin/qms/gauges/:id',                    protect, admin, gaugeCtrl.getGauge);
router.put(    '/admin/qms/gauges/:id',                    protect, admin, gaugeCtrl.updateGauge);
router.delete( '/admin/qms/gauges/:id',                    protect, admin, gaugeCtrl.deleteGauge);
router.get(    '/admin/qms/gauges/:gaugeId/history',       protect, admin, gaugeCtrl.getGaugeHistory);

// Calibration Records
router.get(  '/admin/qms/calibration-records',             protect, admin, gaugeCtrl.getCalibrationRecords);
router.post( '/admin/qms/calibration-records',             protect, admin, gaugeCtrl.createCalibrationRecord);
router.get(  '/admin/qms/calibration-records/:id',         protect, admin, gaugeCtrl.getCalibrationRecord);

// Calibration Schedules
router.get(  '/admin/qms/calibration-schedules',           protect, admin, gaugeCtrl.getCalibrationSchedules);
router.post( '/admin/qms/calibration-schedules',           protect, admin, gaugeCtrl.createCalibrationSchedule);
router.put(  '/admin/qms/calibration-schedules/:id',       protect, admin, gaugeCtrl.updateCalibrationSchedule);

// Supplier Quality
router.get(    '/admin/qms/supplier-quality',              protect, admin, sqCtrl.getSupplierQualityRecords);
router.post(   '/admin/qms/supplier-quality',              protect, admin, sqCtrl.createSupplierQualityRecord);
router.get(    '/admin/qms/supplier-quality/:id',          protect, admin, sqCtrl.getSupplierQualityRecord);
router.put(    '/admin/qms/supplier-quality/:id',          protect, admin, sqCtrl.updateSupplierQualityRecord);
router.delete( '/admin/qms/supplier-quality/:id',          protect, admin, sqCtrl.deleteSupplierQualityRecord);
router.get(    '/admin/qms/supplier-quality/scorecard/:vendorId', protect, admin, sqCtrl.getSupplierScorecard);

// Quality Alerts
router.get(  '/admin/qms/quality-alerts',                  protect, admin, sqCtrl.getQualityAlerts);
router.post( '/admin/qms/quality-alerts',                  protect, admin, sqCtrl.createQualityAlert);
router.put(  '/admin/qms/quality-alerts/:id',              protect, admin, sqCtrl.updateQualityAlert);
router.patch('/admin/qms/quality-alerts/:id/acknowledge',  protect, admin, sqCtrl.acknowledgeAlert);
router.patch('/admin/qms/quality-alerts/:id/resolve',      protect, admin, sqCtrl.resolveAlert);

// Document Control
router.get(    '/admin/qms/documents',                     protect, admin, docCtrl.getDocuments);
router.post(   '/admin/qms/documents',                     protect, admin, docCtrl.createDocument);
router.get(    '/admin/qms/documents/:id',                 protect, admin, docCtrl.getDocument);
router.put(    '/admin/qms/documents/:id',                 protect, admin, docCtrl.updateDocument);
router.delete( '/admin/qms/documents/:id',                 protect, admin, docCtrl.deleteDocument);
router.patch(  '/admin/qms/documents/:id/approve',         protect, admin, docCtrl.approveDocument);
router.patch(  '/admin/qms/documents/:id/activate',        protect, admin, docCtrl.activateDocument);
router.patch(  '/admin/qms/documents/:id/obsolete',        protect, admin, docCtrl.obsoleteDocument);

// Revisions
router.get(  '/admin/qms/documents/:docId/revisions',      protect, admin, docCtrl.getRevisions);
router.post( '/admin/qms/documents/:docId/revisions',      protect, admin, docCtrl.createRevision);

// â”€â”€ Sprint 12F: Enterprise Asset Management (EAM / CMMS) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const assetCtrl   = require('../controllers/assetController');
const maintCtrl   = require('../controllers/maintenanceController');
const eamWoCtrl   = require('../controllers/maintenanceWorkOrderController');
const schedCtrl   = require('../controllers/maintenanceScheduleController');
const cmCtrl      = require('../controllers/conditionMonitoringController');
const meterCtrl   = require('../controllers/meterController');
const brkCtrl     = require('../controllers/breakdownController');
const eamDashCtrl = require('../controllers/maintenanceDashboardController');

// EAM Dashboard
router.get('/admin/eam/dashboard',                         protect, admin, eamDashCtrl.getDashboard);
router.get('/admin/eam/asset-reliability',                 protect, admin, eamDashCtrl.getAssetReliability);
router.get('/admin/eam/maintenance-trend',                 protect, admin, eamDashCtrl.getMaintenanceTrend);
router.get('/admin/eam/breakdown-analysis',                protect, admin, eamDashCtrl.getBreakdownAnalysis);
router.get('/admin/eam/cost-analysis',                     protect, admin, eamDashCtrl.getCostAnalysis);

// Assets
router.get(    '/admin/eam/assets',                        protect, admin, assetCtrl.getAssets);
router.post(   '/admin/eam/assets',                        protect, admin, assetCtrl.createAsset);
router.get(    '/admin/eam/assets/:id',                    protect, admin, assetCtrl.getAsset);
router.put(    '/admin/eam/assets/:id',                    protect, admin, assetCtrl.updateAsset);
router.delete( '/admin/eam/assets/:id',                    protect, admin, assetCtrl.deleteAsset);

// Asset hierarchy (before /:id to avoid route conflict)
router.get(    '/admin/eam/assets/:assetId/hierarchy',     protect, admin, assetCtrl.getHierarchy);
router.put(    '/admin/eam/assets/:assetId/hierarchy',     protect, admin, assetCtrl.upsertHierarchy);

// Asset documents
router.get(    '/admin/eam/assets/:assetId/documents',     protect, admin, assetCtrl.getDocuments);
router.post(   '/admin/eam/assets/:assetId/documents',     protect, admin, assetCtrl.addDocument);
router.delete( '/admin/eam/asset-documents/:id',           protect, admin, assetCtrl.deleteDocument);

// Asset depreciation
router.get(    '/admin/eam/assets/:assetId/depreciation',  protect, admin, assetCtrl.getDepreciation);
router.post(   '/admin/eam/assets/:assetId/depreciation',  protect, admin, assetCtrl.createDepreciation);

// Asset warranties
router.get(    '/admin/eam/assets/:assetId/warranties',    protect, admin, assetCtrl.getWarranties);
router.post(   '/admin/eam/assets/:assetId/warranties',    protect, admin, assetCtrl.createWarranty);
router.put(    '/admin/eam/asset-warranties/:id',          protect, admin, assetCtrl.updateWarranty);

// Asset lifecycle
router.get(    '/admin/eam/assets/:assetId/lifecycle',     protect, admin, assetCtrl.getLifecycle);
router.post(   '/admin/eam/assets/:assetId/lifecycle',     protect, admin, assetCtrl.addLifecycleEvent);

// Asset Categories
router.get(    '/admin/eam/asset-categories',              protect, admin, assetCtrl.getCategories);
router.post(   '/admin/eam/asset-categories',              protect, admin, assetCtrl.createCategory);
router.put(    '/admin/eam/asset-categories/:id',          protect, admin, assetCtrl.updateCategory);
router.delete( '/admin/eam/asset-categories/:id',          protect, admin, assetCtrl.deleteCategory);

// Asset Locations
router.get(    '/admin/eam/asset-locations',               protect, admin, assetCtrl.getLocations);
router.post(   '/admin/eam/asset-locations',               protect, admin, assetCtrl.createLocation);
router.put(    '/admin/eam/asset-locations/:id',           protect, admin, assetCtrl.updateLocation);
router.delete( '/admin/eam/asset-locations/:id',           protect, admin, assetCtrl.deleteLocation);

// Maintenance Plans
router.get(    '/admin/eam/maintenance-plans',             protect, admin, maintCtrl.getPlans);
router.post(   '/admin/eam/maintenance-plans',             protect, admin, maintCtrl.createPlan);
router.get(    '/admin/eam/maintenance-plans/:id',         protect, admin, maintCtrl.getPlan);
router.put(    '/admin/eam/maintenance-plans/:id',         protect, admin, maintCtrl.updatePlan);
router.delete( '/admin/eam/maintenance-plans/:id',         protect, admin, maintCtrl.deletePlan);

// Maintenance Checklists
router.get(    '/admin/eam/checklists',                    protect, admin, maintCtrl.getChecklists);
router.post(   '/admin/eam/checklists',                    protect, admin, maintCtrl.createChecklist);
router.put(    '/admin/eam/checklists/:id',                protect, admin, maintCtrl.updateChecklist);
router.delete( '/admin/eam/checklists/:id',                protect, admin, maintCtrl.deleteChecklist);

// Maintenance History
router.get(    '/admin/eam/maintenance-history',           protect, admin, maintCtrl.getHistory);
router.get(    '/admin/eam/assets/:assetId/history',       protect, admin, maintCtrl.getHistory);
router.post(   '/admin/eam/maintenance-history',           protect, admin, maintCtrl.createHistoryEntry);

// Preventive Maintenance
router.get(    '/admin/eam/preventive',                    protect, admin, maintCtrl.getPreventive);
router.post(   '/admin/eam/preventive',                    protect, admin, maintCtrl.createPreventive);
router.put(    '/admin/eam/preventive/:id',                protect, admin, maintCtrl.updatePreventive);

// Predictive Maintenance
router.get(    '/admin/eam/predictive',                    protect, admin, maintCtrl.getPredictive);
router.post(   '/admin/eam/predictive',                    protect, admin, maintCtrl.createPredictive);
router.put(    '/admin/eam/predictive/:id',                protect, admin, maintCtrl.updatePredictive);

// Maintenance Planner
router.get(    '/admin/eam/planners',                      protect, admin, maintCtrl.getPlanners);
router.post(   '/admin/eam/planners',                      protect, admin, maintCtrl.createPlanner);
router.get(    '/admin/eam/planners/:id',                  protect, admin, maintCtrl.getPlanner);
router.put(    '/admin/eam/planners/:id',                  protect, admin, maintCtrl.updatePlanner);
router.delete( '/admin/eam/planners/:id',                  protect, admin, maintCtrl.deletePlanner);

// Maintenance Log
router.get(    '/admin/eam/maintenance-logs',              protect, admin, maintCtrl.getLogs);
router.post(   '/admin/eam/maintenance-logs',              protect, admin, maintCtrl.createLog);
router.put(    '/admin/eam/maintenance-logs/:id',          protect, admin, maintCtrl.updateLog);

// Vendor Maintenance Services
router.get(    '/admin/eam/vendor-services',               protect, admin, maintCtrl.getVendorServices);
router.post(   '/admin/eam/vendor-services',               protect, admin, maintCtrl.createVendorService);
router.put(    '/admin/eam/vendor-services/:id',           protect, admin, maintCtrl.updateVendorService);
router.delete( '/admin/eam/vendor-services/:id',           protect, admin, maintCtrl.deleteVendorService);

// Maintenance Work Orders
router.get(    '/admin/eam/work-orders',                   protect, admin, eamWoCtrl.getWorkOrders);
router.post(   '/admin/eam/work-orders',                   protect, admin, eamWoCtrl.createWorkOrder);
router.get(    '/admin/eam/work-orders/:id',               protect, admin, eamWoCtrl.getWorkOrder);
router.put(    '/admin/eam/work-orders/:id',               protect, admin, eamWoCtrl.updateWorkOrder);
router.delete( '/admin/eam/work-orders/:id',               protect, admin, eamWoCtrl.deleteWorkOrder);
router.patch(  '/admin/eam/work-orders/:id/transition',    protect, admin, eamWoCtrl.transitionWorkOrder);
router.get(    '/admin/eam/work-orders/:id/parts',         protect, admin, eamWoCtrl.getWorkOrderParts);
router.post(   '/admin/eam/work-orders/:id/parts',         protect, admin, eamWoCtrl.addWorkOrderPart);

// Work Order Tasks
router.get(    '/admin/eam/work-orders/:workOrderId/tasks',protect, admin, maintCtrl.getTasks);
router.post(   '/admin/eam/work-orders/:workOrderId/tasks',protect, admin, maintCtrl.createTask);
router.put(    '/admin/eam/tasks/:id',                     protect, admin, maintCtrl.updateTask);
router.delete( '/admin/eam/tasks/:id',                     protect, admin, maintCtrl.deleteTask);

// Maintenance Requests
router.get(    '/admin/eam/requests',                      protect, admin, eamWoCtrl.getRequests);
router.post(   '/admin/eam/requests',                      protect, admin, eamWoCtrl.createRequest);
router.get(    '/admin/eam/requests/:id',                  protect, admin, eamWoCtrl.getRequest);
router.put(    '/admin/eam/requests/:id',                  protect, admin, eamWoCtrl.updateRequest);
router.patch(  '/admin/eam/requests/:id/convert',          protect, admin, eamWoCtrl.convertRequestToWorkOrder);

// Maintenance Schedules
router.get(    '/admin/eam/schedules',                     protect, admin, schedCtrl.getSchedules);
router.post(   '/admin/eam/schedules',                     protect, admin, schedCtrl.createSchedule);
router.get(    '/admin/eam/schedules/:id',                 protect, admin, schedCtrl.getSchedule);
router.put(    '/admin/eam/schedules/:id',                 protect, admin, schedCtrl.updateSchedule);
router.delete( '/admin/eam/schedules/:id',                 protect, admin, schedCtrl.deleteSchedule);
router.patch(  '/admin/eam/schedules/:id/complete',        protect, admin, schedCtrl.completeSchedule);
router.post(   '/admin/eam/schedules/mark-overdue',        protect, admin, schedCtrl.markScheduleOverdue);

// Maintenance Contracts
router.get(    '/admin/eam/contracts',                     protect, admin, schedCtrl.getContracts);
router.post(   '/admin/eam/contracts',                     protect, admin, schedCtrl.createContract);
router.get(    '/admin/eam/contracts/:id',                 protect, admin, schedCtrl.getContract);
router.put(    '/admin/eam/contracts/:id',                 protect, admin, schedCtrl.updateContract);
router.delete( '/admin/eam/contracts/:id',                 protect, admin, schedCtrl.deleteContract);

// Condition Monitoring
router.get(    '/admin/eam/condition-monitors',            protect, admin, cmCtrl.getMonitors);
router.post(   '/admin/eam/condition-monitors',            protect, admin, cmCtrl.createMonitor);
router.get(    '/admin/eam/condition-monitors/:id',        protect, admin, cmCtrl.getMonitor);
router.put(    '/admin/eam/condition-monitors/:id',        protect, admin, cmCtrl.updateMonitor);
router.delete( '/admin/eam/condition-monitors/:id',        protect, admin, cmCtrl.deleteMonitor);
router.post(   '/admin/eam/condition-monitors/:id/reading',protect, admin, cmCtrl.addReading);

// Risk Assessments
router.get(    '/admin/eam/risk-assessments',              protect, admin, cmCtrl.getRiskAssessments);
router.post(   '/admin/eam/risk-assessments',              protect, admin, cmCtrl.createRiskAssessment);
router.put(    '/admin/eam/risk-assessments/:id',          protect, admin, cmCtrl.updateRiskAssessment);
router.delete( '/admin/eam/risk-assessments/:id',          protect, admin, cmCtrl.deleteRiskAssessment);

// Asset Calibrations (EAM - distinct from QMS gauge calibrations)
router.get(    '/admin/eam/asset-calibrations',            protect, admin, cmCtrl.getAssetCalibrations);
router.post(   '/admin/eam/asset-calibrations',            protect, admin, cmCtrl.createAssetCalibration);
router.put(    '/admin/eam/asset-calibrations/:id',        protect, admin, cmCtrl.updateAssetCalibration);
router.delete( '/admin/eam/asset-calibrations/:id',        protect, admin, cmCtrl.deleteAssetCalibration);

// Asset Meters
router.get(    '/admin/eam/meters',                        protect, admin, meterCtrl.getMeters);
router.post(   '/admin/eam/meters',                        protect, admin, meterCtrl.createMeter);
router.get(    '/admin/eam/meters/:id',                    protect, admin, meterCtrl.getMeter);
router.put(    '/admin/eam/meters/:id',                    protect, admin, meterCtrl.updateMeter);
router.delete( '/admin/eam/meters/:id',                    protect, admin, meterCtrl.deleteMeter);
router.get(    '/admin/eam/meters/:meterId/readings',      protect, admin, meterCtrl.getReadings);
router.post(   '/admin/eam/meters/:meterId/readings',      protect, admin, meterCtrl.addReading);

// Breakdowns
router.get(    '/admin/eam/breakdowns',                    protect, admin, brkCtrl.getBreakdowns);
router.post(   '/admin/eam/breakdowns',                    protect, admin, brkCtrl.createBreakdown);
router.get(    '/admin/eam/breakdowns/:id',                protect, admin, brkCtrl.getBreakdown);
router.put(    '/admin/eam/breakdowns/:id',                protect, admin, brkCtrl.updateBreakdown);
router.delete( '/admin/eam/breakdowns/:id',                protect, admin, brkCtrl.deleteBreakdown);
router.patch(  '/admin/eam/breakdowns/:id/resolve',        protect, admin, brkCtrl.resolveBreakdown);

// Failure Analysis
router.get(    '/admin/eam/failure-analyses',              protect, admin, brkCtrl.getFailureAnalyses);
router.post(   '/admin/eam/failure-analyses',              protect, admin, brkCtrl.createFailureAnalysis);
router.put(    '/admin/eam/failure-analyses/:id',          protect, admin, brkCtrl.updateFailureAnalysis);
router.delete( '/admin/eam/failure-analyses/:id',          protect, admin, brkCtrl.deleteFailureAnalysis);

// â”€â”€ Sprint 13A: Enterprise Finance & General Ledger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const coaCtrl      = require('../controllers/coaController');
const journalCtrl  = require('../controllers/journalController');
const ledgerCtrl   = require('../controllers/ledgerController');
const fiscalCtrl   = require('../controllers/fiscalController');
const postingCtrl  = require('../controllers/postingController');
const reportCtrl   = require('../controllers/reportController');
const finDashCtrl  = require('../controllers/financeDashboardController');
const finSetCtrl   = require('../controllers/financeSettingsController');

// Finance Dashboard
router.get( '/admin/finance/dashboard',                    protect, admin, finDashCtrl.getDashboard);
router.get( '/admin/finance/dashboard/account-breakdown',  protect, admin, finDashCtrl.getAccountTypeBreakdown);
router.get( '/admin/finance/dashboard/top-accounts',       protect, admin, finDashCtrl.getTopAccounts);

// Chart of Accounts
router.get(   '/admin/finance/accounts/tree',              protect, admin, coaCtrl.getAccountTree);
router.get(   '/admin/finance/accounts',                   protect, admin, coaCtrl.getAccounts);
router.post(  '/admin/finance/accounts',                   protect, admin, coaCtrl.createAccount);
router.get(   '/admin/finance/accounts/:id',               protect, admin, coaCtrl.getAccount);
router.put(   '/admin/finance/accounts/:id',               protect, admin, coaCtrl.updateAccount);
router.delete('/admin/finance/accounts/:id',               protect, admin, coaCtrl.deleteAccount);

// Account Groups
router.get(   '/admin/finance/account-groups',             protect, admin, coaCtrl.getGroups);
router.post(  '/admin/finance/account-groups',             protect, admin, coaCtrl.createGroup);
router.put(   '/admin/finance/account-groups/:id',         protect, admin, coaCtrl.updateGroup);
router.delete('/admin/finance/account-groups/:id',         protect, admin, coaCtrl.deleteGroup);

// Journal Entries
router.get(   '/admin/finance/journals',                   protect, admin, journalCtrl.getJournals);
router.post(  '/admin/finance/journals',                   protect, admin, journalCtrl.createJournal);
router.get(   '/admin/finance/journals/:id',               protect, admin, journalCtrl.getJournal);
router.put(   '/admin/finance/journals/:id',               protect, admin, journalCtrl.updateJournal);
router.delete('/admin/finance/journals/:id',               protect, admin, journalCtrl.deleteJournal);
router.patch( '/admin/finance/journals/:id/post',          protect, admin, journalCtrl.postJournal);
router.post(  '/admin/finance/journals/:id/reverse',       protect, admin, journalCtrl.reverseJournal);

// General Ledger
router.get( '/admin/finance/ledger',                       protect, admin, ledgerCtrl.getLedgerEntries);
router.get( '/admin/finance/ledger/balances',              protect, admin, ledgerCtrl.getLedgerBalances);
router.get( '/admin/finance/ledger/accounts/:accountId/statement', protect, admin, ledgerCtrl.getAccountStatement);

// Fiscal Years
router.get(   '/admin/finance/fiscal-years',               protect, admin, fiscalCtrl.getFiscalYears);
router.post(  '/admin/finance/fiscal-years',               protect, admin, fiscalCtrl.createFiscalYear);
router.get(   '/admin/finance/fiscal-years/:id',           protect, admin, fiscalCtrl.getFiscalYear);
router.put(   '/admin/finance/fiscal-years/:id',           protect, admin, fiscalCtrl.updateFiscalYear);
router.delete('/admin/finance/fiscal-years/:id',           protect, admin, fiscalCtrl.deleteFiscalYear);
router.patch( '/admin/finance/fiscal-years/:id/close',     protect, admin, fiscalCtrl.closeFiscalYear);
router.patch( '/admin/finance/fiscal-years/:id/lock',      protect, admin, fiscalCtrl.lockFiscalYear);

// Accounting Periods
router.get(  '/admin/finance/periods',                     protect, admin, fiscalCtrl.getPeriods);
router.post( '/admin/finance/periods',                     protect, admin, fiscalCtrl.createPeriod);
router.put(  '/admin/finance/periods/:id',                 protect, admin, fiscalCtrl.updatePeriod);
router.patch('/admin/finance/periods/:id/close',           protect, admin, fiscalCtrl.closePeriod);
router.patch('/admin/finance/periods/:id/lock',            protect, admin, fiscalCtrl.lockPeriod);

// Posting Rules
router.get(   '/admin/finance/posting-rules',              protect, admin, postingCtrl.getRules);
router.post(  '/admin/finance/posting-rules',              protect, admin, postingCtrl.createRule);
router.put(   '/admin/finance/posting-rules/:id',          protect, admin, postingCtrl.updateRule);
router.delete('/admin/finance/posting-rules/:id',          protect, admin, postingCtrl.deleteRule);

// Posting Templates
router.get(   '/admin/finance/posting-templates',          protect, admin, postingCtrl.getTemplates);
router.post(  '/admin/finance/posting-templates',          protect, admin, postingCtrl.createTemplate);
router.put(   '/admin/finance/posting-templates/:id',      protect, admin, postingCtrl.updateTemplate);
router.delete('/admin/finance/posting-templates/:id',      protect, admin, postingCtrl.deleteTemplate);

// Voucher Series
router.get(  '/admin/finance/voucher-series',              protect, admin, postingCtrl.getVoucherSeries);
router.post( '/admin/finance/voucher-series',              protect, admin, postingCtrl.createVoucherSeries);
router.put(  '/admin/finance/voucher-series/:id',          protect, admin, postingCtrl.updateVoucherSeries);

// Vouchers
router.get(   '/admin/finance/vouchers',                   protect, admin, postingCtrl.getVouchers);
router.post(  '/admin/finance/vouchers',                   protect, admin, postingCtrl.createVoucher);
router.get(   '/admin/finance/vouchers/:id',               protect, admin, postingCtrl.getVoucher);
router.put(   '/admin/finance/vouchers/:id',               protect, admin, postingCtrl.updateVoucher);
router.delete('/admin/finance/vouchers/:id',               protect, admin, postingCtrl.deleteVoucher);

// Cost Centers
router.get(   '/admin/finance/cost-centers',               protect, admin, postingCtrl.getCostCenters);
router.post(  '/admin/finance/cost-centers',               protect, admin, postingCtrl.createCostCenter);
router.put(   '/admin/finance/cost-centers/:id',           protect, admin, postingCtrl.updateCostCenter);
router.delete('/admin/finance/cost-centers/:id',           protect, admin, postingCtrl.deleteCostCenter);

// Profit Centers
router.get(   '/admin/finance/profit-centers',             protect, admin, postingCtrl.getProfitCenters);
router.post(  '/admin/finance/profit-centers',             protect, admin, postingCtrl.createProfitCenter);
router.put(   '/admin/finance/profit-centers/:id',         protect, admin, postingCtrl.updateProfitCenter);
router.delete('/admin/finance/profit-centers/:id',         protect, admin, postingCtrl.deleteProfitCenter);

// Accounting Dimensions
router.get(  '/admin/finance/dimensions',                  protect, admin, postingCtrl.getDimensions);
router.post( '/admin/finance/dimensions',                  protect, admin, postingCtrl.createDimension);
router.put(  '/admin/finance/dimensions/:id',              protect, admin, postingCtrl.updateDimension);

// Financial Reports
router.get(  '/admin/finance/reports/trial-balance',       protect, admin, reportCtrl.getTrialBalance);
router.post( '/admin/finance/reports/trial-balance/save',  protect, admin, reportCtrl.saveTrialBalanceSnapshot);
router.get(  '/admin/finance/reports/balance-sheet',       protect, admin, reportCtrl.getBalanceSheet);
router.get(  '/admin/finance/reports/profit-and-loss',     protect, admin, reportCtrl.getProfitAndLoss);
router.get(  '/admin/finance/reports/cash-book',           protect, admin, reportCtrl.getCashBook);
router.get(  '/admin/finance/reports/bank-book',           protect, admin, reportCtrl.getBankBook);
router.get(  '/admin/finance/reports/journal-book',        protect, admin, reportCtrl.getJournalBook);
router.get(  '/admin/finance/reports/day-book',            protect, admin, reportCtrl.getDayBook);

// Financial Settings
router.get( '/admin/finance/settings',                     protect, admin, finSetCtrl.getSettings);
router.put( '/admin/finance/settings',                     protect, admin, finSetCtrl.updateSettings);

// Currencies
router.get(   '/admin/finance/currencies',                 protect, admin, finSetCtrl.getCurrencies);
router.post(  '/admin/finance/currencies',                 protect, admin, finSetCtrl.createCurrency);
router.put(   '/admin/finance/currencies/:id',             protect, admin, finSetCtrl.updateCurrency);
router.delete('/admin/finance/currencies/:id',             protect, admin, finSetCtrl.deleteCurrency);

// Exchange Rates
router.get(  '/admin/finance/exchange-rates',              protect, admin, finSetCtrl.getExchangeRates);
router.post( '/admin/finance/exchange-rates',              protect, admin, finSetCtrl.createExchangeRate);
router.put(  '/admin/finance/exchange-rates/:id',          protect, admin, finSetCtrl.updateExchangeRate);

// Opening Balances
router.get(  '/admin/finance/opening-balances',            protect, admin, finSetCtrl.getOpeningBalances);
router.post( '/admin/finance/opening-balances',            protect, admin, finSetCtrl.createOpeningBalance);
router.put(  '/admin/finance/opening-balances/:id',        protect, admin, finSetCtrl.updateOpeningBalance);

// â”€â”€â”€ Sprint 13B: Enterprise Accounts Payable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const apDashCtrl      = require('../controllers/accountsPayableDashboardController');
const vendorBillCtrl  = require('../controllers/vendorBillController');
const vendorPmtCtrl   = require('../controllers/vendorPaymentController');
const vendorLedCtrl   = require('../controllers/vendorLedgerController');
const agingCtrl       = require('../controllers/agingController');
const pmtRunCtrl      = require('../controllers/paymentRunController');
const invMatchCtrl    = require('../controllers/invoiceMatchController');

// AP Dashboard
router.get('/admin/accounts-payable/dashboard',                      protect, admin, apDashCtrl.getDashboard);
router.get('/admin/accounts-payable/dashboard/aging-summary',        protect, admin, apDashCtrl.getAgingSummary);
router.get('/admin/accounts-payable/dashboard/top-vendors',          protect, admin, apDashCtrl.getTopVendorsByPayable);
router.get('/admin/accounts-payable/dashboard/gst-credit-summary',   protect, admin, apDashCtrl.getGSTCreditSummary);

// Vendor Bills
router.get(   '/admin/accounts-payable/bills',               protect, admin, vendorBillCtrl.getBills);
router.post(  '/admin/accounts-payable/bills',               protect, admin, vendorBillCtrl.createBill);
router.get(   '/admin/accounts-payable/bills/:id',           protect, admin, vendorBillCtrl.getBill);
router.put(   '/admin/accounts-payable/bills/:id',           protect, admin, vendorBillCtrl.updateBill);
router.delete('/admin/accounts-payable/bills/:id',           protect, admin, vendorBillCtrl.deleteBill);
router.post(  '/admin/accounts-payable/bills/:id/submit',    protect, admin, vendorBillCtrl.submitBill);
router.post(  '/admin/accounts-payable/bills/:id/approve',   protect, admin, vendorBillCtrl.approveBill);
router.post(  '/admin/accounts-payable/bills/:id/reject',    protect, admin, vendorBillCtrl.rejectBill);
router.post(  '/admin/accounts-payable/bills/:id/post-gl',   protect, admin, vendorBillCtrl.postBillToGL);

// Vendor Payments
router.get(   '/admin/accounts-payable/payments',                  protect, admin, vendorPmtCtrl.getPayments);
router.post(  '/admin/accounts-payable/payments',                  protect, admin, vendorPmtCtrl.createPayment);
router.get(   '/admin/accounts-payable/payments/allocations',      protect, admin, vendorPmtCtrl.getAllocations);
router.get(   '/admin/accounts-payable/payments/:id',              protect, admin, vendorPmtCtrl.getPayment);
router.put(   '/admin/accounts-payable/payments/:id',              protect, admin, vendorPmtCtrl.updatePayment);
router.delete('/admin/accounts-payable/payments/:id',              protect, admin, vendorPmtCtrl.deletePayment);
router.post(  '/admin/accounts-payable/payments/:id/approve',      protect, admin, vendorPmtCtrl.approvePayment);
router.post(  '/admin/accounts-payable/payments/:id/post',         protect, admin, vendorPmtCtrl.postPayment);
router.post(  '/admin/accounts-payable/payments/:id/reverse',      protect, admin, vendorPmtCtrl.reversePayment);

// Vendor Ledger
router.get('/admin/accounts-payable/ledger',                       protect, admin, vendorLedCtrl.getLedger);
router.get('/admin/accounts-payable/ledger/statement',             protect, admin, vendorLedCtrl.getAccountStatement);
router.get('/admin/accounts-payable/ledger/:id',                   protect, admin, vendorLedCtrl.getLedgerEntry);

// Vendor Statements
router.get(   '/admin/accounts-payable/statements',                protect, admin, vendorLedCtrl.getStatements);
router.post(  '/admin/accounts-payable/statements/generate',       protect, admin, vendorLedCtrl.generateStatement);
router.get(   '/admin/accounts-payable/statements/:id',            protect, admin, vendorLedCtrl.getStatement);
router.delete('/admin/accounts-payable/statements/:id',            protect, admin, vendorLedCtrl.deleteStatement);

// Aging
router.get( '/admin/accounts-payable/aging/report',                protect, admin, agingCtrl.getAgingReport);
router.post('/admin/accounts-payable/aging/snapshot',              protect, admin, agingCtrl.saveAgingSnapshot);
router.get( '/admin/accounts-payable/aging/snapshots',             protect, admin, agingCtrl.getAgingSnapshots);
router.get( '/admin/accounts-payable/aging/snapshots/:id',         protect, admin, agingCtrl.getAgingSnapshot);

// Payment Runs
router.get(   '/admin/accounts-payable/payment-runs',              protect, admin, pmtRunCtrl.getPaymentRuns);
router.post(  '/admin/accounts-payable/payment-runs',              protect, admin, pmtRunCtrl.createPaymentRun);
router.get(   '/admin/accounts-payable/payment-runs/:id',          protect, admin, pmtRunCtrl.getPaymentRun);
router.post(  '/admin/accounts-payable/payment-runs/:id/propose',  protect, admin, pmtRunCtrl.proposePaymentRun);
router.post(  '/admin/accounts-payable/payment-runs/:id/approve',  protect, admin, pmtRunCtrl.approvePaymentRun);
router.post(  '/admin/accounts-payable/payment-runs/:id/execute',  protect, admin, pmtRunCtrl.executePaymentRun);
router.post(  '/admin/accounts-payable/payment-runs/:id/cancel',   protect, admin, pmtRunCtrl.cancelPaymentRun);
router.delete('/admin/accounts-payable/payment-runs/:id',          protect, admin, pmtRunCtrl.deletePaymentRun);

// Payment Batches
router.get('/admin/accounts-payable/payment-batches',              protect, admin, pmtRunCtrl.getPaymentBatches);
router.get('/admin/accounts-payable/payment-batches/:id',          protect, admin, pmtRunCtrl.getPaymentBatch);

// Payment Advice
router.get(  '/admin/accounts-payable/payment-advices',            protect, admin, pmtRunCtrl.getPaymentAdvices);
router.post( '/admin/accounts-payable/payment-advices',            protect, admin, pmtRunCtrl.createPaymentAdvice);
router.get(  '/admin/accounts-payable/payment-advices/:id',        protect, admin, pmtRunCtrl.getPaymentAdvice);

// Invoice Matching (3-way match)
router.get(  '/admin/accounts-payable/invoice-matches',            protect, admin, invMatchCtrl.getMatches);
router.post( '/admin/accounts-payable/invoice-matches/perform',    protect, admin, invMatchCtrl.performMatch);
router.get(  '/admin/accounts-payable/invoice-matches/:id',        protect, admin, invMatchCtrl.getMatch);
router.post( '/admin/accounts-payable/invoice-matches/:id/resolve',protect, admin, invMatchCtrl.resolveMatch);
router.delete('/admin/accounts-payable/invoice-matches/:id',       protect, admin, invMatchCtrl.deleteMatch);

// Vendor Invoices
router.get(   '/admin/accounts-payable/vendor-invoices',                 protect, admin, invMatchCtrl.getVendorInvoices);
router.post(  '/admin/accounts-payable/vendor-invoices',                 protect, admin, invMatchCtrl.createVendorInvoice);
router.get(   '/admin/accounts-payable/vendor-invoices/:id',             protect, admin, invMatchCtrl.getVendorInvoice);
router.put(   '/admin/accounts-payable/vendor-invoices/:id',             protect, admin, invMatchCtrl.updateVendorInvoice);
router.post(  '/admin/accounts-payable/vendor-invoices/:id/convert',     protect, admin, invMatchCtrl.convertInvoiceToBill);
router.delete('/admin/accounts-payable/vendor-invoices/:id',             protect, admin, invMatchCtrl.deleteVendorInvoice);

// Debit Notes
const DebitNote    = require('../models/DebitNote');
const APCreditNote = require('../models/APCreditNote');
const GSTInputCredit  = require('../models/GSTInputCredit');
const PaymentSchedule = require('../models/PaymentSchedule');
const WithholdingTax  = require('../models/WithholdingTax');
const PaymentTerm     = require('../models/PaymentTerm');
const VendorSettlement = require('../models/VendorSettlement');
const PaymentApproval  = require('../models/PaymentApproval');
const { paginated: pg13b, created: cr13b, ok: ok13b, notFound: nf13b, serverError: se13b, fail: fail13b, noContent: nc13b } = require('../utils/response');

router.get('/admin/accounts-payable/debit-notes', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor, status } = req.query;
    const q = { isDeleted: false };
    if (vendor) q.vendor = vendor;
    if (status) q.status = status;
    const [data, total] = await Promise.all([DebitNote.find(q).sort({ createdAt: -1 }).populate('vendor','name').skip((page-1)*limit).limit(Number(limit)).lean(), DebitNote.countDocuments(q)]);
    return pg13b(res, data, total, page, limit);
  } catch(e) { return se13b(res, e); }
});
router.post('/admin/accounts-payable/debit-notes', protect, admin, async (req, res) => {
  try { const doc = await DebitNote.create({...req.body, createdBy: req.admin._id}); return cr13b(res, doc, 'Debit note created'); }
  catch(e) { return se13b(res, e); }
});
router.get('/admin/accounts-payable/debit-notes/:id', protect, admin, async (req, res) => {
  try { const doc = await DebitNote.findOne({_id: req.params.id, isDeleted: false}).populate('vendor','name email'); if(!doc) return nf13b(res,'Debit Note'); return ok13b(res, doc); }
  catch(e) { return se13b(res, e); }
});
router.put('/admin/accounts-payable/debit-notes/:id', protect, admin, async (req, res) => {
  try {
    const doc = await DebitNote.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Debit Note');
    if(!['draft'].includes(doc.status)) return fail13b(res,'Only draft debit notes can be edited');
    Object.assign(doc, req.body); await doc.save(); return ok13b(res, doc, 'Updated');
  } catch(e) { return se13b(res, e); }
});
router.delete('/admin/accounts-payable/debit-notes/:id', protect, admin, async (req, res) => {
  try {
    const doc = await DebitNote.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Debit Note');
    if(!['draft','cancelled'].includes(doc.status)) return fail13b(res,'Cannot delete');
    doc.isDeleted = true; await doc.save(); return nc13b(res,'Debit note deleted');
  } catch(e) { return se13b(res, e); }
});

// Credit Notes
router.get('/admin/accounts-payable/credit-notes', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor, status } = req.query;
    const q = { isDeleted: false };
    if (vendor) q.vendor = vendor;
    if (status) q.status = status;
    const [data, total] = await Promise.all([APCreditNote.find(q).sort({ createdAt: -1 }).populate('vendor','name').skip((page-1)*limit).limit(Number(limit)).lean(), APCreditNote.countDocuments(q)]);
    return pg13b(res, data, total, page, limit);
  } catch(e) { return se13b(res, e); }
});
router.post('/admin/accounts-payable/credit-notes', protect, admin, async (req, res) => {
  try { const doc = await APCreditNote.create({...req.body, createdBy: req.admin._id}); return cr13b(res, doc, 'Credit note created'); }
  catch(e) { return se13b(res, e); }
});
router.get('/admin/accounts-payable/credit-notes/:id', protect, admin, async (req, res) => {
  try { const doc = await APCreditNote.findOne({_id: req.params.id, isDeleted: false}).populate('vendor','name email'); if(!doc) return nf13b(res,'Credit Note'); return ok13b(res, doc); }
  catch(e) { return se13b(res, e); }
});
router.put('/admin/accounts-payable/credit-notes/:id', protect, admin, async (req, res) => {
  try {
    const doc = await APCreditNote.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Credit Note');
    if(!['draft'].includes(doc.status)) return fail13b(res,'Only draft credit notes can be edited');
    Object.assign(doc, req.body); await doc.save(); return ok13b(res, doc, 'Updated');
  } catch(e) { return se13b(res, e); }
});
router.delete('/admin/accounts-payable/credit-notes/:id', protect, admin, async (req, res) => {
  try {
    const doc = await APCreditNote.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Credit Note');
    if(!['draft','cancelled'].includes(doc.status)) return fail13b(res,'Cannot delete');
    doc.isDeleted = true; await doc.save(); return nc13b(res,'Credit note deleted');
  } catch(e) { return se13b(res, e); }
});

// GST Input Credit
router.get('/admin/accounts-payable/gst-input-credit', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor, reconciliationStatus, gstCategory } = req.query;
    const q = { isDeleted: false };
    if (vendor) q.vendor = vendor;
    if (reconciliationStatus) q.reconciliationStatus = reconciliationStatus;
    if (gstCategory) q.gstCategory = gstCategory;
    const [data, total] = await Promise.all([GSTInputCredit.find(q).sort({ billDate: -1 }).populate('vendor','name').skip((page-1)*limit).limit(Number(limit)).lean(), GSTInputCredit.countDocuments(q)]);
    return pg13b(res, data, total, page, limit);
  } catch(e) { return se13b(res, e); }
});
router.post('/admin/accounts-payable/gst-input-credit', protect, admin, async (req, res) => {
  try { const doc = await GSTInputCredit.create({...req.body}); return cr13b(res, doc, 'GST input credit created'); }
  catch(e) { return se13b(res, e); }
});
router.put('/admin/accounts-payable/gst-input-credit/:id', protect, admin, async (req, res) => {
  try {
    const doc = await GSTInputCredit.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'GST Input Credit');
    Object.assign(doc, req.body); await doc.save(); return ok13b(res, doc, 'Updated');
  } catch(e) { return se13b(res, e); }
});

// Payment Schedules
router.get('/admin/accounts-payable/payment-schedules', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor, status } = req.query;
    const q = { isDeleted: false };
    if (vendor) q.vendor = vendor;
    if (status) q.status = status;
    const [data, total] = await Promise.all([PaymentSchedule.find(q).sort({ scheduledDate: 1 }).populate('vendor','name').skip((page-1)*limit).limit(Number(limit)).lean(), PaymentSchedule.countDocuments(q)]);
    return pg13b(res, data, total, page, limit);
  } catch(e) { return se13b(res, e); }
});
router.post('/admin/accounts-payable/payment-schedules', protect, admin, async (req, res) => {
  try { const doc = await PaymentSchedule.create({...req.body, createdBy: req.admin._id}); return cr13b(res, doc, 'Payment schedule created'); }
  catch(e) { return se13b(res, e); }
});
router.get('/admin/accounts-payable/payment-schedules/:id', protect, admin, async (req, res) => {
  try { const doc = await PaymentSchedule.findOne({_id: req.params.id, isDeleted: false}).populate('vendor','name'); if(!doc) return nf13b(res,'Payment Schedule'); return ok13b(res, doc); }
  catch(e) { return se13b(res, e); }
});
router.put('/admin/accounts-payable/payment-schedules/:id', protect, admin, async (req, res) => {
  try {
    const doc = await PaymentSchedule.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Payment Schedule');
    if(!['scheduled','approved'].includes(doc.status)) return fail13b(res,'Cannot edit this schedule');
    Object.assign(doc, req.body); await doc.save(); return ok13b(res, doc, 'Updated');
  } catch(e) { return se13b(res, e); }
});
router.delete('/admin/accounts-payable/payment-schedules/:id', protect, admin, async (req, res) => {
  try {
    const doc = await PaymentSchedule.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Payment Schedule');
    doc.isDeleted = true; await doc.save(); return nc13b(res,'Deleted');
  } catch(e) { return se13b(res, e); }
});

// Withholding Tax (TDS)
router.get('/admin/accounts-payable/withholding-taxes', protect, admin, async (req, res) => {
  try { const data = await WithholdingTax.find({ isDeleted: false, isActive: true }).sort({ taxCode: 1 }).lean(); return ok13b(res, data); }
  catch(e) { return se13b(res, e); }
});
router.post('/admin/accounts-payable/withholding-taxes', protect, admin, async (req, res) => {
  try { const doc = await WithholdingTax.create({...req.body}); return cr13b(res, doc, 'Withholding tax created'); }
  catch(e) { return se13b(res, e); }
});
router.put('/admin/accounts-payable/withholding-taxes/:id', protect, admin, async (req, res) => {
  try {
    const doc = await WithholdingTax.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Withholding Tax');
    Object.assign(doc, req.body); await doc.save(); return ok13b(res, doc, 'Updated');
  } catch(e) { return se13b(res, e); }
});
router.delete('/admin/accounts-payable/withholding-taxes/:id', protect, admin, async (req, res) => {
  try {
    const doc = await WithholdingTax.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Withholding Tax');
    doc.isDeleted = true; await doc.save(); return nc13b(res,'Deleted');
  } catch(e) { return se13b(res, e); }
});

// Payment Terms
router.get('/admin/accounts-payable/payment-terms', protect, admin, async (req, res) => {
  try { const data = await PaymentTerm.find({ isDeleted: false }).sort({ termCode: 1 }).lean(); return ok13b(res, data); }
  catch(e) { return se13b(res, e); }
});
router.post('/admin/accounts-payable/payment-terms', protect, admin, async (req, res) => {
  try { const doc = await PaymentTerm.create({...req.body}); return cr13b(res, doc, 'Payment term created'); }
  catch(e) { return se13b(res, e); }
});
router.put('/admin/accounts-payable/payment-terms/:id', protect, admin, async (req, res) => {
  try {
    const doc = await PaymentTerm.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Payment Term');
    Object.assign(doc, req.body); await doc.save(); return ok13b(res, doc, 'Updated');
  } catch(e) { return se13b(res, e); }
});
router.delete('/admin/accounts-payable/payment-terms/:id', protect, admin, async (req, res) => {
  try {
    const doc = await PaymentTerm.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Payment Term');
    doc.isDeleted = true; await doc.save(); return nc13b(res,'Deleted');
  } catch(e) { return se13b(res, e); }
});

// Vendor Settlements
router.get('/admin/accounts-payable/settlements', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, vendor, status } = req.query;
    const q = { isDeleted: false };
    if (vendor) q.vendor = vendor;
    if (status) q.status = status;
    const [data, total] = await Promise.all([VendorSettlement.find(q).sort({ settlementDate: -1 }).populate('vendor','name').skip((page-1)*limit).limit(Number(limit)).lean(), VendorSettlement.countDocuments(q)]);
    return pg13b(res, data, total, page, limit);
  } catch(e) { return se13b(res, e); }
});
router.post('/admin/accounts-payable/settlements', protect, admin, async (req, res) => {
  try { const doc = await VendorSettlement.create({...req.body, createdBy: req.admin._id}); return cr13b(res, doc, 'Settlement created'); }
  catch(e) { return se13b(res, e); }
});
router.get('/admin/accounts-payable/settlements/:id', protect, admin, async (req, res) => {
  try { const doc = await VendorSettlement.findOne({_id: req.params.id, isDeleted: false}).populate('vendor','name email'); if(!doc) return nf13b(res,'Settlement'); return ok13b(res, doc); }
  catch(e) { return se13b(res, e); }
});

// Payment Approvals
router.get('/admin/accounts-payable/payment-approvals', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    const [data, total] = await Promise.all([PaymentApproval.find(q).sort({ createdAt: -1 }).populate('vendor','name').populate('requestedBy','name').skip((page-1)*limit).limit(Number(limit)).lean(), PaymentApproval.countDocuments(q)]);
    return pg13b(res, data, total, page, limit);
  } catch(e) { return se13b(res, e); }
});
router.post('/admin/accounts-payable/payment-approvals', protect, admin, async (req, res) => {
  try { const doc = await PaymentApproval.create({...req.body, requestedBy: req.admin._id}); return cr13b(res, doc, 'Approval request created'); }
  catch(e) { return se13b(res, e); }
});
router.post('/admin/accounts-payable/payment-approvals/:id/approve', protect, admin, async (req, res) => {
  try {
    const doc = await PaymentApproval.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Payment Approval');
    doc.status = 'approved'; doc.completedAt = new Date();
    doc.approvers.push({ level: doc.approvalLevel, user: req.admin._id, userName: req.admin.name, action: 'approved', actionDate: new Date(), comments: req.body.comments || '' });
    await doc.save(); return ok13b(res, doc, 'Approved');
  } catch(e) { return se13b(res, e); }
});
router.post('/admin/accounts-payable/payment-approvals/:id/reject', protect, admin, async (req, res) => {
  try {
    const doc = await PaymentApproval.findOne({_id: req.params.id, isDeleted: false});
    if(!doc) return nf13b(res,'Payment Approval');
    doc.status = 'rejected'; doc.rejectionReason = req.body.reason || ''; doc.completedAt = new Date();
    doc.approvers.push({ level: doc.approvalLevel, user: req.admin._id, userName: req.admin.name, action: 'rejected', actionDate: new Date(), comments: req.body.reason || '' });
    await doc.save(); return ok13b(res, doc, 'Rejected');
  } catch(e) { return se13b(res, e); }
});

// â”€â”€ Sprint 13C: Enterprise Accounts Receivable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const arDashCtrl     = require('../controllers/accountsReceivableDashboardController');
const custInvCtrl    = require('../controllers/customerInvoiceController');
const custRcptCtrl   = require('../controllers/customerReceiptController');
const custLedCtrl    = require('../controllers/customerLedgerController');
const custAgingCtrl  = require('../controllers/customerAgingController');
const collCtrl       = require('../controllers/collectionController');
const creditCtrl     = require('../controllers/creditController');

const CustomerInvoice    = require('../models/CustomerInvoice');
const CustomerReceipt    = require('../models/CustomerReceipt');
const CustomerAdvance    = require('../models/CustomerAdvance');
const ReceiptAllocation  = require('../models/ReceiptAllocation');
const CustomerAging      = require('../models/CustomerAging');
const CustomerLedger     = require('../models/CustomerLedger');
const CustomerStatement  = require('../models/CustomerStatement');
const CustomerCreditLimit   = require('../models/CustomerCreditLimit');
const CustomerCreditReview  = require('../models/CustomerCreditReview');
const CollectionActivity = require('../models/CollectionActivity');
const CollectionReminder = require('../models/CollectionReminder');
const PromiseToPay       = require('../models/PromiseToPay');
const BadDebt            = require('../models/BadDebt');
const WriteOff           = require('../models/WriteOff');
const ReceiptBatch       = require('../models/ReceiptBatch');
const ReceiptVoucher     = require('../models/ReceiptVoucher');
const SalesRegister      = require('../models/SalesRegister');
const ReceiptRegister    = require('../models/ReceiptRegister');
const ARSetting          = require('../models/ARSetting');
const CollectionRule     = require('../models/CollectionRule');

const { paginated: pg13c, created: cr13c, ok: ok13c, notFound: nf13c, serverError: se13c, fail: fail13c, noContent: nc13c } = require('../utils/response');

// AR Dashboard
router.get('/admin/accounts-receivable/dashboard',                    protect, admin, arDashCtrl.getDashboard);
router.get('/admin/accounts-receivable/dashboard/aging-summary',      protect, admin, arDashCtrl.getAgingSummary);
router.get('/admin/accounts-receivable/dashboard/top-customers',      protect, admin, arDashCtrl.getTopCustomersByReceivable);
router.get('/admin/accounts-receivable/dashboard/credit-exposure',    protect, admin, arDashCtrl.getCreditExposure);

// Customer Invoices
router.get(   '/admin/accounts-receivable/invoices',               protect, admin, custInvCtrl.getInvoices);
router.post(  '/admin/accounts-receivable/invoices',               protect, admin, custInvCtrl.createInvoice);
router.get(   '/admin/accounts-receivable/invoices/:id',           protect, admin, custInvCtrl.getInvoice);
router.put(   '/admin/accounts-receivable/invoices/:id',           protect, admin, custInvCtrl.updateInvoice);
router.delete('/admin/accounts-receivable/invoices/:id',           protect, admin, custInvCtrl.deleteInvoice);
router.post(  '/admin/accounts-receivable/invoices/:id/submit',    protect, admin, custInvCtrl.submitInvoice);
router.post(  '/admin/accounts-receivable/invoices/:id/approve',   protect, admin, custInvCtrl.approveInvoice);
router.post(  '/admin/accounts-receivable/invoices/:id/reject',    protect, admin, custInvCtrl.rejectInvoice);
router.post(  '/admin/accounts-receivable/invoices/:id/post-gl',   protect, admin, custInvCtrl.postInvoiceToGL);

// Customer Receipts
router.get(   '/admin/accounts-receivable/receipts',                    protect, admin, custRcptCtrl.getReceipts);
router.post(  '/admin/accounts-receivable/receipts',                    protect, admin, custRcptCtrl.createReceipt);
router.get(   '/admin/accounts-receivable/receipts/allocations',        protect, admin, custRcptCtrl.getAllocations);
router.get(   '/admin/accounts-receivable/receipts/:id',                protect, admin, custRcptCtrl.getReceipt);
router.put(   '/admin/accounts-receivable/receipts/:id',                protect, admin, custRcptCtrl.updateReceipt);
router.delete('/admin/accounts-receivable/receipts/:id',                protect, admin, custRcptCtrl.deleteReceipt);
router.post(  '/admin/accounts-receivable/receipts/:id/post',           protect, admin, custRcptCtrl.postReceipt);
router.post(  '/admin/accounts-receivable/receipts/:id/reverse',        protect, admin, custRcptCtrl.reverseReceipt);
router.post(  '/admin/accounts-receivable/receipts/:id/allocate',       protect, admin, custRcptCtrl.allocateReceipt);

// Customer Advances
router.get('/admin/accounts-receivable/advances', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, status } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    if (status)   q.status   = status;
    const [data, total] = await Promise.all([CustomerAdvance.find(q).sort({ advanceDate: -1 }).populate('customer','name').skip((page-1)*limit).limit(Number(limit)).lean(), CustomerAdvance.countDocuments(q)]);
    return pg13c(res, data, total, page, limit);
  } catch(e) { return se13c(res, e); }
});
router.post('/admin/accounts-receivable/advances', protect, admin, async (req, res) => {
  try { const doc = await CustomerAdvance.create({...req.body, createdBy: req.admin._id}); return cr13c(res, doc, 'Advance created'); }
  catch(e) { return se13c(res, e); }
});
router.get('/admin/accounts-receivable/advances/:id', protect, admin, async (req, res) => {
  try { const doc = await CustomerAdvance.findOne({_id:req.params.id, isDeleted:false}).populate('customer','name email'); if(!doc) return nf13c(res,'Customer Advance'); return ok13c(res, doc); }
  catch(e) { return se13c(res, e); }
});

// Customer Ledger
router.get('/admin/accounts-receivable/ledger',              protect, admin, custLedCtrl.getLedger);
router.get('/admin/accounts-receivable/ledger/statement',    protect, admin, custLedCtrl.getAccountStatement);
router.get('/admin/accounts-receivable/ledger/:id',          protect, admin, custLedCtrl.getLedgerEntry);

// Customer Statements
router.get(   '/admin/accounts-receivable/statements',            protect, admin, custLedCtrl.getStatements);
router.post(  '/admin/accounts-receivable/statements/generate',   protect, admin, custLedCtrl.generateStatement);
router.get(   '/admin/accounts-receivable/statements/:id',        protect, admin, custLedCtrl.getStatement);
router.delete('/admin/accounts-receivable/statements/:id',        protect, admin, custLedCtrl.deleteStatement);

// Customer Aging
router.get( '/admin/accounts-receivable/aging/report',            protect, admin, custAgingCtrl.getAgingReport);
router.post('/admin/accounts-receivable/aging/snapshot',          protect, admin, custAgingCtrl.saveAgingSnapshot);
router.get( '/admin/accounts-receivable/aging/snapshots',         protect, admin, custAgingCtrl.getAgingSnapshots);
router.get( '/admin/accounts-receivable/aging/snapshots/:id',     protect, admin, custAgingCtrl.getAgingSnapshot);

// Collection Activities
router.get(   '/admin/accounts-receivable/collections/activities',          protect, admin, collCtrl.getActivities);
router.post(  '/admin/accounts-receivable/collections/activities',          protect, admin, collCtrl.createActivity);
router.get(   '/admin/accounts-receivable/collections/activities/:id',      protect, admin, collCtrl.getActivity);
router.put(   '/admin/accounts-receivable/collections/activities/:id',      protect, admin, collCtrl.updateActivity);
router.delete('/admin/accounts-receivable/collections/activities/:id',      protect, admin, collCtrl.deleteActivity);

// Collection Reminders
router.get(  '/admin/accounts-receivable/collections/reminders',            protect, admin, collCtrl.getReminders);
router.post( '/admin/accounts-receivable/collections/reminders',            protect, admin, collCtrl.createReminder);
router.post( '/admin/accounts-receivable/collections/reminders/:id/send',   protect, admin, collCtrl.sendReminder);
router.delete('/admin/accounts-receivable/collections/reminders/:id',       protect, admin, collCtrl.deleteReminder);

// Promise to Pay
router.get(  '/admin/accounts-receivable/collections/promises',             protect, admin, collCtrl.getPromises);
router.post( '/admin/accounts-receivable/collections/promises',             protect, admin, collCtrl.createPromise);
router.put(  '/admin/accounts-receivable/collections/promises/:id',         protect, admin, collCtrl.updatePromise);

// Write-Offs
router.get(  '/admin/accounts-receivable/write-offs',                       protect, admin, collCtrl.getWriteOffs);
router.post( '/admin/accounts-receivable/write-offs',                       protect, admin, collCtrl.createWriteOff);
router.post( '/admin/accounts-receivable/write-offs/:id/approve',           protect, admin, collCtrl.approveWriteOff);
router.post( '/admin/accounts-receivable/write-offs/:id/post-gl',           protect, admin, collCtrl.postWriteOff);

// Bad Debt
router.get(  '/admin/accounts-receivable/bad-debts',                        protect, admin, collCtrl.getBadDebts);
router.post( '/admin/accounts-receivable/bad-debts',                        protect, admin, collCtrl.createBadDebt);
router.post( '/admin/accounts-receivable/bad-debts/:id/approve',            protect, admin, collCtrl.approveBadDebt);
router.post( '/admin/accounts-receivable/bad-debts/:id/post-gl',            protect, admin, collCtrl.postBadDebt);

// Credit Limits
router.get(   '/admin/accounts-receivable/credit/limits',                   protect, admin, creditCtrl.getCreditLimits);
router.post(  '/admin/accounts-receivable/credit/limits',                   protect, admin, creditCtrl.createCreditLimit);
router.get(   '/admin/accounts-receivable/credit/limits/customer/:customerId', protect, admin, creditCtrl.getCreditLimitByCustomer);
router.get(   '/admin/accounts-receivable/credit/limits/:id',               protect, admin, creditCtrl.getCreditLimit);
router.put(   '/admin/accounts-receivable/credit/limits/:id',               protect, admin, creditCtrl.updateCreditLimit);
router.delete('/admin/accounts-receivable/credit/limits/:id',               protect, admin, creditCtrl.deleteCreditLimit);
router.post(  '/admin/accounts-receivable/credit/limits/:id/block',         protect, admin, creditCtrl.blockCustomer);
router.post(  '/admin/accounts-receivable/credit/limits/:id/unblock',       protect, admin, creditCtrl.unblockCustomer);

// Credit Reviews
router.get(  '/admin/accounts-receivable/credit/reviews',                   protect, admin, creditCtrl.getReviews);
router.post( '/admin/accounts-receivable/credit/reviews',                   protect, admin, creditCtrl.createReview);
router.post( '/admin/accounts-receivable/credit/reviews/:id/approve',       protect, admin, creditCtrl.approveReview);
router.post( '/admin/accounts-receivable/credit/reviews/:id/reject',        protect, admin, creditCtrl.rejectReview);

// Receipt Batches
router.get('/admin/accounts-receivable/receipt-batches', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const q = { isDeleted: false };
    if (status) q.status = status;
    const [data, total] = await Promise.all([ReceiptBatch.find(q).sort({ batchDate: -1 }).skip((page-1)*limit).limit(Number(limit)).lean(), ReceiptBatch.countDocuments(q)]);
    return pg13c(res, data, total, page, limit);
  } catch(e) { return se13c(res, e); }
});
router.post('/admin/accounts-receivable/receipt-batches', protect, admin, async (req, res) => {
  try { const doc = await ReceiptBatch.create({...req.body, processedBy: req.admin._id}); return cr13c(res, doc, 'Batch created'); }
  catch(e) { return se13c(res, e); }
});
router.get('/admin/accounts-receivable/receipt-batches/:id', protect, admin, async (req, res) => {
  try { const doc = await ReceiptBatch.findOne({_id:req.params.id, isDeleted:false}); if(!doc) return nf13c(res,'Receipt Batch'); return ok13c(res, doc); }
  catch(e) { return se13c(res, e); }
});
router.put('/admin/accounts-receivable/receipt-batches/:id', protect, admin, async (req, res) => {
  try {
    const doc = await ReceiptBatch.findOne({_id:req.params.id, isDeleted:false});
    if(!doc) return nf13c(res,'Receipt Batch');
    Object.assign(doc, req.body); await doc.save(); return ok13c(res, doc, 'Batch updated');
  } catch(e) { return se13c(res, e); }
});

// Receipt Vouchers
router.get('/admin/accounts-receivable/receipt-vouchers', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, status } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    if (status)   q.status   = status;
    const [data, total] = await Promise.all([ReceiptVoucher.find(q).sort({ voucherDate: -1 }).populate('customer','name').skip((page-1)*limit).limit(Number(limit)).lean(), ReceiptVoucher.countDocuments(q)]);
    return pg13c(res, data, total, page, limit);
  } catch(e) { return se13c(res, e); }
});
router.post('/admin/accounts-receivable/receipt-vouchers', protect, admin, async (req, res) => {
  try { const doc = await ReceiptVoucher.create({...req.body, createdBy: req.admin._id}); return cr13c(res, doc, 'Voucher created'); }
  catch(e) { return se13c(res, e); }
});
router.get('/admin/accounts-receivable/receipt-vouchers/:id', protect, admin, async (req, res) => {
  try { const doc = await ReceiptVoucher.findOne({_id:req.params.id, isDeleted:false}).populate('customer','name email'); if(!doc) return nf13c(res,'Receipt Voucher'); return ok13c(res, doc); }
  catch(e) { return se13c(res, e); }
});

// Sales Register
router.get('/admin/accounts-receivable/sales-register', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    if (startDate || endDate) { q.invoiceDate = {}; if(startDate) q.invoiceDate.$gte = new Date(startDate); if(endDate) q.invoiceDate.$lte = new Date(endDate); }
    const [data, total] = await Promise.all([SalesRegister.find(q).sort({ invoiceDate: -1 }).populate('customer','name').skip((page-1)*limit).limit(Number(limit)).lean(), SalesRegister.countDocuments(q)]);
    return pg13c(res, data, total, page, limit);
  } catch(e) { return se13c(res, e); }
});

// Receipt Register
router.get('/admin/accounts-receivable/receipt-register', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, customer, startDate, endDate } = req.query;
    const q = { isDeleted: false };
    if (customer) q.customer = customer;
    if (startDate || endDate) { q.receiptDate = {}; if(startDate) q.receiptDate.$gte = new Date(startDate); if(endDate) q.receiptDate.$lte = new Date(endDate); }
    const [data, total] = await Promise.all([ReceiptRegister.find(q).sort({ receiptDate: -1 }).populate('customer','name').skip((page-1)*limit).limit(Number(limit)).lean(), ReceiptRegister.countDocuments(q)]);
    return pg13c(res, data, total, page, limit);
  } catch(e) { return se13c(res, e); }
});

// AR Settings
router.get('/admin/accounts-receivable/settings', protect, admin, async (req, res) => {
  try { const data = await ARSetting.find({ isDeleted: false }).lean(); return ok13c(res, data); }
  catch(e) { return se13c(res, e); }
});
router.put('/admin/accounts-receivable/settings/:key', protect, admin, async (req, res) => {
  try {
    const doc = await ARSetting.findOneAndUpdate({ key: req.params.key }, { $set: { value: req.body.value, description: req.body.description } }, { upsert: true, new: true });
    return ok13c(res, doc, 'Setting updated');
  } catch(e) { return se13c(res, e); }
});

// Collection Rules
router.get('/admin/accounts-receivable/collection-rules', protect, admin, async (req, res) => {
  try { const data = await CollectionRule.find({ isDeleted: false, isActive: true }).sort({ priority: 1 }).lean(); return ok13c(res, data); }
  catch(e) { return se13c(res, e); }
});
router.post('/admin/accounts-receivable/collection-rules', protect, admin, async (req, res) => {
  try { const doc = await CollectionRule.create(req.body); return cr13c(res, doc, 'Collection rule created'); }
  catch(e) { return se13c(res, e); }
});
router.put('/admin/accounts-receivable/collection-rules/:id', protect, admin, async (req, res) => {
  try {
    const doc = await CollectionRule.findOne({_id:req.params.id, isDeleted:false});
    if(!doc) return nf13c(res,'Collection Rule');
    Object.assign(doc, req.body); await doc.save(); return ok13c(res, doc, 'Updated');
  } catch(e) { return se13c(res, e); }
});
router.delete('/admin/accounts-receivable/collection-rules/:id', protect, admin, async (req, res) => {
  try {
    const doc = await CollectionRule.findOne({_id:req.params.id, isDeleted:false});
    if(!doc) return nf13c(res,'Collection Rule');
    doc.isDeleted = true; await doc.save(); return nc13c(res,'Deleted');
  } catch(e) { return se13c(res, e); }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SPRINT 13D â€” Enterprise Tax & Compliance Engine
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const TaxCode             = require('../models/TaxCode');
const TaxRate             = require('../models/TaxRate');
const TaxGroup            = require('../models/TaxGroup');
const TaxJurisdiction     = require('../models/TaxJurisdiction');
const TaxRule             = require('../models/TaxRule');
const TaxExemption        = require('../models/TaxExemption');
const TaxConfiguration    = require('../models/TaxConfiguration');
const taxDashCtrl         = require('../controllers/taxDashboardController');
const gstCtrl             = require('../controllers/gstController');
const tdsCtrl             = require('../controllers/tdsController');
const complianceCtrl      = require('../controllers/complianceController');
const einvoiceCtrl        = require('../controllers/einvoiceController');
const ewayBillCtrl        = require('../controllers/ewayBillController');
const taxReportCtrl       = require('../controllers/taxReportController');

const { paginated: pgT, created: crT, ok: okT, notFound: nfT, serverError: seT, noContent: ncT } = require('../utils/response');

// â”€â”€ Tax Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/dashboard',            protect, admin, taxDashCtrl.getDashboard);
router.get('/admin/tax/compliance-status',    protect, admin, taxDashCtrl.getComplianceStatus);

// â”€â”€ Tax Codes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/codes', protect, admin, async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.taxType) q.taxType = req.query.taxType;
    if (req.query.isActive !== undefined) q.isActive = req.query.isActive === 'true';
    const data = await TaxCode.find(q).sort({ code: 1 });
    return okT(res, data);
  } catch(e) { return seT(res, e); }
});
router.post('/admin/tax/codes', protect, admin, async (req, res) => {
  try { const doc = await TaxCode.create(req.body); return crT(res, doc, 'Tax code created'); }
  catch(e) { return seT(res, e); }
});
router.put('/admin/tax/codes/:id', protect, admin, async (req, res) => {
  try {
    const doc = await TaxCode.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return nfT(res, 'Tax code');
    return okT(res, doc);
  } catch(e) { return seT(res, e); }
});
router.delete('/admin/tax/codes/:id', protect, admin, async (req, res) => {
  try {
    const doc = await TaxCode.findOneAndUpdate({ _id: req.params.id }, { isDeleted: true }, { new: true });
    if (!doc) return nfT(res, 'Tax code');
    return res.status(204).send();
  } catch(e) { return seT(res, e); }
});

// â”€â”€ Tax Rates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/rates', protect, admin, async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.taxCode) q.taxCode = req.query.taxCode;
    if (req.query.isActive !== undefined) q.isActive = req.query.isActive === 'true';
    const data = await TaxRate.find(q).sort({ effectiveFrom: -1 }).populate('taxCode','code name taxType');
    return okT(res, data);
  } catch(e) { return seT(res, e); }
});
router.post('/admin/tax/rates', protect, admin, async (req, res) => {
  try { const doc = await TaxRate.create(req.body); return crT(res, doc, 'Tax rate created'); }
  catch(e) { return seT(res, e); }
});
router.put('/admin/tax/rates/:id', protect, admin, async (req, res) => {
  try {
    const doc = await TaxRate.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return nfT(res, 'Tax rate');
    return okT(res, doc);
  } catch(e) { return seT(res, e); }
});

// â”€â”€ Tax Groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/groups', protect, admin, async (req, res) => {
  try {
    const data = await TaxGroup.find({ isDeleted: false }).sort({ name: 1 }).populate('taxCodes','code name');
    return okT(res, data);
  } catch(e) { return seT(res, e); }
});
router.post('/admin/tax/groups', protect, admin, async (req, res) => {
  try { const doc = await TaxGroup.create(req.body); return crT(res, doc, 'Tax group created'); }
  catch(e) { return seT(res, e); }
});
router.put('/admin/tax/groups/:id', protect, admin, async (req, res) => {
  try {
    const doc = await TaxGroup.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return nfT(res, 'Tax group');
    return okT(res, doc);
  } catch(e) { return seT(res, e); }
});

// â”€â”€ Tax Jurisdictions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/jurisdictions', protect, admin, async (req, res) => {
  try { const data = await TaxJurisdiction.find({ isDeleted: false }).sort({ stateCode: 1 }); return okT(res, data); }
  catch(e) { return seT(res, e); }
});
router.post('/admin/tax/jurisdictions', protect, admin, async (req, res) => {
  try { const doc = await TaxJurisdiction.create(req.body); return crT(res, doc, 'Jurisdiction created'); }
  catch(e) { return seT(res, e); }
});
router.put('/admin/tax/jurisdictions/:id', protect, admin, async (req, res) => {
  try {
    const doc = await TaxJurisdiction.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return nfT(res, 'Tax jurisdiction');
    return okT(res, doc);
  } catch(e) { return seT(res, e); }
});

// â”€â”€ Tax Rules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/rules', protect, admin, async (req, res) => {
  try {
    const q = { isDeleted: false };
    if (req.query.taxType)     q.taxType     = req.query.taxType;
    if (req.query.isActive !== undefined) q.isActive = req.query.isActive === 'true';
    const data = await TaxRule.find(q).sort({ priority: 1 });
    return okT(res, data);
  } catch(e) { return seT(res, e); }
});
router.post('/admin/tax/rules', protect, admin, async (req, res) => {
  try { const doc = await TaxRule.create(req.body); return crT(res, doc, 'Tax rule created'); }
  catch(e) { return seT(res, e); }
});
router.put('/admin/tax/rules/:id', protect, admin, async (req, res) => {
  try {
    const doc = await TaxRule.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return nfT(res, 'Tax rule');
    return okT(res, doc);
  } catch(e) { return seT(res, e); }
});

// â”€â”€ Tax Exemptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/exemptions', protect, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, exemptionType, isActive } = req.query;
    const q = { isDeleted: false };
    if (exemptionType) q.exemptionType = exemptionType;
    if (isActive !== undefined) q.isActive = isActive === 'true';
    const [data, total] = await Promise.all([
      TaxExemption.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      TaxExemption.countDocuments(q),
    ]);
    return pgT(res, data, total, page, limit);
  } catch(e) { return seT(res, e); }
});
router.post('/admin/tax/exemptions', protect, admin, async (req, res) => {
  try { const doc = await TaxExemption.create(req.body); return crT(res, doc, 'Tax exemption created'); }
  catch(e) { return seT(res, e); }
});
router.put('/admin/tax/exemptions/:id', protect, admin, async (req, res) => {
  try {
    const doc = await TaxExemption.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!doc) return nfT(res, 'Tax exemption');
    return okT(res, doc);
  } catch(e) { return seT(res, e); }
});
router.delete('/admin/tax/exemptions/:id', protect, admin, async (req, res) => {
  try {
    const doc = await TaxExemption.findOneAndUpdate({ _id: req.params.id }, { isDeleted: true }, { new: true });
    if (!doc) return nfT(res, 'Tax exemption');
    return res.status(204).send();
  } catch(e) { return seT(res, e); }
});

// â”€â”€ Tax Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/configuration', protect, admin, async (req, res) => {
  try {
    const q = {};
    if (req.query.category) q.category = req.query.category;
    const data = await TaxConfiguration.find(q).sort({ category: 1, key: 1 });
    return okT(res, data);
  } catch(e) { return seT(res, e); }
});
router.put('/admin/tax/configuration/:key', protect, admin, async (req, res) => {
  try {
    const doc = await TaxConfiguration.findOneAndUpdate(
      { key: req.params.key },
      { $set: { value: req.body.value, description: req.body.description, category: req.body.category } },
      { upsert: true, new: true },
    );
    return okT(res, doc, 'Configuration updated');
  } catch(e) { return seT(res, e); }
});

// â”€â”€ GST Registrations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/gst/registrations',           protect, admin, gstCtrl.getRegistrations);
router.post('/admin/tax/gst/registrations',          protect, admin, gstCtrl.createRegistration);
router.put('/admin/tax/gst/registrations/:id',       protect, admin, gstCtrl.updateRegistration);
router.delete('/admin/tax/gst/registrations/:id',    protect, admin, gstCtrl.deleteRegistration);

// â”€â”€ GST Returns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/gst/returns',                 protect, admin, gstCtrl.getReturns);
router.post('/admin/tax/gst/returns',                protect, admin, gstCtrl.createReturn);
router.get('/admin/tax/gst/returns/:id',             protect, admin, gstCtrl.getReturn);
router.put('/admin/tax/gst/returns/:id',             protect, admin, gstCtrl.updateReturn);
router.post('/admin/tax/gst/returns/:id/file',       protect, admin, gstCtrl.fileReturn);
router.delete('/admin/tax/gst/returns/:id',          protect, admin, gstCtrl.deleteReturn);

// â”€â”€ GST Invoices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/gst/invoices',                protect, admin, gstCtrl.getGSTInvoices);
router.post('/admin/tax/gst/invoices',               protect, admin, gstCtrl.createGSTInvoice);
router.put('/admin/tax/gst/invoices/:id',            protect, admin, gstCtrl.updateGSTInvoice);

// â”€â”€ GST Adjustments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/gst/adjustments',             protect, admin, gstCtrl.getAdjustments);
router.post('/admin/tax/gst/adjustments',            protect, admin, gstCtrl.createAdjustment);
router.post('/admin/tax/gst/adjustments/:id/approve',protect, admin, gstCtrl.approveAdjustment);

// â”€â”€ ITC Ledger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/gst/itc-ledger',              protect, admin, gstCtrl.getITCLedger);
router.post('/admin/tax/gst/itc-ledger',             protect, admin, gstCtrl.createITCEntry);

// â”€â”€ Output Tax Ledger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/gst/output-tax-ledger',       protect, admin, gstCtrl.getOutputTaxLedger);
router.post('/admin/tax/gst/output-tax-ledger',      protect, admin, gstCtrl.createOutputTaxEntry);

// â”€â”€ GST Settlements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/gst/settlements',             protect, admin, gstCtrl.getSettlements);
router.post('/admin/tax/gst/settlements',            protect, admin, gstCtrl.createSettlement);
router.get('/admin/tax/gst/settlements/:id',         protect, admin, gstCtrl.getSettlement);
router.post('/admin/tax/gst/settlements/:id/settle', protect, admin, gstCtrl.settleGST);

// â”€â”€ ITC Register (AP module) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/gst/itc-register',            protect, admin, gstCtrl.getInputCreditRegister);

// â”€â”€ TDS Sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/tds/sections',                protect, admin, tdsCtrl.getSections);
router.post('/admin/tax/tds/sections',               protect, admin, tdsCtrl.createSection);
router.put('/admin/tax/tds/sections/:id',            protect, admin, tdsCtrl.updateSection);

// â”€â”€ TDS Rates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/tds/rates',                   protect, admin, tdsCtrl.getRates);
router.post('/admin/tax/tds/rates',                  protect, admin, tdsCtrl.createRate);

// â”€â”€ TDS Deductions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/tds/deductions',              protect, admin, tdsCtrl.getDeductions);
router.post('/admin/tax/tds/deductions',             protect, admin, tdsCtrl.createDeduction);
router.get('/admin/tax/tds/deductions/:id',          protect, admin, tdsCtrl.getDeduction);
router.put('/admin/tax/tds/deductions/:id',          protect, admin, tdsCtrl.updateDeduction);
router.delete('/admin/tax/tds/deductions/:id',       protect, admin, tdsCtrl.deleteDeduction);

// â”€â”€ TDS Deposits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/tds/deposits',                protect, admin, tdsCtrl.getDeposits);
router.post('/admin/tax/tds/deposits',               protect, admin, tdsCtrl.createDeposit);
router.post('/admin/tax/tds/deposits/:id/acknowledge', protect, admin, tdsCtrl.acknowledgeDeposit);

// â”€â”€ TDS Certificates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/tds/certificates',            protect, admin, tdsCtrl.getCertificates);
router.post('/admin/tax/tds/certificates',           protect, admin, tdsCtrl.createCertificate);
router.post('/admin/tax/tds/certificates/:id/issue', protect, admin, tdsCtrl.issueCertificate);
router.delete('/admin/tax/tds/certificates/:id',     protect, admin, tdsCtrl.deleteCertificate);

// â”€â”€ Compliance Calendar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/compliance/calendars',        protect, admin, complianceCtrl.getCalendars);
router.post('/admin/tax/compliance/calendars',       protect, admin, complianceCtrl.createCalendar);
router.put('/admin/tax/compliance/calendars/:id',    protect, admin, complianceCtrl.updateCalendar);
router.delete('/admin/tax/compliance/calendars/:id', protect, admin, complianceCtrl.deleteCalendar);

// â”€â”€ Compliance Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/compliance/tasks',                   protect, admin, complianceCtrl.getTasks);
router.post('/admin/tax/compliance/tasks',                  protect, admin, complianceCtrl.createTask);
router.get('/admin/tax/compliance/tasks/reminders',         protect, admin, complianceCtrl.getReminders);
router.get('/admin/tax/compliance/tasks/:id',               protect, admin, complianceCtrl.getTask);
router.put('/admin/tax/compliance/tasks/:id',               protect, admin, complianceCtrl.updateTask);
router.post('/admin/tax/compliance/tasks/:id/complete',     protect, admin, complianceCtrl.completeTask);
router.delete('/admin/tax/compliance/tasks/:id',            protect, admin, complianceCtrl.deleteTask);

// â”€â”€ Tax Audits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/compliance/audits',           protect, admin, complianceCtrl.getAudits);
router.post('/admin/tax/compliance/audits',          protect, admin, complianceCtrl.createAudit);
router.put('/admin/tax/compliance/audits/:id',       protect, admin, complianceCtrl.updateAudit);

// â”€â”€ E-Invoice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/einvoice',                    protect, admin, einvoiceCtrl.getEInvoices);
router.post('/admin/tax/einvoice',                   protect, admin, einvoiceCtrl.createEInvoice);
router.get('/admin/tax/einvoice/:id',                protect, admin, einvoiceCtrl.getEInvoice);
router.post('/admin/tax/einvoice/:id/generate-irn', protect, admin, einvoiceCtrl.generateIRN);
router.post('/admin/tax/einvoice/:id/cancel',        protect, admin, einvoiceCtrl.cancelEInvoice);
router.delete('/admin/tax/einvoice/:id',             protect, admin, einvoiceCtrl.deleteEInvoice);

// â”€â”€ E-Way Bill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/ewaybill',                    protect, admin, ewayBillCtrl.getEWayBills);
router.post('/admin/tax/ewaybill',                   protect, admin, ewayBillCtrl.createEWayBill);
router.get('/admin/tax/ewaybill/:id',                protect, admin, ewayBillCtrl.getEWayBill);
router.post('/admin/tax/ewaybill/:id/generate',      protect, admin, ewayBillCtrl.generateEWB);
router.put('/admin/tax/ewaybill/:id/transport',      protect, admin, ewayBillCtrl.updateTransport);
router.post('/admin/tax/ewaybill/:id/cancel',        protect, admin, ewayBillCtrl.cancelEWayBill);
router.delete('/admin/tax/ewaybill/:id',             protect, admin, ewayBillCtrl.deleteEWayBill);

// â”€â”€ Tax Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/tax/reports/gstr1',               protect, admin, taxReportCtrl.getGSTR1Summary);
router.get('/admin/tax/reports/gstr3b',              protect, admin, taxReportCtrl.getGSTR3BSummary);
router.get('/admin/tax/reports/itc-register',        protect, admin, taxReportCtrl.getInputCreditReport);
router.get('/admin/tax/reports/tds-register',        protect, admin, taxReportCtrl.getTDSRegister);
router.get('/admin/tax/reports/gst-settlement',      protect, admin, taxReportCtrl.getSettlementReport);
router.get('/admin/tax/reports/tax-audit',           protect, admin, taxReportCtrl.getTaxAuditReport);
router.get('/admin/tax/reports/compliance-summary',  protect, admin, taxReportCtrl.getComplianceSummary);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SPRINT 13E â€” ENTERPRISE BANKING & TREASURY
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const Bank                  = require('../models/Bank');
const BankBranch            = require('../models/BankBranch');
const BankAccount           = require('../models/BankAccount');
const BankTransaction       = require('../models/BankTransaction');
const BankStatement         = require('../models/BankStatement');
const BankStatementLine     = require('../models/BankStatementLine');
const BankReconciliation    = require('../models/BankReconciliation');
const ReconciliationMatch   = require('../models/ReconciliationMatch');
const CashAccount           = require('../models/CashAccount');
const CashTransaction       = require('../models/CashTransaction');
const PettyCash             = require('../models/PettyCash');
const PettyCashVoucher      = require('../models/PettyCashVoucher');
const CashTransfer          = require('../models/CashTransfer');
const ChequeBook            = require('../models/ChequeBook');
const Cheque                = require('../models/Cheque');
const ElectronicPayment     = require('../models/ElectronicPayment');
const PaymentGateway        = require('../models/PaymentGateway');
const PaymentGatewayTransaction = require('../models/PaymentGatewayTransaction');
const TreasuryPosition      = require('../models/TreasuryPosition');
const CashForecast          = require('../models/CashForecast');
const LiquidityForecast     = require('../models/LiquidityForecast');
const Investment            = require('../models/Investment');
const FixedDeposit          = require('../models/FixedDeposit');
const BankGuarantee         = require('../models/BankGuarantee');
const LetterOfCredit        = require('../models/LetterOfCredit');
const TreasurySetting       = require('../models/TreasurySetting');
const BankCharge            = require('../models/BankCharge');
const InterestPosting       = require('../models/InterestPosting');
const CurrencyAccount       = require('../models/CurrencyAccount');
const FXTransaction         = require('../models/FXTransaction');
const FXGainLoss            = require('../models/FXGainLoss');
// Reuse existing: ExchangeRate (Sprint 13A), Currency (earlier sprint)

const bankingDashCtrl  = require('../controllers/bankingDashboardController');
const bankCtrl         = require('../controllers/bankController');
const bankAccCtrl      = require('../controllers/bankAccountController');
const bankReconCtrl    = require('../controllers/bankReconciliationController');
const cashCtrl         = require('../controllers/cashController');
const treasuryCtrl     = require('../controllers/treasuryController');
const investmentCtrl   = require('../controllers/investmentController');
const fxCtrl           = require('../controllers/fxController');
const bankingReportCtrl= require('../controllers/bankingReportController');

const pgB  = (...a) => require('../utils/response').paginated(...a);
const crB  = (...a) => require('../utils/response').created(...a);
const okB  = (...a) => require('../utils/response').ok(...a);
const nfB  = (...a) => require('../utils/response').notFound(...a);
const seB  = (...a) => require('../utils/response').serverError(...a);
const ncB  = (...a) => require('../utils/response').noContent(...a);

// â”€â”€ Banking Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/dashboard',           protect, admin, bankingDashCtrl.getDashboard);
router.get('/admin/banking/compliance-status',   protect, admin, bankingDashCtrl.getComplianceStatus);

// â”€â”€ Banks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/banks',               protect, admin, bankCtrl.getBanks);
router.post('/admin/banking/banks',              protect, admin, bankCtrl.createBank);
router.put('/admin/banking/banks/:id',           protect, admin, bankCtrl.updateBank);
router.delete('/admin/banking/banks/:id',        protect, admin, bankCtrl.deleteBank);

// â”€â”€ Bank Branches â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/branches',            protect, admin, bankCtrl.getBranches);
router.post('/admin/banking/branches',           protect, admin, bankCtrl.createBranch);
router.put('/admin/banking/branches/:id',        protect, admin, bankCtrl.updateBranch);
router.delete('/admin/banking/branches/:id',     protect, admin, bankCtrl.deleteBranch);

// â”€â”€ Bank Accounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/accounts',            protect, admin, bankAccCtrl.getAccounts);
router.post('/admin/banking/accounts',           protect, admin, bankAccCtrl.createAccount);
router.get('/admin/banking/accounts/:id',        protect, admin, bankAccCtrl.getAccount);
router.put('/admin/banking/accounts/:id',        protect, admin, bankAccCtrl.updateAccount);

// â”€â”€ Bank Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/transactions',        protect, admin, bankAccCtrl.getTransactions);
router.post('/admin/banking/transactions',       protect, admin, bankAccCtrl.createTransaction);
router.put('/admin/banking/transactions/:id',    protect, admin, bankAccCtrl.updateTransaction);
router.delete('/admin/banking/transactions/:id', protect, admin, bankAccCtrl.deleteTransaction);

// â”€â”€ Bank Statements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/statements',          protect, admin, bankAccCtrl.getStatements);
router.post('/admin/banking/statements',         protect, admin, bankAccCtrl.createStatement);
router.get('/admin/banking/statements/:id/lines',protect, admin, bankAccCtrl.getStatementLines);

// â”€â”€ Bank Charges â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/charges',             protect, admin, bankAccCtrl.getCharges);
router.post('/admin/banking/charges',            protect, admin, bankAccCtrl.createCharge);

// â”€â”€ Interest Postings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/interest-postings',   protect, admin, bankAccCtrl.getInterestPostings);
router.post('/admin/banking/interest-postings',  protect, admin, bankAccCtrl.createInterestPosting);

// â”€â”€ Electronic Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/electronic-payments',       protect, admin, bankAccCtrl.getElectronicPayments);
router.post('/admin/banking/electronic-payments',      protect, admin, bankAccCtrl.createElectronicPayment);
router.put('/admin/banking/electronic-payments/:id/status', protect, admin, bankAccCtrl.updatePaymentStatus);

// â”€â”€ Cheque Books â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/cheque-books',        protect, admin, bankAccCtrl.getChequeBooks);
router.post('/admin/banking/cheque-books',       protect, admin, bankAccCtrl.createChequeBook);

// â”€â”€ Cheques â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/cheques',             protect, admin, bankAccCtrl.getCheques);
router.post('/admin/banking/cheques',            protect, admin, bankAccCtrl.createCheque);
router.put('/admin/banking/cheques/:id/status',  protect, admin, bankAccCtrl.updateChequeStatus);

// â”€â”€ Bank Reconciliation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/reconciliation',      protect, admin, bankReconCtrl.getReconciliations);
router.post('/admin/banking/reconciliation',     protect, admin, bankReconCtrl.createReconciliation);
router.get('/admin/banking/reconciliation/:id',  protect, admin, bankReconCtrl.getReconciliation);
router.post('/admin/banking/reconciliation/:id/auto-match',  protect, admin, bankReconCtrl.autoMatch);
router.post('/admin/banking/reconciliation/:id/manual-match',protect, admin, bankReconCtrl.manualMatch);
router.post('/admin/banking/reconciliation/:id/complete',    protect, admin, bankReconCtrl.completeReconciliation);
router.delete('/admin/banking/reconciliation/:id',           protect, admin, bankReconCtrl.deleteReconciliation);
router.get('/admin/banking/reconciliation/:id/unmatched',    protect, admin, bankReconCtrl.getUnmatchedTransactions);

// â”€â”€ Cash Accounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/cash-accounts',       protect, admin, cashCtrl.getCashAccounts);
router.post('/admin/banking/cash-accounts',      protect, admin, cashCtrl.createCashAccount);
router.put('/admin/banking/cash-accounts/:id',   protect, admin, cashCtrl.updateCashAccount);

// â”€â”€ Cash Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/cash-transactions',   protect, admin, cashCtrl.getCashTransactions);
router.post('/admin/banking/cash-transactions',  protect, admin, cashCtrl.createCashTransaction);

// â”€â”€ Cash Transfers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/cash-transfers',      protect, admin, cashCtrl.getCashTransfers);
router.post('/admin/banking/cash-transfers',     protect, admin, cashCtrl.createCashTransfer);
router.post('/admin/banking/cash-transfers/:id/complete', protect, admin, cashCtrl.completeTransfer);

// â”€â”€ Petty Cash Funds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/petty-cash',          protect, admin, cashCtrl.getPettyCashFunds);
router.post('/admin/banking/petty-cash',         protect, admin, cashCtrl.createPettyCashFund);
router.put('/admin/banking/petty-cash/:id',      protect, admin, cashCtrl.updatePettyCashFund);
router.post('/admin/banking/petty-cash/:id/replenish', protect, admin, cashCtrl.replenishFund);

// â”€â”€ Petty Cash Vouchers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/petty-cash-vouchers', protect, admin, cashCtrl.getVouchers);
router.post('/admin/banking/petty-cash-vouchers',protect, admin, cashCtrl.createVoucher);
router.post('/admin/banking/petty-cash-vouchers/:id/approve', protect, admin, cashCtrl.approveVoucher);

// â”€â”€ Treasury Positions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/treasury-positions',  protect, admin, treasuryCtrl.getTreasuryPositions);
router.post('/admin/banking/treasury-positions', protect, admin, treasuryCtrl.createTreasuryPosition);

// â”€â”€ Cash Forecasts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/cash-forecasts',      protect, admin, treasuryCtrl.getCashForecasts);
router.post('/admin/banking/cash-forecasts',     protect, admin, treasuryCtrl.createCashForecast);
router.put('/admin/banking/cash-forecasts/:id',  protect, admin, treasuryCtrl.updateCashForecast);
router.delete('/admin/banking/cash-forecasts/:id', protect, admin, treasuryCtrl.deleteCashForecast);

// â”€â”€ Liquidity Forecasts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/liquidity-forecasts', protect, admin, treasuryCtrl.getLiquidityForecasts);
router.post('/admin/banking/liquidity-forecasts',protect, admin, treasuryCtrl.createLiquidityForecast);

// â”€â”€ Bank Guarantees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/bank-guarantees',     protect, admin, treasuryCtrl.getBankGuarantees);
router.post('/admin/banking/bank-guarantees',    protect, admin, treasuryCtrl.createBankGuarantee);
router.get('/admin/banking/bank-guarantees/:id', protect, admin, treasuryCtrl.getBankGuarantee);
router.put('/admin/banking/bank-guarantees/:id', protect, admin, treasuryCtrl.updateBankGuarantee);
router.delete('/admin/banking/bank-guarantees/:id', protect, admin, treasuryCtrl.deleteBankGuarantee);

// â”€â”€ Letters of Credit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/letters-of-credit',   protect, admin, treasuryCtrl.getLettersOfCredit);
router.post('/admin/banking/letters-of-credit',  protect, admin, treasuryCtrl.createLetterOfCredit);
router.get('/admin/banking/letters-of-credit/:id',protect, admin, treasuryCtrl.getLetterOfCredit);
router.put('/admin/banking/letters-of-credit/:id',protect, admin, treasuryCtrl.updateLetterOfCredit);
router.delete('/admin/banking/letters-of-credit/:id', protect, admin, treasuryCtrl.deleteLetterOfCredit);

// â”€â”€ Treasury Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/settings',            protect, admin, treasuryCtrl.getSettings);
router.put('/admin/banking/settings/:key',       protect, admin, treasuryCtrl.upsertSetting);

// â”€â”€ Payment Gateways â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/gateways',            protect, admin, treasuryCtrl.getGateways);
router.post('/admin/banking/gateways',           protect, admin, treasuryCtrl.createGateway);
router.put('/admin/banking/gateways/:id',        protect, admin, treasuryCtrl.updateGateway);
router.get('/admin/banking/gateway-transactions',protect, admin, treasuryCtrl.getGatewayTransactions);
router.post('/admin/banking/gateway-transactions',protect, admin, treasuryCtrl.createGatewayTransaction);

// â”€â”€ Investments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/investments',         protect, admin, investmentCtrl.getInvestments);
router.post('/admin/banking/investments',        protect, admin, investmentCtrl.createInvestment);
router.get('/admin/banking/investments/:id',     protect, admin, investmentCtrl.getInvestment);
router.put('/admin/banking/investments/:id',     protect, admin, investmentCtrl.updateInvestment);
router.post('/admin/banking/investments/:id/redeem', protect, admin, investmentCtrl.redeemInvestment);
router.delete('/admin/banking/investments/:id',  protect, admin, investmentCtrl.deleteInvestment);

// â”€â”€ Fixed Deposits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/fixed-deposits',      protect, admin, investmentCtrl.getFixedDeposits);
router.post('/admin/banking/fixed-deposits',     protect, admin, investmentCtrl.createFixedDeposit);
router.get('/admin/banking/fixed-deposits/:id',  protect, admin, investmentCtrl.getFixedDeposit);
router.put('/admin/banking/fixed-deposits/:id',  protect, admin, investmentCtrl.updateFixedDeposit);
router.post('/admin/banking/fixed-deposits/:id/close', protect, admin, investmentCtrl.closeFixedDeposit);
router.delete('/admin/banking/fixed-deposits/:id', protect, admin, investmentCtrl.deleteFixedDeposit);
router.get('/admin/banking/fixed-deposits/:id/interest', protect, admin, investmentCtrl.getFDInterestPostings);

// â”€â”€ FX â€” Exchange Rates (reuse ExchangeRate model) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/fx/rates',            protect, admin, fxCtrl.getExchangeRates);
router.post('/admin/banking/fx/rates',           protect, admin, fxCtrl.createExchangeRate);
router.put('/admin/banking/fx/rates/:id',        protect, admin, fxCtrl.updateExchangeRate);
router.delete('/admin/banking/fx/rates/:id',     protect, admin, fxCtrl.deleteExchangeRate);

// â”€â”€ FX Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/fx/transactions',     protect, admin, fxCtrl.getFXTransactions);
router.post('/admin/banking/fx/transactions',    protect, admin, fxCtrl.createFXTransaction);
router.put('/admin/banking/fx/transactions/:id', protect, admin, fxCtrl.updateFXTransaction);
router.post('/admin/banking/fx/transactions/:id/settle', protect, admin, fxCtrl.settleFXTransaction);
router.delete('/admin/banking/fx/transactions/:id', protect, admin, fxCtrl.deleteFXTransaction);

// â”€â”€ FX Gain/Loss â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/fx/gain-loss',        protect, admin, fxCtrl.getFXGainLoss);

// â”€â”€ Currency Accounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/currency-accounts',   protect, admin, fxCtrl.getCurrencyAccounts);
router.post('/admin/banking/currency-accounts',  protect, admin, fxCtrl.createCurrencyAccount);
router.put('/admin/banking/currency-accounts/:id', protect, admin, fxCtrl.updateCurrencyAccount);
router.post('/admin/banking/currency-accounts/:id/revalue', protect, admin, fxCtrl.revalueCurrencyAccount);

// â”€â”€ Banking Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/banking/reports/bank-book',        protect, admin, bankingReportCtrl.getBankBook);
router.get('/admin/banking/reports/cash-book',        protect, admin, bankingReportCtrl.getCashBook);
router.get('/admin/banking/reports/daily-cash',       protect, admin, bankingReportCtrl.getDailyCashPosition);
router.get('/admin/banking/reports/treasury-position',protect, admin, bankingReportCtrl.getTreasuryPositionReport);
router.get('/admin/banking/reports/investments',      protect, admin, bankingReportCtrl.getInvestmentRegister);
router.get('/admin/banking/reports/fd-register',      protect, admin, bankingReportCtrl.getFDRegister);
router.get('/admin/banking/reports/guarantee-register',protect, admin, bankingReportCtrl.getGuaranteeRegister);
router.get('/admin/banking/reports/cash-flow',        protect, admin, bankingReportCtrl.getCashFlowReport);
router.get('/admin/banking/reports/forecast-actual',  protect, admin, bankingReportCtrl.getForecastVsActual);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SPRINT 13F â€” CFO DASHBOARD & FINANCIAL CONSOLIDATION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const cfoDashCtrl      = require('../controllers/cfoDashboardController');
const budgetCtrl       = require('../controllers/budgetController');
const cfoForecastCtrl  = require('../controllers/cfoForecastController');
const kpiCtrl          = require('../controllers/kpiController');
const consolidCtrl     = require('../controllers/consolidationController');
const cashFlowCtrl     = require('../controllers/cashFlowController');
const profitCtrl       = require('../controllers/profitabilityController');
const cfoReportCtrl    = require('../controllers/cfoReportController');

// â”€â”€ CFO Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/cfo/dashboard',              protect, admin, cfoDashCtrl.getDashboard);
router.get('/admin/cfo/dashboard/revenue-trend',protect, admin, cfoDashCtrl.getRevenueTrend);
router.get('/admin/cfo/dashboard/cash-flow',    protect, admin, cfoDashCtrl.getCashFlowChart);
router.get('/admin/cfo/dashboard/budget-actual',protect, admin, cfoDashCtrl.getBudgetVsActual);
router.get('/admin/cfo/dashboard/expense-breakdown', protect, admin, cfoDashCtrl.getExpenseBreakdown);
router.get('/admin/cfo/dashboard/kpi-trend',    protect, admin, cfoDashCtrl.getKPITrend);
router.get('/admin/cfo/dashboard/alerts',       protect, admin, cfoDashCtrl.getAlertSummary);

// â”€â”€ Budgets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/budgets',                       protect, admin, budgetCtrl.getBudgets);
router.post(  '/admin/cfo/budgets',                       protect, admin, budgetCtrl.createBudget);
router.get(   '/admin/cfo/budgets/variance',              protect, admin, budgetCtrl.getBudgetVariance);
router.get(   '/admin/cfo/budgets/:id',                   protect, admin, budgetCtrl.getBudget);
router.put(   '/admin/cfo/budgets/:id',                   protect, admin, budgetCtrl.updateBudget);
router.delete('/admin/cfo/budgets/:id',                   protect, admin, budgetCtrl.deleteBudget);
router.patch( '/admin/cfo/budgets/:id/approve',           protect, admin, budgetCtrl.approveBudget);
router.patch( '/admin/cfo/budgets/:id/lock',              protect, admin, budgetCtrl.lockBudget);
router.post(  '/admin/cfo/budgets/:id/revise',            protect, admin, budgetCtrl.reviseBudget);
router.get(   '/admin/cfo/budgets/:id/lines',             protect, admin, budgetCtrl.getBudgetLines);
router.post(  '/admin/cfo/budgets/:id/lines',             protect, admin, budgetCtrl.createBudgetLine);
router.put(   '/admin/cfo/budgets/:id/lines/:lineId',     protect, admin, budgetCtrl.updateBudgetLine);
router.delete('/admin/cfo/budgets/:id/lines/:lineId',     protect, admin, budgetCtrl.deleteBudgetLine);

// â”€â”€ Budget Scenarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/budget-scenarios',              protect, admin, budgetCtrl.getScenarios);
router.post(  '/admin/cfo/budget-scenarios',              protect, admin, budgetCtrl.createScenario);
router.put(   '/admin/cfo/budget-scenarios/:id',          protect, admin, budgetCtrl.updateScenario);
router.delete('/admin/cfo/budget-scenarios/:id',          protect, admin, budgetCtrl.deleteScenario);

// â”€â”€ Financial Forecasts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/forecasts',                     protect, admin, cfoForecastCtrl.getForecasts);
router.post(  '/admin/cfo/forecasts',                     protect, admin, cfoForecastCtrl.createForecast);
router.get(   '/admin/cfo/forecasts/variance',            protect, admin, cfoForecastCtrl.getForecastVariance);
router.get(   '/admin/cfo/forecasts/:id',                 protect, admin, cfoForecastCtrl.getForecast);
router.put(   '/admin/cfo/forecasts/:id',                 protect, admin, cfoForecastCtrl.updateForecast);
router.delete('/admin/cfo/forecasts/:id',                 protect, admin, cfoForecastCtrl.deleteForecast);
router.patch( '/admin/cfo/forecasts/:id/approve',         protect, admin, cfoForecastCtrl.approveForecast);
router.get(   '/admin/cfo/forecasts/:id/lines',           protect, admin, cfoForecastCtrl.getForecastLines);
router.post(  '/admin/cfo/forecasts/:id/lines',           protect, admin, cfoForecastCtrl.createForecastLine);
router.put(   '/admin/cfo/forecasts/:id/lines/:lineId',   protect, admin, cfoForecastCtrl.updateForecastLine);
router.delete('/admin/cfo/forecasts/:id/lines/:lineId',   protect, admin, cfoForecastCtrl.deleteForecastLine);

// â”€â”€ KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/kpis',                          protect, admin, kpiCtrl.getKPIs);
router.post(  '/admin/cfo/kpis',                          protect, admin, kpiCtrl.createKPI);
router.post(  '/admin/cfo/kpis/calculate',                protect, admin, kpiCtrl.calculateKPIs);
router.get(   '/admin/cfo/kpis/trend',                    protect, admin, kpiCtrl.getKPITrend);
router.get(   '/admin/cfo/kpis/:id',                      protect, admin, kpiCtrl.getKPI);
router.delete('/admin/cfo/kpis/:id',                      protect, admin, kpiCtrl.deleteKPI);

// â”€â”€ KPI Thresholds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/kpi-thresholds',                protect, admin, kpiCtrl.getThresholds);
router.post(  '/admin/cfo/kpi-thresholds',                protect, admin, kpiCtrl.createThreshold);
router.put(   '/admin/cfo/kpi-thresholds/:id',            protect, admin, kpiCtrl.updateThreshold);
router.delete('/admin/cfo/kpi-thresholds/:id',            protect, admin, kpiCtrl.deleteThreshold);

// â”€â”€ Financial Alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/alerts',                        protect, admin, kpiCtrl.getAlerts);
router.post(  '/admin/cfo/alerts',                        protect, admin, kpiCtrl.createAlert);
router.patch( '/admin/cfo/alerts/:id/acknowledge',        protect, admin, kpiCtrl.acknowledgeAlert);
router.patch( '/admin/cfo/alerts/:id/resolve',            protect, admin, kpiCtrl.resolveAlert);
router.delete('/admin/cfo/alerts/:id',                    protect, admin, kpiCtrl.deleteAlert);

// â”€â”€ Executive Dashboard Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/settings',                      protect, admin, kpiCtrl.getSettings);
router.post(  '/admin/cfo/settings',                      protect, admin, kpiCtrl.upsertSetting);
router.delete('/admin/cfo/settings/:id',                  protect, admin, kpiCtrl.deleteSetting);

// â”€â”€ Consolidation Groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/consolidation/groups',          protect, admin, consolidCtrl.getGroups);
router.post(  '/admin/cfo/consolidation/groups',          protect, admin, consolidCtrl.createGroup);
router.put(   '/admin/cfo/consolidation/groups/:id',      protect, admin, consolidCtrl.updateGroup);
router.delete('/admin/cfo/consolidation/groups/:id',      protect, admin, consolidCtrl.deleteGroup);

// â”€â”€ Consolidation Companies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/consolidation/companies',       protect, admin, consolidCtrl.getCompanies);
router.post(  '/admin/cfo/consolidation/companies',       protect, admin, consolidCtrl.createCompany);
router.put(   '/admin/cfo/consolidation/companies/:id',   protect, admin, consolidCtrl.updateCompany);
router.delete('/admin/cfo/consolidation/companies/:id',   protect, admin, consolidCtrl.deleteCompany);

// â”€â”€ Inter-Company Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/consolidation/ic-transactions', protect, admin, consolidCtrl.getICTransactions);
router.post(  '/admin/cfo/consolidation/ic-transactions', protect, admin, consolidCtrl.createICTransaction);
router.put(   '/admin/cfo/consolidation/ic-transactions/:id', protect, admin, consolidCtrl.updateICTransaction);
router.delete('/admin/cfo/consolidation/ic-transactions/:id', protect, admin, consolidCtrl.deleteICTransaction);

// â”€â”€ Elimination Entries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/consolidation/eliminations',    protect, admin, consolidCtrl.getEliminations);
router.post(  '/admin/cfo/consolidation/eliminations',    protect, admin, consolidCtrl.createElimination);
router.delete('/admin/cfo/consolidation/eliminations/:id',protect, admin, consolidCtrl.deleteElimination);

// â”€â”€ Consolidated Financials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/cfo/consolidation/pnl',                protect, admin, consolidCtrl.getConsolidatedPnL);
router.get('/admin/cfo/consolidation/balance-sheet',      protect, admin, consolidCtrl.getConsolidatedBalanceSheet);

// â”€â”€ Financial Snapshots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get( '/admin/cfo/snapshots',                       protect, admin, consolidCtrl.getSnapshots);
router.post('/admin/cfo/snapshots',                       protect, admin, consolidCtrl.createSnapshot);

// â”€â”€ Cash Flow Statements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/cash-flow',                     protect, admin, cashFlowCtrl.getStatements);
router.post(  '/admin/cfo/cash-flow',                     protect, admin, cashFlowCtrl.createStatement);
router.get(   '/admin/cfo/cash-flow/position',            protect, admin, cashFlowCtrl.getCashPosition);
router.get(   '/admin/cfo/cash-flow/liquidity',           protect, admin, cashFlowCtrl.getLiquidityPosition);
router.get(   '/admin/cfo/cash-flow/free-cash-flow',      protect, admin, cashFlowCtrl.getFreeCashFlow);
router.get(   '/admin/cfo/cash-flow/:id',                 protect, admin, cashFlowCtrl.getStatement);
router.put(   '/admin/cfo/cash-flow/:id',                 protect, admin, cashFlowCtrl.updateStatement);
router.patch( '/admin/cfo/cash-flow/:id/finalize',        protect, admin, cashFlowCtrl.finalizeStatement);
router.delete('/admin/cfo/cash-flow/:id',                 protect, admin, cashFlowCtrl.deleteStatement);

// â”€â”€ Profitability â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/profitability',                 protect, admin, profitCtrl.getAnalyses);
router.post(  '/admin/cfo/profitability',                 protect, admin, profitCtrl.createAnalysis);
router.get(   '/admin/cfo/profitability/summary',         protect, admin, profitCtrl.getProfitabilitySummary);
router.get(   '/admin/cfo/profitability/product',         protect, admin, profitCtrl.getProductProfitability);
router.get(   '/admin/cfo/profitability/customer',        protect, admin, profitCtrl.getCustomerProfitability);
router.get(   '/admin/cfo/profitability/dealer',          protect, admin, profitCtrl.getDealerProfitability);
router.get(   '/admin/cfo/profitability/factory',         protect, admin, profitCtrl.getFactoryProfitability);
router.get(   '/admin/cfo/profitability/warehouse',       protect, admin, profitCtrl.getWarehouseProfitability);
router.get(   '/admin/cfo/profitability/service',         protect, admin, profitCtrl.getServiceProfitability);
router.get(   '/admin/cfo/profitability/:id',             protect, admin, profitCtrl.getAnalysis);
router.put(   '/admin/cfo/profitability/:id',             protect, admin, profitCtrl.updateAnalysis);
router.delete('/admin/cfo/profitability/:id',             protect, admin, profitCtrl.deleteAnalysis);

// â”€â”€ Financial Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/reports',                       protect, admin, cfoReportCtrl.getReports);
router.post(  '/admin/cfo/reports',                       protect, admin, cfoReportCtrl.createReport);
router.get(   '/admin/cfo/reports/balance-sheet',         protect, admin, cfoReportCtrl.getBalanceSheet);
router.get(   '/admin/cfo/reports/profit-loss',           protect, admin, cfoReportCtrl.getProfitLoss);
router.get(   '/admin/cfo/reports/cash-flow',             protect, admin, cfoReportCtrl.getCashFlowReport);
router.get(   '/admin/cfo/reports/trial-balance',         protect, admin, cfoReportCtrl.getTrialBalance);
router.get(   '/admin/cfo/reports/budget-variance',       protect, admin, cfoReportCtrl.getBudgetVarianceReport);
router.get(   '/admin/cfo/reports/forecast-variance',     protect, admin, cfoReportCtrl.getForecastVarianceReport);
router.get(   '/admin/cfo/reports/executive-board-pack',  protect, admin, cfoReportCtrl.getExecutiveBoardPack);
router.get(   '/admin/cfo/reports/monthly-pack',          protect, admin, cfoReportCtrl.getMonthlyFinancialPack);
router.get(   '/admin/cfo/reports/:id',                   protect, admin, cfoReportCtrl.getReport);
router.put(   '/admin/cfo/reports/:id',                   protect, admin, cfoReportCtrl.updateReport);
router.patch( '/admin/cfo/reports/:id/approve',           protect, admin, cfoReportCtrl.approveReport);
router.delete('/admin/cfo/reports/:id',                   protect, admin, cfoReportCtrl.deleteReport);

// â”€â”€ Variance Analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/variance',                      protect, admin, cfoReportCtrl.getVarianceAnalyses);
router.post(  '/admin/cfo/variance',                      protect, admin, cfoReportCtrl.createVarianceAnalysis);
router.delete('/admin/cfo/variance/:id',                  protect, admin, cfoReportCtrl.deleteVarianceAnalysis);

// â”€â”€ Board Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/cfo/board-reports',                 protect, admin, cfoReportCtrl.getBoardReports);
router.post(  '/admin/cfo/board-reports',                 protect, admin, cfoReportCtrl.createBoardReport);
router.get(   '/admin/cfo/board-reports/:id',             protect, admin, cfoReportCtrl.getBoardReport);
router.put(   '/admin/cfo/board-reports/:id',             protect, admin, cfoReportCtrl.updateBoardReport);
router.patch( '/admin/cfo/board-reports/:id/approve',     protect, admin, cfoReportCtrl.approveBoardReport);
router.delete('/admin/cfo/board-reports/:id',             protect, admin, cfoReportCtrl.deleteBoardReport);

// =============================================================================
// SPRINT 14A â€” ENTERPRISE HRMS
// =============================================================================
const hrDashCtrl    = require('../controllers/hrDashboardController');
const empCtrl       = require('../controllers/employeeController');
const deptCtrl      = require('../controllers/departmentController');
const lifecycleCtrl = require('../controllers/employeeLifecycleController');
const orgCtrl       = require('../controllers/organizationController');
const empDocCtrl    = require('../controllers/employeeDocumentController');

// â”€â”€ HR Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/dashboard',                        protect, admin, hrDashCtrl.getDashboard);
router.get('/admin/hr/reports/headcount',                protect, admin, hrDashCtrl.getHeadcountReport);
router.get('/admin/hr/reports/attrition',                protect, admin, hrDashCtrl.getAttritionReport);
router.get('/admin/hr/reports/new-joiners',              protect, admin, hrDashCtrl.getNewJoinersReport);

// â”€â”€ Employees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/employees',                     protect, admin, empCtrl.getEmployees);
router.post(  '/admin/hr/employees',                     protect, admin, empCtrl.createEmployee);
router.get(   '/admin/hr/employees/:id',                 protect, admin, empCtrl.getEmployee);
router.put(   '/admin/hr/employees/:id',                 protect, admin, empCtrl.updateEmployee);
router.delete('/admin/hr/employees/:id',                 protect, admin, empCtrl.deleteEmployee);
router.patch( '/admin/hr/employees/:id/confirm',         protect, admin, empCtrl.confirmEmployee);

// Employee sub-resources
router.get(   '/admin/hr/employees/:id/bank-accounts',   protect, admin, empCtrl.getBankAccounts);
router.post(  '/admin/hr/employees/:id/bank-accounts',   protect, admin, empCtrl.createBankAccount);
router.delete('/admin/hr/employees/:id/bank-accounts/:bid', protect, admin, empCtrl.deleteBankAccount);

router.get(   '/admin/hr/employees/:id/emergency-contacts',       protect, admin, empCtrl.getEmergencyContacts);
router.post(  '/admin/hr/employees/:id/emergency-contacts',       protect, admin, empCtrl.createEmergencyContact);
router.delete('/admin/hr/employees/:id/emergency-contacts/:cid',  protect, admin, empCtrl.deleteEmergencyContact);

router.get(   '/admin/hr/employees/:id/skills',          protect, admin, empCtrl.getSkills);
router.post(  '/admin/hr/employees/:id/skills',          protect, admin, empCtrl.createSkill);
router.put(   '/admin/hr/employees/:id/skills/:sid',     protect, admin, empCtrl.updateSkill);
router.delete('/admin/hr/employees/:id/skills/:sid',     protect, admin, empCtrl.deleteSkill);

router.get(   '/admin/hr/employees/:id/certifications',          protect, admin, empCtrl.getCertifications);
router.post(  '/admin/hr/employees/:id/certifications',          protect, admin, empCtrl.createCertification);
router.delete('/admin/hr/employees/:id/certifications/:certId',  protect, admin, empCtrl.deleteCertification);

router.get(   '/admin/hr/employees/:id/notes',           protect, admin, empCtrl.getNotes);
router.post(  '/admin/hr/employees/:id/notes',           protect, admin, empCtrl.createNote);
router.delete('/admin/hr/employees/:id/notes/:nid',      protect, admin, empCtrl.deleteNote);

router.get(   '/admin/hr/employees/:id/employment-history',          protect, admin, empCtrl.getEmploymentHistory);
router.post(  '/admin/hr/employees/:id/employment-history',          protect, admin, empCtrl.createEmploymentHistory);
router.delete('/admin/hr/employees/:id/employment-history/:hid',     protect, admin, empCtrl.deleteEmploymentHistory);

// â”€â”€ Departments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/departments',                   protect, admin, deptCtrl.getDepartments);
router.post(  '/admin/hr/departments',                   protect, admin, deptCtrl.createDepartment);
router.get(   '/admin/hr/departments/:id',               protect, admin, deptCtrl.getDepartment);
router.put(   '/admin/hr/departments/:id',               protect, admin, deptCtrl.updateDepartment);
router.delete('/admin/hr/departments/:id',               protect, admin, deptCtrl.deleteDepartment);

// â”€â”€ Designations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/designations',                  protect, admin, deptCtrl.getDesignations);
router.post(  '/admin/hr/designations',                  protect, admin, deptCtrl.createDesignation);
router.get(   '/admin/hr/designations/:id',              protect, admin, deptCtrl.getDesignation);
router.put(   '/admin/hr/designations/:id',              protect, admin, deptCtrl.updateDesignation);
router.delete('/admin/hr/designations/:id',              protect, admin, deptCtrl.deleteDesignation);

// â”€â”€ Business Units â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/business-units',                protect, admin, deptCtrl.getBusinessUnits);
router.post(  '/admin/hr/business-units',                protect, admin, deptCtrl.createBusinessUnit);
router.put(   '/admin/hr/business-units/:id',            protect, admin, deptCtrl.updateBusinessUnit);
router.delete('/admin/hr/business-units/:id',            protect, admin, deptCtrl.deleteBusinessUnit);

// â”€â”€ Locations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/locations',                     protect, admin, deptCtrl.getLocations);
router.post(  '/admin/hr/locations',                     protect, admin, deptCtrl.createLocation);
router.put(   '/admin/hr/locations/:id',                 protect, admin, deptCtrl.updateLocation);
router.delete('/admin/hr/locations/:id',                 protect, admin, deptCtrl.deleteLocation);

// â”€â”€ HR Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(  '/admin/hr/settings',                       protect, admin, deptCtrl.getSettings);
router.post( '/admin/hr/settings',                       protect, admin, deptCtrl.upsertSetting);

// â”€â”€ Transfers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/transfers',                     protect, admin, lifecycleCtrl.getTransfers);
router.post(  '/admin/hr/transfers',                     protect, admin, lifecycleCtrl.createTransfer);
router.get(   '/admin/hr/transfers/:id',                 protect, admin, lifecycleCtrl.getTransfer);
router.patch( '/admin/hr/transfers/:id/approve',         protect, admin, lifecycleCtrl.approveTransfer);
router.patch( '/admin/hr/transfers/:id/reject',          protect, admin, lifecycleCtrl.rejectTransfer);
router.delete('/admin/hr/transfers/:id',                 protect, admin, lifecycleCtrl.deleteTransfer);

// â”€â”€ Promotions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/promotions',                    protect, admin, lifecycleCtrl.getPromotions);
router.post(  '/admin/hr/promotions',                    protect, admin, lifecycleCtrl.createPromotion);
router.patch( '/admin/hr/promotions/:id/approve',        protect, admin, lifecycleCtrl.approvePromotion);
router.patch( '/admin/hr/promotions/:id/reject',         protect, admin, lifecycleCtrl.rejectPromotion);
router.delete('/admin/hr/promotions/:id',                protect, admin, lifecycleCtrl.deletePromotion);

// â”€â”€ Probation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/probation',                     protect, admin, lifecycleCtrl.getProbations);
router.post(  '/admin/hr/probation',                     protect, admin, lifecycleCtrl.createProbation);
router.patch( '/admin/hr/probation/:id/confirm',         protect, admin, lifecycleCtrl.confirmProbation);
router.patch( '/admin/hr/probation/:id/extend',          protect, admin, lifecycleCtrl.extendProbation);
router.delete('/admin/hr/probation/:id',                 protect, admin, lifecycleCtrl.deleteProbation);

// â”€â”€ Exits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/exits',                         protect, admin, lifecycleCtrl.getExits);
router.post(  '/admin/hr/exits',                         protect, admin, lifecycleCtrl.createExit);
router.get(   '/admin/hr/exits/:id',                     protect, admin, lifecycleCtrl.getExit);
router.put(   '/admin/hr/exits/:id',                     protect, admin, lifecycleCtrl.updateExit);
router.delete('/admin/hr/exits/:id',                     protect, admin, lifecycleCtrl.deleteExit);

// â”€â”€ Organization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/org/nodes',                     protect, admin, orgCtrl.getNodes);
router.post(  '/admin/hr/org/nodes',                     protect, admin, orgCtrl.createNode);
router.get(   '/admin/hr/org/nodes/:id',                 protect, admin, orgCtrl.getNode);
router.put(   '/admin/hr/org/nodes/:id',                 protect, admin, orgCtrl.updateNode);
router.delete('/admin/hr/org/nodes/:id',                 protect, admin, orgCtrl.deleteNode);

router.get(   '/admin/hr/org/charts',                    protect, admin, orgCtrl.getCharts);
router.post(  '/admin/hr/org/charts',                    protect, admin, orgCtrl.createChart);
router.get(   '/admin/hr/org/charts/active',             protect, admin, orgCtrl.getActiveChart);
router.patch( '/admin/hr/org/charts/:id/activate',       protect, admin, orgCtrl.activateChart);
router.delete('/admin/hr/org/charts/:id',                protect, admin, orgCtrl.deleteChart);

router.get(   '/admin/hr/org/reporting',                 protect, admin, orgCtrl.getReportingRelationships);
router.post(  '/admin/hr/org/reporting',                 protect, admin, orgCtrl.createReportingRelationship);
router.patch( '/admin/hr/org/reporting/:id/terminate',   protect, admin, orgCtrl.terminateReportingRelationship);
router.get(   '/admin/hr/org/hierarchy/:employeeId',     protect, admin, orgCtrl.getHierarchyTree);

// â”€â”€ Employee Documents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/documents',                     protect, admin, empDocCtrl.getDocuments);
router.post(  '/admin/hr/documents',                     protect, admin, empDocCtrl.createDocument);
router.get(   '/admin/hr/documents/expiring',            protect, admin, empDocCtrl.getExpiringDocuments);
router.get(   '/admin/hr/documents/:id',                 protect, admin, empDocCtrl.getDocument);
router.put(   '/admin/hr/documents/:id',                 protect, admin, empDocCtrl.updateDocument);
router.patch( '/admin/hr/documents/:id/verify',          protect, admin, empDocCtrl.verifyDocument);
router.delete('/admin/hr/documents/:id',                 protect, admin, empDocCtrl.deleteDocument);

// =============================================================================
// SPRINT 14B â€” ENTERPRISE ATTENDANCE & LEAVE MANAGEMENT
// =============================================================================
const attCtrl        = require('../controllers/attendanceController');
const attPolicyCtrl  = require('../controllers/attendancePolicyController');
const leaveCtrl      = require('../controllers/leaveController');
const lvPolicyCtrl   = require('../controllers/leavePolicyController');
const attReportCtrl  = require('../controllers/attendanceReportController');

// â”€â”€ Attendance Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/attendance/dashboard',                    protect, admin, attCtrl.getDashboard);

// â”€â”€ Attendance Records â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/attendance',                           protect, admin, attCtrl.getAttendances);
router.post(  '/admin/hr/attendance',                           protect, admin, attCtrl.createAttendance);
router.get(   '/admin/hr/attendance/:id',                       protect, admin, attCtrl.getAttendance);
router.put(   '/admin/hr/attendance/:id',                       protect, admin, attCtrl.updateAttendance);
router.delete('/admin/hr/attendance/:id',                       protect, admin, attCtrl.deleteAttendance);

// â”€â”€ Employee Punches â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(  '/admin/hr/attendance/punches',                    protect, admin, attCtrl.getPunches);
router.post( '/admin/hr/attendance/punch',                      protect, admin, attCtrl.recordPunch);

// â”€â”€ Attendance Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(  '/admin/hr/attendance/summaries',                  protect, admin, attCtrl.getSummaries);
router.post( '/admin/hr/attendance/summaries/compute',          protect, admin, attCtrl.computeSummary);

// â”€â”€ Attendance Exceptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(  '/admin/hr/attendance/exceptions',                 protect, admin, attCtrl.getExceptions);
router.patch('/admin/hr/attendance/exceptions/:id/resolve',     protect, admin, attCtrl.resolveException);

// â”€â”€ Attendance Policies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/attendance/policies',                  protect, admin, attPolicyCtrl.getPolicies);
router.post(  '/admin/hr/attendance/policies',                  protect, admin, attPolicyCtrl.createPolicy);
router.get(   '/admin/hr/attendance/policies/:id',              protect, admin, attPolicyCtrl.getPolicy);
router.put(   '/admin/hr/attendance/policies/:id',              protect, admin, attPolicyCtrl.updatePolicy);
router.delete('/admin/hr/attendance/policies/:id',              protect, admin, attPolicyCtrl.deletePolicy);

// â”€â”€ Attendance Devices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/attendance/devices',                   protect, admin, attPolicyCtrl.getDevices);
router.post(  '/admin/hr/attendance/devices',                   protect, admin, attPolicyCtrl.createDevice);
router.get(   '/admin/hr/attendance/devices/:id',               protect, admin, attPolicyCtrl.getDevice);
router.put(   '/admin/hr/attendance/devices/:id',               protect, admin, attPolicyCtrl.updateDevice);
router.delete('/admin/hr/attendance/devices/:id',               protect, admin, attPolicyCtrl.deleteDevice);

// â”€â”€ Attendance Adjustments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/attendance/adjustments',               protect, admin, attPolicyCtrl.getAdjustments);
router.post(  '/admin/hr/attendance/adjustments',               protect, admin, attPolicyCtrl.createAdjustment);
router.patch( '/admin/hr/attendance/adjustments/:id/approve',   protect, admin, attPolicyCtrl.approveAdjustment);
router.patch( '/admin/hr/attendance/adjustments/:id/reject',    protect, admin, attPolicyCtrl.rejectAdjustment);

// â”€â”€ Attendance Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/reports/attendance/daily',                protect, admin, attReportCtrl.getDailyAttendance);
router.get('/admin/hr/reports/attendance/monthly',              protect, admin, attReportCtrl.getMonthlyAttendance);
router.get('/admin/hr/reports/attendance/late',                 protect, admin, attReportCtrl.getLateReport);
router.get('/admin/hr/reports/attendance/absentee',             protect, admin, attReportCtrl.getAbsenteeReport);

// â”€â”€ Leave Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/leave/types',                          protect, admin, lvPolicyCtrl.getLeaveTypes);
router.post(  '/admin/hr/leave/types',                          protect, admin, lvPolicyCtrl.createLeaveType);
router.get(   '/admin/hr/leave/types/:id',                      protect, admin, lvPolicyCtrl.getLeaveType);
router.put(   '/admin/hr/leave/types/:id',                      protect, admin, lvPolicyCtrl.updateLeaveType);
router.delete('/admin/hr/leave/types/:id',                      protect, admin, lvPolicyCtrl.deleteLeaveType);

// â”€â”€ Leave Policies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/leave/policies',                       protect, admin, lvPolicyCtrl.getLeavePolicies);
router.post(  '/admin/hr/leave/policies',                       protect, admin, lvPolicyCtrl.createLeavePolicy);
router.get(   '/admin/hr/leave/policies/:id',                   protect, admin, lvPolicyCtrl.getLeavePolicy);
router.put(   '/admin/hr/leave/policies/:id',                   protect, admin, lvPolicyCtrl.updateLeavePolicy);
router.delete('/admin/hr/leave/policies/:id',                   protect, admin, lvPolicyCtrl.deleteLeavePolicy);

// â”€â”€ Holidays â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/leave/holidays',                       protect, admin, lvPolicyCtrl.getHolidays);
router.post(  '/admin/hr/leave/holidays',                       protect, admin, lvPolicyCtrl.createHoliday);
router.get(   '/admin/hr/leave/holidays/:id',                   protect, admin, lvPolicyCtrl.getHoliday);
router.put(   '/admin/hr/leave/holidays/:id',                   protect, admin, lvPolicyCtrl.updateHoliday);
router.delete('/admin/hr/leave/holidays/:id',                   protect, admin, lvPolicyCtrl.deleteHoliday);

// â”€â”€ Leave Requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/leave/requests',                       protect, admin, leaveCtrl.getLeaveRequests);
router.post(  '/admin/hr/leave/requests',                       protect, admin, leaveCtrl.createLeaveRequest);
router.get(   '/admin/hr/leave/requests/:id',                   protect, admin, leaveCtrl.getLeaveRequest);
router.put(   '/admin/hr/leave/requests/:id',                   protect, admin, leaveCtrl.updateLeaveRequest);
router.patch( '/admin/hr/leave/requests/:id/approve',           protect, admin, leaveCtrl.approveLeaveRequest);
router.patch( '/admin/hr/leave/requests/:id/reject',            protect, admin, leaveCtrl.rejectLeaveRequest);
router.patch( '/admin/hr/leave/requests/:id/cancel',            protect, admin, leaveCtrl.cancelLeaveRequest);
router.delete('/admin/hr/leave/requests/:id',                   protect, admin, leaveCtrl.deleteLeaveRequest);

// â”€â”€ Leave Balances â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get( '/admin/hr/leave/balances',                         protect, admin, leaveCtrl.getLeaveBalances);
router.post('/admin/hr/leave/balances',                         protect, admin, leaveCtrl.upsertLeaveBalance);

// â”€â”€ Leave Accruals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get( '/admin/hr/leave/accruals',                         protect, admin, leaveCtrl.getLeaveAccruals);
router.post('/admin/hr/leave/accruals',                         protect, admin, leaveCtrl.createLeaveAccrual);

// â”€â”€ Leave Encashments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/leave/encashments',                    protect, admin, leaveCtrl.getEncashments);
router.post(  '/admin/hr/leave/encashments',                    protect, admin, leaveCtrl.createEncashment);
router.patch( '/admin/hr/leave/encashments/:id/approve',        protect, admin, leaveCtrl.approveEncashment);
router.patch( '/admin/hr/leave/encashments/:id/reject',         protect, admin, leaveCtrl.rejectEncashment);

// â”€â”€ Leave Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/reports/leave/utilization',               protect, admin, attReportCtrl.getLeaveUtilizationReport);
router.get('/admin/hr/reports/leave/balances',                  protect, admin, attReportCtrl.getLeaveBalanceReport);

// =============================================================================
// SPRINT 14C â€” ENTERPRISE PAYROLL MANAGEMENT
// =============================================================================
const payrollDashCtrl  = require('../controllers/payrollDashboardController');
const payrollRunCtrl   = require('../controllers/payrollRunController');
const salStructCtrl    = require('../controllers/salaryStructureController');
const empSalCtrl       = require('../controllers/employeeSalaryController');
const payrollLoanCtrl  = require('../controllers/payrollLoanController');
const payrollBonusCtrl = require('../controllers/payrollBonusController');
const payrollRptCtrl   = require('../controllers/payrollReportController');
const payrollSetCtrl   = require('../controllers/payrollSettingController');

// â”€â”€ Payroll Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/payroll/dashboard',                           protect, admin, payrollDashCtrl.getDashboard);

// â”€â”€ Payroll Periods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/payroll/periods',                          protect, admin, payrollRunCtrl.getPeriods);
router.post(  '/admin/hr/payroll/periods',                          protect, admin, payrollRunCtrl.createPeriod);
router.get(   '/admin/hr/payroll/periods/:id',                      protect, admin, payrollRunCtrl.getPeriod);
router.put(   '/admin/hr/payroll/periods/:id',                      protect, admin, payrollRunCtrl.updatePeriod);
router.delete('/admin/hr/payroll/periods/:id',                      protect, admin, payrollRunCtrl.deletePeriod);
router.patch( '/admin/hr/payroll/periods/:id/close',                protect, admin, payrollRunCtrl.closePeriod);

// â”€â”€ Payroll Runs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/payroll/runs',                             protect, admin, payrollRunCtrl.getRuns);
router.post(  '/admin/hr/payroll/runs',                             protect, admin, payrollRunCtrl.createRun);
router.get(   '/admin/hr/payroll/runs/:id',                         protect, admin, payrollRunCtrl.getRun);
router.patch( '/admin/hr/payroll/runs/:id/calculate',               protect, admin, payrollRunCtrl.calculateRun);
router.patch( '/admin/hr/payroll/runs/:id/approve',                 protect, admin, payrollRunCtrl.approveRun);
router.patch( '/admin/hr/payroll/runs/:id/post',                    protect, admin, payrollRunCtrl.postRun);
router.patch( '/admin/hr/payroll/runs/:id/pay',                     protect, admin, payrollRunCtrl.payRun);
router.get(   '/admin/hr/payroll/runs/:id/employees',               protect, admin, payrollRunCtrl.getRunEmployees);

// â”€â”€ Payroll Employees (individual entries) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(  '/admin/hr/payroll/payroll-employees/:id',             protect, admin, payrollRunCtrl.getPayrollEmployee);
router.post( '/admin/hr/payroll/payroll-employees/:id/adjustments', protect, admin, payrollRunCtrl.addAdjustment);

// â”€â”€ Salary Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/payroll/components',                       protect, admin, salStructCtrl.getComponents);
router.post(  '/admin/hr/payroll/components',                       protect, admin, salStructCtrl.createComponent);
router.get(   '/admin/hr/payroll/components/:id',                   protect, admin, salStructCtrl.getComponent);
router.put(   '/admin/hr/payroll/components/:id',                   protect, admin, salStructCtrl.updateComponent);
router.delete('/admin/hr/payroll/components/:id',                   protect, admin, salStructCtrl.deleteComponent);

// â”€â”€ Salary Structures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/payroll/structures',                       protect, admin, salStructCtrl.getStructures);
router.post(  '/admin/hr/payroll/structures',                       protect, admin, salStructCtrl.createStructure);
router.get(   '/admin/hr/payroll/structures/:id',                   protect, admin, salStructCtrl.getStructure);
router.put(   '/admin/hr/payroll/structures/:id',                   protect, admin, salStructCtrl.updateStructure);
router.delete('/admin/hr/payroll/structures/:id',                   protect, admin, salStructCtrl.deleteStructure);

// â”€â”€ Employee Salary Assignments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/payroll/employee-salary',                  protect, admin, empSalCtrl.getEmployeeSalaries);
router.post(  '/admin/hr/payroll/employee-salary',                  protect, admin, empSalCtrl.assignSalary);
router.get(   '/admin/hr/payroll/employee-salary/:id',              protect, admin, empSalCtrl.getEmployeeSalary);
router.put(   '/admin/hr/payroll/employee-salary/:id',              protect, admin, empSalCtrl.updateEmployeeSalary);
router.delete('/admin/hr/payroll/employee-salary/:id',              protect, admin, empSalCtrl.deleteEmployeeSalary);

// â”€â”€ Payslips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(  '/admin/hr/payroll/payslips',                          protect, admin, empSalCtrl.getPayslips);
router.get(  '/admin/hr/payroll/payslips/:id',                      protect, admin, empSalCtrl.getPayslip);
router.patch('/admin/hr/payroll/payslips/:id/publish',              protect, admin, empSalCtrl.publishPayslip);

// â”€â”€ Bonuses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/payroll/bonuses',                          protect, admin, payrollBonusCtrl.getBonuses);
router.post(  '/admin/hr/payroll/bonuses',                          protect, admin, payrollBonusCtrl.createBonus);
router.get(   '/admin/hr/payroll/bonuses/:id',                      protect, admin, payrollBonusCtrl.getBonus);
router.put(   '/admin/hr/payroll/bonuses/:id',                      protect, admin, payrollBonusCtrl.updateBonus);
router.delete('/admin/hr/payroll/bonuses/:id',                      protect, admin, payrollBonusCtrl.deleteBonus);
router.patch( '/admin/hr/payroll/bonuses/:id/approve',              protect, admin, payrollBonusCtrl.approveBonus);

// â”€â”€ Incentives â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(  '/admin/hr/payroll/incentives',                        protect, admin, payrollBonusCtrl.getIncentives);
router.post( '/admin/hr/payroll/incentives',                        protect, admin, payrollBonusCtrl.createIncentive);
router.get(  '/admin/hr/payroll/incentives/:id',                    protect, admin, payrollBonusCtrl.getIncentive);
router.put(  '/admin/hr/payroll/incentives/:id',                    protect, admin, payrollBonusCtrl.updateIncentive);
router.patch('/admin/hr/payroll/incentives/:id/approve',            protect, admin, payrollBonusCtrl.approveIncentive);

// â”€â”€ Overtime â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(  '/admin/hr/payroll/overtime',                          protect, admin, payrollBonusCtrl.getOvertime);
router.post( '/admin/hr/payroll/overtime',                          protect, admin, payrollBonusCtrl.createOvertime);
router.get(  '/admin/hr/payroll/overtime/:id',                      protect, admin, payrollBonusCtrl.getOvertimeRecord);
router.put(  '/admin/hr/payroll/overtime/:id',                      protect, admin, payrollBonusCtrl.updateOvertime);
router.patch('/admin/hr/payroll/overtime/:id/approve',              protect, admin, payrollBonusCtrl.approveOvertime);

// â”€â”€ Loans â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/payroll/loans',                            protect, admin, payrollLoanCtrl.getLoans);
router.post(  '/admin/hr/payroll/loans',                            protect, admin, payrollLoanCtrl.createLoan);
router.get(   '/admin/hr/payroll/loans/:id',                        protect, admin, payrollLoanCtrl.getLoan);
router.put(   '/admin/hr/payroll/loans/:id',                        protect, admin, payrollLoanCtrl.updateLoan);
router.patch( '/admin/hr/payroll/loans/:id/approve',                protect, admin, payrollLoanCtrl.approveLoan);
router.patch( '/admin/hr/payroll/loans/:id/close',                  protect, admin, payrollLoanCtrl.closeLoan);
router.get(   '/admin/hr/payroll/loans/:id/repayments',             protect, admin, payrollLoanCtrl.getRepayments);
router.post(  '/admin/hr/payroll/loans/:id/repayments',             protect, admin, payrollLoanCtrl.createRepayment);

// â”€â”€ Advances â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(  '/admin/hr/payroll/advances',                          protect, admin, payrollLoanCtrl.getAdvances);
router.post( '/admin/hr/payroll/advances',                          protect, admin, payrollLoanCtrl.createAdvance);
router.get(  '/admin/hr/payroll/advances/:id',                      protect, admin, payrollLoanCtrl.getAdvance);
router.patch('/admin/hr/payroll/advances/:id/approve',              protect, admin, payrollLoanCtrl.approveAdvance);
router.patch('/admin/hr/payroll/advances/:id/recover',              protect, admin, payrollLoanCtrl.recoverAdvance);

// â”€â”€ Payroll Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/payroll/reports/summary',                     protect, admin, payrollRptCtrl.getPayrollSummary);
router.get('/admin/hr/payroll/reports/register',                    protect, admin, payrollRptCtrl.getSalaryRegister);
router.get('/admin/hr/payroll/reports/bank-transfer',               protect, admin, payrollRptCtrl.getBankTransferSheet);
router.get('/admin/hr/payroll/reports/variance',                    protect, admin, payrollRptCtrl.getPayrollVariance);
router.get('/admin/hr/payroll/reports/department-cost',             protect, admin, payrollRptCtrl.getDepartmentCost);
router.get('/admin/hr/payroll/reports/cost-center',                 protect, admin, payrollRptCtrl.getCostCenterPayroll);
router.get('/admin/hr/payroll/reports/monthly',                     protect, admin, payrollRptCtrl.getMonthlyPayroll);
router.get('/admin/hr/payroll/reports/annual',                      protect, admin, payrollRptCtrl.getAnnualPayroll);

// â”€â”€ Payroll Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/payroll/settings',                            protect, admin, payrollSetCtrl.getSettings);
router.put('/admin/hr/payroll/settings',                            protect, admin, payrollSetCtrl.updateSettings);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SPRINT 14D â€” ENTERPRISE RECRUITMENT & ATS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const recruitDashCtrl  = require('../controllers/recruitmentDashboardController');
const jobOpeningCtrl   = require('../controllers/jobOpeningController');
const jobAppCtrl       = require('../controllers/jobApplicationController');
const candidateCtrl    = require('../controllers/candidateController');
const interviewCtrl    = require('../controllers/interviewController');
const offerCtrl        = require('../controllers/offerController');
const bgvCtrl          = require('../controllers/backgroundVerificationController');
const recruitRptCtrl   = require('../controllers/recruitmentReportController');

// â”€â”€ Recruitment Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/recruitment/dashboard',                        protect, admin, recruitDashCtrl.getDashboard);

// â”€â”€ Job Openings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/recruitment/jobs',                             protect, admin, jobOpeningCtrl.getJobs);
router.post('/admin/hr/recruitment/jobs',                            protect, admin, jobOpeningCtrl.createJob);
router.get('/admin/hr/recruitment/jobs/:id',                         protect, admin, jobOpeningCtrl.getJob);
router.put('/admin/hr/recruitment/jobs/:id',                         protect, admin, jobOpeningCtrl.updateJob);
router.delete('/admin/hr/recruitment/jobs/:id',                      protect, admin, jobOpeningCtrl.deleteJob);
router.patch('/admin/hr/recruitment/jobs/:id/post',                  protect, admin, jobOpeningCtrl.postJob);
router.patch('/admin/hr/recruitment/jobs/:id/close',                 protect, admin, jobOpeningCtrl.closeJob);
router.patch('/admin/hr/recruitment/jobs/:id/hold',                  protect, admin, jobOpeningCtrl.holdJob);
router.get('/admin/hr/recruitment/jobs/:id/applications',            protect, admin, jobOpeningCtrl.getJobApplications);

// â”€â”€ Applications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/recruitment/applications',                     protect, admin, jobAppCtrl.getApplications);
router.post('/admin/hr/recruitment/applications',                    protect, admin, jobAppCtrl.createApplication);
router.post('/admin/hr/recruitment/applications/bulk-action',        protect, admin, jobAppCtrl.bulkAction);
router.get('/admin/hr/recruitment/applications/:id',                 protect, admin, jobAppCtrl.getApplication);
router.put('/admin/hr/recruitment/applications/:id',                 protect, admin, jobAppCtrl.updateApplication);
router.delete('/admin/hr/recruitment/applications/:id',              protect, admin, jobAppCtrl.deleteApplication);
router.patch('/admin/hr/recruitment/applications/:id/move-stage',    protect, admin, jobAppCtrl.moveStage);
router.patch('/admin/hr/recruitment/applications/:id/shortlist',     protect, admin, jobAppCtrl.shortlistApplication);
router.patch('/admin/hr/recruitment/applications/:id/reject',        protect, admin, jobAppCtrl.rejectApplication);

// â”€â”€ Candidates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/recruitment/candidates',                       protect, admin, candidateCtrl.getCandidates);
router.post('/admin/hr/recruitment/candidates',                      protect, admin, candidateCtrl.createCandidate);
router.get('/admin/hr/recruitment/talent-pool',                      protect, admin, candidateCtrl.getTalentPool);
router.get('/admin/hr/recruitment/agencies',                         protect, admin, candidateCtrl.getAgencies);
router.post('/admin/hr/recruitment/agencies',                        protect, admin, candidateCtrl.createAgency);
router.put('/admin/hr/recruitment/agencies/:id',                     protect, admin, candidateCtrl.updateAgency);
router.get('/admin/hr/recruitment/sources',                          protect, admin, candidateCtrl.getSources);
router.post('/admin/hr/recruitment/sources',                         protect, admin, candidateCtrl.createSource);
router.get('/admin/hr/recruitment/candidates/:id',                   protect, admin, candidateCtrl.getCandidate);
router.put('/admin/hr/recruitment/candidates/:id',                   protect, admin, candidateCtrl.updateCandidate);
router.delete('/admin/hr/recruitment/candidates/:id',                protect, admin, candidateCtrl.deleteCandidate);
router.get('/admin/hr/recruitment/candidates/:id/applications',      protect, admin, candidateCtrl.getCandidateApplications);
router.get('/admin/hr/recruitment/candidates/:id/documents',         protect, admin, candidateCtrl.getCandidateDocuments);
router.post('/admin/hr/recruitment/candidates/:id/documents',        protect, admin, candidateCtrl.addDocument);
router.patch('/admin/hr/recruitment/candidates/:id/talent-pool',     protect, admin, candidateCtrl.addToTalentPool);
router.post('/admin/hr/recruitment/candidates/:id/convert',          protect, admin, candidateCtrl.convertToEmployee);

// â”€â”€ Interviews â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/recruitment/interviews',                       protect, admin, interviewCtrl.getInterviews);
router.post('/admin/hr/recruitment/interviews',                      protect, admin, interviewCtrl.scheduleInterview);
router.get('/admin/hr/recruitment/interviews/panel/:jobId',          protect, admin, interviewCtrl.getPanel);
router.post('/admin/hr/recruitment/interviews/panel/:jobId',         protect, admin, interviewCtrl.setPanel);
router.get('/admin/hr/recruitment/interviews/:id',                   protect, admin, interviewCtrl.getInterview);
router.put('/admin/hr/recruitment/interviews/:id',                   protect, admin, interviewCtrl.updateInterview);
router.patch('/admin/hr/recruitment/interviews/:id/complete',        protect, admin, interviewCtrl.completeInterview);
router.patch('/admin/hr/recruitment/interviews/:id/cancel',          protect, admin, interviewCtrl.cancelInterview);
router.patch('/admin/hr/recruitment/interviews/:id/reschedule',      protect, admin, interviewCtrl.rescheduleInterview);
router.get('/admin/hr/recruitment/interviews/:id/feedback',          protect, admin, interviewCtrl.getFeedback);
router.post('/admin/hr/recruitment/interviews/:id/feedback',         protect, admin, interviewCtrl.submitFeedback);

// â”€â”€ Offers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/recruitment/offers',                           protect, admin, offerCtrl.getOffers);
router.post('/admin/hr/recruitment/offers',                          protect, admin, offerCtrl.createOffer);
router.get('/admin/hr/recruitment/offers/:id',                       protect, admin, offerCtrl.getOffer);
router.put('/admin/hr/recruitment/offers/:id',                       protect, admin, offerCtrl.updateOffer);
router.patch('/admin/hr/recruitment/offers/:id/send',                protect, admin, offerCtrl.sendOffer);
router.patch('/admin/hr/recruitment/offers/:id/approve',             protect, admin, offerCtrl.approveOffer);
router.patch('/admin/hr/recruitment/offers/:id/reject',              protect, admin, offerCtrl.rejectOffer);
router.get('/admin/hr/recruitment/offers/:id/acceptance',            protect, admin, offerCtrl.getAcceptance);
router.post('/admin/hr/recruitment/offers/:id/acceptance',           protect, admin, offerCtrl.recordAcceptance);
router.get('/admin/hr/recruitment/offers/:id/approvals',             protect, admin, offerCtrl.getApprovals);

// â”€â”€ Background Verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/recruitment/bgv',                              protect, admin, bgvCtrl.getBGVs);
router.post('/admin/hr/recruitment/bgv',                             protect, admin, bgvCtrl.initiateBGV);
router.get('/admin/hr/recruitment/bgv/:id',                          protect, admin, bgvCtrl.getBGV);
router.patch('/admin/hr/recruitment/bgv/:id/check',                  protect, admin, bgvCtrl.updateBGVCheck);
router.patch('/admin/hr/recruitment/bgv/:id/complete',               protect, admin, bgvCtrl.completeBGV);

// â”€â”€ Onboarding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/recruitment/onboarding',                       protect, admin, bgvCtrl.getOnboardings);
router.post('/admin/hr/recruitment/onboarding',                      protect, admin, bgvCtrl.createOnboarding);
router.get('/admin/hr/recruitment/onboarding/:id',                   protect, admin, bgvCtrl.getOnboarding);
router.patch('/admin/hr/recruitment/onboarding/:id/task',            protect, admin, bgvCtrl.updateTask);
router.patch('/admin/hr/recruitment/onboarding/:id/complete',        protect, admin, bgvCtrl.completeOnboarding);

// â”€â”€ Recruitment Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/recruitment/reports/open-positions',           protect, admin, recruitRptCtrl.getOpenPositions);
router.get('/admin/hr/recruitment/reports/hiring-funnel',            protect, admin, recruitRptCtrl.getHiringFunnel);
router.get('/admin/hr/recruitment/reports/source-effectiveness',     protect, admin, recruitRptCtrl.getSourceEffectiveness);
router.get('/admin/hr/recruitment/reports/time-to-hire',             protect, admin, recruitRptCtrl.getTimeToHire);
router.get('/admin/hr/recruitment/reports/offer-acceptance',         protect, admin, recruitRptCtrl.getOfferAcceptance);
router.get('/admin/hr/recruitment/reports/recruiter-performance',    protect, admin, recruitRptCtrl.getRecruiterPerformance);
router.get('/admin/hr/recruitment/reports/department-hiring',        protect, admin, recruitRptCtrl.getDepartmentHiring);

// â”€â”€ Recruitment Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/recruitment/settings',                         protect, admin, recruitRptCtrl.getSettings);
router.put('/admin/hr/recruitment/settings',                         protect, admin, recruitRptCtrl.updateSettings);

// =============================================================================
// SPRINT 14E â€” ENTERPRISE PERFORMANCE MANAGEMENT, LEARNING & ESS
// =============================================================================
const { protectEmployee } = require('../middleware/employeeAuth');
const perfDashCtrl    = require('../controllers/performanceDashboardController');
const goalCtrl        = require('../controllers/goalController');
const perfReviewCtrl  = require('../controllers/performanceReviewController');
const trainingCtrl    = require('../controllers/trainingController');
const learningCtrl    = require('../controllers/learningController');
const successionCtrl  = require('../controllers/successionController');
const perfReportCtrl  = require('../controllers/performanceReportController');
const essAuthCtrl     = require('../controllers/essAuthController');
const essCtrl         = require('../controllers/essController');

// â”€â”€ Performance Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/performance/dashboard',                        protect, admin, perfDashCtrl.getDashboard);

// â”€â”€ Performance Cycles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/cycles',                        protect, admin, goalCtrl.getCycles);
router.post(  '/admin/hr/performance/cycles',                        protect, admin, goalCtrl.createCycle);
router.get(   '/admin/hr/performance/cycles/:id',                    protect, admin, goalCtrl.getCycle);
router.put(   '/admin/hr/performance/cycles/:id',                    protect, admin, goalCtrl.updateCycle);
router.delete('/admin/hr/performance/cycles/:id',                    protect, admin, goalCtrl.deleteCycle);

// â”€â”€ Goal Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/goal-categories',               protect, admin, goalCtrl.getGoalCategories);
router.post(  '/admin/hr/performance/goal-categories',               protect, admin, goalCtrl.createGoalCategory);
router.put(   '/admin/hr/performance/goal-categories/:id',           protect, admin, goalCtrl.updateGoalCategory);
router.delete('/admin/hr/performance/goal-categories/:id',           protect, admin, goalCtrl.deleteGoalCategory);

// â”€â”€ Goals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/goals',                         protect, admin, goalCtrl.getGoals);
router.post(  '/admin/hr/performance/goals',                         protect, admin, goalCtrl.createGoal);
router.get(   '/admin/hr/performance/goals/:id',                     protect, admin, goalCtrl.getGoal);
router.put(   '/admin/hr/performance/goals/:id',                     protect, admin, goalCtrl.updateGoal);
router.delete('/admin/hr/performance/goals/:id',                     protect, admin, goalCtrl.deleteGoal);
router.patch( '/admin/hr/performance/goals/:id/approve',             protect, admin, goalCtrl.approveGoal);
router.patch( '/admin/hr/performance/goals/:id/progress',            protect, admin, goalCtrl.updateProgress);

// â”€â”€ Competencies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/competencies',                  protect, admin, kpiCtrl.getCompetencies);
router.post(  '/admin/hr/performance/competencies',                  protect, admin, kpiCtrl.createCompetency);
router.get(   '/admin/hr/performance/competencies/:id',              protect, admin, kpiCtrl.getCompetency);
router.put(   '/admin/hr/performance/competencies/:id',              protect, admin, kpiCtrl.updateCompetency);
router.delete('/admin/hr/performance/competencies/:id',              protect, admin, kpiCtrl.deleteCompetency);
router.get(   '/admin/hr/performance/competency-assessments',        protect, admin, kpiCtrl.getCompetencyAssessments);
router.post(  '/admin/hr/performance/competency-assessments',        protect, admin, kpiCtrl.createCompetencyAssessment);

// â”€â”€ KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/kpis',                          protect, admin, kpiCtrl.getKPIs);
router.post(  '/admin/hr/performance/kpis',                          protect, admin, kpiCtrl.createKPI);
router.get(   '/admin/hr/performance/kpis/:id',                      protect, admin, kpiCtrl.getKPI);
router.put(   '/admin/hr/performance/kpis/:id',                      protect, admin, kpiCtrl.updateKPI);
router.delete('/admin/hr/performance/kpis/:id',                      protect, admin, kpiCtrl.deleteKPI);
router.get(   '/admin/hr/performance/kpi-reviews',                   protect, admin, kpiCtrl.getKPIReviews);
router.post(  '/admin/hr/performance/kpi-reviews',                   protect, admin, kpiCtrl.createKPIReview);

// â”€â”€ Performance Reviews â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/reviews',                       protect, admin, perfReviewCtrl.getReviews);
router.post(  '/admin/hr/performance/reviews',                       protect, admin, perfReviewCtrl.createReview);
router.get(   '/admin/hr/performance/reviews/:id',                   protect, admin, perfReviewCtrl.getReview);
router.put(   '/admin/hr/performance/reviews/:id',                   protect, admin, perfReviewCtrl.updateReview);
router.patch( '/admin/hr/performance/reviews/:id/self',              protect, admin, perfReviewCtrl.submitSelfReview);
router.patch( '/admin/hr/performance/reviews/:id/manager',           protect, admin, perfReviewCtrl.submitManagerReview);
router.patch( '/admin/hr/performance/reviews/:id/finalize',          protect, admin, perfReviewCtrl.finalizeReview);

// â”€â”€ Appraisals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/appraisals',                    protect, admin, perfReviewCtrl.getAppraisals);
router.post(  '/admin/hr/performance/appraisals',                    protect, admin, perfReviewCtrl.createAppraisal);
router.get(   '/admin/hr/performance/appraisals/:id',                protect, admin, perfReviewCtrl.getAppraisal);
router.put(   '/admin/hr/performance/appraisals/:id',                protect, admin, perfReviewCtrl.updateAppraisal);

// â”€â”€ Training Courses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/training/courses',              protect, admin, trainingCtrl.getCourses);
router.post(  '/admin/hr/performance/training/courses',              protect, admin, trainingCtrl.createCourse);
router.get(   '/admin/hr/performance/training/courses/:id',          protect, admin, trainingCtrl.getCourse);
router.put(   '/admin/hr/performance/training/courses/:id',          protect, admin, trainingCtrl.updateCourse);
router.delete('/admin/hr/performance/training/courses/:id',          protect, admin, trainingCtrl.deleteCourse);

// â”€â”€ Training Sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/training/sessions',             protect, admin, trainingCtrl.getSessions);
router.post(  '/admin/hr/performance/training/sessions',             protect, admin, trainingCtrl.createSession);
router.get(   '/admin/hr/performance/training/enrollments',          protect, admin, trainingCtrl.getEnrollments);
router.post(  '/admin/hr/performance/training/enroll',               protect, admin, trainingCtrl.enrollEmployee);
router.patch( '/admin/hr/performance/training/enrollments/:id/complete',  protect, admin, trainingCtrl.completeTraining);
router.patch( '/admin/hr/performance/training/enrollments/:id/certificate', protect, admin, trainingCtrl.issueCertificate);

// â”€â”€ Learning Paths â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/learning/paths',                protect, admin, learningCtrl.getLearningPaths);
router.post(  '/admin/hr/performance/learning/paths',                protect, admin, learningCtrl.createLearningPath);
router.get(   '/admin/hr/performance/learning/paths/:id',            protect, admin, learningCtrl.getLearningPath);
router.put(   '/admin/hr/performance/learning/paths/:id',            protect, admin, learningCtrl.updateLearningPath);
router.delete('/admin/hr/performance/learning/paths/:id',            protect, admin, learningCtrl.deleteLearningPath);
router.post(  '/admin/hr/performance/learning/paths/:id/assign',     protect, admin, learningCtrl.assignLearningPath);

// â”€â”€ Career Development â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/career/plans',                  protect, admin, learningCtrl.getCareerPlans);
router.post(  '/admin/hr/performance/career/plans',                  protect, admin, learningCtrl.createCareerPlan);
router.put(   '/admin/hr/performance/career/plans/:id',              protect, admin, learningCtrl.updateCareerPlan);
router.get(   '/admin/hr/performance/career/skill-gaps',             protect, admin, learningCtrl.getSkillGapAnalyses);
router.post(  '/admin/hr/performance/career/skill-gaps',             protect, admin, learningCtrl.createSkillGapAnalysis);

// â”€â”€ Certifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/performance/certifications',                   protect, admin, trainingCtrl.getCertifications);

// â”€â”€ Succession Planning â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/succession',                    protect, admin, successionCtrl.getSuccessionPlans);
router.post(  '/admin/hr/performance/succession',                    protect, admin, successionCtrl.createSuccessionPlan);
router.get(   '/admin/hr/performance/succession/:id',                protect, admin, successionCtrl.getSuccessionPlan);
router.put(   '/admin/hr/performance/succession/:id',                protect, admin, successionCtrl.updateSuccessionPlan);
router.post(  '/admin/hr/performance/succession/:id/successors',     protect, admin, successionCtrl.addSuccessor);
router.delete('/admin/hr/performance/succession/:id/successors/:eid',protect, admin, successionCtrl.removeSuccessor);

// â”€â”€ Promotion Recommendations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/promotions',                    protect, admin, successionCtrl.getPromotionRecommendations);
router.post(  '/admin/hr/performance/promotions',                    protect, admin, successionCtrl.createPromotionRecommendation);

// â”€â”€ Recognitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/recognitions',                  protect, admin, successionCtrl.getRecognitions);
router.post(  '/admin/hr/performance/recognitions',                  protect, admin, successionCtrl.createRecognition);
router.get(   '/admin/hr/performance/recognitions/:id',              protect, admin, successionCtrl.getRecognition);

// â”€â”€ Employee Feedback / 1:1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/feedback',                      protect, admin, successionCtrl.getFeedbacks);
router.post(  '/admin/hr/performance/feedback',                      protect, admin, successionCtrl.createFeedback);
router.get(   '/admin/hr/performance/1on1',                          protect, admin, successionCtrl.getOneOnOnes);
router.post(  '/admin/hr/performance/1on1',                          protect, admin, successionCtrl.createOneOnOne);

// â”€â”€ Announcements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get(   '/admin/hr/performance/announcements',                 protect, admin, perfReportCtrl.getAnnouncements);
router.post(  '/admin/hr/performance/announcements',                 protect, admin, perfReportCtrl.createAnnouncement);
router.get(   '/admin/hr/performance/announcements/:id',             protect, admin, perfReportCtrl.getAnnouncement);
router.put(   '/admin/hr/performance/announcements/:id',             protect, admin, perfReportCtrl.updateAnnouncement);
router.delete('/admin/hr/performance/announcements/:id',             protect, admin, perfReportCtrl.deleteAnnouncement);
router.patch( '/admin/hr/performance/announcements/:id/publish',     protect, admin, perfReportCtrl.publishAnnouncement);

// â”€â”€ ESS Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/performance/ess-settings',                     protect, admin, perfReportCtrl.getESSSettings);
router.put('/admin/hr/performance/ess-settings',                     protect, admin, perfReportCtrl.updateESSSettings);

// â”€â”€ Performance Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/admin/hr/performance/reports/goal-completion',          protect, admin, perfReportCtrl.getGoalCompletionReport);
router.get('/admin/hr/performance/reports/kpi',                      protect, admin, perfReportCtrl.getKPIReport);
router.get('/admin/hr/performance/reports/review-distribution',      protect, admin, perfReportCtrl.getReviewDistribution);
router.get('/admin/hr/performance/reports/training',                 protect, admin, perfReportCtrl.getTrainingReport);
router.get('/admin/hr/performance/reports/recognition',              protect, admin, perfReportCtrl.getRecognitionReport);
router.get('/admin/hr/performance/reports/competency',               protect, admin, perfReportCtrl.getCompetencyReport);
router.get('/admin/hr/performance/reports/overall',                  protect, admin, perfReportCtrl.getOverallPerformanceReport);

// â”€â”€ ESS Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/employee/auth/login',                                  essAuthCtrl.login);
router.post('/employee/auth/logout',                                 protectEmployee, essAuthCtrl.logout);
router.put(  '/employee/auth/change-password',                       protectEmployee, essAuthCtrl.changePassword);
router.get(  '/employee/auth/me',                                    protectEmployee, essAuthCtrl.getProfile);

// â”€â”€ ESS Self-Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/employee/self-service/dashboard',                       protectEmployee, essCtrl.getEssDashboard);
router.get('/employee/self-service/attendance',                      protectEmployee, essCtrl.getMyAttendance);
router.get('/employee/self-service/leave',                           protectEmployee, essCtrl.getMyLeave);
router.get('/employee/self-service/payslips',                        protectEmployee, essCtrl.getMyPayslips);
router.get('/employee/self-service/performance',                     protectEmployee, essCtrl.getMyPerformance);
router.get('/employee/self-service/training',                        protectEmployee, essCtrl.getMyTraining);
router.get('/employee/self-service/announcements',                   protectEmployee, essCtrl.getAnnouncements);
router.get('/employee/self-service/recognitions',                    protectEmployee, essCtrl.getRecognitions);
router.get('/employee/self-service/feedback',                        protectEmployee, essCtrl.getMyFeedback);
router.post('/employee/self-service/feedback',                       protectEmployee, essCtrl.submitFeedback);

// â”€â”€ Sprint 15A: Project Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const projDashCtrl   = require('../controllers/projectDashboardController');
const adminProjCtrl  = require('../controllers/projectController');
const projTaskCtrl   = require('../controllers/projectTaskController');
const milestoneCtrl  = require('../controllers/milestoneController');
const kanbanCtrl     = require('../controllers/kanbanController');
const timesheetCtrl  = require('../controllers/timesheetController');
const projRiskCtrl   = require('../controllers/projectRiskController');
const projReportCtrl = require('../controllers/projectReportController');

// Dashboard
router.get('/admin/projects/dashboard',                              protect, admin, projDashCtrl.getDashboard);

// Static-path project sub-resources (must be before /:id routes)
router.get('/admin/projects/templates',                              protect, admin, adminProjCtrl.listTemplates);
router.post('/admin/projects/templates',                             protect, admin, adminProjCtrl.createTemplate);
router.put('/admin/projects/templates/:id',                         protect, admin, adminProjCtrl.updateTemplate);
router.delete('/admin/projects/templates/:id',                      protect, admin, adminProjCtrl.deleteTemplate);
router.get('/admin/projects/roles',                                  protect, admin, milestoneCtrl.listProjectRoles);
router.post('/admin/projects/roles',                                 protect, admin, milestoneCtrl.createProjectRole);
router.put('/admin/projects/roles/:id',                              protect, admin, milestoneCtrl.updateProjectRole);
router.delete('/admin/projects/roles/:id',                           protect, admin, milestoneCtrl.deleteProjectRole);
router.get('/admin/projects/reports/progress',                       protect, admin, projReportCtrl.getProjectProgress);
router.get('/admin/projects/reports/milestones',                     protect, admin, projReportCtrl.getMilestoneStatus);
router.get('/admin/projects/reports/budget',                         protect, admin, projReportCtrl.getBudgetVsActual);
router.get('/admin/projects/reports/resources',                      protect, admin, projReportCtrl.getResourceUtilization);
router.get('/admin/projects/reports/tasks',                          protect, admin, projReportCtrl.getTaskCompletion);
router.get('/admin/projects/reports/timesheets',                     protect, admin, projReportCtrl.getTimesheetSummary);
router.get('/admin/projects/reports/risks',                          protect, admin, projReportCtrl.getRiskReport);
router.get('/admin/projects/reports/issues',                         protect, admin, projReportCtrl.getIssueReport);
router.get('/admin/projects/settings',                               protect, admin, projReportCtrl.getProjectSettings);
router.put('/admin/projects/settings',                               protect, admin, projReportCtrl.updateProjectSettings);
router.get('/admin/projects/notifications',                          protect, admin, projReportCtrl.listProjectNotifications);
router.get('/admin/projects/timesheets/summary',                     protect, admin, timesheetCtrl.getTimesheetSummary);
// Sub-resource ID routes (must be before /:id)
router.get('/admin/projects/phases/:id',                             protect, admin, adminProjCtrl.listPhases);
router.put('/admin/projects/phases/:id',                             protect, admin, adminProjCtrl.updatePhase);
router.delete('/admin/projects/phases/:id',                          protect, admin, adminProjCtrl.deletePhase);
router.get('/admin/projects/milestones/:id',                         protect, admin, milestoneCtrl.getMilestone);
router.put('/admin/projects/milestones/:id',                         protect, admin, milestoneCtrl.updateMilestone);
router.delete('/admin/projects/milestones/:id',                      protect, admin, milestoneCtrl.deleteMilestone);
router.patch('/admin/projects/milestones/:id/complete',              protect, admin, milestoneCtrl.completeMilestone);
router.get('/admin/projects/tasks/:id',                              protect, admin, projTaskCtrl.getTask);
router.put('/admin/projects/tasks/:id',                              protect, admin, projTaskCtrl.updateTask);
router.delete('/admin/projects/tasks/:id',                           protect, admin, projTaskCtrl.deleteTask);
router.patch('/admin/projects/tasks/:id/status',                     protect, admin, projTaskCtrl.updateTaskStatus);
router.get('/admin/projects/tasks/:id/subtasks',                     protect, admin, projTaskCtrl.listSubTasks);
router.post('/admin/projects/tasks/:id/subtasks',                    protect, admin, projTaskCtrl.createSubTask);
router.put('/admin/projects/subtasks/:id',                           protect, admin, projTaskCtrl.updateSubTask);
router.delete('/admin/projects/subtasks/:id',                        protect, admin, projTaskCtrl.deleteSubTask);
router.get('/admin/projects/tasks/:id/comments',                     protect, admin, projTaskCtrl.listComments);
router.post('/admin/projects/tasks/:id/comments',                    protect, admin, projTaskCtrl.addComment);
router.delete('/admin/projects/tasks/comments/:id',                  protect, admin, projTaskCtrl.deleteComment);
router.post('/admin/projects/tasks/:id/attachments',                 protect, admin, projTaskCtrl.addAttachment);
router.delete('/admin/projects/tasks/attachments/:id',               protect, admin, projTaskCtrl.deleteAttachment);
router.get('/admin/projects/tasks/:id/dependencies',                 protect, admin, projTaskCtrl.listDependencies);
router.post('/admin/projects/tasks/dependencies',                    protect, admin, projTaskCtrl.addDependency);
router.delete('/admin/projects/tasks/dependencies/:id',              protect, admin, projTaskCtrl.removeDependency);
router.get('/admin/projects/kanban/:id',                             protect, admin, kanbanCtrl.getBoard);
router.put('/admin/projects/kanban/:id',                             protect, admin, kanbanCtrl.updateBoard);
router.get('/admin/projects/kanban/:id/columns',                     protect, admin, kanbanCtrl.listColumns);
router.post('/admin/projects/kanban/:id/columns',                    protect, admin, kanbanCtrl.createColumn);
router.put('/admin/projects/kanban/columns/:id',                     protect, admin, kanbanCtrl.updateColumn);
router.delete('/admin/projects/kanban/columns/:id',                  protect, admin, kanbanCtrl.deleteColumn);
router.get('/admin/projects/kanban/:id/cards',                       protect, admin, kanbanCtrl.listCards);
router.post('/admin/projects/kanban/:id/cards',                      protect, admin, kanbanCtrl.createCard);
router.put('/admin/projects/kanban/cards/:id',                       protect, admin, kanbanCtrl.updateCard);
router.delete('/admin/projects/kanban/cards/:id',                    protect, admin, kanbanCtrl.deleteCard);
router.patch('/admin/projects/kanban/cards/:id/move',                protect, admin, kanbanCtrl.moveCard);
router.put('/admin/projects/sprint/:id',                             protect, admin, kanbanCtrl.updateSprint);
router.patch('/admin/projects/sprint/:id/complete',                  protect, admin, kanbanCtrl.completeSprint);
router.put('/admin/projects/members/:id',                            protect, admin, milestoneCtrl.updateMember);
router.delete('/admin/projects/members/:id',                         protect, admin, milestoneCtrl.removeMember);
router.put('/admin/projects/resources/:id',                          protect, admin, timesheetCtrl.updateResource);
router.delete('/admin/projects/resources/:id',                       protect, admin, timesheetCtrl.deleteResource);
router.put('/admin/projects/time-entries/:id',                       protect, admin, timesheetCtrl.updateTimeEntry);
router.delete('/admin/projects/time-entries/:id',                    protect, admin, timesheetCtrl.deleteTimeEntry);
router.put('/admin/projects/timesheets/:id',                         protect, admin, timesheetCtrl.updateTimesheet);
router.patch('/admin/projects/timesheets/:id/submit',                protect, admin, timesheetCtrl.submitTimesheet);
router.patch('/admin/projects/timesheets/:id/approve',               protect, admin, timesheetCtrl.approveTimesheet);
router.get('/admin/projects/risks/:id',                              protect, admin, projRiskCtrl.getRisk);
router.put('/admin/projects/risks/:id',                              protect, admin, projRiskCtrl.updateRisk);
router.delete('/admin/projects/risks/:id',                           protect, admin, projRiskCtrl.deleteRisk);
router.get('/admin/projects/issues/:id',                             protect, admin, projRiskCtrl.getIssue);
router.put('/admin/projects/issues/:id',                             protect, admin, projRiskCtrl.updateIssue);
router.delete('/admin/projects/issues/:id',                          protect, admin, projRiskCtrl.deleteIssue);
router.put('/admin/projects/calendar/:id',                           protect, admin, projReportCtrl.updateCalendarEvent);
router.delete('/admin/projects/calendar/:id',                        protect, admin, projReportCtrl.deleteCalendarEvent);
router.put('/admin/projects/budget/:id',                             protect, admin, projReportCtrl.updateProjectBudget);
router.put('/admin/projects/costs/:id',                              protect, admin, projReportCtrl.updateProjectCost);
// /:id project routes
router.get('/admin/projects',                                        protect, admin, adminProjCtrl.listProjects);
router.post('/admin/projects',                                       protect, admin, adminProjCtrl.createProject);
router.get('/admin/projects/:id',                                    protect, admin, adminProjCtrl.getProject);
router.put('/admin/projects/:id',                                    protect, admin, adminProjCtrl.updateProject);
router.delete('/admin/projects/:id',                                 protect, admin, adminProjCtrl.deleteProject);
router.patch('/admin/projects/:id/status',                           protect, admin, adminProjCtrl.updateProjectStatus);
router.get('/admin/projects/:id/phases',                             protect, admin, adminProjCtrl.listPhases);
router.post('/admin/projects/:id/phases',                            protect, admin, adminProjCtrl.createPhase);
router.get('/admin/projects/:id/milestones',                         protect, admin, milestoneCtrl.listMilestones);
router.post('/admin/projects/:id/milestones',                        protect, admin, milestoneCtrl.createMilestone);
router.get('/admin/projects/:id/tasks',                              protect, admin, projTaskCtrl.listTasks);
router.post('/admin/projects/:id/tasks',                             protect, admin, projTaskCtrl.createTask);
router.get('/admin/projects/:id/kanban',                             protect, admin, kanbanCtrl.listBoards);
router.post('/admin/projects/:id/kanban',                            protect, admin, kanbanCtrl.createBoard);
router.get('/admin/projects/:id/sprint',                             protect, admin, kanbanCtrl.listSprints);
router.post('/admin/projects/:id/sprint',                            protect, admin, kanbanCtrl.createSprint);
router.get('/admin/projects/:id/members',                            protect, admin, milestoneCtrl.listMembers);
router.post('/admin/projects/:id/members',                           protect, admin, milestoneCtrl.addMember);
router.get('/admin/projects/:id/resources',                          protect, admin, timesheetCtrl.listResources);
router.post('/admin/projects/:id/resources',                         protect, admin, timesheetCtrl.createResource);
router.get('/admin/projects/:id/time-entries',                       protect, admin, timesheetCtrl.listTimeEntries);
router.post('/admin/projects/:id/time-entries',                      protect, admin, timesheetCtrl.createTimeEntry);
router.get('/admin/projects/:id/timesheets',                         protect, admin, timesheetCtrl.listTimesheets);
router.post('/admin/projects/:id/timesheets',                        protect, admin, timesheetCtrl.createTimesheet);
router.get('/admin/projects/:id/risks',                              protect, admin, projRiskCtrl.listRisks);
router.post('/admin/projects/:id/risks',                             protect, admin, projRiskCtrl.createRisk);
router.get('/admin/projects/:id/issues',                             protect, admin, projRiskCtrl.listIssues);
router.post('/admin/projects/:id/issues',                            protect, admin, projRiskCtrl.createIssue);
router.get('/admin/projects/:id/calendar',                           protect, admin, projReportCtrl.listCalendarEvents);
router.post('/admin/projects/:id/calendar',                          protect, admin, projReportCtrl.createCalendarEvent);
router.get('/admin/projects/:id/budget',                             protect, admin, projReportCtrl.getProjectBudget);
router.post('/admin/projects/:id/budget',                            protect, admin, projReportCtrl.createProjectBudget);
router.get('/admin/projects/:id/costs',                              protect, admin, projReportCtrl.listProjectCosts);
router.post('/admin/projects/:id/costs',                             protect, admin, projReportCtrl.createProjectCost);

// ── Sprint 15B: Enterprise Project Portfolio Management (PPM) ────────────────
const pfDashCtrl   = require('../controllers/portfolioDashboardController');
const pfCtrl       = require('../controllers/portfolioController');
const pfFinCtrl    = require('../controllers/portfolioFinanceController');
const pfRiskCtrl   = require('../controllers/portfolioRiskController');
const pfResCtrl    = require('../controllers/resourceCapacityController');
const pfReportCtrl = require('../controllers/portfolioReportController');

// Dashboards (static paths — before /:id)
router.get('/admin/portfolio/dashboard',                  protect, admin, pfDashCtrl.getDashboard);
router.get('/admin/portfolio/executive-dashboard',        protect, admin, pfDashCtrl.getExecutiveDashboard);

// Resource Capacity Planning (cross-portfolio)
router.get('/admin/portfolio/resources/capacity',         protect, admin, pfResCtrl.listCapacity);
router.post('/admin/portfolio/resources/capacity',        protect, admin, pfResCtrl.createCapacity);
router.put('/admin/portfolio/resources/capacity/:id',     protect, admin, pfResCtrl.updateCapacity);
router.delete('/admin/portfolio/resources/capacity/:id',  protect, admin, pfResCtrl.deleteCapacity);
router.get('/admin/portfolio/resources/demand',           protect, admin, pfResCtrl.listDemand);
router.post('/admin/portfolio/resources/demand',          protect, admin, pfResCtrl.createDemand);
router.put('/admin/portfolio/resources/demand/:id',       protect, admin, pfResCtrl.updateDemand);
router.delete('/admin/portfolio/resources/demand/:id',    protect, admin, pfResCtrl.deleteDemand);
router.get('/admin/portfolio/resources/demand-vs-capacity', protect, admin, pfResCtrl.getDemandVsCapacity);
router.get('/admin/portfolio/resources/utilization',      protect, admin, pfResCtrl.getUtilization);
router.get('/admin/portfolio/resources/conflicts',        protect, admin, pfResCtrl.getConflicts);
router.get('/admin/portfolio/resources/heatmap',          protect, admin, pfResCtrl.getHeatmap);

// Reports (cross-portfolio aggregations)
router.get('/admin/portfolio/reports/executive',          protect, admin, pfReportCtrl.getExecutiveReport);
router.get('/admin/portfolio/reports/resource',           protect, admin, pfReportCtrl.getResourceReport);
router.get('/admin/portfolio/reports/financial',          protect, admin, pfReportCtrl.getFinancialReport);
router.get('/admin/portfolio/reports/benefits',           protect, admin, pfReportCtrl.getBenefitsReport);
router.get('/admin/portfolio/reports/risk',               protect, admin, pfReportCtrl.getRiskSummary);

// Programs
router.get('/admin/portfolio/programs',                   protect, admin, pfCtrl.listPrograms);
router.post('/admin/portfolio/programs',                  protect, admin, pfCtrl.createProgram);
router.get('/admin/portfolio/programs/:id',               protect, admin, pfCtrl.getProgram);
router.put('/admin/portfolio/programs/:id',               protect, admin, pfCtrl.updateProgram);
router.delete('/admin/portfolio/programs/:id',            protect, admin, pfCtrl.deleteProgram);

// Program-Project mapping
router.get('/admin/portfolio/program-projects',           protect, admin, pfCtrl.listProgramProjects);
router.post('/admin/portfolio/program-projects',          protect, admin, pfCtrl.mapProject);
router.put('/admin/portfolio/program-projects/:id',       protect, admin, pfCtrl.updateProgramProject);
router.delete('/admin/portfolio/program-projects/:id',    protect, admin, pfCtrl.unmapProject);

// Strategic Initiatives
router.get('/admin/portfolio/initiatives',                protect, admin, pfCtrl.listInitiatives);
router.post('/admin/portfolio/initiatives',               protect, admin, pfCtrl.createInitiative);
router.put('/admin/portfolio/initiatives/:id',            protect, admin, pfCtrl.updateInitiative);
router.delete('/admin/portfolio/initiatives/:id',         protect, admin, pfCtrl.deleteInitiative);

// Sub-resource item routes (literal segment — before /:id family)
router.put('/admin/portfolio/risks/:id',                  protect, admin, pfRiskCtrl.updateRisk);
router.delete('/admin/portfolio/risks/:id',               protect, admin, pfRiskCtrl.deleteRisk);
router.put('/admin/portfolio/kpis/:id',                   protect, admin, pfRiskCtrl.updateKPI);
router.delete('/admin/portfolio/kpis/:id',                protect, admin, pfRiskCtrl.deleteKPI);
router.put('/admin/portfolio/governance/:id',             protect, admin, pfRiskCtrl.updateGovernance);
router.delete('/admin/portfolio/governance/:id',          protect, admin, pfRiskCtrl.deleteGovernance);
router.patch('/admin/portfolio/approvals/:id/decide',     protect, admin, pfRiskCtrl.decideApproval);
router.delete('/admin/portfolio/approvals/:id',           protect, admin, pfRiskCtrl.deleteApproval);
router.put('/admin/portfolio/forecast/:id',               protect, admin, pfFinCtrl.updateForecast);
router.delete('/admin/portfolio/forecast/:id',            protect, admin, pfFinCtrl.deleteForecast);
router.put('/admin/portfolio/benefits/:id',               protect, admin, pfFinCtrl.updateBenefit);
router.delete('/admin/portfolio/benefits/:id',            protect, admin, pfFinCtrl.deleteBenefit);
router.put('/admin/portfolio/roadmap/:id',                protect, admin, pfReportCtrl.updateRoadmapItem);
router.delete('/admin/portfolio/roadmap/:id',             protect, admin, pfReportCtrl.deleteRoadmapItem);
router.put('/admin/portfolio/milestones/:id',             protect, admin, pfReportCtrl.updateMilestone);
router.delete('/admin/portfolio/milestones/:id',          protect, admin, pfReportCtrl.deleteMilestone);
router.delete('/admin/portfolio/status-reports/:id',      protect, admin, pfReportCtrl.deleteStatusReport);

// Per-portfolio sub-collections (/:id/<resource>)
router.get('/admin/portfolio/:id/risks',                  protect, admin, pfRiskCtrl.listRisks);
router.post('/admin/portfolio/:id/risks',                 protect, admin, pfRiskCtrl.createRisk);
router.get('/admin/portfolio/:id/kpis',                   protect, admin, pfRiskCtrl.listKPIs);
router.post('/admin/portfolio/:id/kpis',                  protect, admin, pfRiskCtrl.createKPI);
router.get('/admin/portfolio/:id/governance',             protect, admin, pfRiskCtrl.listGovernance);
router.post('/admin/portfolio/:id/governance',            protect, admin, pfRiskCtrl.createGovernance);
router.get('/admin/portfolio/:id/approvals',              protect, admin, pfRiskCtrl.listApprovals);
router.post('/admin/portfolio/:id/approvals',             protect, admin, pfRiskCtrl.createApproval);
router.get('/admin/portfolio/:id/budget',                 protect, admin, pfFinCtrl.getBudget);
router.put('/admin/portfolio/:id/budget',                 protect, admin, pfFinCtrl.upsertBudget);
router.get('/admin/portfolio/:id/forecast',               protect, admin, pfFinCtrl.listForecasts);
router.post('/admin/portfolio/:id/forecast',              protect, admin, pfFinCtrl.createForecast);
router.get('/admin/portfolio/:id/benefits',               protect, admin, pfFinCtrl.listBenefits);
router.post('/admin/portfolio/:id/benefits',              protect, admin, pfFinCtrl.createBenefit);
router.get('/admin/portfolio/:id/financial-summary',      protect, admin, pfFinCtrl.getFinancialSummary);
router.get('/admin/portfolio/:id/roadmap',                protect, admin, pfReportCtrl.listRoadmap);
router.post('/admin/portfolio/:id/roadmap',               protect, admin, pfReportCtrl.createRoadmapItem);
router.get('/admin/portfolio/:id/milestones',             protect, admin, pfReportCtrl.listMilestones);
router.post('/admin/portfolio/:id/milestones',            protect, admin, pfReportCtrl.createMilestone);
router.get('/admin/portfolio/:id/status-reports',         protect, admin, pfReportCtrl.listStatusReports);
router.post('/admin/portfolio/:id/status-reports',        protect, admin, pfReportCtrl.createStatusReport);
router.get('/admin/portfolio/:id/status-report',          protect, admin, pfReportCtrl.getPortfolioStatusReport);

// Portfolio CRUD (/:id family LAST)
router.get('/admin/portfolio',                            protect, admin, pfCtrl.listPortfolios);
router.post('/admin/portfolio',                           protect, admin, pfCtrl.createPortfolio);
router.get('/admin/portfolio/:id',                        protect, admin, pfCtrl.getPortfolio);
router.put('/admin/portfolio/:id',                        protect, admin, pfCtrl.updatePortfolio);
router.delete('/admin/portfolio/:id',                     protect, admin, pfCtrl.deletePortfolio);
router.patch('/admin/portfolio/:id/status',               protect, admin, pfCtrl.updatePortfolioStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// SPRINT 15C — PMO Governance & Analytics
// ═══════════════════════════════════════════════════════════════════════════════
const pmoGovCtrl       = require('../controllers/pmoGovernanceController');
const pmoBizCtrl       = require('../controllers/pmoBusinessController');
const pmoKnowledgeCtrl = require('../controllers/pmoKnowledgeController');
const pmoAuditCtrl     = require('../controllers/pmoAuditController');
const pmoAnalyticsCtrl = require('../controllers/pmoAnalyticsController');

// PMO Models (register on first require so mongoose.model() works)
require('../models/PMOGovernanceBoard');
require('../models/PMODecisionLog');
require('../models/PMOSteeringCommittee');
require('../models/PMOComplianceItem');
require('../models/PMOBusinessCase');
require('../models/PMOInvestmentRequest');
require('../models/PMOProjectCharter');
require('../models/PMOLessonsLearned');
require('../models/PMOTemplate');
require('../models/PMODocument');
require('../models/PMOProjectAudit');
require('../models/PMOProjectScorecard');

// ── Analytics / Dashboard (no :id params — must be FIRST) ───────────────────
router.get('/admin/pmo/dashboard',             protect, admin, pmoAnalyticsCtrl.getPMODashboard);
router.get('/admin/pmo/analytics/evm',         protect, admin, pmoAnalyticsCtrl.getEVMAnalytics);
router.get('/admin/pmo/analytics/risk-heatmap',protect, admin, pmoAnalyticsCtrl.getRiskHeatmap);
router.get('/admin/pmo/analytics/budget',      protect, admin, pmoAnalyticsCtrl.getBudgetAnalytics);
router.get('/admin/pmo/analytics/resource-forecast', protect, admin, pmoAnalyticsCtrl.getResourceForecast);
router.get('/admin/pmo/analytics/benefits',    protect, admin, pmoAnalyticsCtrl.getBenefitRealization);
router.get('/admin/pmo/analytics/alignment',   protect, admin, pmoAnalyticsCtrl.getStrategicAlignment);
router.get('/admin/pmo/analytics/governance-report', protect, admin, pmoAnalyticsCtrl.getGovernanceReport);
router.get('/admin/pmo/analytics/issue-trend', protect, admin, pmoAnalyticsCtrl.getIssueTrend);

// ── Governance Boards ─────────────────────────────────────────────────────────
router.get('/admin/pmo/boards',           protect, admin, pmoGovCtrl.listBoards);
router.post('/admin/pmo/boards',          protect, admin, pmoGovCtrl.createBoard);
router.get('/admin/pmo/boards/:id',       protect, admin, pmoGovCtrl.getBoard);
router.put('/admin/pmo/boards/:id',       protect, admin, pmoGovCtrl.updateBoard);
router.delete('/admin/pmo/boards/:id',    protect, admin, pmoGovCtrl.deleteBoard);

// ── Decision Log ──────────────────────────────────────────────────────────────
router.get('/admin/pmo/decisions',        protect, admin, pmoGovCtrl.listDecisions);
router.post('/admin/pmo/decisions',       protect, admin, pmoGovCtrl.createDecision);
router.get('/admin/pmo/decisions/:id',    protect, admin, pmoGovCtrl.getDecision);
router.put('/admin/pmo/decisions/:id',    protect, admin, pmoGovCtrl.updateDecision);
router.delete('/admin/pmo/decisions/:id', protect, admin, pmoGovCtrl.deleteDecision);

// ── Steering Committees ───────────────────────────────────────────────────────
router.get('/admin/pmo/committees',                   protect, admin, pmoGovCtrl.listCommittees);
router.post('/admin/pmo/committees',                  protect, admin, pmoGovCtrl.createCommittee);
router.get('/admin/pmo/committees/:id',               protect, admin, pmoGovCtrl.getCommittee);
router.put('/admin/pmo/committees/:id',               protect, admin, pmoGovCtrl.updateCommittee);
router.delete('/admin/pmo/committees/:id',            protect, admin, pmoGovCtrl.deleteCommittee);
router.post('/admin/pmo/committees/:id/meetings',     protect, admin, pmoGovCtrl.addMeeting);

// ── Compliance Tracking ───────────────────────────────────────────────────────
router.get('/admin/pmo/compliance/summary',   protect, admin, pmoGovCtrl.getComplianceSummary);
router.get('/admin/pmo/compliance',           protect, admin, pmoGovCtrl.listCompliance);
router.post('/admin/pmo/compliance',          protect, admin, pmoGovCtrl.createCompliance);
router.get('/admin/pmo/compliance/:id',       protect, admin, pmoGovCtrl.getCompliance);
router.put('/admin/pmo/compliance/:id',       protect, admin, pmoGovCtrl.updateCompliance);
router.delete('/admin/pmo/compliance/:id',    protect, admin, pmoGovCtrl.deleteCompliance);

// ── Business Cases ────────────────────────────────────────────────────────────
router.get('/admin/pmo/business-cases',               protect, admin, pmoBizCtrl.listBusinessCases);
router.post('/admin/pmo/business-cases',              protect, admin, pmoBizCtrl.createBusinessCase);
router.get('/admin/pmo/business-cases/:id',           protect, admin, pmoBizCtrl.getBusinessCase);
router.put('/admin/pmo/business-cases/:id',           protect, admin, pmoBizCtrl.updateBusinessCase);
router.delete('/admin/pmo/business-cases/:id',        protect, admin, pmoBizCtrl.deleteBusinessCase);
router.patch('/admin/pmo/business-cases/:id/approve', protect, admin, pmoBizCtrl.approveBusinessCase);

// ── Investment Requests ───────────────────────────────────────────────────────
router.get('/admin/pmo/investment-requests',                protect, admin, pmoBizCtrl.listInvestmentRequests);
router.post('/admin/pmo/investment-requests',               protect, admin, pmoBizCtrl.createInvestmentRequest);
router.get('/admin/pmo/investment-requests/:id',            protect, admin, pmoBizCtrl.getInvestmentRequest);
router.put('/admin/pmo/investment-requests/:id',            protect, admin, pmoBizCtrl.updateInvestmentRequest);
router.delete('/admin/pmo/investment-requests/:id',         protect, admin, pmoBizCtrl.deleteInvestmentRequest);
router.patch('/admin/pmo/investment-requests/:id/decide',   protect, admin, pmoBizCtrl.decideInvestmentRequest);

// ── Project Charters ──────────────────────────────────────────────────────────
router.get('/admin/pmo/charters',                protect, admin, pmoBizCtrl.listCharters);
router.post('/admin/pmo/charters',               protect, admin, pmoBizCtrl.createCharter);
router.get('/admin/pmo/charters/:id',            protect, admin, pmoBizCtrl.getCharter);
router.put('/admin/pmo/charters/:id',            protect, admin, pmoBizCtrl.updateCharter);
router.delete('/admin/pmo/charters/:id',         protect, admin, pmoBizCtrl.deleteCharter);
router.patch('/admin/pmo/charters/:id/approve',  protect, admin, pmoBizCtrl.approveCharter);

// ── Lessons Learned ───────────────────────────────────────────────────────────
router.get('/admin/pmo/lessons/report',        protect, admin, pmoKnowledgeCtrl.getLessonsReport);
router.get('/admin/pmo/lessons',               protect, admin, pmoKnowledgeCtrl.listLessons);
router.post('/admin/pmo/lessons',              protect, admin, pmoKnowledgeCtrl.createLesson);
router.get('/admin/pmo/lessons/:id',           protect, admin, pmoKnowledgeCtrl.getLesson);
router.put('/admin/pmo/lessons/:id',           protect, admin, pmoKnowledgeCtrl.updateLesson);
router.delete('/admin/pmo/lessons/:id',        protect, admin, pmoKnowledgeCtrl.deleteLesson);
router.patch('/admin/pmo/lessons/:id/approve', protect, admin, pmoKnowledgeCtrl.approveLesson);

// ── Templates / Methodology Library ──────────────────────────────────────────
router.get('/admin/pmo/templates',             protect, admin, pmoKnowledgeCtrl.listTemplates);
router.post('/admin/pmo/templates',            protect, admin, pmoKnowledgeCtrl.createTemplate);
router.get('/admin/pmo/templates/:id',         protect, admin, pmoKnowledgeCtrl.getTemplate);
router.put('/admin/pmo/templates/:id',         protect, admin, pmoKnowledgeCtrl.updateTemplate);
router.delete('/admin/pmo/templates/:id',      protect, admin, pmoKnowledgeCtrl.deleteTemplate);

// ── Document Repository ────────────────────────────────────────────────────────
router.get('/admin/pmo/documents',             protect, admin, pmoKnowledgeCtrl.listDocuments);
router.post('/admin/pmo/documents',            protect, admin, pmoKnowledgeCtrl.createDocument);
router.get('/admin/pmo/documents/:id',         protect, admin, pmoKnowledgeCtrl.getDocument);
router.put('/admin/pmo/documents/:id',         protect, admin, pmoKnowledgeCtrl.updateDocument);
router.delete('/admin/pmo/documents/:id',      protect, admin, pmoKnowledgeCtrl.deleteDocument);

// ── Project Audits ────────────────────────────────────────────────────────────
router.get('/admin/pmo/audits/summary',                      protect, admin, pmoAuditCtrl.getAuditSummary);
router.get('/admin/pmo/audits',                              protect, admin, pmoAuditCtrl.listAudits);
router.post('/admin/pmo/audits',                             protect, admin, pmoAuditCtrl.createAudit);
router.get('/admin/pmo/audits/:id',                          protect, admin, pmoAuditCtrl.getAudit);
router.put('/admin/pmo/audits/:id',                          protect, admin, pmoAuditCtrl.updateAudit);
router.delete('/admin/pmo/audits/:id',                       protect, admin, pmoAuditCtrl.deleteAudit);
router.post('/admin/pmo/audits/:id/findings',                protect, admin, pmoAuditCtrl.addFinding);
router.put('/admin/pmo/audits/:id/findings/:findingId',      protect, admin, pmoAuditCtrl.updateFinding);

// ── Project Scorecards ─────────────────────────────────────────────────────────
router.get('/admin/pmo/scorecards/health-report', protect, admin, pmoAuditCtrl.getScorecardHealthReport);
router.get('/admin/pmo/scorecards',               protect, admin, pmoAuditCtrl.listScorecards);
router.post('/admin/pmo/scorecards',              protect, admin, pmoAuditCtrl.createScorecard);
router.get('/admin/pmo/scorecards/:id',           protect, admin, pmoAuditCtrl.getScorecard);
router.put('/admin/pmo/scorecards/:id',           protect, admin, pmoAuditCtrl.updateScorecard);
router.delete('/admin/pmo/scorecards/:id',        protect, admin, pmoAuditCtrl.deleteScorecard);

// ══════════════════════════════════════════════════════════════════════════════
// Sprint 15D — Workflow Automation & BPM
// ══════════════════════════════════════════════════════════════════════════════
const wfDefCtrl      = require('../controllers/workflowDefinitionController');
const wfInstCtrl     = require('../controllers/workflowInstanceController');
const wfApprCtrl     = require('../controllers/workflowApprovalController');
const wfAutoCtrl     = require('../controllers/workflowAutomationController');
const wfAnalCtrl     = require('../controllers/workflowAnalyticsController');

// ── Analytics & Dashboard (static — must come before /:id) ───────────────────
router.get('/admin/workflows/dashboard',                protect, admin, wfAnalCtrl.getBPMDashboard);
router.get('/admin/workflows/analytics/performance',   protect, admin, wfAnalCtrl.getWorkflowPerformance);
router.get('/admin/workflows/analytics/approvals',     protect, admin, wfAnalCtrl.getApprovalAnalytics);
router.get('/admin/workflows/analytics/sla-compliance',protect, admin, wfAnalCtrl.getSLACompliance);
router.get('/admin/workflows/analytics/escalations',   protect, admin, wfAnalCtrl.getEscalationReport);
router.get('/admin/workflows/analytics/automation',    protect, admin, wfAnalCtrl.getAutomationReport);
router.get('/admin/workflows/analytics/audit-trail',   protect, admin, wfAnalCtrl.getAuditTrail);
router.get('/admin/workflows/analytics/department',    protect, admin, wfAnalCtrl.getDepartmentAnalytics);

// ── Templates (static — before /:id) ─────────────────────────────────────────
router.get('/admin/workflows/templates',               protect, admin, wfDefCtrl.listTemplates);
router.post('/admin/workflows/templates',              protect, admin, wfDefCtrl.createTemplate);
router.get('/admin/workflows/templates/:id',           protect, admin, wfDefCtrl.getTemplate);
router.put('/admin/workflows/templates/:id',           protect, admin, wfDefCtrl.updateTemplate);
router.delete('/admin/workflows/templates/:id',        protect, admin, wfDefCtrl.deleteTemplate);

// ── Rules ─────────────────────────────────────────────────────────────────────
router.get('/admin/workflows/rules',                   protect, admin, wfDefCtrl.listRules);
router.post('/admin/workflows/rules',                  protect, admin, wfDefCtrl.createRule);
router.get('/admin/workflows/rules/:id',               protect, admin, wfDefCtrl.getRule);
router.put('/admin/workflows/rules/:id',               protect, admin, wfDefCtrl.updateRule);
router.delete('/admin/workflows/rules/:id',            protect, admin, wfDefCtrl.deleteRule);

// ── Conditions ────────────────────────────────────────────────────────────────
router.get('/admin/workflows/conditions',              protect, admin, wfDefCtrl.listConditions);
router.post('/admin/workflows/conditions',             protect, admin, wfDefCtrl.createCondition);
router.get('/admin/workflows/conditions/:id',          protect, admin, wfDefCtrl.getCondition);
router.put('/admin/workflows/conditions/:id',          protect, admin, wfDefCtrl.updateCondition);
router.delete('/admin/workflows/conditions/:id',       protect, admin, wfDefCtrl.deleteCondition);

// ── Steps (standalone) ───────────────────────────────────────────────────────
router.get('/admin/workflows/steps/:id',               protect, admin, wfDefCtrl.getStep);
router.put('/admin/workflows/steps/:id',               protect, admin, wfDefCtrl.updateStep);
router.delete('/admin/workflows/steps/:id',            protect, admin, wfDefCtrl.deleteStep);

// ── Transitions (standalone) ─────────────────────────────────────────────────
router.put('/admin/workflows/transitions/:id',         protect, admin, wfDefCtrl.updateTransition);
router.delete('/admin/workflows/transitions/:id',      protect, admin, wfDefCtrl.deleteTransition);

// ── Triggers ──────────────────────────────────────────────────────────────────
router.get('/admin/workflows/triggers',                protect, admin, wfDefCtrl.listTriggers);
router.post('/admin/workflows/triggers',               protect, admin, wfDefCtrl.createTrigger);
router.get('/admin/workflows/triggers/:id',            protect, admin, wfDefCtrl.getTrigger);
router.put('/admin/workflows/triggers/:id',            protect, admin, wfDefCtrl.updateTrigger);
router.delete('/admin/workflows/triggers/:id',         protect, admin, wfDefCtrl.deleteTrigger);
router.post('/admin/workflows/triggers/:id/fire',      protect, admin, wfDefCtrl.fireTrigger);

// ── Instances ─────────────────────────────────────────────────────────────────
router.get('/admin/workflows/instances',               protect, admin, wfInstCtrl.listInstances);
router.post('/admin/workflows/instances',              protect, admin, wfInstCtrl.createInstance);
router.get('/admin/workflows/instances/my-pending',    protect, admin, wfInstCtrl.getMyPendingInstances);
router.get('/admin/workflows/instances/my-initiated',  protect, admin, wfInstCtrl.getMyInitiatedInstances);
router.get('/admin/workflows/instances/:id',           protect, admin, wfInstCtrl.getInstance);
router.put('/admin/workflows/instances/:id',           protect, admin, wfInstCtrl.updateInstance);
router.patch('/admin/workflows/instances/:id/start',   protect, admin, wfInstCtrl.startInstance);
router.patch('/admin/workflows/instances/:id/cancel',  protect, admin, wfInstCtrl.cancelInstance);
router.get('/admin/workflows/instances/:id/history',   protect, admin, wfInstCtrl.getInstanceHistory);
router.post('/admin/workflows/instances/:id/comments', protect, admin, wfInstCtrl.addComment);
router.get('/admin/workflows/instances/:id/comments',  protect, admin, wfInstCtrl.getComments);
router.post('/admin/workflows/instances/:id/attachments', protect, admin, wfInstCtrl.addAttachment);
router.get('/admin/workflows/instances/:id/attachments',  protect, admin, wfInstCtrl.getAttachments);

// ── Approvals ─────────────────────────────────────────────────────────────────
router.get('/admin/workflows/approvals',                    protect, admin, wfApprCtrl.listApprovals);
router.get('/admin/workflows/approvals/pending',            protect, admin, wfApprCtrl.getPendingApprovals);
router.post('/admin/workflows/approvals/bulk-approve',      protect, admin, wfApprCtrl.bulkApprove);
router.get('/admin/workflows/approvals/history/:instanceId',protect, admin, wfApprCtrl.getApprovalHistory);
router.get('/admin/workflows/approvals/:id',                protect, admin, wfApprCtrl.getApproval);
router.patch('/admin/workflows/approvals/:id/approve',      protect, admin, wfApprCtrl.approveStep);
router.patch('/admin/workflows/approvals/:id/reject',       protect, admin, wfApprCtrl.rejectStep);
router.patch('/admin/workflows/approvals/:id/delegate',     protect, admin, wfApprCtrl.delegateApproval);
router.patch('/admin/workflows/approvals/:id/recall',       protect, admin, wfApprCtrl.recallApproval);
router.patch('/admin/workflows/approvals/:id/override',     protect, admin, wfApprCtrl.overrideApproval);

// ── Escalations ───────────────────────────────────────────────────────────────
router.get('/admin/workflows/escalations',                      protect, admin, wfAutoCtrl.listEscalations);
router.post('/admin/workflows/escalations',                     protect, admin, wfAutoCtrl.createEscalation);
router.get('/admin/workflows/escalations/:id',                  protect, admin, wfAutoCtrl.getEscalation);
router.patch('/admin/workflows/escalations/:id/acknowledge',    protect, admin, wfAutoCtrl.acknowledgeEscalation);
router.patch('/admin/workflows/escalations/:id/resolve',        protect, admin, wfAutoCtrl.resolveEscalation);

// ── SLAs ──────────────────────────────────────────────────────────────────────
router.get('/admin/workflows/slas/breaches',           protect, admin, wfAutoCtrl.getSLABreaches);
router.get('/admin/workflows/slas',                    protect, admin, wfAutoCtrl.listSLAs);
router.post('/admin/workflows/slas',                   protect, admin, wfAutoCtrl.createSLA);
router.get('/admin/workflows/slas/:id',                protect, admin, wfAutoCtrl.getSLA);
router.put('/admin/workflows/slas/:id',                protect, admin, wfAutoCtrl.updateSLA);
router.delete('/admin/workflows/slas/:id',             protect, admin, wfAutoCtrl.deleteSLA);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/admin/workflows/notifications',                protect, admin, wfAutoCtrl.listNotifications);
router.post('/admin/workflows/notifications/mark-all-read', protect, admin, wfAutoCtrl.markAllNotificationsRead);
router.patch('/admin/workflows/notifications/:id/read',     protect, admin, wfAutoCtrl.markNotificationRead);

// ── Workflow Definitions (/:id last to avoid shadowing static routes) ─────────
router.get('/admin/workflows',                         protect, admin, wfDefCtrl.listWorkflows);
router.post('/admin/workflows',                        protect, admin, wfDefCtrl.createWorkflow);
router.get('/admin/workflows/:id',                     protect, admin, wfDefCtrl.getWorkflow);
router.put('/admin/workflows/:id',                     protect, admin, wfDefCtrl.updateWorkflow);
router.delete('/admin/workflows/:id',                  protect, admin, wfDefCtrl.deleteWorkflow);
router.patch('/admin/workflows/:id/activate',          protect, admin, wfDefCtrl.activateWorkflow);
router.patch('/admin/workflows/:id/deactivate',        protect, admin, wfDefCtrl.deactivateWorkflow);

// ── Steps (nested under workflow) ────────────────────────────────────────────
router.get('/admin/workflows/:workflowId/steps',       protect, admin, wfDefCtrl.listSteps);
router.post('/admin/workflows/:workflowId/steps',      protect, admin, wfDefCtrl.createStep);

// ── Transitions (nested under workflow) ──────────────────────────────────────
router.get('/admin/workflows/:workflowId/transitions', protect, admin, wfDefCtrl.listTransitions);
router.post('/admin/workflows/:workflowId/transitions',protect, admin, wfDefCtrl.createTransition);

// ═══════════════════════════════════════════════════════════════════════════
// Sprint 15E — Document Management System (DMS) & Knowledge Base
// ═══════════════════════════════════════════════════════════════════════════
const docLib  = require('../controllers/documentLibraryController');
const docWf   = require('../controllers/documentWorkflowController');
const docAna  = require('../controllers/documentAnalyticsController');
const kbCtrl  = require('../controllers/knowledgeBaseController');

// ── DMS Dashboard & Analytics ──────────────────────────────────────────────
router.get('/admin/documents/dashboard',              protect, admin, docAna.getDMSDashboard);
router.get('/admin/documents/analytics/activity',     protect, admin, docAna.getDocumentActivity);
router.get('/admin/documents/analytics/expiry',       protect, admin, docAna.getExpiryReport);
router.get('/admin/documents/analytics/retention',    protect, admin, docAna.getRetentionReport);
router.get('/admin/documents/analytics/reviews',      protect, admin, docAna.getReviewReport);
router.get('/admin/documents/analytics/audit',        protect, admin, docAna.getDocumentAuditTrail);
router.get('/admin/documents/analytics/knowledge',    protect, admin, docAna.getKnowledgeUsageReport);

// ── Document Search ────────────────────────────────────────────────────────
router.get('/admin/documents/search',                 protect, admin, docLib.searchDocuments);
router.get('/admin/documents/my',                     protect, admin, docLib.getMyDocuments);
router.get('/admin/documents/favorites',              protect, admin, docLib.getMyFavorites);
router.get('/admin/documents/recent',                 protect, admin, docLib.getRecentDocuments);

// ── Expiring & Review-Due ──────────────────────────────────────────────────
router.get('/admin/documents/expiring',               protect, admin, docWf.getExpiringDocuments);
router.get('/admin/documents/reviews/overdue',        protect, admin, docWf.getOverdueReviews);
router.get('/admin/documents/approvals/pending',      protect, admin, docWf.getPendingApprovals);

// ── Folders ────────────────────────────────────────────────────────────────
router.get('/admin/documents/folders',                protect, admin, docLib.listFolders);
router.post('/admin/documents/folders',               protect, admin, docLib.createFolder);
router.put('/admin/documents/folders/:id',            protect, admin, docLib.updateFolder);
router.delete('/admin/documents/folders/:id',         protect, admin, docLib.deleteFolder);

// ── Categories ─────────────────────────────────────────────────────────────
router.get('/admin/documents/categories',             protect, admin, docLib.listCategories);
router.post('/admin/documents/categories',            protect, admin, docLib.createCategory);
router.put('/admin/documents/categories/:id',         protect, admin, docLib.updateCategory);
router.delete('/admin/documents/categories/:id',      protect, admin, docLib.deleteCategory);

// ── Tags ───────────────────────────────────────────────────────────────────
router.get('/admin/documents/tags',                   protect, admin, docLib.listTags);
router.post('/admin/documents/tags',                  protect, admin, docLib.createTag);
router.delete('/admin/documents/tags/:id',            protect, admin, docLib.deleteTag);

// ── Templates ──────────────────────────────────────────────────────────────
router.get('/admin/documents/templates',              protect, admin, docLib.listTemplates);
router.post('/admin/documents/templates',             protect, admin, docLib.createTemplate);
router.post('/admin/documents/templates/:id/file',    protect, admin, serviceUpload.single('file'), docLib.uploadTemplateFile);
router.post('/admin/documents/templates/:id/use',     protect, admin, docLib.createFromTemplate);
router.put('/admin/documents/templates/:id',          protect, admin, docLib.updateTemplate);
router.delete('/admin/documents/templates/:id',       protect, admin, docLib.deleteTemplate);

// ── Retention Policies ─────────────────────────────────────────────────────
router.get('/admin/documents/retention',              protect, admin, docWf.listRetentionPolicies);
router.post('/admin/documents/retention',             protect, admin, docWf.createRetentionPolicy);
router.post('/admin/documents/retention/:id/apply',   protect, admin, docWf.applyRetentionPolicy);
router.put('/admin/documents/retention/:id',          protect, admin, docWf.updateRetentionPolicy);
router.delete('/admin/documents/retention/:id',       protect, admin, docWf.deleteRetentionPolicy);

// ── Archive ────────────────────────────────────────────────────────────────
router.get('/admin/documents/archive',                protect, admin, docWf.listArchives);
router.post('/admin/documents/archive/:id/restore',   protect, admin, docWf.restoreDocument);

// ── Reviews ────────────────────────────────────────────────────────────────
router.get('/admin/documents/reviews',                protect, admin, docWf.listReviews);
router.post('/admin/documents/reviews',               protect, admin, docWf.createReview);
router.patch('/admin/documents/reviews/:id/complete', protect, admin, docWf.completeReview);

// ── Approvals ──────────────────────────────────────────────────────────────
router.get('/admin/documents/approvals',              protect, admin, docWf.listApprovals);
router.post('/admin/documents/approvals',             protect, admin, docWf.createApproval);
router.patch('/admin/documents/approvals/:id/approve',protect, admin, docWf.approveDocument);
router.patch('/admin/documents/approvals/:id/reject', protect, admin, docWf.rejectDocument);

// ── Documents CRUD (/:id last to avoid shadowing) ─────────────────────────
router.get('/admin/documents',                        protect, admin, docLib.listDocuments);
router.post('/admin/documents',                       protect, admin, docLib.createDocument);
router.get('/admin/documents/:id',                    protect, admin, docLib.getDocument);
router.put('/admin/documents/:id',                    protect, admin, docLib.updateDocument);
router.delete('/admin/documents/:id',                 protect, admin, docLib.deleteDocument);

// ── Document File & Actions ────────────────────────────────────────────────
router.post('/admin/documents/:id/upload',            protect, admin, serviceUpload.single('file'), docLib.uploadDocumentFile);
router.post('/admin/documents/:id/checkout',          protect, admin, docLib.checkOutDocument);
router.post('/admin/documents/:id/checkin',           protect, admin, docLib.checkInDocument);
router.post('/admin/documents/:id/favorite',          protect, admin, docLib.toggleFavorite);
router.get('/admin/documents/:id/download',           protect, admin, docLib.downloadDocument);
router.post('/admin/documents/:id/publish',           protect, admin, docWf.publishDocument);
router.post('/admin/documents/:id/archive',           protect, admin, docWf.archiveDocument);

// ── Document Versions ──────────────────────────────────────────────────────
router.get('/admin/documents/:id/versions',           protect, admin, docLib.listVersions);
router.post('/admin/documents/:id/versions/:verId/restore', protect, admin, docLib.restoreVersion);

// ── Document Comments ──────────────────────────────────────────────────────
router.get('/admin/documents/:id/comments',           protect, admin, docLib.listComments);
router.post('/admin/documents/:id/comments',          protect, admin, docLib.addComment);
router.delete('/admin/documents/:id/comments/:cmtId', protect, admin, docLib.deleteComment);

// ── Document Permissions ───────────────────────────────────────────────────
router.get('/admin/documents/:id/permissions',        protect, admin, docLib.listPermissions);
router.post('/admin/documents/:id/permissions',       protect, admin, docLib.grantPermission);
router.delete('/admin/documents/:id/permissions/:permId', protect, admin, docLib.revokePermission);

// ── Document Sharing ───────────────────────────────────────────────────────
router.get('/admin/documents/:id/shares',             protect, admin, docLib.listShares);
router.post('/admin/documents/:id/share',             protect, admin, docLib.shareDocument);
router.delete('/admin/documents/:id/shares/:shareId', protect, admin, docLib.revokeShare);

// ── Document Signatures ────────────────────────────────────────────────────
router.get('/admin/documents/:id/signatures',         protect, admin, docWf.listSignatures);
router.post('/admin/documents/:id/signatures',        protect, admin, docWf.requestSignature);
router.patch('/admin/documents/:id/signatures/:sigId/sign',    protect, admin, docWf.signDocument);
router.patch('/admin/documents/:id/signatures/:sigId/decline', protect, admin, docWf.declineSignature);

// ── Knowledge Base Categories ──────────────────────────────────────────────
router.get('/admin/knowledge/categories',             protect, admin, kbCtrl.listCategories);
router.post('/admin/knowledge/categories',            protect, admin, kbCtrl.createCategory);
router.put('/admin/knowledge/categories/:id',         protect, admin, kbCtrl.updateCategory);
router.delete('/admin/knowledge/categories/:id',      protect, admin, kbCtrl.deleteCategory);

// ── Knowledge Base Articles — static sub-paths FIRST ─────────────────────
router.get('/admin/knowledge/search',                 protect, admin, kbCtrl.searchArticles);
router.get('/admin/knowledge/popular',                protect, admin, kbCtrl.getPopularArticles);
router.get('/admin/knowledge/bookmarks',              protect, admin, kbCtrl.getMyBookmarks);

// ── Knowledge Base Articles CRUD ──────────────────────────────────────────
router.get('/admin/knowledge',                        protect, admin, kbCtrl.listArticles);
router.post('/admin/knowledge',                       protect, admin, kbCtrl.createArticle);
router.get('/admin/knowledge/:id',                    protect, admin, kbCtrl.getArticle);
router.put('/admin/knowledge/:id',                    protect, admin, kbCtrl.updateArticle);
router.delete('/admin/knowledge/:id',                 protect, admin, kbCtrl.deleteArticle);

// ── Knowledge Base Article Actions ────────────────────────────────────────
router.post('/admin/knowledge/:id/publish',           protect, admin, kbCtrl.publishArticle);
router.post('/admin/knowledge/:id/archive',           protect, admin, kbCtrl.archiveArticle);
router.post('/admin/knowledge/:id/bookmark',          protect, admin, kbCtrl.toggleBookmark);
router.delete('/admin/knowledge/:id/bookmarks/:bmId', protect, admin, kbCtrl.deleteBookmark);
router.get('/admin/knowledge/:id/related',            protect, admin, kbCtrl.getRelatedArticles);
router.get('/admin/knowledge/:id/feedback',           protect, admin, kbCtrl.listFeedback);
router.post('/admin/knowledge/:id/feedback',          protect, admin, kbCtrl.addFeedback);
router.get('/admin/knowledge/:id/revisions',          protect, admin, kbCtrl.listRevisions);
router.get('/admin/knowledge/:id/revisions/:revId',   protect, admin, kbCtrl.getRevision);

// ═══════════════════════════════════════════════════════════════════════════
// Sprint 16A — Enterprise Business Intelligence & Executive Analytics
// ═══════════════════════════════════════════════════════════════════════════
const biDash  = require('../controllers/biDashboardController');
const biKPI   = require('../controllers/biKPIController');
const biAna   = require('../controllers/biAnalyticsController');
const biRpt   = require('../controllers/biReportController');
const biCfg   = require('../controllers/biConfigController');

// ── Executive Dashboards ──────────────────────────────────────────────────────
router.get('/admin/bi/executive/ceo',             protect, admin, biDash.getCEODashboard);
router.get('/admin/bi/executive/coo',             protect, admin, biDash.getCOODashboard);
router.get('/admin/bi/executive/cfo',             protect, admin, biDash.getCFODashboard);
router.get('/admin/bi/executive/chro',            protect, admin, biDash.getCHRODashboard);
router.get('/admin/bi/executive/operations',      protect, admin, biDash.getOperationsDashboard);
router.get('/admin/bi/executive/manufacturing',   protect, admin, biDash.getManufacturingDashboard);
router.get('/admin/bi/executive/supply-chain',    protect, admin, biDash.getSupplyChainDashboard);
router.get('/admin/bi/executive/sales',           protect, admin, biDash.getSalesExecutiveDashboard);
router.get('/admin/bi/executive/customer',        protect, admin, biDash.getCustomerDashboard);
router.get('/admin/bi/executive/projects',        protect, admin, biDash.getProjectsDashboard);
router.get('/admin/bi/executive/enterprise',      protect, admin, biDash.getEnterpriseHealthDashboard);

// ── KPI Engine ────────────────────────────────────────────────────────────────
router.get(   '/admin/bi/kpis',                   protect, admin, biKPI.getAllKPIs);
router.get(   '/admin/bi/kpis/check-alerts',      protect, admin, biKPI.checkAlerts);
router.get(   '/admin/bi/kpi-targets',            protect, admin, biKPI.getKPITargets);
router.post(  '/admin/bi/kpi-targets',            protect, admin, biKPI.createKPITarget);
router.put(   '/admin/bi/kpi-targets/:id',        protect, admin, biKPI.updateKPITarget);
router.delete('/admin/bi/kpi-targets/:id',        protect, admin, biKPI.deleteKPITarget);
router.get(   '/admin/bi/kpis/:name/trend',       protect, admin, biKPI.getKPITrend);
router.get(   '/admin/bi/kpis/:name',             protect, admin, biKPI.getKPI);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/admin/bi/analytics/cross-module',    protect, admin, biAna.getCrossModuleAnalytics);
router.get('/admin/bi/analytics/trends',          protect, admin, biAna.getTrendAnalysis);
router.get('/admin/bi/analytics/yoy',             protect, admin, biAna.getYoYComparison);
router.get('/admin/bi/analytics/mom',             protect, admin, biAna.getMoMComparison);
router.get('/admin/bi/analytics/qoq',             protect, admin, biAna.getQoQComparison);
router.get('/admin/bi/analytics/forecast',        protect, admin, biAna.getForecast);
router.get('/admin/bi/analytics/variance',        protect, admin, biAna.getVarianceAnalysis);
router.get('/admin/bi/analytics/benchmarks',      protect, admin, biAna.getBenchmarks);
router.get('/admin/bi/analytics/drilldown',       protect, admin, biAna.getDrillDown);
router.get('/admin/bi/analytics/heatmap/:module', protect, admin, biAna.getHeatmap);

// ── Reports & Board Packs ─────────────────────────────────────────────────────
router.get(   '/admin/bi/board-pack',             protect, admin, biRpt.getBoardPack);
router.get(   '/admin/bi/management-summary',     protect, admin, biRpt.getManagementSummary);
router.get(   '/admin/bi/scorecards/:dept',       protect, admin, biRpt.getDepartmentScorecard);
router.get(   '/admin/bi/reports',                protect, admin, biRpt.listReports);
router.post(  '/admin/bi/reports',                protect, admin, biRpt.createReport);
router.get(   '/admin/bi/reports/export/:format', protect, admin, biRpt.exportBoardPack);
router.get(   '/admin/bi/reports/:id/generate',   protect, admin, biRpt.generateReport);
router.get(   '/admin/bi/reports/:id',            protect, admin, biRpt.getReport);
router.put(   '/admin/bi/reports/:id',            protect, admin, biRpt.updateReport);
router.delete('/admin/bi/reports/:id',            protect, admin, biRpt.deleteReport);

// ── Config: Dashboards ────────────────────────────────────────────────────────
router.get(   '/admin/bi/dashboards',             protect, admin, biCfg.listDashboards);
router.post(  '/admin/bi/dashboards',             protect, admin, biCfg.createDashboard);
router.get(   '/admin/bi/dashboards/:id',         protect, admin, biCfg.getDashboard);
router.put(   '/admin/bi/dashboards/:id',         protect, admin, biCfg.updateDashboard);
router.delete('/admin/bi/dashboards/:id',         protect, admin, biCfg.deleteDashboard);

// ── Config: Alerts ────────────────────────────────────────────────────────────
router.get(   '/admin/bi/alerts',                 protect, admin, biCfg.listAlerts);
router.post(  '/admin/bi/alerts',                 protect, admin, biCfg.createAlert);
router.patch( '/admin/bi/alerts/:id/toggle',      protect, admin, biCfg.toggleAlert);
router.get(   '/admin/bi/alerts/:id',             protect, admin, biCfg.getAlert);
router.put(   '/admin/bi/alerts/:id',             protect, admin, biCfg.updateAlert);
router.delete('/admin/bi/alerts/:id',             protect, admin, biCfg.deleteAlert);

// ── Config: Bookmarks ─────────────────────────────────────────────────────────
router.get(   '/admin/bi/bookmarks',              protect, admin, biCfg.listBookmarks);
router.post(  '/admin/bi/bookmarks',              protect, admin, biCfg.createBookmark);
router.patch( '/admin/bi/bookmarks/:id/default',  protect, admin, biCfg.setDefaultBookmark);
router.delete('/admin/bi/bookmarks/:id',          protect, admin, biCfg.deleteBookmark);

// ═══════════════════════════════════════════════════════════════════════════
// Sprint 16B — Enterprise AI Forecasting & Predictive Intelligence
// ═══════════════════════════════════════════════════════════════════════════
const aiFC   = require('../controllers/aiForecastController');
const aiAnom = require('../controllers/aiAnomalyController');
const aiRec  = require('../controllers/aiRecommendationController');
const aiDash = require('../controllers/aiDashboardController');
const aiCfg  = require('../controllers/aiConfigController');

// AI Dashboard & Insights
router.get('/admin/ai/dashboard',                protect, admin, aiDash.getAIDashboard);
router.get('/admin/ai/dashboard/accuracy',       protect, admin, aiDash.getForecastAccuracy);
router.get('/admin/ai/dashboard/insights',       protect, admin, aiDash.getAIInsights);

// Scenarios
router.get('/admin/ai/scenarios',                protect, admin, aiDash.getScenarios);
router.post('/admin/ai/scenarios',               protect, admin, aiDash.createScenario);
router.get('/admin/ai/scenarios/compare',        protect, admin, aiDash.compareScenarios);
router.delete('/admin/ai/scenarios/:id',         protect, admin, aiDash.deleteScenario);

// Prediction History
router.get('/admin/ai/history',                  protect, admin, aiDash.getPredictionHistory);
router.get('/admin/ai/history/accuracy',         protect, admin, aiCfg.getModelPerformance);

// Forecasts — list & detail
router.get('/admin/ai/forecasts',                protect, admin, aiFC.listForecasts);
router.get('/admin/ai/forecasts/:id',            protect, admin, aiFC.getForecast);
router.delete('/admin/ai/forecasts/:id',         protect, admin, aiFC.deleteForecast);

// Forecasts — generate by type
router.post('/admin/ai/forecasts/sales',         protect, admin, aiFC.generateSalesForecast);
router.post('/admin/ai/forecasts/demand',        protect, admin, aiFC.generateDemandForecast);
router.post('/admin/ai/forecasts/inventory',     protect, admin, aiFC.generateInventoryForecast);
router.post('/admin/ai/forecasts/production',    protect, admin, aiFC.generateProductionForecast);
router.post('/admin/ai/forecasts/cashflow',      protect, admin, aiFC.generateCashFlowForecast);
router.post('/admin/ai/forecasts/revenue',       protect, admin, aiFC.generateRevenueForecast);
router.post('/admin/ai/forecasts/expense',       protect, admin, aiFC.generateExpenseForecast);
router.post('/admin/ai/forecasts/workforce',     protect, admin, aiFC.generateWorkforceForecast);
router.post('/admin/ai/forecasts/maintenance',   protect, admin, aiFC.generateMaintenanceForecast);
router.post('/admin/ai/forecasts/warranty',      protect, admin, aiFC.generateWarrantyForecast);
router.post('/admin/ai/forecasts/projects',      protect, admin, aiFC.generateProjectForecast);

// Anomalies
router.get('/admin/ai/anomalies',                protect, admin, aiAnom.listAnomalies);
router.get('/admin/ai/anomalies/stats',          protect, admin, aiAnom.getAnomalyStats);
router.post('/admin/ai/anomalies/detect',        protect, admin, aiAnom.detectAllAnomalies);
router.post('/admin/ai/anomalies/detect/demand', protect, admin, aiAnom.detectDemandAnomalies);
router.post('/admin/ai/anomalies/detect/inventory', protect, admin, aiAnom.detectInventoryAnomalies);
router.post('/admin/ai/anomalies/detect/cash',   protect, admin, aiAnom.detectCashAnomalies);
router.post('/admin/ai/anomalies/detect/production', protect, admin, aiAnom.detectProductionAnomalies);
router.patch('/admin/ai/anomalies/:id/resolve',  protect, admin, aiAnom.resolveAnomaly);

// Recommendations
router.get('/admin/ai/recommendations',          protect, admin, aiRec.listRecommendations);
router.get('/admin/ai/recommendations/stats',    protect, admin, aiRec.getRecommendationStats);
router.post('/admin/ai/recommendations/generate',           protect, admin, aiRec.generateAllRecommendations);
router.post('/admin/ai/recommendations/generate/inventory', protect, admin, aiRec.generateInventoryRecommendations);
router.post('/admin/ai/recommendations/generate/production',protect, admin, aiRec.generateProductionRecommendations);
router.post('/admin/ai/recommendations/generate/hr',        protect, admin, aiRec.generateHRRecommendations);
router.post('/admin/ai/recommendations/generate/maintenance',protect, admin, aiRec.generateMaintenanceRecommendations);
router.patch('/admin/ai/recommendations/:id/status', protect, admin, aiRec.updateRecommendationStatus);

// Config — Settings
router.get('/admin/ai/settings',                 protect, admin, aiCfg.listSettings);
router.put('/admin/ai/settings/:key',            protect, admin, aiCfg.updateSetting);
router.post('/admin/ai/settings/seed',           protect, admin, aiCfg.seedDefaultSettings);

// Config — Forecast Models
router.get('/admin/ai/models',                   protect, admin, aiCfg.getForecastModels);
router.post('/admin/ai/models',                  protect, admin, aiCfg.createForecastModel);
router.put('/admin/ai/models/:id',               protect, admin, aiCfg.updateForecastModel);
router.delete('/admin/ai/models/:id',            protect, admin, aiCfg.deleteForecastModel);

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT 16C — AI Copilot & Intelligent Automation  /api/admin/copilot/*
// ─────────────────────────────────────────────────────────────────────────────
const cplt   = require('../controllers/copilotController');
const aiAsst = require('../controllers/aiAssistantController');
const aiIns  = require('../controllers/aiInsightController');
const autom  = require('../controllers/automationController');
const know   = require('../controllers/knowledgeController');

// Conversations
router.get('/admin/copilot/conversations',               protect, admin, cplt.listConversations);
router.post('/admin/copilot/conversations',              protect, admin, cplt.createConversation);
router.get('/admin/copilot/conversations/:id',           protect, admin, cplt.getConversation);
router.delete('/admin/copilot/conversations/:id',        protect, admin, cplt.deleteConversation);
router.post('/admin/copilot/conversations/:id/message',  protect, admin, cplt.sendMessage);

// Suggestions
router.get('/admin/copilot/suggestions',                 protect, admin, cplt.getSuggestions);
router.post('/admin/copilot/suggestions/generate',       protect, admin, cplt.generateSuggestions);
router.patch('/admin/copilot/suggestions/:id/apply',     protect, admin, cplt.applySuggestion);
router.patch('/admin/copilot/suggestions/:id/dismiss',   protect, admin, cplt.dismissSuggestion);

// Tasks & Actions
router.get('/admin/copilot/tasks',                       protect, admin, cplt.listTasks);
router.post('/admin/copilot/tasks',                      protect, admin, cplt.createTask);
router.get('/admin/copilot/tasks/:id',                   protect, admin, cplt.getTask);
router.get('/admin/copilot/actions',                     protect, admin, cplt.listActions);

// Insights
router.post('/admin/copilot/insights/daily-briefing',    protect, admin, aiIns.generateDailyBriefing);
router.post('/admin/copilot/insights/dept-summary',      protect, admin, aiIns.generateDeptSummary);
router.post('/admin/copilot/insights/kpi-digest',        protect, admin, aiIns.generateKPIDigest);
router.post('/admin/copilot/insights/monthly-summary',   protect, admin, aiIns.generateMonthlySummary);
router.post('/admin/copilot/insights/risk-summary',      protect, admin, aiIns.generateRiskSummary);
router.post('/admin/copilot/insights/opportunity-summary', protect, admin, aiIns.generateOpportunitySummary);
router.get('/admin/copilot/insights',                    protect, admin, aiIns.listInsights);
router.get('/admin/copilot/insights/:id',                protect, admin, aiIns.getInsight);
router.delete('/admin/copilot/insights/:id',             protect, admin, aiIns.deleteInsight);

// Automation — Rules
router.get('/admin/copilot/automation/stats',            protect, admin, autom.getAutomationStats);
router.get('/admin/copilot/automation/rules',            protect, admin, autom.listRules);
router.post('/admin/copilot/automation/rules',           protect, admin, autom.createRule);
router.get('/admin/copilot/automation/rules/:id',        protect, admin, autom.getRule);
router.put('/admin/copilot/automation/rules/:id',        protect, admin, autom.updateRule);
router.delete('/admin/copilot/automation/rules/:id',     protect, admin, autom.deleteRule);
router.patch('/admin/copilot/automation/rules/:id/toggle', protect, admin, autom.toggleRule);
router.post('/admin/copilot/automation/rules/:id/execute', protect, admin, autom.executeRule);
router.post('/admin/copilot/automation/rules/:id/test',  protect, admin, autom.testRule);

// Automation — Executions & History
router.get('/admin/copilot/automation/executions',       protect, admin, autom.listExecutions);
router.get('/admin/copilot/automation/executions/:id',   protect, admin, autom.getExecution);
router.get('/admin/copilot/automation/history',          protect, admin, autom.listHistory);

// Automation — Templates
router.get('/admin/copilot/automation/templates',        protect, admin, autom.listTemplates);
router.post('/admin/copilot/automation/templates/seed',  protect, admin, autom.seedBuiltInTemplates);
router.post('/admin/copilot/automation/templates/:id/create-rule', protect, admin, autom.createFromTemplate);

// Knowledge Base
router.get('/admin/copilot/knowledge',                   protect, admin, know.listKnowledge);
router.post('/admin/copilot/knowledge',                  protect, admin, know.createKnowledge);
router.get('/admin/copilot/knowledge/search',            protect, admin, know.searchKnowledge);
router.post('/admin/copilot/knowledge/seed',             protect, admin, know.seedBuiltInKnowledge);
router.get('/admin/copilot/knowledge/module/:module',    protect, admin, know.getByModule);
router.get('/admin/copilot/knowledge/:id',               protect, admin, know.getKnowledge);
router.put('/admin/copilot/knowledge/:id',               protect, admin, know.updateKnowledge);
router.delete('/admin/copilot/knowledge/:id',            protect, admin, know.deleteKnowledge);
router.post('/admin/copilot/knowledge/:id/use',          protect, admin, know.incrementUseCount);

// Assistants
router.get('/admin/copilot/assistants',                  protect, admin, aiAsst.listAssistants);
router.post('/admin/copilot/assistants',                 protect, admin, aiAsst.createAssistant);
router.post('/admin/copilot/assistants/seed',            protect, admin, aiAsst.seedDefaultAssistants);
router.get('/admin/copilot/assistants/:id',              protect, admin, aiAsst.getAssistant);
router.put('/admin/copilot/assistants/:id',              protect, admin, aiAsst.updateAssistant);
router.delete('/admin/copilot/assistants/:id',           protect, admin, aiAsst.deleteAssistant);

// Prompts
router.get('/admin/copilot/prompts',                     protect, admin, aiAsst.listPrompts);
router.post('/admin/copilot/prompts',                    protect, admin, aiAsst.createPrompt);
router.post('/admin/copilot/prompts/seed',               protect, admin, aiAsst.seedBuiltInPrompts);
router.get('/admin/copilot/prompts/:id',                 protect, admin, aiAsst.getPrompt);
router.put('/admin/copilot/prompts/:id',                 protect, admin, aiAsst.updatePrompt);
router.delete('/admin/copilot/prompts/:id',              protect, admin, aiAsst.deletePrompt);
router.post('/admin/copilot/prompts/:id/use',            protect, admin, aiAsst.incrementPromptUse);

// Feedback
router.post('/admin/copilot/feedback',                   protect, admin, aiAsst.submitFeedback);
router.get('/admin/copilot/feedback/stats',              protect, admin, aiAsst.getFeedbackStats);

module.exports = router;

