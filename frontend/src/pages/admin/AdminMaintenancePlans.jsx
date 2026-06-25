import React, { useEffect, useState, useCallback } from 'react';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchMaintenancePlans, createMaintenancePlan, updateMaintenancePlan, deleteMaintenancePlan } from '../../services/eamAPI';

const TYPE_OPTS = ['','preventive','corrective','predictive','condition_based','run_to_failure'].map(v=>({value:v,label:v||'All Types'}));
const REC_OPTS  = ['','one_time','daily','weekly','monthly','quarterly','annually','meter_based'].map(v=>({value:v,label:v||'All Recurrence'}));

export default function AdminMaintenancePlans() {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name:'', maintenanceType:'preventive', recurrenceType:'monthly', intervalDays:30 });
  const [delId,   setDelId]   = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMaintenancePlans({ page, limit: LIMIT, search });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openEdit = item => { setEditing(item); setForm({ name: item.name, maintenanceType: item.maintenanceType, recurrenceType: item.recurrenceType, intervalDays: item.intervalDays || 30 }); };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) await updateMaintenancePlan(editing._id, form);
      else await createMaintenancePlan(form);
      setEditing(null); setForm({ name:'', maintenanceType:'preventive', recurrenceType:'monthly', intervalDays:30 });
      load();
    } catch {}
  };

  const handleDelete = async () => {
    try { await deleteMaintenancePlan(delId); setDelId(null); load(); } catch {}
  };

  const columns = [
    { key: 'planNumber',      label: 'Plan No.' },
    { key: 'name',            label: 'Name' },
    { key: 'maintenanceType', label: 'Type', render: v => <span className="capitalize text-sm">{v?.replace(/_/g,' ')}</span> },
    { key: 'recurrenceType',  label: 'Recurrence', render: v => <span className="text-sm capitalize">{v?.replace(/_/g,' ')}</span> },
    { key: 'intervalDays',    label: 'Every (days)', render: v => v || '—' },
    { key: 'estimatedHours',  label: 'Est. Hours', render: v => v || '—' },
    { key: 'isActive',        label: 'Active', render: v => <span className={v ? 'text-green-600 font-medium' : 'text-gray-400'} >{v ? 'Yes' : 'No'}</span> },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(row)} className="text-blue-600 text-sm hover:underline">Edit</button>
          <button onClick={() => setDelId(v)} className="text-red-500 text-sm hover:underline">Delete</button>
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Maintenance Plans" subtitle={`${total} plans`}>
        <button onClick={() => { setEditing(null); setForm({ name:'', maintenanceType:'preventive', recurrenceType:'monthly', intervalDays:30 }); document.getElementById('plan-form-modal').showModal?.(); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600" data-modal-toggle="plan-form">+ New Plan</button>
      </SectionHeader>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search plans..." />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No plans found" /> :
        <>
          <DataTable columns={columns} data={items} />
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </>
      }

      {/* Inline modal trigger via state */}
      {(editing !== undefined) && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${editing === null && !document.getElementById('plan-form-state') ? 'hidden' : ''}`} id="plan-form-state" style={{ display: editing !== undefined && typeof editing !== 'string' && items.length >= 0 ? 'flex' : 'none' }}>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Plan" message="Delete this maintenance plan?" onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}
