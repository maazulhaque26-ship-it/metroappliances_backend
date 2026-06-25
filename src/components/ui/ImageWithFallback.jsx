import React, { useEffect, useState } from 'react';
import { getImageUrl, PLACEHOLDER } from '../../utils/imageHelper';

/**
 * Resilient <img> wrapper for ecommerce data where the "true" image can vanish
 * after the fact (deleted product, deleted Cloudinary asset, stale local upload
 * path) — the stored URL string alone can't tell you that ahead of render time.
 * Tries src -> fallbackSrc -> PLACEHOLDER, advancing on actual <img> onError
 * (a dead URL still "looks" valid to getImageUrl, only the browser load fails).
 */
export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  imgClassName = 'w-full h-full object-cover',
  loading = 'lazy',
  style,
}) {
  const candidates = Array.from(new Set([getImageUrl(src), getImageUrl(fallbackSrc), PLACEHOLDER].filter(Boolean)));
  
  const [index, setIndex] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState(null);
  
  // Track previous props to reset state when props change
  const [prevProps, setPrevProps] = useState({ src, fallbackSrc });
  if (prevProps.src !== src || prevProps.fallbackSrc !== fallbackSrc) {
    setPrevProps({ src, fallbackSrc });
    setIndex(0);
    // Don't reset loadedSrc here, let it happen naturally when the new image loads or fails
  }

  const currentSrc = candidates[index] || PLACEHOLDER;
  const isLoaded = loadedSrc === currentSrc;

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {!isLoaded && (
        <div className="skeleton absolute inset-0" aria-hidden="true" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setLoadedSrc(currentSrc)}
        onError={() => {
          setLoadedSrc(null);
          setIndex(i => (i + 1 < candidates.length ? i + 1 : i));
        }}
        className={`${imgClassName} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
