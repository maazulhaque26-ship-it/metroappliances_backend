import React, { useEffect, useState, useCallback } from 'react';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge   from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchMaintenanceSchedules, completeSchedule, markSchedulesOverdue } from '../../services/eamAPI';

const STATUS_OPTS = ['','scheduled','overdue','completed','cancelled','skipped'].map(v=>({value:v,label:v||'All Status'}));
const VIEW_OPTS   = [
  { value: '',        label: 'All Schedules' },
  { value: 'upcoming',label: 'Upcoming (7 days)' },
];

export default function AdminMaintenanceCalendar() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [status,   setStatus]   = useState('');
  const [upcoming, setUpcoming] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [markingOverdue, setMarkingOverdue] = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (status) params.status = status;
      if (upcoming) params.upcoming = 'true';
      const res = await fetchMaintenanceSchedules(params);
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, status, upcoming]);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (id) => {
    try { await completeSchedule(id, {}); load(); } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleMarkOverdue = async () => {
    setMarkingOverdue(true);
    try { const r = await markSchedulesOverdue(); alert(r.data.message); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
    finally { setMarkingOverdue(false); }
  };

  const columns = [
    { key: 'scheduleNumber',  label: 'Schedule No.' },
    { key: 'maintenancePlan', label: 'Plan',  render: (v, row) => row.maintenancePlan?.name || '—' },
    { key: 'asset',           label: 'Asset', render: (v, row) => row.asset?.name || '—' },
    { key: 'scheduledDate',   label: 'Scheduled', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'dueDate',         label: 'Due',       render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status',          label: 'Status',    render: v => <StatusBadge status={v} /> },
    { key: 'assignedTo',      label: 'Assigned',  render: (v, row) => row.assignedTo?.name || '—' },
    { key: '_id', label: 'Actions', render: (v, row) => row.status === 'scheduled' ? (
        <button onClick={() => handleComplete(v)} className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Complete</button>
      ) : null,
    },
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Maintenance Calendar" subtitle={`${total} schedules`}>
        <button onClick={handleMarkOverdue} disabled={markingOverdue} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50">
          {markingOverdue ? 'Updating...' : 'Mark Overdue'}
        </button>
      </SectionHeader>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <FilterToolbar filters={[
          { label: 'Status', value: status,   onChange: v => { setStatus(v);   setPage(1); }, options: STATUS_OPTS },
          { label: 'View',   value: upcoming, onChange: v => { setUpcoming(v); setPage(1); }, options: VIEW_OPTS  },
        ]} />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No schedules found" /> :
        <>
          <DataTable columns={columns} data={items} />
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </>
      }
    </div>
  );
}
