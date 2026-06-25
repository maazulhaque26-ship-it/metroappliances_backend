import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getAttendance } from '../../services/mesAPI';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'present',  label: 'Present' },
  { value: 'absent',   label: 'Absent' },
  { value: 'late',     label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'holiday',  label: 'Holiday' },
  { value: 'leave',    label: 'Leave' },
];

export default function AdminOperatorAttendance() {
  const [rows,   setRows]   = useState([]);
  const [total,  setTotal]  = useState(0);
  const [page,   setPage]   = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getAttendance({ page, limit: 20, status })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'attendanceNumber', label: '#', render: r => <span className="font-mono text-xs text-orange-600">{r.attendanceNumber}</span> },
    { key: 'operator',         label: 'Operator',   render: r => r.operator?.name || '—' },
    { key: 'factory',          label: 'Factory',    render: r => r.factory?.name  || '—' },
    { key: 'date',             label: 'Date',       render: r => new Date(r.date).toLocaleDateString() },
    { key: 'status',           label: 'Status',     render: r => <StatusBadge status={r.status} /> },
    { key: 'checkIn',          label: 'Check In',   render: r => r.checkIn  ? new Date(r.checkIn).toLocaleTimeString()  : '—' },
    { key: 'checkOut',         label: 'Check Out',  render: r => r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—' },
    { key: 'hoursWorked',      label: 'Hours',      render: r => r.hoursWorked ?? '—' },
    { key: 'overtimeHours',    label: 'OT Hours',   render: r => r.overtimeHours ?? '—' },
    { key: 'lateMinutes',      label: 'Late (min)', render: r => r.lateMinutes ?? '—' },
  ];

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Operator Attendance" subtitle={`${total} records`} />
      <FilterToolbar filters={[{ key: 'status', label: 'Status', value: status, options: STATUS_OPTIONS, onChange: v => { setStatus(v); setPage(1); } }]} />
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState message="No attendance records" /> : <DataTable columns={columns} rows={rows} />}
      <Pagination page={page} total={total} limit={20} onChange={setPage} />
    </div>
  );
}
