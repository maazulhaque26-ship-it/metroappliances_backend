import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getShiftAssignments, getSkills } from '../../services/mesAPI';

const SHIFT_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'absent',    label: 'Absent' },
];

export default function AdminOperatorManagement() {
  const [tab,    setTab]    = useState('shifts');
  const [rows,   setRows]   = useState([]);
  const [total,  setTotal]  = useState(0);
  const [page,   setPage]   = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const fn = tab === 'shifts'
      ? getShiftAssignments({ page, limit: 20, status })
      : getSkills({ page, limit: 50 });
    fn
      .then(r => { setRows(r.data.data || []); setTotal(r.data.meta?.total || r.data.data?.length || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab, page, status]);

  useEffect(() => { load(); }, [load]);

  const shiftColumns = [
    { key: 'assignmentNumber', label: '#', render: r => <span className="font-mono text-xs text-orange-600">{r.assignmentNumber}</span> },
    { key: 'operator',  label: 'Operator',  render: r => r.operator?.name || '—' },
    { key: 'shift',     label: 'Shift',     render: r => r.shift?.name   || '—' },
    { key: 'factory',   label: 'Factory',   render: r => r.factory?.name || '—' },
    { key: 'date',      label: 'Date',      render: r => new Date(r.date).toLocaleDateString() },
    { key: 'status',    label: 'Status',    render: r => <StatusBadge status={r.status} /> },
    { key: 'hoursWorked', label: 'Hours',   render: r => r.hoursWorked ?? '—' },
  ];

  const skillColumns = [
    { key: 'operator',         label: 'Operator',    render: r => r.operator?.name || '—' },
    { key: 'skillName',        label: 'Skill' },
    { key: 'skillCategory',    label: 'Category' },
    { key: 'proficiencyLevel', label: 'Level',       render: r => `${r.proficiencyLevel} / 5` },
    { key: 'isActive',         label: 'Active',      render: r => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    { key: 'certificationDate', label: 'Certified',  render: r => r.certificationDate ? new Date(r.certificationDate).toLocaleDateString() : '—' },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Operator Management" subtitle={`${total} records`} />
      <div className="flex gap-2 border-b border-gray-200">
        {['shifts','skills'].map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`px-4 py-2 text-sm font-medium border-b-2 capitalize ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>
      {tab === 'shifts' && (
        <FilterToolbar filters={[{ key: 'status', label: 'Status', value: status, options: SHIFT_STATUS_OPTIONS, onChange: v => { setStatus(v); setPage(1); } }]} />
      )}
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No records found" /> : <DataTable columns={tab === 'shifts' ? shiftColumns : skillColumns} rows={rows} />}
      {tab === 'shifts' && <Pagination page={page} total={total} limit={20} onChange={setPage} />}
    </div>
  );
}
