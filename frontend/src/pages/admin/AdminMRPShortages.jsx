import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import StatusBadge  from '../../components/shared/StatusBadge';
import Pagination   from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getShortages, resolveShortage, ignoreShortage } from '../../services/mrpAPI';

const SEV_COLOR = { critical: { bg: '#FEE2E2', text: '#991B1B' }, high: { bg: '#FEF3C7', text: '#92400E' }, medium: { bg: '#FEF9C3', text: '#713F12' }, low: { bg: '#F0FDF4', text: '#166534' } };

export default function AdminMRPShortages() {
  const [data,     setData]    = useState([]);
  const [loading,  setLoad]    = useState(true);
  const [page,     setPage]    = useState(1);
  const [total,    setTotal]   = useState(0);
  const [severityF,setSevF]    = useState('');
  const [statusF,  setStatusF] = useState('open');
  const LIMIT = 25;

  const load = useCallback(() => {
    setLoad(true);
    getShortages({ page, limit: LIMIT, severity: severityF, status: statusF })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [page, severityF, statusF]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id) => {
    if (!window.confirm('Mark this shortage as resolved?')) return;
    try { await resolveShortage(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleIgnore = async (id) => {
    if (!window.confirm('Ignore this shortage?')) return;
    try { await ignoreShortage(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'materialName', header: 'Material', render: (v, r) => <div><span style={{ fontWeight: 600 }}>{v || r.material?.name}</span><div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{r.materialSKU}</div></div> },
    { key: 'shortageQty', header: 'Shortage Qty', align: 'center', render: v => <span style={{ fontWeight: 700, color: '#EF4444' }}>{(v || 0).toFixed(2)}</span> },
    { key: 'unit',     header: 'Unit',     render: v => <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span> },
    { key: 'severity', header: 'Severity', render: v => {
      const c = SEV_COLOR[v] || {};
      return <span style={{ padding: '3px 8px', background: c.bg, color: c.text, borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{v}</span>;
    }},
    { key: 'requiredDate', header: 'Required By', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status', header: 'Status', render: v => <StatusBadge status={v} /> },
    { key: '_id', header: 'Actions', align: 'center', width: 160,
      render: (id, r) => r.status === 'open' || r.status === 'in_progress' ? (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <button onClick={() => handleResolve(id)} style={{ padding: '4px 8px', background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Resolve</button>
          <button onClick={() => handleIgnore(id)} style={{ padding: '4px 8px', background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Ignore</button>
        </div>
      ) : null,
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Material Shortages</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={severityF} onChange={e => { setSevF(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Severities</option>
          {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="open">Open</option>
          <option value="">All Statuses</option>
          {['open','in_progress','resolved','ignored'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No shortages found" />
      <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
    </div>
  );
}
