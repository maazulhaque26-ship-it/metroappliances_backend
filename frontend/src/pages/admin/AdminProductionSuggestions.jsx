import React, { useEffect, useState, useCallback } from 'react';
import DataTable   from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination  from '../../components/shared/Pagination';
import { getRecommendations, acceptRecommendation, rejectRecommendation } from '../../services/mrpAPI';

const PRI_COLOR = { critical: { bg: '#FEE2E2', text: '#991B1B' }, high: { bg: '#FEF3C7', text: '#92400E' }, medium: { bg: '#EFF6FF', text: '#1D4ED8' }, low: { bg: '#F0FDF4', text: '#166534' } };

export default function AdminProductionSuggestions() {
  const [data,    setData]    = useState([]);
  const [loading, setLoad]    = useState(true);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [statusF, setStatusF] = useState('open');
  const LIMIT = 25;

  const load = useCallback(() => {
    setLoad(true);
    getRecommendations({ page, limit: LIMIT, type: 'production', status: statusF })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [page, statusF]);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (id) => {
    try { await acceptRecommendation(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return;
    try { await rejectRecommendation(id, { rejectionReason: reason }); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'recommendationNumber', header: 'Rec. #', render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>{v}</span> },
    { key: 'materialName', header: 'Material', render: (v, r) => <div><span style={{ fontWeight: 600 }}>{v || r.material?.name}</span><div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{r.materialSKU}</div></div> },
    { key: 'type',     header: 'Type',     render: v => <span style={{ textTransform: 'capitalize', fontSize: 12, fontWeight: 600 }}>{v?.replace('_', ' ')}</span> },
    { key: 'quantity', header: 'Qty',      align: 'center', render: v => <span style={{ fontWeight: 700 }}>{(v || 0).toFixed(2)}</span> },
    { key: 'unit',     header: 'Unit',     render: v => <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span> },
    { key: 'factory',  header: 'Factory',  render: v => v?.name || '—' },
    { key: 'suggestedDate', header: 'Suggested', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'dueDate',       header: 'Due By',    render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'estimatedCost', header: 'Est. Cost', render: v => v ? `₹${v.toLocaleString()}` : '—' },
    { key: 'priority', header: 'Priority', render: v => {
      const c = PRI_COLOR[v] || {};
      return <span style={{ padding: '3px 8px', background: c.bg, color: c.text, borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{v}</span>;
    }},
    { key: 'status', header: 'Status', render: v => <StatusBadge status={v} /> },
    { key: '_id', header: 'Actions', align: 'center', width: 140,
      render: (id, r) => r.status === 'open' ? (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <button onClick={() => handleAccept(id)} style={{ padding: '4px 8px', background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Accept</button>
          <button onClick={() => handleReject(id)} style={{ padding: '4px 8px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Reject</button>
        </div>
      ) : null,
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Production Suggestions</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="open">Open</option>
          <option value="">All Statuses</option>
          {['open','accepted','rejected','actioned'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No production suggestions found" />
      <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
    </div>
  );
}
