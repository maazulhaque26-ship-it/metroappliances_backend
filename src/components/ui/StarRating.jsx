import React from 'react';
import { FiStar as Star } from 'react-icons/fi';

export default function StarRating({ rating = 0, count, size = 14, showCount = true, className = '' }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {stars.map(s => {
          const filled = s <= Math.floor(rating);
          const half   = !filled && s - 0.5 <= rating;
          return (
            <Star
              key={s}
              size={size}
              className={filled || half ? 'star-filled' : 'star-empty'}
              fill={filled ? 'currentColor' : half ? 'url(#half)' : 'none'}
            />
          );
        })}
      </div>
      {showCount && (
        <span className="text-xs text-gray-500 ml-0.5">
          {rating?.toFixed(1)}
          {count != null && ` (${count})`}
        </span>
      )}
    </div>
  );
}

export function InteractiveStars({ value, onChange, size = 20 }) {
  const [hovered, setHovered] = React.useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={(hovered || value) >= s ? 'star-filled' : 'star-empty'}
            fill={(hovered || value) >= s ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  );
}
