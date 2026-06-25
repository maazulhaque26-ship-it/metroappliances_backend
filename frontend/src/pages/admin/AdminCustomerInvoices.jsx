import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/shared/DataTable';
import Pagination from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchInvoices, createInvoice } from '../../services/accountsReceivableAPI';

const STATUS_OPTIONS = ['draft','submitted','approved','partially_paid','paid','overdue','cancelled','written_off'];

export default function AdminCustomerInvoices() {
  const navigate = useNavigate();
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form,    setForm]    = useState({ customerName: '', invoiceDate: '', totalAmount: '', paymentTerm: 'net30' });
  const [saving,  setSaving]  = useState(false);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true); setError('');
    fetchInvoices({ page, limit: LIMIT, search, status })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setError('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createInvoice(form); setShowCreate(false); setForm({ customerName:'', invoiceDate:'', totalAmount:'', paymentTerm:'net30' }); load(); }
    catch { /* error handled by API */ } finally { setSaving(false); }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #', render: (r) => <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.invoiceNumber}</span> },
    { key: 'customerName',  label: 'Customer' },
    { key: 'invoiceDate',   label: 'Date', render: (r) => r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('en-IN') : '-' },
    { key: 'dueDate',       label: 'Due', render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '-' },
    { key: 'totalAmount',   label: 'Total', render: (r) => fmt(r.totalAmount) },
    { key: 'outstandingAmount', label: 'Outstanding', render: (r) => fmt(r.outstandingAmount) },
    { key: 'status',        label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions',       label: '', render: (r) => (
      <button onClick={() => navigate(`/admin/accounts-receivable/invoices/${r._id}`)}
        className="text-[11px] px-3 py-1 rounded font-medium"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
        View
      </button>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Customer Invoices</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>{total} total invoices</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white"
          style={{ background: 'var(--accent)' }}>
          + New Invoice
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search invoices…" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-[12.5px] px-3 py-2 rounded-lg outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <DataTable columns={columns} data={data} />
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>New Customer Invoice</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {[['customerName','Customer Name','text'],['invoiceDate','Invoice Date','date'],['totalAmount','Total Amount','number']].map(([k,l,t]) => (
                <div key={k}>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l}</label>
                  <input type={t} required value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
                    className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>Payment Term</label>
                <select value={form.paymentTerm} onChange={e => setForm(f => ({...f, paymentTerm: e.target.value}))}
                  className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {['immediate','net7','net15','net30','net45','net60','net90'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>{saving ? 'Creating…' : 'Create Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
