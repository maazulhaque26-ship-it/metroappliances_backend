import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader  from '../../components/shared/SectionHeader';
import SearchToolbar  from '../../components/shared/SearchToolbar';
import DataTable      from '../../components/shared/DataTable';
import Pagination     from '../../components/shared/Pagination';
import StatusBadge    from '../../components/shared/StatusBadge';
import LoadingState   from '../../components/shared/LoadingState';
import ErrorState     from '../../components/shared/ErrorState';
import EmptyState     from '../../components/shared/EmptyState';
import { fetchBills, createBill, approveBill, submitBill } from '../../services/accountsPayableAPI';

const STATUS_COLORS = { draft: 'gray', submitted: 'blue', approved: 'green', partially_paid: 'yellow', paid: 'green', overdue: 'red', cancelled: 'red', rejected: 'red' };
const fmt = v => `₹${(v||0).toLocaleString('en-IN')}`;

export default function AdminVendorBills() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form,    setForm]    = useState({ vendorName: '', vendorInvoiceNo: '', billDate: '', dueDate: '', totalAmount: '', notes: '' });
  const [saving,  setSaving]  = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetchBills({ page, limit, search: search || undefined, status: status || undefined });
      setData(r.data.data || []); setTotal(r.data.pagination?.total || 0);
    } catch(e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await createBill({ ...form, totalAmount: Number(form.totalAmount), outstandingAmount: Number(form.totalAmount) });
      setShowNew(false); setForm({ vendorName:'', vendorInvoiceNo:'', billDate:'', dueDate:'', totalAmount:'', notes:'' }); load();
    } catch(e) { alert(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const handleApprove = async id => {
    if (!window.confirm('Approve this bill?')) return;
    try { await approveBill(id); load(); } catch(e) { alert(e.response?.data?.message || e.message); }
  };

  const columns = [
    { key: 'billNumber', label: 'Bill #', render: (v, row) => <Link to={`/admin/accounts-payable/bills/${row._id}`} className="text-orange-600 hover:underline font-medium">{v}</Link> },
    { key: 'vendorName', label: 'Vendor' },
    { key: 'billDate',   label: 'Bill Date', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'dueDate',    label: 'Due Date',  render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'totalAmount',label: 'Total',     render: v => fmt(v) },
    { key: 'outstandingAmount', label: 'Outstanding', render: v => fmt(v) },
    { key: 'status',     label: 'Status',    render: v => <StatusBadge status={v} color={STATUS_COLORS[v]} /> },
    { key: '_id', label: 'Actions', render: (id, row) => (
      <div className="flex gap-2">
        {row.status === 'submitted' && <button onClick={() => handleApprove(id)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Approve</button>}
        <Link to={`/admin/accounts-payable/bills/${id}`} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">View</Link>
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Vendor Bills" subtitle="AP invoices from vendors" action={<button onClick={() => setShowNew(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Bill</button>} />

      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search bill #, vendor..." />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          {['draft','submitted','approved','partially_paid','paid','overdue','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}
      {!loading && !error && data.length === 0 && <EmptyState title="No vendor bills found" />}
      {!loading && !error && data.length > 0 && (
        <>
          <DataTable columns={columns} data={data} />
          <Pagination page={page} total={total} limit={limit} onPage={setPage} />
        </>
      )}

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">New Vendor Bill</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required placeholder="Vendor Name" value={form.vendorName} onChange={e => setForm(f => ({...f, vendorName: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Vendor Invoice No." value={form.vendorInvoiceNo} onChange={e => setForm(f => ({...f, vendorInvoiceNo: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500">Bill Date</label><input type="date" required value={form.billDate} onChange={e => setForm(f => ({...f, billDate: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-500">Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <input type="number" required placeholder="Total Amount" value={form.totalAmount} onChange={e => setForm(f => ({...f, totalAmount: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50">Create Bill</button>
                <button type="button" onClick={() => setShowNew(false)} className="flex-1 border py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
