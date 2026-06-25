/**
 * Analytics — consent-gated, environment-driven.
 *
 * IDs are read from VITE_ env vars so nothing is hardcoded in source.
 * Set these in Vercel project settings:
 *   VITE_GA4_ID          = G-XXXXXXXXXX
 *   VITE_CLARITY_ID      = xxxxxxxxxx
 *   VITE_META_PIXEL_ID   = xxxxxxxxxxxxxxxx
 *
 * Call initAnalytics() once after the user grants cookie consent.
 * All event helpers are safe to call before init (they no-op silently).
 */

let initialised = false;

function gtag(...args) {
  if (typeof window.gtag === 'function') window.gtag(...args);
}

export function initAnalytics() {
  if (initialised) return;
  initialised = true;

  const GA4_ID      = import.meta.env.VITE_GA4_ID;
  const CLARITY_ID  = import.meta.env.VITE_CLARITY_ID;
  const PIXEL_ID    = import.meta.env.VITE_META_PIXEL_ID;

  // ── Google Analytics 4 ───────────────────────────────────────────────────
  if (GA4_ID) {
    const s = document.createElement('script');
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    s.async = true;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA4_ID, { send_page_view: false });
  }

  // ── Microsoft Clarity ────────────────────────────────────────────────────
  if (CLARITY_ID) {
    (function(c, l, a, r, i, t, y) {
      c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  // ── Meta Pixel ───────────────────────────────────────────────────────────
  if (PIXEL_ID) {
    !function(f,b,e,v,n,t,s) {
      if(f.fbq) return; n=f.fbq=function() {
        n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments);
      };
      if(!f._fbq) f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0';
      n.queue=[]; t=b.createElement(e); t.async=!0;
      t.src=v; s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
}

// ── Typed event helpers ──────────────────────────────────────────────────────

export function trackPageView(path, title) {
  gtag('event', 'page_view', { page_path: path, page_title: title });
  if (typeof window.fbq === 'function') window.fbq('track', 'PageView');
}

export function trackProductView(product) {
  if (!product) return;
  gtag('event', 'view_item', {
    currency: 'INR',
    value: product.discountPrice || product.price,
    items: [{ item_id: product._id, item_name: product.name, price: product.discountPrice || product.price }],
  });
}

export function trackAddToCart(product, quantity = 1) {
  if (!product) return;
  gtag('event', 'add_to_cart', {
    currency: 'INR',
    value: (product.discountPrice || product.price) * quantity,
    items: [{ item_id: product._id, item_name: product.name, quantity }],
  });
  if (typeof window.fbq === 'function') window.fbq('track', 'AddToCart');
}

export function trackWishlist(product) {
  if (!product) return;
  gtag('event', 'add_to_wishlist', {
    currency: 'INR',
    value: product.discountPrice || product.price,
    items: [{ item_id: product._id, item_name: product.name }],
  });
}

export function trackSearch(query) {
  if (!query) return;
  gtag('event', 'search', { search_term: query });
}

export function trackCheckoutStarted(value) {
  gtag('event', 'begin_checkout', { currency: 'INR', value });
  if (typeof window.fbq === 'function') window.fbq('track', 'InitiateCheckout');
}

export function trackPurchase(order) {
  if (!order) return;
  gtag('event', 'purchase', {
    transaction_id: order.orderNumber || order._id,
    value: order.totalPrice,
    currency: 'INR',
    items: order.items?.map(i => ({ item_id: i.product, item_name: i.name, quantity: i.quantity, price: i.price })) || [],
  });
  if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', { value: order.totalPrice, currency: 'INR' });
}

export function trackPaymentFailure(reason) {
  gtag('event', 'payment_failure', { reason: reason || 'unknown' });
  if (typeof window.fbq === 'function') window.fbq('trackCustom', 'PaymentFailure');
}

export function trackCategoryView(category) {
  if (!category) return;
  gtag('event', 'view_item_list', {
    item_list_id: category._id || category.slug,
    item_list_name: category.name || category,
  });
}

export function trackQuickView(product) {
  if (!product) return;
  gtag('event', 'quick_view', {
    currency: 'INR',
    value: product.discountPrice || product.price,
    items: [{ item_id: product._id, item_name: product.name }],
  });
}

export function trackCompare(products) {
  if (!products?.length) return;
  gtag('event', 'compare_products', {
    items: products.map(p => ({ item_id: p._id, item_name: p.name })),
  });
}

export function trackContactForm() {
  gtag('event', 'contact_form_submit');
  if (typeof window.fbq === 'function') window.fbq('trackCustom', 'ContactForm');
}

export function trackBlogView(blog) {
  if (!blog) return;
  gtag('event', 'blog_view', {
    blog_id: blog._id || blog.slug,
    blog_title: blog.title,
  });
}

export function trackOrderTracked(orderId) {
  if (!orderId) return;
  gtag('event', 'track_order', { order_id: orderId });
}

export function trackNewsletterSignup() {
  gtag('event', 'newsletter_signup');
  if (typeof window.fbq === 'function') window.fbq('trackCustom', 'NewsletterSignup');
}
