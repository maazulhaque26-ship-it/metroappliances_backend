import React from 'react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';

export default function DataTable({ columns, data, loading, emptyIcon, emptyTitle, emptyMessage, rowKey = '_id', style, onRowClick }) {
  const tdStyle = { padding: '12px 16px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #F3F4F6', fontFamily: 'var(--font-body, Poppins, sans-serif)', verticalAlign: 'middle' };
  const thStyle = { padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', textAlign: 'left', whiteSpace: 'nowrap', fontFamily: 'var(--font-body, Poppins, sans-serif)' };

  if (loading) return <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', ...style }}><LoadingState /></div>;
  if (!data?.length) return <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', ...style }}><EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} /></div>;

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ ...thStyle, width: col.width, textAlign: col.align || 'left' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row[rowKey] || i}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = '#FAFAFA'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
            >
              {columns.map(col => (
                <td key={col.key} style={{ ...tdStyle, textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row[col.key], row, i) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
