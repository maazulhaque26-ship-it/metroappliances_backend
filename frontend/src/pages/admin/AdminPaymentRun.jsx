import React, { useEffect, useState, useCallback } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchPaymentRuns, createPaymentRun, proposePaymentRun, approvePaymentRun, executePaymentRun, cancelPaymentRun } from '../../services/accountsPayableAPI';

const fmt = v => `₹${(v||0).toLocaleString('en-IN')}`;
const STATUS_COLORS = { draft: 'gray', proposed: 'blue', approved: 'yellow', executed: 'green', partially_failed: 'orange', failed: 'red', cancelled: 'red' };

export default function AdminPaymentRun() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form,    setForm]    = useState({ paymentMethod: 'bank_transfer', bankAccount: '', filterDueBefore: '', filterOverdue: false, notes: '' });
  const [saving,  setSaving]  = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetchPaymentRuns({ page, limit });
      setData(r.data.data || []); setTotal(r.data.pagination?.total || 0);
    } catch(e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await createPaymentRun({ ...form, runDate: new Date().toISOString() });
      setShowNew(false); load();
    } catch(e) { alert(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const action = async (fn, id, label) => {
    if (!window.confirm(`${label}?`)) return;
    try { await fn(id); load(); } catch(e) { alert(e.response?.data?.message || e.message); }
  };

  const columns = [
    { key: 'runNumber',     label: 'Run #' },
    { key: 'runDate',       label: 'Run Date',     render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'paymentDate',   label: 'Payment Date', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'paymentMethod', label: 'Method',       render: v => v?.replace(/_/g,' ') },
    { key: 'totalProposed', label: 'Proposed',     render: v => fmt(v) },
    { key: 'totalApproved', label: 'Approved',     render: v => fmt(v) },
    { key: 'vendorCount',   label: 'Vendors' },
    { key: 'status',        label: 'Status',       render: v => <StatusBadge status={v} color={STATUS_COLORS[v]} /> },
    { key: '_id', label: 'Actions', render: (id, row) => (
      <div className="flex gap-1 flex-wrap">
        {row.status === 'draft'    && <button onClick={() => action(proposePaymentRun, id, 'Propose')}  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Propose</button>}
        {row.status === 'proposed' && <button onClick={() => action(approvePaymentRun, id, 'Approve')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Approve</button>}
        {row.status === 'approved' && <button onClick={() => action(executePaymentRun, id, 'Execute')} className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">Execute</button>}
        {['draft','proposed','approved'].includes(row.status) && <button onClick={() => action(cancelPaymentRun, id, 'Cancel')} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Cancel</button>}
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Payment Runs" subtitle="Batch AP payment execution" action={<button onClick={() => setShowNew(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Run</button>} />

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}
      {!loading && !error && data.length === 0 && <EmptyState title="No payment runs found" />}
      {!loading && !error && data.length > 0 && <>
        <DataTable columns={columns} data={data} />
        <Pagination page={page} total={total} limit={limit} onPage={setPage} />
      </>}

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Payment Run</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Payment Method</label>
                <select value={form.paymentMethod} onChange={e=>setForm(f=>({...f,paymentMethod:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {['bank_transfer','cheque','neft','rtgs','upi'].map(m=><option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <input placeholder="Bank Account" value={form.bankAccount} onChange={e=>setForm(f=>({...f,bankAccount:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <div><label className="text-xs text-gray-500">Filter: Due Before</label><input type="date" value={form.filterDueBefore} onChange={e=>setForm(f=>({...f,filterDueBefore:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.filterOverdue} onChange={e=>setForm(f=>({...f,filterOverdue:e.target.checked}))} />
                Overdue bills only
              </label>
              <textarea placeholder="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm disabled:opacity-50">Create Run</button>
                <button type="button" onClick={()=>setShowNew(false)} className="flex-1 border py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
