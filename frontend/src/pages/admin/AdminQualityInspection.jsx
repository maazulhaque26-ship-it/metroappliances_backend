import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getInspections, getDefects } from '../../services/mesAPI';

const RESULT_OPTIONS = [
  { value: '', label: 'All Results' },
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'pending', label: 'Pending' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'in_process', label: 'In Process' },
  { value: 'final', label: 'Final' },
];

export default function AdminQualityInspection() {
  const [tab, setTab]         = useState('inspections');
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [result, setResult]   = useState('');
  const [typeF, setTypeF]     = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const fn = tab === 'inspections'
      ? getInspections({ page, limit: 20, result, inspectionType: typeF })
      : getDefects({ page, limit: 20 });
    fn
      .then(r => { setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab, page, result, typeF]);

  useEffect(() => { load(); }, [load]);

  const inspectionColumns = [
    { key: 'inspectionNumber', label: 'Inspection #', render: r => <span className="font-mono text-sm text-orange-600">{r.inspectionNumber}</span> },
    { key: 'workOrder', label: 'Work Order', render: r => r.workOrder?.orderNumber || '—' },
    { key: 'product',   label: 'Product',   render: r => r.workOrder?.productName || '—' },
    { key: 'inspectionType', label: 'Type' },
    { key: 'inspectedQty',   label: 'Inspected' },
    { key: 'passQty',        label: 'Pass',  render: r => r.passQty ?? '—' },
    { key: 'failQty',        label: 'Fail',  render: r => r.failQty ?? '—' },
    { key: 'result', label: 'Result', render: r => <StatusBadge status={r.result} /> },
    { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString() },
  ];

  const defectColumns = [
    { key: 'defectNumber',   label: 'Defect #', render: r => <span className="font-mono text-sm text-orange-600">{r.defectNumber}</span> },
    { key: 'workOrder',      label: 'Work Order', render: r => r.workOrder?.orderNumber || '—' },
    { key: 'defectName',     label: 'Defect' },
    { key: 'defectCategory', label: 'Category' },
    { key: 'severity',       label: 'Severity',   render: r => <StatusBadge status={r.severity} /> },
    { key: 'disposition',    label: 'Disposition', render: r => <StatusBadge status={r.disposition} /> },
    { key: 'qty',            label: 'Qty', render: r => r.qty ?? 1 },
    { key: 'createdAt',      label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString() },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Quality Inspection" subtitle={`${total} records`} />
      <div className="flex gap-2 border-b border-gray-200">
        {['inspections','defects'].map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`px-4 py-2 text-sm font-medium border-b-2 capitalize ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>
      {tab === 'inspections' && (
        <FilterToolbar filters={[
          { key: 'result', label: 'Result', value: result, options: RESULT_OPTIONS, onChange: v => { setResult(v); setPage(1); } },
          { key: 'type',   label: 'Type',   value: typeF,  options: TYPE_OPTIONS,   onChange: v => { setTypeF(v); setPage(1); } },
        ]} />
      )}
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No records found" /> : <DataTable columns={tab === 'inspections' ? inspectionColumns : defectColumns} rows={rows} />}
      <Pagination page={page} total={total} limit={20} onChange={setPage} />
    </div>
  );
}
