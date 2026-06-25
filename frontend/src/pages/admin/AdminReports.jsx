import React, { useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../services/api';

const REPORT_TYPES = [
  { key: 'sales',   label: 'Sales Report',   desc: 'B2C orders, revenue, payment method', icon: '🛒' },
  { key: 'agents',  label: 'Agent Report',   desc: 'Agent leads, conversions, visits',    icon: '👤' },
  { key: 'dealers', label: 'Dealer Report',  desc: 'B2B dealer revenue ranking',          icon: '🏢' },
  { key: 'leads',   label: 'Lead Report',    desc: 'Lead pipeline, stage, source, value', icon: '📊' },
];

const PERIODS = [
  { key: 'all',         label: 'All Time' },
  { key: 'thisYear',    label: 'This Year' },
  { key: 'thisQuarter', label: 'This Quarter' },
  { key: 'thisMonth',   label: 'This Month' },
  { key: 'lastMonth',   label: 'Last Month' },
];

function exportToCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows    = data.map(row => headers.map(h => {
    const v = row[h];
    const s = v === null || v === undefined ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','));
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [reportType, setReportType] = useState('sales');
  const [period,     setPeriod]     = useState('thisMonth');
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [generated,  setGenerated]  = useState(false);

  const generate = useCallback(() => {
    setLoading(true);
    setGenerated(false);
    api.get(`/admin/bi/export/${reportType}?period=${period}`)
      .then(r => { setData(r.data.data || []); setGenerated(true); })
      .catch(e => { alert(e?.response?.data?.message || 'Failed to generate report'); })
      .finally(() => setLoading(false));
  }, [reportType, period]);

  const handleExport = () => {
    if (!data?.length) return;
    const periodLabel = PERIODS.find(p => p.key === period)?.label?.replace(/\s/g, '-') || period;
    exportToCSV(data, `metro-${reportType}-${periodLabel}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePrint = () => window.print();

  const cols = data?.length ? Object.keys(data[0]) : [];

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Reports & Export</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0' }}>Generate and export detailed reports as CSV or print</p>
        </div>

        {/* Report Type Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {REPORT_TYPES.map(r => (
            <button key={r.key} onClick={() => { setReportType(r.key); setGenerated(false); setData(null); }}
              style={{ padding: '16px', borderRadius: '12px', border: `2px solid ${reportType === r.key ? '#FF7A00' : '#E5E7EB'}`, background: reportType === r.key ? '#FFF7F0' : '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{r.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '3px' }}>{r.label}</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{r.desc}</div>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Time Period:</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {PERIODS.map(p => (
                <button key={p.key} onClick={() => { setPeriod(p.key); setGenerated(false); setData(null); }}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: period === p.key ? '#FF7A00' : '#F3F4F6', color: period === p.key ? '#fff' : '#374151' }}>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <button onClick={generate} disabled={loading}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
              {generated && data?.length > 0 && (
                <>
                  <button onClick={handleExport}
                    style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    ⬇ Export CSV
                  </button>
                  <button onClick={handlePrint}
                    style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    🖨 Print
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Report Preview */}
        {generated && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>
                {REPORT_TYPES.find(r => r.key === reportType)?.label} — {PERIODS.find(p => p.key === period)?.label}
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{data?.length || 0} records</div>
            </div>
            {data?.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>No data found for the selected period.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {cols.map(c => (
                      <th key={c} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#9CA3AF', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>
                        {c.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 50).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      {cols.map(c => (
                        <td key={c} style={{ padding: '9px 12px', color: '#374151' }}>
                          {typeof row[c] === 'number' && c.toLowerCase().includes('revenue') || c.toLowerCase().includes('amount') || c.toLowerCase().includes('value') || c.toLowerCase().includes('total')
                            ? `₹${(row[c] || 0).toLocaleString('en-IN')}`
                            : row[c] === null || row[c] === undefined ? '—' : String(row[c])
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {data?.length > 50 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>
                Showing first 50 rows. Export CSV to see all {data.length} records.
              </div>
            )}
          </div>
        )}

        {!generated && !loading && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '13px' }}>
            Select a report type and period above, then click <strong>Generate Report</strong>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
