import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import StatusBadge  from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchFiscalYears, createFiscalYear, closeFiscalYear, lockFiscalYear, deleteFiscalYear } from '../../services/financeAPI';

const BLANK = { name: '', startDate: '', endDate: '', baseCurrency: 'INR' };

export default function AdminFiscalYears() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(BLANK);
  const [confirm,  setConfirm]  = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFiscalYears({ page, limit: LIMIT });
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async e => {
    e.preventDefault();
    try { await createFiscalYear(form); setShowForm(false); setForm(BLANK); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleAction = async () => {
    const { action, id } = confirm;
    try {
      if (action === 'close')  await closeFiscalYear(id);
      if (action === 'lock')   await lockFiscalYear(id);
      if (action === 'delete') await deleteFiscalYear(id);
      setConfirm(null); load();
    } catch (e) { alert(e.response?.data?.message || e.message); setConfirm(null); }
  };

  const columns = [
    { key: 'yearCode',  label: 'Code',   render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'name',      label: 'Name' },
    { key: 'startDate', label: 'Start',  render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'endDate',   label: 'End',    render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status',    label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'baseCurrency', label: 'Currency' },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1 flex-wrap">
          {row.status === 'open'   && <button onClick={() => setConfirm({ action:'close',  id: v })} className="text-xs text-yellow-600 hover:underline">Close</button>}
          {row.status === 'closed' && <button onClick={() => setConfirm({ action:'lock',   id: v })} className="text-xs text-red-500   hover:underline">Lock</button>}
          {row.status === 'open'   && <button onClick={() => setConfirm({ action:'delete', id: v })} className="text-xs text-red-500   hover:underline">Del</button>}
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Fiscal Years" subtitle={`${total} fiscal years`}>
        <button onClick={() => { setForm(BLANK); setShowForm(true); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Fiscal Year</button>
      </SectionHeader>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No fiscal years found" /> :
        <><DataTable columns={columns} data={items} /><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold">New Fiscal Year</h3>
            <input required placeholder="Name (e.g. FY 2025-26)" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <input required type="date" value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <input required type="date" value={form.endDate} onChange={e => setForm(f=>({...f,endDate:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input placeholder="Base Currency" value={form.baseCurrency} onChange={e => setForm(f=>({...f,baseCurrency:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'close' ? 'Close Fiscal Year' : confirm?.action === 'lock' ? 'Lock Fiscal Year' : 'Delete Fiscal Year'}
        message={confirm?.action === 'close' ? 'Close this fiscal year? Journals can still be reversed.' : confirm?.action === 'lock' ? 'Lock this fiscal year? No further changes allowed.' : 'Delete this open fiscal year?'}
        onConfirm={handleAction}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
