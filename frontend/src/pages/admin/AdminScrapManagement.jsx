import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getScrap } from '../../services/mesAPI';

const DISPOSITION_OPTIONS = [
  { value: '', label: 'All Dispositions' },
  { value: 'recycled',  label: 'Recycled' },
  { value: 'disposed',  label: 'Disposed' },
  { value: 'sold',      label: 'Sold' },
  { value: 'pending',   label: 'Pending' },
];

export default function AdminScrapManagement() {
  const [rows,        setRows]       = useState([]);
  const [total,       setTotal]      = useState(0);
  const [page,        setPage]       = useState(1);
  const [disposition, setDisposition]= useState('');
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getScrap({ page, limit: 20, disposition })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, disposition]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'scrapNumber', label: '#', render: r => <span className="font-mono text-sm text-orange-600">{r.scrapNumber}</span> },
    { key: 'workOrder',   label: 'Work Order', render: r => r.workOrder?.orderNumber || '—' },
    { key: 'product',     label: 'Product',    render: r => r.workOrder?.productName || '—' },
    { key: 'reason',      label: 'Reason' },
    { key: 'qty',         label: 'Qty', render: r => `${r.qty ?? 0} ${r.unit || ''}` },
    { key: 'scrapValue',  label: 'Value',       render: r => r.scrapValue ? `₹${r.scrapValue.toLocaleString()}` : '—' },
    { key: 'disposition', label: 'Disposition', render: r => <StatusBadge status={r.disposition} /> },
    { key: 'status',      label: 'Status',      render: r => <StatusBadge status={r.status} /> },
    { key: 'createdAt',   label: 'Date',        render: r => new Date(r.createdAt).toLocaleDateString() },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Scrap Management" subtitle={`${total} records`} />
      <FilterToolbar filters={[{ key: 'disposition', label: 'Disposition', value: disposition, options: DISPOSITION_OPTIONS, onChange: v => { setDisposition(v); setPage(1); } }]} />
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No scrap records" /> : <DataTable columns={columns} rows={rows} />}
      <Pagination page={page} total={total} limit={20} onChange={setPage} />
    </div>
  );
}
