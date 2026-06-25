import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import StatusBadge  from '../../components/shared/StatusBadge';
import Pagination   from '../../components/shared/Pagination';
import { getRequirements, getMRPRuns } from '../../services/mrpAPI';

export default function AdminMaterialRequirements() {
  const [data,    setData]   = useState([]);
  const [runs,    setRuns]   = useState([]);
  const [loading, setLoad]   = useState(true);
  const [page,    setPage]   = useState(1);
  const [total,   setTotal]  = useState(0);
  const [runF,    setRunF]   = useState('');
  const [statusF, setStatusF]= useState('');
  const LIMIT = 25;

  const load = useCallback(() => {
    setLoad(true);
    getRequirements({ page, limit: LIMIT, mrpRun: runF, status: statusF })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [page, runF, statusF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getMRPRuns({ limit: 20 }).then(r => setRuns(r.data.data || [])).catch(() => {}); }, []);

  const columns = [
    { key: 'requirementNumber', header: 'Req #', render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>{v}</span> },
    { key: 'materialName', header: 'Material', render: (v, r) => <div><span style={{ fontWeight: 600 }}>{v || r.material?.name}</span><div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{r.materialSKU}</div></div> },
    { key: 'bomLevel',        header: 'Level', align: 'center' },
    { key: 'grossRequirement',header: 'Gross',    align: 'center', render: v => (v || 0).toFixed(2) },
    { key: 'availableQty',   header: 'Available', align: 'center', render: v => <span style={{ color: '#059669' }}>{(v || 0).toFixed(2)}</span> },
    { key: 'incomingPOQty',  header: 'In PO',     align: 'center', render: v => <span style={{ color: '#3B82F6' }}>{(v || 0).toFixed(2)}</span> },
    { key: 'netRequirement', header: 'Net Req.',   align: 'center', render: v => <span style={{ fontWeight: 700 }}>{(v || 0).toFixed(2)}</span> },
    { key: 'shortageQty',    header: 'Shortage',   align: 'center', render: v => <span style={{ fontWeight: 700, color: v > 0 ? '#EF4444' : '#9CA3AF' }}>{(v || 0).toFixed(2)}</span> },
    { key: 'unit', header: 'Unit', render: v => <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span> },
    { key: 'status', header: 'Status', render: v => <StatusBadge status={v} /> },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Material Requirements</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={runF} onChange={e => { setRunF(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All MRP Runs</option>
          {runs.map(r => <option key={r._id} value={r._id}>{r.runNumber}</option>)}
        </select>
        <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Statuses</option>
          {['open','partially_fulfilled','fulfilled','shortage'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No material requirements found" />
      <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
    </div>
  );
}
