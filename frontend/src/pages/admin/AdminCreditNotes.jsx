import React, { useEffect, useState, useCallback } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchCreditNotes, createCreditNote, deleteCreditNote } from '../../services/accountsPayableAPI';

const fmt = v => `₹${(v||0).toLocaleString('en-IN')}`;

export default function AdminCreditNotes() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form,    setForm]    = useState({ vendorName: '', creditNoteDate: '', reason: 'price_difference', totalAmount: '', description: '', vendorCNNumber: '' });
  const [saving,  setSaving]  = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetchCreditNotes({ page, limit, status: status || undefined });
      setData(r.data.data || []); setTotal(r.data.pagination?.total || 0);
    } catch(e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await createCreditNote({ ...form, totalAmount: Number(form.totalAmount), subtotal: Number(form.totalAmount) });
      setShowNew(false); load();
    } catch(e) { alert(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this credit note?')) return;
    try { await deleteCreditNote(id); load(); } catch(e) { alert(e.response?.data?.message || e.message); }
  };

  const columns = [
    { key: 'creditNoteNumber', label: 'CN #' },
    { key: 'vendorName',       label: 'Vendor' },
    { key: 'creditNoteDate',   label: 'Date',   render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'vendorCNNumber',   label: 'Vendor CN#' },
    { key: 'reason',           label: 'Reason', render: v => v?.replace(/_/g,' ') },
    { key: 'totalAmount',      label: 'Amount', render: v => fmt(v) },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} color={{ draft:'gray', submitted:'blue', approved:'green', adjusted:'yellow', cancelled:'red' }[v]} /> },
    { key: '_id', label: '', render: (id, row) => ['draft','cancelled'].includes(row.status) && <button onClick={() => handleDelete(id)} className="text-xs text-red-500 hover:underline">Delete</button> },
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="AP Credit Notes" subtitle="Vendor credit notes received" action={<button onClick={() => setShowNew(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Credit Note</button>} />

      <div className="flex gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          {['draft','submitted','approved','adjusted','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}
      {!loading && !error && data.length === 0 && <EmptyState title="No credit notes found" />}
      {!loading && !error && data.length > 0 && <>
        <DataTable columns={columns} data={data} />
        <Pagination page={page} total={total} limit={limit} onPage={setPage} />
      </>}

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Credit Note</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Vendor Name" value={form.vendorName} onChange={e=>setForm(f=>({...f,vendorName:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <input placeholder="Vendor CN Number" value={form.vendorCNNumber} onChange={e=>setForm(f=>({...f,vendorCNNumber:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <div><label className="text-xs text-gray-500">Credit Note Date</label><input type="date" required value={form.creditNoteDate} onChange={e=>setForm(f=>({...f,creditNoteDate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
              <select value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {['price_difference','quantity_difference','discount','quality_allowance','other'].map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
              </select>
              <input type="number" required placeholder="Total Amount" value={form.totalAmount} onChange={e=>setForm(f=>({...f,totalAmount:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm disabled:opacity-50">Create</button>
                <button type="button" onClick={()=>setShowNew(false)} className="flex-1 border py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
