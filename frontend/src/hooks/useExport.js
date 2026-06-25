import { useCallback } from 'react';

function toCSV(data) {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows    = data.map(row => headers.map(h => {
    const v = row[h];
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function useExport() {
  const exportCSV = useCallback((data, filename = 'export') => {
    if (!data?.length) return;
    const csv  = '﻿' + toCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const print = useCallback(() => window.print(), []);

  return { exportCSV, print };
}
