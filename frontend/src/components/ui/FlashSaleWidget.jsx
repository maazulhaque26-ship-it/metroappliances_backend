import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import ProductCard from './ProductCard';
import { FiZap, FiArrowRight } from 'react-icons/fi';

function useCountdown(endDate) {
  const calc = () => {
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return { h: 0, m: 0, s: 0, done: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, done: false };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    if (time.done) return;
    const t = setInterval(() => setTime(calc), 1000);
    return () => clearInterval(t);
  }, [endDate, time.done]);
  return time;
}

function TimeBlock({ val, label }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="font-extrabold tabular-nums"
        style={{ fontFamily: 'var(--font-numbers)', fontSize: '1.75rem', lineHeight: 1, color: '#ffffff', minWidth: '2.5ch', textAlign: 'center' }}
      >
        {String(val).padStart(2, '0')}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</span>
    </div>
  );
}

function Colon() {
  return <span className="font-extrabold text-xl mb-2" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-numbers)' }}>:</span>;
}

export default function FlashSaleWidget() {
  const [sale, setSale] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    API.get('/flash-sale/active')
      .then(r => { setSale(r.data.flashSale); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const time = useCountdown(sale?.endDate || new Date());

  if (!loaded || !sale) return null;
  if (time.done) return null;

  const products = (sale.products || [])
    .filter(p => p.product?.isActive)
    .slice(0, 8);
  if (products.length === 0) return null;

  return (
    <section
      className="py-12 px-4"
      style={{ background: sale.bgColor || '#111111', fontFamily: 'var(--font-body)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center w-10 h-10 flex-shrink-0"
              style={{ background: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
            >
              <FiZap size={18} strokeWidth={2.5} color="#fff" />
            </div>
            <div>
              <span
                className="inline-block mb-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em]"
                style={{ background: 'rgba(255,138,0,0.15)', color: 'var(--accent)', borderRadius: '2px', border: '1px solid rgba(255,138,0,0.25)' }}
              >
                {sale.badgeText || 'Flash Sale'}
              </span>
              <h2
                className="font-extrabold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.25rem,3vw,1.75rem)', color: sale.textColor || '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}
              >
                {sale.title}
              </h2>
              {sale.subtitle && (
                <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{sale.subtitle}</p>
              )}
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>Ends in</span>
            <div className="flex items-end gap-2">
              <TimeBlock val={time.h} label="hrs" />
              <Colon />
              <TimeBlock val={time.m} label="min" />
              <Colon />
              <TimeBlock val={time.s} label="sec" />
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(({ product, salePrice, originalPrice }) => (
            <ProductCard
              key={product._id}
              product={{
                ...product,
                price:         originalPrice || product.price,
                discountPrice: salePrice,
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 font-bold text-[11px] uppercase tracking-widest transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
          >
            View All Deals <FiArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
