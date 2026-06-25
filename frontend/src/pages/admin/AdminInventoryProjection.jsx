import React, { useEffect, useState, useCallback } from 'react';
import DataTable  from '../../components/shared/DataTable';
import Pagination from '../../components/shared/Pagination';
import { getProjections, getMRPRuns } from '../../services/mrpAPI';

export default function AdminInventoryProjection() {
  const [data,    setData]       = useState([]);
  const [runs,    setRuns]       = useState([]);
  const [loading, setLoad]       = useState(true);
  const [page,    setPage]       = useState(1);
  const [total,   setTotal]      = useState(0);
  const [runF,    setRunF]       = useState('');
  const [belowF,  setBelowF]     = useState('');
  const LIMIT = 25;

  const load = useCallback(() => {
    setLoad(true);
    const params = { page, limit: LIMIT, mrpRun: runF };
    if (belowF === 'safety') params.isBelowSafety = 'true';
    getProjections(params)
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [page, runF, belowF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getMRPRuns({ limit: 20, status: 'completed' }).then(r => setRuns(r.data.data || [])).catch(() => {}); }, []);

  const columns = [
    { key: 'materialName', header: 'Material', render: (v, r) => <div><span style={{ fontWeight: 600 }}>{v || r.material?.name}</span><div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{r.materialSKU}</div></div> },
    { key: 'openingQty',   header: 'Opening',      align: 'center', render: v => (v || 0).toFixed(2) },
    { key: 'expectedIn',   header: 'Expected In',  align: 'center', render: v => <span style={{ color: '#059669' }}>{(v || 0).toFixed(2)}</span> },
    { key: 'expectedOut',  header: 'Expected Out', align: 'center', render: v => <span style={{ color: '#EF4444' }}>{(v || 0).toFixed(2)}</span> },
    { key: 'projectedQty', header: 'Projected',    align: 'center', render: v => <span style={{ fontWeight: 700, color: v < 0 ? '#DC2626' : '#111827' }}>{(v || 0).toFixed(2)}</span> },
    { key: 'safetyStock',  header: 'Safety Stock', align: 'center', render: v => (v || 0).toFixed(2) },
    { key: 'reorderPoint', header: 'Reorder Pt.',  align: 'center', render: v => (v || 0).toFixed(2) },
    { key: 'unit', header: 'Unit', render: v => <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span> },
    { key: 'isBelowSafety', header: 'Risk', render: (v, r) => (
      v
        ? <span style={{ padding: '2px 7px', background: '#FEE2E2', color: '#991B1B', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>Below Safety</span>
        : r.isBelowReorder
          ? <span style={{ padding: '2px 7px', background: '#FEF3C7', color: '#92400E', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>Reorder</span>
          : <span style={{ color: '#10B981', fontSize: 11 }}>OK</span>
    )},
    { key: 'projectionDate', header: 'As Of', render: v => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Inventory Projection</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={runF} onChange={e => { setRunF(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All MRP Runs</option>
          {runs.map(r => <option key={r._id} value={r._id}>{r.runNumber}</option>)}
        </select>
        <select value={belowF} onChange={e => { setBelowF(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Items</option>
          <option value="safety">Below Safety Stock</option>
        </select>
      </div>
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No inventory projections found" />
      <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
    </div>
  );
}
