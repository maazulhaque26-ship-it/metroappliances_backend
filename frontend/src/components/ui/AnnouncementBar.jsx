import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const DISMISSED_KEY = 'metro_announcement_dismissed';

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); }
  catch { return []; }
}

function dismiss(id) {
  const current = getDismissed();
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...new Set([...current, id])]));
}

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState([]);
  const [index, setIndex]                 = useState(0);
  const [visible, setVisible]             = useState(true);

  useEffect(() => {
    API.get('/announcements')
      .then(r => {
        const dismissed = getDismissed();
        const live = (r.data.announcements || []).filter(a => !dismissed.includes(a._id));
        setAnnouncements(live);
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => setIndex(i => (i + 1) % announcements.length), [announcements.length]);
  const prev = useCallback(() => setIndex(i => (i - 1 + announcements.length) % announcements.length), [announcements.length]);

  // Auto-rotate every 5s if there are multiple announcements
  useEffect(() => {
    if (announcements.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [announcements.length, next]);

  if (!visible || announcements.length === 0) return null;

  const current = announcements[index];

  return (
    <div
      className="relative w-full flex items-center justify-center px-4 py-2.5"
      style={{
        background: current.bgColor || '#111111',
        color: current.textColor || '#ffffff',
        minHeight: '38px',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Prev arrow (only when multiple) */}
      {announcements.length > 1 && (
        <button
          onClick={prev}
          className="absolute left-3 p-1 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Previous announcement"
        >
          <FiChevronLeft size={14} />
        </button>
      )}

      {/* Content */}
      <div className="flex items-center gap-2 text-center text-[12px] font-semibold tracking-wide">
        {current.icon && <span className="text-[14px]">{current.icon}</span>}
        <span style={{ color: current.textColor || '#ffffff' }}>{current.title}</span>
        {current.ctaText && current.ctaLink && (
          <Link
            to={current.ctaLink.startsWith('http') ? undefined : current.ctaLink}
            href={current.ctaLink.startsWith('http') ? current.ctaLink : undefined}
            className="ml-2 underline underline-offset-2 font-bold text-[11px] uppercase tracking-widest opacity-90 hover:opacity-100 transition-opacity"
            style={{ color: current.textColor || '#ffffff' }}
          >
            {current.ctaText}
          </Link>
        )}
      </div>

      {/* Dots (only when multiple) */}
      {announcements.length > 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0.5 flex gap-1">
          {announcements.map((_, i) => (
            <span
              key={i}
              onClick={() => setIndex(i)}
              className="cursor-pointer w-1 h-1 rounded-full transition-opacity"
              style={{ background: current.textColor || '#fff', opacity: i === index ? 1 : 0.35 }}
            />
          ))}
        </div>
      )}

      {/* Next arrow (only when multiple) */}
      {announcements.length > 1 && (
        <button
          onClick={next}
          className="absolute right-8 p-1 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Next announcement"
        >
          <FiChevronRight size={14} />
        </button>
      )}

      {/* Close */}
      <button
        onClick={() => { dismiss(current._id); setVisible(false); }}
        className="absolute right-3 p-1 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <FiX size={14} />
      </button>
    </div>
  );
}
