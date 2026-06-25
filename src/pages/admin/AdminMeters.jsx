import React, { useEffect, useState, useCallback } from 'react';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchMeters, createMeter, updateMeter, deleteMeter, addMeterReading } from '../../services/eamAPI';

export default function AdminMeters() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ name:'', meterType:'runtime_hours', unit:'hours' });
  const [readingForm, setReadingForm] = useState(null);
  const [delId,    setDelId]    = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMeters({ page, limit: LIMIT, search });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async e => {
    e.preventDefault();
    try { await createMeter(form); setShowForm(false); setForm({ name:'', meterType:'runtime_hours', unit:'hours' }); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleAddReading = async e => {
    e.preventDefault();
    try { await addMeterReading(readingForm.meterId, { readingValue: Number(readingForm.value), readingDate: readingForm.date }); setReadingForm(null); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deleteMeter(delId); setDelId(null); load(); } catch {}
  };

  const columns = [
    { key: 'meterNumber',  label: 'Meter No.' },
    { key: 'name',         label: 'Name' },
    { key: 'asset',        label: 'Asset',       render: (v, row) => row.asset?.name || '—' },
    { key: 'meterType',    label: 'Type',        render: v => <span className="text-sm capitalize">{v?.replace(/_/g,' ')}</span> },
    { key: 'currentValue', label: 'Current',     render: (v, row) => v !== undefined ? `${v} ${row.unit}` : '—' },
    { key: 'maintenanceThreshold', label: 'Maint. At', render: (v, row) => v ? `${v} ${row.unit}` : '—' },
    { key: 'lastReadingDate', label: 'Last Reading', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'isActive',     label: 'Active',      render: v => v ? '✓' : '✗' },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1">
          <button onClick={() => setReadingForm({ meterId: v, value:'', date: new Date().toISOString().slice(0,10) })} className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">+ Reading</button>
          <button onClick={() => setDelId(v)} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Del</button>
        </div>
      )},
  ];

  const METER_TYPES = ['runtime_hours','cycle_count','distance','production_count','fuel_consumption','power_consumption','other'];

  return (
    <div className="p-6">
      <SectionHeader title="Asset Meters" subtitle={`${total} meters`}>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ Add Meter</button>
      </SectionHeader>
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search meters..." />
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No meters found" /> :
        <>
          <DataTable columns={columns} data={items} />
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold">Add Meter</h3>
            <input required placeholder="Meter name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Asset ID" value={form.asset||''} onChange={e => setForm(f=>({...f,asset:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <select value={form.meterType} onChange={e => setForm(f=>({...f,meterType:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
              {METER_TYPES.map(m=><option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
            </select>
            <input required placeholder="Unit (e.g. hours, km)" value={form.unit} onChange={e => setForm(f=>({...f,unit:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Maintenance threshold" value={form.maintenanceThreshold||''} onChange={e => setForm(f=>({...f,maintenanceThreshold:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Add</button>
            </div>
          </form>
        </div>
      )}

      {readingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleAddReading} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3">
            <h3 className="text-lg font-semibold">Add Meter Reading</h3>
            <input type="number" required placeholder="Reading value" value={readingForm.value} onChange={e => setReadingForm(f=>({...f,value:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="date" value={readingForm.date} onChange={e => setReadingForm(f=>({...f,date:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setReadingForm(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Save</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Meter" message="Delete this meter?" onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}
