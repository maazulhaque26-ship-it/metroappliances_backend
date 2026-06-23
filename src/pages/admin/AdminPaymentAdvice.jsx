import React, { useEffect, useState, useCallback } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchPaymentAdvices, createPaymentAdvice } from '../../services/accountsPayableAPI';

const fmt = v => `₹${(v||0).toLocaleString('en-IN')}`;

export default function AdminPaymentAdvice() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form,    setForm]    = useState({ vendorName: '', paymentDate: '', paymentMethod: 'bank_transfer', netAmount: '', bankReference: '', sentTo: '' });
  const [saving,  setSaving]  = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetchPaymentAdvices({ page, limit, status: status || undefined });
      setData(r.data.data || []); setTotal(r.data.pagination?.total || 0);
    } catch(e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await createPaymentAdvice({ ...form, netAmount: Number(form.netAmount), totalAmount: Number(form.netAmount), adviceDate: new Date().toISOString() });
      setShowNew(false); load();
    } catch(e) { alert(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: 'adviceNumber', label: 'Advice #' },
    { key: 'vendorName',   label: 'Vendor' },
    { key: 'adviceDate',   label: 'Date',   render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'paymentDate',  label: 'Pmt Date', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'paymentMethod',label: 'Method', render: v => v?.replace(/_/g,' ') },
    { key: 'netAmount',    label: 'Net Amount', render: v => fmt(v) },
    { key: 'bankReference',label: 'Bank Ref' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} color={{ draft:'gray', sent:'blue', acknowledged:'green' }[v]} /> },
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Payment Advice" subtitle="Formal payment advices to vendors" action={<button onClick={() => setShowNew(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Advice</button>} />

      <div className="flex gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          {['draft','sent','acknowledged'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}
      {!loading && !error && data.length === 0 && <EmptyState title="No payment advices found" />}
      {!loading && !error && data.length > 0 && <>
        <DataTable columns={columns} data={data} />
        <Pagination page={page} total={total} limit={limit} onPage={setPage} />
      </>}

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Payment Advice</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Vendor Name" value={form.vendorName} onChange={e=>setForm(f=>({...f,vendorName:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <div><label className="text-xs text-gray-500">Payment Date</label><input type="date" value={form.paymentDate} onChange={e=>setForm(f=>({...f,paymentDate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
              <select value={form.paymentMethod} onChange={e=>setForm(f=>({...f,paymentMethod:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                {['bank_transfer','cheque','neft','rtgs','upi'].map(m=><option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
              </select>
              <input type="number" required placeholder="Net Amount" value={form.netAmount} onChange={e=>setForm(f=>({...f,netAmount:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <input placeholder="Bank Reference" value={form.bankReference} onChange={e=>setForm(f=>({...f,bankReference:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <input type="email" placeholder="Send To (email)" value={form.sentTo} onChange={e=>setForm(f=>({...f,sentTo:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
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
