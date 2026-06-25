import React, { useEffect, useState, useCallback } from 'react';
import { FiTool } from 'react-icons/fi';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getTools, getCalibrations } from '../../services/mesAPI';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'available',    label: 'Available' },
  { value: 'in_use',       label: 'In Use' },
  { value: 'maintenance',  label: 'Maintenance' },
  { value: 'calibration',  label: 'Calibration' },
  { value: 'retired',      label: 'Retired' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'cutting',   label: 'Cutting' },
  { value: 'measuring', label: 'Measuring' },
  { value: 'holding',   label: 'Holding' },
  { value: 'forming',   label: 'Forming' },
  { value: 'assembly',  label: 'Assembly' },
  { value: 'testing',   label: 'Testing' },
  { value: 'welding',   label: 'Welding' },
  { value: 'other',     label: 'Other' },
];

export default function AdminToolManagement() {
  const [tab,    setTab]    = useState('tools');
  const [rows,   setRows]   = useState([]);
  const [total,  setTotal]  = useState(0);
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type,   setType]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const fn = tab === 'tools'
      ? getTools({ page, limit: 20, search, status, type })
      : getCalibrations({ page, limit: 20 });
    fn
      .then(r => { setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab, page, search, status, type]);

  useEffect(() => { load(); }, [load]);

  const toolColumns = [
    { key: 'toolCode',   label: 'Code',     render: r => <span className="font-mono text-sm font-semibold text-orange-600">{r.toolCode}</span> },
    { key: 'name',       label: 'Name' },
    { key: 'type',       label: 'Type',     render: r => <StatusBadge status={r.type} /> },
    { key: 'status',     label: 'Status',   render: r => <StatusBadge status={r.status} /> },
    { key: 'location',   label: 'Location', render: r => r.location || '—' },
    { key: 'currentUsageCycles', label: 'Cycles', render: r => `${r.currentUsageCycles ?? 0} / ${r.maxUsageCycles || '∞'}` },
    { key: 'nextCalibrationDate', label: 'Next Cal.', render: r => r.nextCalibrationDate ? new Date(r.nextCalibrationDate).toLocaleDateString() : '—' },
  ];

  const calColumns = [
    { key: 'calibrationNumber', label: '#', render: r => <span className="font-mono text-xs text-orange-600">{r.calibrationNumber}</span> },
    { key: 'tool',              label: 'Tool',   render: r => `${r.tool?.toolCode || ''} ${r.tool?.name || ''}` },
    { key: 'calibrationDate',   label: 'Date',   render: r => new Date(r.calibrationDate).toLocaleDateString() },
    { key: 'nextCalibrationDate', label: 'Next', render: r => new Date(r.nextCalibrationDate).toLocaleDateString() },
    { key: 'result',            label: 'Result', render: r => <StatusBadge status={r.result} /> },
    { key: 'performedByName',   label: 'Performed By', render: r => r.performedByName || '—' },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Tool Management" subtitle={`${total} records`} />
      <div className="flex gap-2 border-b border-gray-200">
        {['tools','calibrations'].map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`px-4 py-2 text-sm font-medium border-b-2 capitalize ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>
      {tab === 'tools' && (
        <>
          <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search tool code or name…" />
          <FilterToolbar filters={[
            { key: 'status', label: 'Status', value: status, options: STATUS_OPTIONS, onChange: v => { setStatus(v); setPage(1); } },
            { key: 'type',   label: 'Type',   value: type,   options: TYPE_OPTIONS,   onChange: v => { setType(v);   setPage(1); } },
          ]} />
        </>
      )}
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No records found" /> : <DataTable columns={tab === 'tools' ? toolColumns : calColumns} rows={rows} />}
      <Pagination page={page} total={total} limit={20} onChange={setPage} />
    </div>
  );
}
