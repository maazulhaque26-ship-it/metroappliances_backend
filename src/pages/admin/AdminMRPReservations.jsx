import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import StatusBadge  from '../../components/shared/StatusBadge';
import Pagination   from '../../components/shared/Pagination';
import { getReservations, releaseReservation } from '../../services/mrpAPI';

export default function AdminMRPReservations() {
  const [data,    setData]   = useState([]);
  const [loading, setLoad]   = useState(true);
  const [page,    setPage]   = useState(1);
  const [total,   setTotal]  = useState(0);
  const [statusF, setStatusF]= useState('');
  const LIMIT = 25;

  const load = useCallback(() => {
    setLoad(true);
    getReservations({ page, limit: LIMIT, status: statusF })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [page, statusF]);

  useEffect(() => { load(); }, [load]);

  const handleRelease = async (id) => {
    if (!window.confirm('Release this MRP reservation?')) return;
    try { await releaseReservation(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'reservationNumber', header: 'Reservation #', render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>{v}</span> },
    { key: 'materialName', header: 'Material', render: (v, r) => <span style={{ fontWeight: 600 }}>{v || r.material?.name}</span> },
    { key: 'quantity',  header: 'Qty',   align: 'center', render: v => (v || 0).toFixed(2) },
    { key: 'unit',      header: 'Unit',  render: v => <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span> },
    { key: 'warehouse', header: 'Warehouse', render: v => v?.name || '—' },
    { key: 'mrpRun',    header: 'MRP Run', render: v => <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6B7280' }}>{v?.runNumber}</span> },
    { key: 'reservedDate', header: 'Reserved', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status', header: 'Status', render: v => <StatusBadge status={v} /> },
    { key: '_id', header: '', align: 'center', width: 80,
      render: (id, r) => r.status === 'active' ? (
        <button onClick={() => handleRelease(id)} style={{ padding: '4px 10px', background: '#FEF3C7', color: '#92400E', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Release</button>
      ) : null,
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>MRP Reservations</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Statuses</option>
          {['active','released','consumed','expired','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No MRP reservations found" />
      <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
    </div>
  );
}
