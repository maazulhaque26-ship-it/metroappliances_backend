// Images in DB are stored as [{url: '/uploads/...', public_id: '...'}] objects
// This helper normalises any image value (object or string) to a URL

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

export function getImageUrl(img) {
  if (!img) return null;
  // Object form {url, public_id}  ← what Product model stores
  if (typeof img === 'object' && img.url) return getImageUrl(img.url);
  // Already absolute URL
  if (img.startsWith('http')) return img;
  // Local upload path e.g. /uploads/product-1234.jpg
  if (img.startsWith('/uploads/')) return `${API_BASE}${img}`;
  if (img.startsWith('uploads/')) return `${API_BASE}/${img}`;
  return img;
}

export const PLACEHOLDER = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=70';

export function imgSrc(img) {
  return getImageUrl(img) || PLACEHOLDER;
}
