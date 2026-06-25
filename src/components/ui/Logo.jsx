import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ imageClass = 'h-16 w-auto', className = '' }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center flex-shrink-0 ${className}`}
      aria-label="Metro Appliances — Home"
    >
      <img
        src="/brand/logo.png"
        alt="Metro Appliances"
        className={imageClass}
        style={{ objectFit: 'contain', display: 'block', maxWidth: '100%' }}
        loading="eager"
        decoding="sync"
        draggable={false}
      />
    </Link>
  );
}
