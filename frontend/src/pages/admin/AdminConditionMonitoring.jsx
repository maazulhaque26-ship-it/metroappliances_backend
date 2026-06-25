import React, { useEffect, useState, useCallback } from 'react';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import FilterToolbar from '../../components/shared/FilterToolbar';
import SectionHeader from '../../components/shared/SectionHeader';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchConditionMonitors, createConditionMonitor, updateConditionMonitor, deleteConditionMonitor, addConditionReading } from '../../services/eamAPI';

const STATE_OPTS = ['','normal','warning','critical','unknown'].map(v=>({value:v,label:v||'All States'}));
const TYPE_OPTS  = ['','vibration','temperature','pressure','current','voltage','flow','humidity','noise','speed','lubrication','other'].map(v=>({value:v,label:v||'All Types'}));

const STATE_COLOR = { normal:'bg-green-100 text-green-700', warning:'bg-yellow-100 text-yellow-700', critical:'bg-red-100 text-red-700', unknown:'bg-gray-100 text-gray-600' };

export default function AdminConditionMonitoring() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [state,    setState]    = useState('');
  const [pType,    setPType]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ parameter:'', parameterType:'temperature', unit:'°C' });
  const [rdgForm,  setRdgForm]  = useState(null);
  const [delId,    setDelId]    = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchConditionMonitors({ page, limit: LIMIT, currentState: state, parameterType: pType });
      setItems(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, state, pType]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async e => {
    e.preventDefault();
    try { await createConditionMonitor(form); setShowForm(false); setForm({ parameter:'', parameterType:'temperature', unit:'°C' }); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleAddReading = async e => {
    e.preventDefault();
    try { await addConditionReading(rdgForm.monitorId, { value: Number(rdgForm.value) }); setRdgForm(null); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDelete = async () => {
    try { await deleteConditionMonitor(delId); setDelId(null); load(); } catch {}
  };

  const PARAM_TYPES = ['vibration','temperature','pressure','current','voltage','flow','humidity','noise','speed','lubrication','other'];

  const columns = [
    { key: 'monitorNumber',  label: 'Monitor No.' },
    { key: 'asset',          label: 'Asset',      render: (v, row) => row.asset?.name || '—' },
    { key: 'parameter',      label: 'Parameter' },
    { key: 'parameterType',  label: 'Type',       render: v => <span className="capitalize text-sm">{v}</span> },
    { key: 'currentValue',   label: 'Current',    render: (v, row) => v !== undefined ? `${v} ${row.unit||''}` : '—' },
    { key: 'currentState',   label: 'State',      render: v => <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATE_COLOR[v]||''}`}>{v||'—'}</span> },
    { key: 'lastReadingAt',  label: 'Last Reading', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1">
          <button onClick={() => setRdgForm({ monitorId: v, value:'' })} className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">+ Reading</button>
          <button onClick={() => setDelId(v)} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Del</button>
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Condition Monitoring" subtitle={`${total} monitors`}>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ Add Monitor</button>
      </SectionHeader>
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <FilterToolbar filters={[
          { label: 'State', value: state, onChange: v => { setState(v); setPage(1); }, options: STATE_OPTS },
          { label: 'Type',  value: pType, onChange: v => { setPType(v); setPage(1); }, options: TYPE_OPTS  },
        ]} />
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No monitors found" /> :
        <>
          <DataTable columns={columns} data={items} />
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold">Add Condition Monitor</h3>
            <input placeholder="Asset ID" value={form.asset||''} onChange={e => setForm(f=>({...f,asset:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Parameter name (e.g. Bearing Temperature)" value={form.parameter} onChange={e => setForm(f=>({...f,parameter:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <select required value={form.parameterType} onChange={e => setForm(f=>({...f,parameterType:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
              {PARAM_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="Unit (e.g. °C, bar, A)" value={form.unit} onChange={e => setForm(f=>({...f,unit:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create</button>
            </div>
          </form>
        </div>
      )}

      {rdgForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleAddReading} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3">
            <h3 className="text-lg font-semibold">Add Reading</h3>
            <input type="number" step="any" required placeholder="Value" value={rdgForm.value} onChange={e => setRdgForm(f=>({...f,value:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setRdgForm(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Save</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delId} title="Delete Monitor" message="Delete this condition monitor?" onConfirm={handleDelete} onCancel={() => setDelId(null)} />
    </div>
  );
}
