import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import StatusBadge  from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchPeriods, createPeriod, closePeriod, lockPeriod } from '../../services/financeAPI';

const BLANK = { fiscalYear: '', periodName: '', periodNumber: 1, startDate: '', endDate: '' };

export default function AdminAccountingPeriods() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [fyFilter, setFyFilter] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(BLANK);
  const [confirm,  setConfirm]  = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPeriods({ page, limit: LIMIT, fiscalYear: fyFilter });
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, fyFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async e => {
    e.preventDefault();
    try { await createPeriod(form); setShowForm(false); setForm(BLANK); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleAction = async () => {
    const { action, id } = confirm;
    try {
      if (action === 'close') await closePeriod(id);
      if (action === 'lock')  await lockPeriod(id);
      setConfirm(null); load();
    } catch (e) { alert(e.response?.data?.message || e.message); setConfirm(null); }
  };

  const columns = [
    { key: 'periodCode',   label: 'Code',   render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'fiscalYear',   label: 'FY',     render: v => v?.name || '—' },
    { key: 'periodName',   label: 'Period' },
    { key: 'periodNumber', label: '#', render: v => <span className="text-gray-500">{v}</span> },
    { key: 'startDate',    label: 'Start',  render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'endDate',      label: 'End',    render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status',       label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-1">
          {row.status === 'open'   && <button onClick={() => setConfirm({ action:'close', id: v })} className="text-xs text-yellow-600 hover:underline">Close</button>}
          {row.status === 'closed' && <button onClick={() => setConfirm({ action:'lock',  id: v })} className="text-xs text-red-500   hover:underline">Lock</button>}
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Accounting Periods" subtitle={`${total} periods`}>
        <button onClick={() => { setForm(BLANK); setShowForm(true); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Period</button>
      </SectionHeader>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex gap-3">
        <input placeholder="Filter by Fiscal Year ID" value={fyFilter} onChange={e => { setFyFilter(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm" />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No accounting periods found" /> :
        <><DataTable columns={columns} data={items} /><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold">New Accounting Period</h3>
            <input required placeholder="Fiscal Year ID" value={form.fiscalYear} onChange={e => setForm(f=>({...f,fiscalYear:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Period Name (e.g. April 2025)" value={form.periodName} onChange={e => setForm(f=>({...f,periodName:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input required type="number" min="1" max="12" placeholder="Period Number (1-12)" value={form.periodNumber} onChange={e => setForm(f=>({...f,periodNumber:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <input required type="date" value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <input required type="date" value={form.endDate}   onChange={e => setForm(f=>({...f,endDate:e.target.value}))}   className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'close' ? 'Close Period' : 'Lock Period'}
        message={confirm?.action === 'close' ? 'Close this accounting period?' : 'Lock this period? No further changes allowed.'}
        onConfirm={handleAction}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
