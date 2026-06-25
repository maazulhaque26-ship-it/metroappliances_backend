import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({ page, total, limit, onPageChange }) {
  const pages = Math.ceil(total / limit) || 1;
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const range = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) range.push(i);
  } else {
    range.push(1);
    if (page > 3) range.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) range.push(i);
    if (page < pages - 2) range.push('…');
    range.push(pages);
  }

  const btn = (content, target, disabled, active) => (
    <button
      key={String(content)}
      onClick={() => !disabled && target && onPageChange(target)}
      disabled={disabled}
      style={{
        minWidth: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: active ? 'none' : '1px solid #E5E7EB',
        borderRadius: '8px',
        background: active ? '#FF7A00' : disabled ? '#F9FAFB' : '#fff',
        color: active ? '#fff' : disabled ? '#D1D5DB' : '#374151',
        fontSize: '13px', fontWeight: active ? 700 : 500, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body, Poppins, sans-serif)',
        transition: 'all 0.15s',
      }}
    >{content}</button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '16px 0 0' }}>
      <span style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>
        Showing {from}–{to} of {total}
      </span>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {btn(<FiChevronLeft size={14} />, page - 1, page <= 1, false)}
        {range.map((r, i) =>
          r === '…'
            ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: '#9CA3AF', fontSize: '13px' }}>…</span>
            : btn(r, r, false, r === page)
        )}
        {btn(<FiChevronRight size={14} />, page + 1, page >= pages, false)}
      </div>
    </div>
  );
}
