import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  categoryAdded, categoryUpdated, categoryRemoved,
  productAdded, productUpdated, productRemoved,
} from '../redux/slices/shopSlices';
import API from '../services/api';
import ProductCard from '../components/ui/ProductCard';
import StarRating from '../components/ui/StarRating';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import useScrollReveal from '../hooks/useScrollReveal';
import { imgSrc, PLACEHOLDER } from '../utils/imageHelper';
import TestimonialModal from '../components/ui/TestimonialModal';
import FlashSaleWidget from '../components/ui/FlashSaleWidget';
import { getSocket } from '../services/socket';
import {
  FiZap, FiArrowRight, FiStar, FiPackage,
  FiTruck, FiShield, FiHome, FiMapPin, FiAward, FiHeadphones,
} from 'react-icons/fi';

// ── Stat counter — animates 0 → num using rAF, triggers once on viewport enter ──
function StatCounter({ num, format, duration = 2000 }) {
  const [val, setVal]   = useState(0);
  const ref             = useRef(null);
  const started         = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setVal(num * eased);
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [num, duration]);

  return <span ref={ref}>{format(val)}</span>;
}

// ── Hero fallback slides (used when CMS banners are empty) ─────────────────────
const HERO_SLIDES = [
  {
    eyebrow:  'Introducing the X-Series',
    title1:   'Engineering',
    title2:   'Perfection',
    subtitle: 'Metro X-Series appliances set a new benchmark in precision engineering, smart technology, and sustainable design.',
    cta:      'Shop Collection',
    ctaPath:  '/shop',
    image:    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&q=85',
  },
  {
    eyebrow:  'Metro Smart Home',
    title1:   'Your Home,',
    title2:   'Intelligent',
    subtitle: 'Wi-Fi enabled, app-controlled, energy-star rated. Metro smart appliances learn and adapt to your lifestyle.',
    cta:      'View Best Sellers',
    ctaPath:  '/shop?bestSeller=true',
    image:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=85',
  },
];

// ── Hero statistics with counter targets and formatting ────────────────────────
const STATS = [
  {
    num:    200000,
    format: n => n >= 100000 ? `${Math.floor(n / 100000)}L+` : n >= 1000 ? `${Math.floor(n / 1000)}K+` : `${Math.floor(n)}+`,
    label:  'Happy Homes',
    Icon:   FiHome,
  },
  {
    num:    500,
    format: n => `${Math.floor(n)}+`,
    label:  'Products',
    Icon:   FiPackage,
  },
  {
    num:    100,
    format: n => `${Math.floor(n)}+`,
    label:  'Cities Served',
    Icon:   FiMapPin,
  },
  {
    num:    4.9,
    format: n => `${Math.min(n, 4.9).toFixed(1)}★`,
    label:  'Customer Rating',
    Icon:   FiStar,
  },
  {
    num:    2,
    format: n => `${Math.ceil(n) || 1} Yrs`,
    label:  'Warranty',
    Icon:   FiAward,
  },
];

// ── Default testimonials ───────────────────────────────────────────────────────
const TESTIMONIALS_DEFAULT = [
  { name: 'Priya Sharma',  city: 'Mumbai',    rating: 5, initial: 'P', text: 'My Metro Smart Refrigerator X1 arrived perfectly. The build quality is exceptional — it truly feels like a premium product. The smart cooling technology is impressive.' },
  { name: 'Rahul Mehta',   city: 'Bangalore', rating: 5, initial: 'R', text: 'The Metro Vacuum Max is incredibly powerful. Quiet, efficient, and beautifully designed. It has completely changed how I think about home cleaning.' },
  { name: 'Anita Reddy',   city: 'Hyderabad', rating: 5, initial: 'A', text: 'Metro Ultra Wash Pro is outstanding. Gentle on clothes, tough on dirt. The build quality is far superior to anything I used before. Absolutely worth it.' },
  { name: 'Vikram Singh',  city: 'Delhi',     rating: 5, initial: 'V', text: 'The Metro AirCool Elite is whisper-quiet and cools instantly. The app control is seamless. Metro has genuinely raised the bar for home appliances in India.' },
  { name: 'Sneha Iyer',    city: 'Chennai',   rating: 5, initial: 'S', text: 'Bought the Metro ProMix 750 and the difference in build quality is immediately noticeable. Powerful motor, premium finish. Worth every rupee.' },
  { name: 'Arjun Kapoor',  city: 'Pune',      rating: 5, initial: 'A', text: 'Excellent after-sales support and the product arrived in immaculate condition. This is what premium Indian manufacturing looks like.' },
];

