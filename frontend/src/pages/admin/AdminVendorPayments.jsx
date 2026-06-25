import React, { useEffect, useState, useCallback } from 'react';
import SectionHeader  from '../../components/shared/SectionHeader';
import SearchToolbar  from '../../components/shared/SearchToolbar';
import DataTable      from '../../components/shared/DataTable';
import Pagination     from '../../components/shared/Pagination';
import StatusBadge    from '../../components/shared/StatusBadge';
import LoadingState   from '../../components/shared/LoadingState';
import ErrorState     from '../../components/shared/ErrorState';
import EmptyState     from '../../components/shared/EmptyState';
import { fetchPayments, createPayment, approvePayment, postPayment, reversePayment } from '../../services/accountsPayableAPI';

const fmt = v => `₹${(v||0).toLocaleString('en-IN')}`;
const STATUS_COLORS = { draft: 'gray', approved: 'blue', posted: 'green', reversed: 'orange', cancelled: 'red' };

export default function AdminVendorPayments() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form,    setForm]    = useState({ vendorName: '', paymentDate: '', paymentMethod: 'bank_transfer', amount: '', utrNumber: '', notes: '' });
  const [saving,  setSaving]  = useState(false);
  const [postForm, setPostForm] = useState({ apAccount: '', bankAccount: '' });
  const [postingId, setPostingId] = useState(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetchPayments({ page, limit, search: search || undefined, status: status || undefined });
      setData(r.data.data || []); setTotal(r.data.pagination?.total || 0);
    } catch(e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await createPayment({ ...form, amount: Number(form.amount), netAmount: Number(form.amount) });
      setShowNew(false); setForm({ vendorName:'', paymentDate:'', paymentMethod:'bank_transfer', amount:'', utrNumber:'', notes:'' }); load();
    } catch(e) { alert(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const handleApprove = async id => {
    try { await approvePayment(id); load(); } catch(e) { alert(e.response?.data?.message || e.message); }
  };

  const handlePost = async e => {
    e.preventDefault();
    try { await postPayment(postingId, postForm); setPostingId(null); load(); }
    catch(e) { alert(e.response?.data?.message || e.message); }
  };

  const handleReverse = async id => {
    const reason = prompt('Reversal reason:');
    if (reason === null) return;
    const apAccount   = prompt('AP Account ID:');
    const bankAccount = prompt('Bank Account ID:');
    if (!apAccount || !bankAccount) return;
    try { await reversePayment(id, { reason, apAccount, bankAccount }); load(); }
    catch(e) { alert(e.response?.data?.message || e.message); }
  };

  const columns = [
    { key: 'paymentNumber', label: 'Payment #' },
    { key: 'vendorName',    label: 'Vendor' },
    { key: 'paymentDate',   label: 'Date',    render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'paymentMethod', label: 'Method',  render: v => v?.replace(/_/g,' ') },
    { key: 'amount',        label: 'Amount',  render: v => fmt(v) },
    { key: 'netAmount',     label: 'Net',     render: v => fmt(v) },
    { key: 'status',        label: 'Status',  render: v => <StatusBadge status={v} color={STATUS_COLORS[v]} /> },
    { key: '_id', label: 'Actions', render: (id, row) => (
      <div className="flex gap-1">
        {row.status === 'draft'     && <button onClick={() => handleApprove(id)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Approve</button>}
        {row.status === 'approved'  && <button onClick={() => setPostingId(id)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Post GL</button>}
        {row.status === 'posted'    && <button onClick={() => handleReverse(id)} className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">Reverse</button>}
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Vendor Payments" subtitle="AP payment transactions" action={<button onClick={() => setShowNew(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Payment</button>} />

      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search payment #, vendor..." />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          {['draft','approved','posted','reversed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}
      {!loading && !error && data.length === 0 && <EmptyState title="No payments found" />}
      {!loading && !error && data.length > 0 && <>
        <DataTable columns={columns} data={data} />
        <Pagination page={page} total={total} limit={limit} onPage={setPage} />
      </>}

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">New Payment</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Vendor Name" value={form.vendorName} onChange={e => setForm(f=>({...f,vendorName:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Payment Date</label><input type="date" required value={form.paymentDate} onChange={e=>setForm(f=>({...f,paymentDate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
                <div><label className="text-xs text-gray-500">Method</label>
                  <select value={form.paymentMethod} onChange={e=>setForm(f=>({...f,paymentMethod:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
                    {['bank_transfer','cheque','cash','upi','neft','rtgs','imps'].map(m=><option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
              </div>
              <input type="number" required placeholder="Amount" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <input placeholder="UTR / Reference No." value={form.utrNumber} onChange={e=>setForm(f=>({...f,utrNumber:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm disabled:opacity-50">Create</button>
                <button type="button" onClick={()=>setShowNew(false)} className="flex-1 border py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {postingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Post Payment to GL</h3>
            <form onSubmit={handlePost} className="space-y-3">
              <div><label className="text-xs text-gray-500">AP Account ID</label><input required value={postForm.apAccount} onChange={e=>setPostForm(f=>({...f,apAccount:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
              <div><label className="text-xs text-gray-500">Bank Account ID</label><input required value={postForm.bankAccount} onChange={e=>setPostForm(f=>({...f,bankAccount:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm">Post</button>
                <button type="button" onClick={()=>setPostingId(null)} className="flex-1 border py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
