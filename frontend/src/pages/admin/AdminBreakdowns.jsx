import React, { useEffect, useState, useCallback } from 'react';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge   from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchBreakdowns, createBreakdown, resolveBreakdown, deleteBreakdown } from '../../services/eamAPI';

const SEV_OPTS  = ['','critical','high','medium','low'].map(v=>({value:v,label:v||'All Severity'}));
const STAT_OPTS = ['','open','under_investigation','resolved','closed'].map(v=>({value:v,label:v||'All Status'}));
const SEV_COLOR = { critical:'bg-red-600 text-white', high:'bg-red-100 text-red-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-gray-100 text-gray-700' };

export default function AdminBreakdowns() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [severity, setSeverity] = useState('');
  const [status,   setStatus]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ description:'', failureMode:'mechanical', severity:'high', breakdownDate: new Date().toISOString().slice(0,10) });
  const [resolveData, setResolveData] = useState(null);
  const [delId,    setDelId]    = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBreakdowns({ page, limit: LIMIT, search, severity, status });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, search, severity, status]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async e => {
    e.preventDefault();
    try { await createBreakdown(form); setShowForm(false); load(); } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleResolve = async e => {
    e.preventDefault();
    try { await resolveBreakdown(resolveData.id, resolveData); setResolveData(null); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deleteBreakdown(delId); setDelId(null); load(); } catch {}
  };

  const FAILURE_MODES = ['mechanical','electrical','hydraulic','pneumatic','software','operator_error','wear','corrosion','contamination','other'];

  const columns = [
    { key: 'breakdownNumber', label: 'Ref No.' },
    { key: 'asset',     label: 'Asset',       render: (v, row) => row.asset?.name || '—' },
    { key: 'failureMode', label: 'Failure Mode', render: v => <span className="text-sm capitalize">{v?.replace(/_/g,' ')}</span> },
    { key: 'severity',  label: 'Severity',    render: v => <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${SEV_COLOR[v]||''}`}>{v}</span> },
    { key: 'status',    label: 'Status',      render: v => <StatusBadge status={v} /> },
    { key: 'breakdownDate', label: 'Date',    render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'downtimeHours', label: 'Downtime', render: v => v ? `${v}h` : '—' },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1">
          {row.status !== 'resolved' && row.status !== 'closed' && (
            <button onClick={() => setResolveData({ id: v, restoredDate: new Date().toISOString().slice(0,10), rootCause:'', repairCost:0 })} className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Resolve</button>
          )}
          <button onClick={() => setDelId(v)} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Del</button>
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Breakdown Records" subtitle={`${total} breakdowns`}>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">+ Record Breakdown</button>
      </SectionHeader>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search breakdowns..." />
        <FilterToolbar filters={[
          { label: 'Severity', value: severity, onChange: v => { setSeverity(v); setPage(1); }, options: SEV_OPTS  },
          { label: 'Status',   value: status,   onChange: v => { setStatus(v);   setPage(1); }, options: STAT_OPTS },
        ]} />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No breakdowns found" /> :
        <>
          <DataTable columns={columns} data={items} />
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold text-red-600">Record Breakdown</h3>
            <input required placeholder="Asset ID" value={form.asset||''} onChange={e => setForm(f=>({...f,asset:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <select required value={form.failureMode} onChange={e => setForm(f=>({...f,failureMode:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
              {FAILURE_MODES.map(m=><option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
            </select>
            <select value={form.severity} onChange={e => setForm(f=>({...f,severity:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
              {['critical','high','medium','low'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" required value={form.breakdownDate} onChange={e => setForm(f=>({...f,breakdownDate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">Record</button>
            </div>
          </form>
        </div>
      )}

      {resolveData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleResolve} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold text-green-600">Resolve Breakdown</h3>
            <input type="date" required value={resolveData.restoredDate} onChange={e => setResolveData(d=>({...d,restoredDate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Root cause" value={resolveData.rootCause||''} onChange={e => setResolveData(d=>({...d,rootCause:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Repair cost (₹)" value={resolveData.repairCost||''} onChange={e => setResolveData(d=>({...d,repairCost:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setResolveData(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm">Resolve</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Breakdown" message="Delete this breakdown record?" onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}