export default function Home() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { categories } = useSelector(s => s.products);
  const settings       = useSelector(s => s.settings.data);

  const [heroIdx,              setHeroIdx]              = useState(0);
  const [searchQ,              setSearchQ]              = useState('');
  const [testimonials,         setTestimonials]         = useState([]);
  const [banners,              setBanners]              = useState([]);
  const [newArrivals,          setNewArrivals]          = useState([]);
  const [bestSellers,          setBestSellers]          = useState([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [featuredProducts,     setFeaturedProducts]     = useState([]);
  const [featuredLoading,      setFeaturedLoading]      = useState(true);
  const [promoSections,        setPromoSections]        = useState([]);

  useScrollReveal({}, [
    testimonials.length, featuredProducts.length,
    categories.length, newArrivals.length, bestSellers.length,
  ]);

  // Single data-fetch on mount — no extra /categories call (Navbar already fetches)
  useEffect(() => {
    API.get('/testimonials').then(res => setTestimonials(res.data)).catch(console.error);
    API.get('/banners').then(res => setBanners(res.data.banners)).catch(console.error);

    setFeaturedLoading(true);
    API.get('/products', { params: { limit: 8, sort: '-createdAt' } })
      .then(res => setFeaturedProducts(res.data.products || []))
      .catch(() => setFeaturedProducts([]))
      .finally(() => setFeaturedLoading(false));

    API.get('/products', { params: { newArrival: 'true', limit: 8, sort: '-createdAt' } })
      .then(res => setNewArrivals(res.data.products || [])).catch(() => {});
    API.get('/products', { params: { bestSeller: 'true', limit: 8, sort: '-numReviews' } })
      .then(res => setBestSellers(res.data.products || [])).catch(() => {});
    API.get('/promo-sections')
      .then(res => setPromoSections(res.data.sections || [])).catch(() => {});
  }, [dispatch]);

  const activeBanners = banners.length > 0 ? banners : HERO_SLIDES;

  // Hero auto-advance
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const id = setInterval(() => setHeroIdx(i => (i + 1) % activeBanners.length), 5000);
    return () => clearInterval(id);
  }, [activeBanners.length]);

  // Socket: category sync
  useEffect(() => {
    const socket = getSocket();
    const onCreated = ({ category } = {}) => { if (category?.isActive) dispatch(categoryAdded(category)); };
    const onUpdated = ({ category } = {}) => {
      if (!category?._id) return;
      if (category.isActive) dispatch(categoryUpdated(category));
      else dispatch(categoryRemoved(category._id));
    };
    const onDeleted = ({ categoryId } = {}) => { if (categoryId) dispatch(categoryRemoved(categoryId)); };
    socket.on('category:created', onCreated);
    socket.on('category:updated', onUpdated);
    socket.on('category:deleted', onDeleted);
    return () => {
      socket.off('category:created', onCreated);
      socket.off('category:updated', onUpdated);
      socket.off('category:deleted', onDeleted);
    };
  }, [dispatch]);

  // Socket: product sync
  useEffect(() => {
    const socket = getSocket();
    const onProductCreated = ({ product } = {}) => {
      if (!product?._id || !product.isActive) return;
      dispatch(productAdded(product));
      setFeaturedProducts(prev => [product, ...prev].slice(0, 8));
      if (product.isNewArrival) setNewArrivals(prev => [product, ...prev].slice(0, 8));
      if (product.isBestSeller) setBestSellers(prev => [product, ...prev].slice(0, 8));
    };
    const onProductUpdated = ({ product } = {}) => {
      if (!product?._id) return;
      if (product.isActive) {
        dispatch(productUpdated(product));
        setFeaturedProducts(prev =>
          prev.some(p => p._id === product._id) ? prev.map(p => p._id === product._id ? product : p) : prev
        );
        setNewArrivals(prev => product.isNewArrival
          ? prev.some(p => p._id === product._id) ? prev.map(p => p._id === product._id ? product : p) : [product, ...prev].slice(0, 8)
          : prev.filter(p => p._id !== product._id)
        );
        setBestSellers(prev => product.isBestSeller
          ? prev.some(p => p._id === product._id) ? prev.map(p => p._id === product._id ? product : p) : [product, ...prev].slice(0, 8)
          : prev.filter(p => p._id !== product._id)
        );
      } else {
        dispatch(productRemoved(product._id));
        setFeaturedProducts(prev => prev.filter(p => p._id !== product._id));
        setNewArrivals(prev => prev.filter(p => p._id !== product._id));
        setBestSellers(prev => prev.filter(p => p._id !== product._id));
      }
    };
    const onProductDeleted = ({ productId } = {}) => {
      if (!productId) return;
      dispatch(productRemoved(productId));
      setFeaturedProducts(prev => prev.filter(p => p._id !== productId));
      setNewArrivals(prev => prev.filter(p => p._id !== productId));
      setBestSellers(prev => prev.filter(p => p._id !== productId));
    };
    socket.on('product:created', onProductCreated);
    socket.on('product:updated', onProductUpdated);
    socket.on('product:deleted', onProductDeleted);
    return () => {
      socket.off('product:created', onProductCreated);
      socket.off('product:updated', onProductUpdated);
      socket.off('product:deleted', onProductDeleted);
    };
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/shop?search=${encodeURIComponent(searchQ.trim())}`);
  };

  const slide = activeBanners[heroIdx] || activeBanners[0];

  // Dynamic trust strip — shipping text from settings, not hardcoded
  const shippingLabel = settings?.freeShippingEnabled !== false
    ? `Free Shipping ₹${(settings?.freeShippingThreshold || 5000).toLocaleString('en-IN')}+`
    : 'Nationwide Delivery';

  const TRUST_ITEMS = [
    { Icon: FiTruck,      label: shippingLabel,        sub: 'Pan India Coverage'       },
    { Icon: FiShield,     label: 'Secure Payments',    sub: 'SSL Encrypted'            },
    { Icon: FiAward,      label: 'Manufacturer Warranty', sub: 'Authorised Service'    },
    { Icon: FiHome,       label: 'Made for India',     sub: 'Engineered Locally'       },
    { Icon: FiHeadphones, label: 'Easy Support',       sub: '7 Days a Week'            },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ╔══════════════════════════════════════╗
          ║  HERO                                ║
          ╚══════════════════════════════════════╝ */}
      <section aria-label="Hero" className="relative min-h-screen pt-[72px] flex items-center overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0" style={{ background: 'var(--bg)' }} />
          <div
            className="absolute -right-40 top-0 bottom-0 w-[55%] hidden lg:block"
            style={{ background: '#EAEAEA', clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0% 100%)' }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full py-20 lg:py-0 min-h-[calc(100vh-72px)] flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">

            {/* ── Copy — re-animates on slide change; stats stay static ── */}
            <div className="relative z-10 py-12 lg:py-24">

              {/* Slide-dependent content: fades in on every change */}
              <div key={`hero-copy-${heroIdx}`} className="animate-fadeInUp">
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-8" aria-hidden="true">
                  <div className="w-8 h-px bg-[#FF8A00]" />
                  <span
                    className="text-[10px] font-bold tracking-[0.25em] uppercase"
                    style={{ color: 'var(--text-4)', fontFamily: 'var(--font-body)' }}
                  >
                    {slide.eyebrow}
                  </span>
                </div>

                {/* Headline */}
                <h1
                  className="mb-8 leading-[0.95]"
                  style={{
                    fontFamily:    'var(--font-display)',
                    fontWeight:    800,
                    fontSize:      'clamp(2.75rem, 6.5vw, 5.25rem)',
                    letterSpacing: '-0.035em',
                    color:         'var(--text)',
                  }}
                >
                  <span className="block">{slide.title1}</span>
                  {slide.title2 && (
                    <span className="block" style={{ color: 'var(--accent)' }}>{slide.title2}</span>
                  )}
                </h1>

                {/* Subtitle */}
                <p
                  className="mb-10 max-w-md leading-relaxed text-[17px]"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  {slide.subtitle}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-4 mb-0">
                  <Link to={slide.ctaPath || '/shop'} className="btn btn-primary">
                    {slide.cta || 'Shop Collection'} <FiArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                  </Link>
                  <Link to="/deals" className="btn btn-outline">
                    View Deals <FiZap size={15} strokeWidth={2.5} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Stats — static, not keyed, counter runs once on viewport enter */}
              <div
                className="flex flex-wrap items-center gap-8 sm:gap-10 mt-12 pt-8"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                {STATS.map(({ num, format, label, Icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                      style={{
                        background:   'var(--bg-2)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <Icon size={15} aria-hidden="true" style={{ color: 'var(--text-3)' }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div
                        className="stat-ticker"
                        style={{ fontSize: '1.625rem' }}
                      >
                        <StatCounter num={num} format={format} duration={1800} />
                      </div>
                      <div className="stat-ticker-label">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Image with floating animation ─────────────────────── */}
            <div className="relative py-12 lg:py-24">
              {/* Float wrapper — separated from overflow-hidden container to avoid clip */}
              <div className="animate-float" style={{ willChange: 'transform' }}>
                <div
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio:  '4/5',
                    background:   'var(--bg-2)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {activeBanners.map((s, i) => (
                    <img
                      key={s._id || i}
                      src={s?.image?.startsWith('http') ? s.image : imgSrc(s?.image)}
                      alt={s.title1 || s.title || 'Metro Appliance'}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      fetchpriority={i === 0 ? 'high' : 'low'}
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        opacity:    i === heroIdx ? 1 : 0,
                        transition: 'opacity 0.7s ease',
                        willChange: 'opacity',
                      }}
                      onError={(e) => { if (e.target.src !== PLACEHOLDER) e.target.src = PLACEHOLDER; }}
                    />
                  ))}
                  {/* Subtle bottom vignette */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/4 pointer-events-none z-10"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.04), transparent)' }}
                  />
                </div>
              </div>

              {/* Slide dots — outside float so they stay fixed */}
              {activeBanners.length > 1 && (
                <div className="absolute -bottom-8 left-0 flex gap-2.5" role="tablist" aria-label="Hero slides">
                  {activeBanners.map((_, i) => (
                    <button
                      key={i}
                      role="tab"
                      aria-selected={i === heroIdx}
                      aria-label={`Go to slide ${i + 1}`}
                      onClick={() => setHeroIdx(i)}
                      style={{
                        height:     '2px',
                        width:      i === heroIdx ? '32px' : '16px',
                        background: i === heroIdx ? 'var(--text)' : 'var(--bg-2)',
                        transition: 'all 0.35s var(--ease)',
                        borderRadius: '2px',
                        border:     'none',
                        cursor:     'pointer',
                        padding:    0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║  TRUST STRIP                         ║
          ╚══════════════════════════════════════╝ */}
      <section
        aria-label="Why shop with us"
        style={{
          borderTop:    '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          background:   'var(--card)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center min-w-max md:min-w-0 md:justify-between py-5 gap-6 md:gap-4">
            {TRUST_ITEMS.map(({ Icon, label, sub }, i) => (
              <React.Fragment key={label}>
                {i > 0 && (
                  <div
                    aria-hidden="true"
                    className="hidden md:block flex-shrink-0 w-px h-10"
                    style={{ background: 'var(--border)' }}
                  />
                )}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}
                  >
                    <Icon size={16} aria-hidden="true" style={{ color: 'var(--text-3)' }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p
                      className="text-[12px] font-bold leading-tight"
                      style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-[10px] mt-0.5 leading-tight"
                      style={{ color: 'var(--text-4)', fontFamily: 'var(--font-body)' }}
                    >
                      {sub}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║  CATEGORIES                          ║
          ╚══════════════════════════════════════╝ */}
      <section
        aria-labelledby="categories-heading"
        className="py-20 md:py-24"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 reveal gap-4">
            <div>
              <span className="section-eyebrow">Browse Collections</span>
              <h2 id="categories-heading" className="section-title">Shop by Category</h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors pb-0.5"
              style={{ color: 'var(--text-3)', borderBottom: '1px solid transparent' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderBottomColor = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderBottomColor = 'transparent'; }}
            >
              All Categories <FiArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 stagger-grid">
            {categories.length === 0 ? (
              Array(12).fill(null).map((_, i) => (
                <div key={i} className="flex flex-col gap-3" aria-hidden="true">
                  <div className="aspect-square skeleton" style={{ borderRadius: 'var(--radius-md)' }} />
                  <div className="h-3 skeleton w-2/3 mx-auto" style={{ borderRadius: 'var(--radius-sm)' }} />
                </div>
              ))
            ) : (
              categories.slice(0, 12).map(cat => (
                <Link
                  key={cat._id}
                  to={`/shop?category=${cat.slug}`}
                  className="group flex flex-col items-center text-center"
                  aria-label={`Browse ${cat.name}`}
                >
                  <div
                    className="w-full aspect-square overflow-hidden mb-3 relative transition-all duration-300"
                    style={{
                      background:   'var(--bg-2)',
                      borderRadius: 'var(--radius-md)',
                      border:       '1px solid var(--border)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none';             e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    {cat.image ? (
                      <img
                        src={imgSrc({ url: cat.image })}
                        alt={cat.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-5)' }}>NO IMAGE</span>
                      </div>
                    )}
                  </div>
                  <h3
                    className="font-semibold text-[13px] leading-snug transition-colors duration-150 group-hover:text-[#FF8A00]"
                    style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}
                  >
                    {cat.name}
                  </h3>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Flash Sale Widget (CMS-driven, only renders when a live sale exists) ── */}
      <FlashSaleWidget />

      {/* ╔══════════════════════════════════════╗
          ║  FEATURED PRODUCTS                   ║
          ╚══════════════════════════════════════╝ */}
      <section
        aria-labelledby="featured-heading"
        className="py-20 md:py-28"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 reveal gap-6">
            <div>
              <span className="section-eyebrow">Selected</span>
              <h2 id="featured-heading" className="section-title-lg">Featured Appliances</h2>
            </div>
            <Link to="/shop" className="btn btn-ghost">
              View All <FiArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>

          {featuredLoading ? (
            <ProductGridSkeleton count={8} />
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-grid">
              {featuredProducts.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div
              className="py-28 text-center border"
              style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg)' }}
            >
              <FiPackage size={40} aria-hidden="true" className="mx-auto mb-4" style={{ color: 'var(--text-5)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>Products are being cataloged.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CMS Promotional Sections (admin-managed, render dynamically) ── */}
      {promoSections.map(section => (
        <section
          key={section._id}
          aria-labelledby={`promo-${section._id}`}
          className="py-20 md:py-28"
          style={{
            borderTop: '1px solid var(--border)',
            background: section.bgColor || 'var(--bg)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 reveal gap-6">
              <div>
                <span className="section-eyebrow">{section.sectionType?.replace('_', ' ') || 'Collection'}</span>
                <h2 id={`promo-${section._id}`} className="section-title-lg">{section.title}</h2>
                {section.subtitle && <p className="mt-2 text-sm" style={{ color: 'var(--text-3)' }}>{section.subtitle}</p>}
              </div>
              {section.ctaText && section.ctaLink && (
                <Link to={section.ctaLink} className="btn btn-ghost">
                  {section.ctaText} <FiArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
                </Link>
              )}
            </div>
            {section.products?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-grid">
                {section.products.slice(0, section.maxProducts || 8).map(p => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-sm" style={{ color: 'var(--text-4)' }}>No products in this section yet.</p>
            )}
          </div>
        </section>
      ))}

      {/* ╔══════════════════════════════════════╗
          ║  NEW ARRIVALS                        ║
          ╚══════════════════════════════════════╝ */}
      {newArrivals.length > 0 && (
        <section
          aria-labelledby="new-arrivals-heading"
          className="py-20 md:py-28"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 reveal gap-6">
              <div>
                <span className="section-eyebrow">Just Landed</span>
                <h2 id="new-arrivals-heading" className="section-title-lg">New Arrivals</h2>
              </div>
              <Link to="/shop?newArrival=true" className="btn btn-ghost">
                See All <FiArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-grid">
              {newArrivals.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ╔══════════════════════════════════════╗
          ║  BEST SELLERS                        ║
          ╚══════════════════════════════════════╝ */}
      {bestSellers.length > 0 && (
        <section
          aria-labelledby="best-sellers-heading"
          className="py-20 md:py-28"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 reveal gap-6">
              <div>
                <span className="section-eyebrow-accent">Customer Favourite</span>
                <h2 id="best-sellers-heading" className="section-title-lg">Best Sellers</h2>
              </div>
              <Link to="/shop?bestSeller=true" className="btn btn-ghost">
                View All <FiArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-grid">
              {bestSellers.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ╔══════════════════════════════════════╗
          ║  TESTIMONIALS                        ║
          ╚══════════════════════════════════════╝ */}
      <section
        aria-labelledby="testimonials-heading"
        className="py-20 md:py-28"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-16 reveal flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="section-eyebrow">Reputation</span>
              <h2 id="testimonials-heading" className="section-title-lg mb-4">Client Experiences</h2>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5" aria-hidden="true">
                  {[1,2,3,4,5].map(i => (
                    <FiStar key={i} size={13} className="fill-current" style={{ color: 'var(--accent)' }} />
                  ))}
                </div>
                <span className="font-numbers font-bold text-sm ml-1" style={{ color: 'var(--text)' }}>4.9 / 5</span>
                <span className="text-sm" style={{ color: 'var(--text-3)' }}>from 200,000+ reviews</span>
              </div>
              <div className="mt-8">
                <button onClick={() => setShowTestimonialModal(true)} className="btn btn-outline">
                  Share Your Experience
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-grid">
            {(testimonials.length > 0 ? testimonials : TESTIMONIALS_DEFAULT).slice(0, 6).map((t, i) => (
              <article
                key={t._id || i}
                className="flex flex-col justify-between p-8 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background:   'var(--card)',
                  border:       '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow:    'var(--shadow-xs)',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-xs)'}
              >
                <div>
                  <div
                    aria-hidden="true"
                    className="text-5xl font-black leading-none mb-4 select-none"
                    style={{ color: 'var(--bg-2)', fontFamily: 'Georgia, serif', lineHeight: 1 }}
                  >"</div>
                  <StarRating rating={t.rating} showCount={false} size={12} className="mb-5" />
                  <p
                    className="text-[14px] leading-[1.75]"
                    style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
                  >
                    {t.text}
                  </p>
                </div>

                <footer
                  className="mt-7 pt-6 flex items-center gap-4"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  {t.image ? (
                    <img
                      src={imgSrc(t.image)}
                      alt={t.name}
                      className="w-11 h-11 object-cover flex-shrink-0 rounded-full"
                      style={{ border: '2px solid var(--border)' }}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-11 h-11 flex items-center justify-center flex-shrink-0 font-bold text-base rounded-full"
                      style={{
                        background: 'var(--bg-2)',
                        border:     '2px solid var(--border)',
                        color:      'var(--text)',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {t.initial || t.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p
                      className="text-[13px] font-bold tracking-wide uppercase leading-tight"
                      style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}
                    >
                      {t.name}
                    </p>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: 'var(--text-4)', fontFamily: 'var(--font-body)' }}
                    >
                      {t.city}
                    </p>
                  </div>
                </footer>
              </article>
            ))}
          </div>

          {showTestimonialModal && (
            <TestimonialModal
              onClose={() => setShowTestimonialModal(false)}
              onSuccess={(newT) => setTestimonials(prev => [newT, ...prev])}
            />
          )}
        </div>
      </section>

      {/* ╔══════════════════════════════════════╗
          ║  CTA BANNER                          ║
          ╚══════════════════════════════════════╝ */}
      <section
        aria-label="Call to action"
        className="py-24 md:py-32"
        style={{ background: 'var(--text)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center reveal">
          <span
            className="block text-[10px] font-bold tracking-[0.25em] uppercase mb-8"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
          >
            Exclusive Access
          </span>
          <h2
            className="mb-6 text-white"
            style={{
              fontFamily:    'var(--font-display)',
              fontWeight:    800,
              fontSize:      'clamp(2.25rem, 5vw, 3.5rem)',
              letterSpacing: '-0.03em',
              lineHeight:    1.05,
            }}
          >
            Elevate Your Space
          </h2>
          <p
            className="mb-12 mx-auto max-w-lg text-[17px] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Register today to receive our latest catalog and access exclusive pricing on all product lines.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link to="/shop" className="btn btn-accent w-full sm:w-auto">
              Explore Catalog <FiArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <Link
              to="/register"
              className="btn btn-outline w-full sm:w-auto"
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
