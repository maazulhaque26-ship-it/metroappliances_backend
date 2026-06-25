import React, { useEffect, useCallback, useState, useRef } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { imgSrc } from '../../utils/imageHelper';

// Chrome heights (px) — image stage is bounded by these to prevent any overlap.
const TOP_BAR_H    = 56;   // counter + zoom + close buttons
const THUMB_STRIP_H = 80;  // thumbnail strip (h-12 thumbs + spacing)
const ARROW_W       = 56;  // horizontal space reserved per side for prev/next arrows

export default function GalleryLightbox({ images, startIndex = 0, onClose }) {
  const [idx,    setIdx]    = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);

  const touchStartX = useRef(null);
  const hasMany     = images.length > 1;

  const prev = useCallback(() => {
    setIdx(i => (i - 1 + images.length) % images.length);
    setZoomed(false);
  }, [images.length]);

  const next = useCallback(() => {
    setIdx(i => (i + 1) % images.length);
    setZoomed(false);
  }, [images.length]);

  // Keyboard: ESC closes, arrows navigate
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  // Lock body scroll; restore on unmount
  useEffect(() => {
    const saved = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = saved; };
  }, []);

  // Swipe navigation
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  const current = images[idx];
  const src = typeof current === 'string'
    ? imgSrc(current)
    : imgSrc(current?.image || current?.src || '');

  return (
    /*
     * Outer overlay — `inset-0` on a fixed element fills the viewport without
     * depending on `100vh` (which iOS Safari inflates to include the address bar).
     * `overflow-hidden` is the critical clip that prevents ANY child — including
     * transformed/scaled images — from bleeding outside the viewport boundary.
     */
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.93)' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >

      {/* ── Top bar: counter · zoom · close ─────────────────────────────── */}
      <div
        className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4"
        style={{ height: TOP_BAR_H }}
      >
        <span className="text-[12px] font-bold uppercase tracking-widest text-white/50 select-none">
          {idx + 1} / {images.length}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomed(z => !z)}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          >
            {zoomed ? <FiZoomOut size={20} /> : <FiZoomIn size={20} />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close lightbox"
          >
            <FiX size={24} />
          </button>
        </div>
      </div>

      {/*
       * ── Image stage ───────────────────────────────────────────────────────
       *
       * Positioned absolutely so its exact pixel bounds exclude every piece
       * of chrome: top bar, arrow buttons, and thumbnail strip.
       *
       * - top:    TOP_BAR_H        — never goes behind the top bar
       * - bottom: THUMB_STRIP_H    — never goes behind the thumbnail strip
       *                              (0 when single image — no thumbnail strip)
       * - left/right: ARROW_W      — stays clear of the prev/next arrows
       *                              (reduced when no arrows)
       *
       * overflow: hidden clips the zoom-scaled image to this bounded region,
       * giving a "magnify center" zoom UX without any viewport bleed.
       *
       * The image itself uses max-width/max-height: 100% so it is ALWAYS
       * constrained to the stage dimensions — never to an abstract vw/vh value
       * that might exceed the available safe area.
       */}
      <div
        className="absolute flex items-center justify-center overflow-hidden"
        style={{
          top:    TOP_BAR_H,
          bottom: hasMany ? THUMB_STRIP_H : 0,
          left:   hasMany ? ARROW_W : 16,
          right:  hasMany ? ARROW_W : 16,
          cursor: zoomed ? 'zoom-out' : 'zoom-in',
        }}
        onClick={() => setZoomed(z => !z)}
      >
        <img
          key={idx}
          src={src}
          alt={`Gallery image ${idx + 1}`}
          draggable={false}
          style={{
            display:    'block',
            /*
             * max-width/max-height: 100% — fills the stage exactly.
             * The stage boundaries (set above) already account for all chrome,
             * so the image is always fully visible without any external constraint.
             *
             * width/height: auto — preserves the image's intrinsic aspect ratio.
             * object-fit: contain — belt-and-suspenders; ensures no distortion if
             *   the browser tries to stretch the replaced content.
             */
            maxWidth:   '100%',
            maxHeight:  '100%',
            width:      'auto',
            height:     'auto',
            objectFit:  'contain',
            /*
             * Zoom mode: scale(2) doubles the image from its center, revealing
             * fine detail. overflow: hidden on the stage clips to the safe area
             * so nothing bleeds outside the viewport. No maxWidth/maxHeight change
             * needed — transform operates in paint space, not layout space.
             */
            transform:  zoomed ? 'scale(2)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            userSelect: 'none',
            pointerEvents: 'none',
            boxShadow:  '0 24px 64px rgba(0,0,0,0.7)',
          }}
        />
      </div>

      {/* ── Prev button ──────────────────────────────────────────────────── */}
      {hasMany && (
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full
                     text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Previous image"
        >
          <FiChevronLeft size={28} />
        </button>
      )}

      {/* ── Next button ───────────────────────────────────────────────────── */}
      {hasMany && (
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full
                     text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Next image"
        >
          <FiChevronRight size={28} />
        </button>
      )}

      {/* ── Thumbnail strip ───────────────────────────────────────────────── */}
      {hasMany && (
        <div
          className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-center
                     gap-2 overflow-x-auto no-scrollbar px-4"
          style={{ height: THUMB_STRIP_H }}
        >
          {images.map((img, i) => {
            const thumbSrc = typeof img === 'string'
              ? imgSrc(img)
              : imgSrc(img?.image || img?.src || '');
            return (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); setZoomed(false); }}
                className="flex-shrink-0 w-12 h-12 overflow-hidden transition-all duration-200"
                style={{
                  border:  i === idx ? '2px solid #FF7A00' : '2px solid transparent',
                  opacity: i === idx ? 1 : 0.45,
                }}
                aria-label={`View image ${i + 1}`}
              >
                <img
                  src={thumbSrc}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
