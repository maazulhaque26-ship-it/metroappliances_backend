import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, productAdded, productUpdated, productRemoved } from '../redux/slices/shopSlices';
import { getSocket } from '../services/socket';
import ProductCard from '../components/ui/ProductCard';
import CountdownTimer from '../components/ui/CountdownTimer';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import useScrollReveal from '../hooks/useScrollReveal';
import { FiZap, FiTag, FiArrowRight, FiClock } from 'react-icons/fi';

const DEAL_SECTIONS = [
  { key: 'flash',  label: 'Flash Sale',    end: new Date(Date.now() + 4  * 3600000), badge: 'Ends Soon',  color: 'text-red-400' },
  { key: 'today',  label: "Today's Deals", end: new Date(Date.now() + 12 * 3600000), badge: '12h Left',   color: 'text-amber-400' },
  { key: 'week',   label: 'Weekly Offers', end: new Date(Date.now() + 7  * 86400000),badge: '7 Days',     color: 'text-green-400' },
];

// Metro-only coupon offers — no third-party references
const OFFER_BANNERS = [
  { code: 'METRO1000', desc: 'Rs. 1,000 off on orders above Rs. 9,999', icon: FiTag },
  { code: 'FIRSTBUY',  desc: '15% off on your first Metro order',        icon: FiZap },
  { code: 'METRO5',    desc: '5% extra off on all smart appliances',     icon: FiClock },
];

export default function Deals() {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector(s => s.products);
  useScrollReveal({}, [products]);
  const [activeSection, setActiveSection] = useState('flash');

  useEffect(() => {
    dispatch(fetchProducts({ limit: 12, sort: '-discountPrice' }));
  }, [dispatch]);

  useEffect(() => {
    const socket = getSocket();

    const onProductCreated = ({ product } = {}) => {
      if (product?.isActive) dispatch(productAdded(product));
    };
    const onProductUpdated = ({ product } = {}) => {
      if (!product?._id) return;
      if (product.isActive) dispatch(productUpdated(product));
      else dispatch(productRemoved(product._id));
    };
    const onProductDeleted = ({ productId } = {}) => {
      if (productId) dispatch(productRemoved(productId));
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

  const dealProducts = products.filter(p => p.discountPrice > 0 && p.discountPrice < p.price);

  return (
    <div className="min-h-screen bg-[#080808] pt-28 pb-16">
      {/* Hero */}
      <div className="relative py-16 overflow-hidden border-b border-white/5 mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/15 via-amber-900/10 to-transparent" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FiZap size={18} className="text-red-400" />
                <span className="text-red-400 font-bold text-sm uppercase tracking-[0.2em]">Limited Time Offers</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
                Up to <span className="text-gradient-orange">60% Off</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-md">
                Exclusive savings on Metro premium appliances. Engineered for your home, priced for everyone.
              </p>
            </div>
            <div className="flex-shrink-0">
              <p className="text-gray-400 text-sm mb-3 text-center">Flash sale ends in:</p>
              <CountdownTimer targetDate={DEAL_SECTIONS[0].end} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Offer banners */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12 stagger-grid">
          {OFFER_BANNERS.map(({ code, desc, icon: Icon }) => (
            <div key={code} className="card p-5 flex items-center gap-4 hover:border-amber-500/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                <Icon size={18} className="text-amber-500" />
              </div>
              <div>
                <p className="text-white font-black font-mono text-lg">{code}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/5 overflow-x-auto no-scrollbar">
          {DEAL_SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`whitespace-nowrap px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all ${
                activeSection === s.key
                  ? 'text-amber-500 border-amber-500'
                  : 'text-gray-500 border-transparent hover:text-white'
              }`}
            >
              {s.label}
              <span className={`ml-2 text-[10px] font-bold ${s.color}`}>{s.badge}</span>
            </button>
          ))}
        </div>

        {/* Countdown for active section */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-400 text-sm">
            {dealProducts.length} deals available
          </p>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">Section ends in:</span>
            <CountdownTimer
              targetDate={DEAL_SECTIONS.find(s => s.key === activeSection)?.end}
            />
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : dealProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 stagger-grid">
            {dealProducts.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <FiTag size={48} className="mx-auto mb-3 text-gray-700" />
            <p className="text-white font-bold text-lg mb-2">No deals right now</p>
            <p className="text-gray-500 mb-6">Check back soon for exclusive Metro offers.</p>
            <Link to="/shop" className="btn-orange">Browse All Products</Link>
          </div>
        )}

        {dealProducts.length > 0 && (
          <div className="text-center mt-12">
            <Link to="/shop" className="btn-outline btn-lg">
              View All Metro Products <FiArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
