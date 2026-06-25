// ── Currency ──────────────────────────────────────────────────────────────────
export const formatINR = (v, decimals = 0) =>
  `₹${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

export const formatINRCompact = (v) => {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(2)}Cr`;
  if (v >= 100_000)    return `₹${(v / 100_000).toFixed(2)}L`;
  if (v >= 1_000)      return `₹${(v / 1_000).toFixed(1)}K`;
  return formatINR(v);
};

// ── GST ───────────────────────────────────────────────────────────────────────
export const formatGST = (gstin) => {
  if (!gstin) return '—';
  const g = gstin.toUpperCase();
  return `${g.slice(0, 2)} ${g.slice(2, 12)} ${g.slice(12, 13)} ${g.slice(13, 14)} ${g.slice(14)}`;
};

// ── Phone ─────────────────────────────────────────────────────────────────────
export const formatPhone = (p) => {
  if (!p) return '—';
  const d = String(p).replace(/\D/g, '');
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  return p;
};

// ── Date / Time ───────────────────────────────────────────────────────────────
export const formatDate = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatRelative = (ts) => {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)    return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)    return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)    return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)    return `${d}d ago`;
  return formatDate(ts);
};

// ── Address ───────────────────────────────────────────────────────────────────
export const formatAddress = (addr) => {
  if (!addr) return '—';
  const parts = [addr.street || addr.line1, addr.city, addr.state, addr.pincode || addr.zip].filter(Boolean);
  return parts.join(', ') || '—';
};

// ── Percentage ────────────────────────────────────────────────────────────────
export const formatPct = (v, decimals = 1) => `${(v || 0).toFixed(decimals)}%`;

// ── Number ────────────────────────────────────────────────────────────────────
export const formatNumber = (v) => (v || 0).toLocaleString('en-IN');
