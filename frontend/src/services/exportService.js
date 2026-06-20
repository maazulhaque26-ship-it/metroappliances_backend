function rowsToCSV(data) {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => {
    const v = row[h];
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(data, filename = 'export') {
  if (!data?.length) return;
  const csv  = '﻿' + rowsToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printPage() {
  window.print();
}

export function downloadJSON(data, filename = 'export') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
