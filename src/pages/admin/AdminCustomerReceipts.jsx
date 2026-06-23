import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import Pagination from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchReceipts, createReceipt, postReceipt, reverseReceipt } from '../../services/accountsReceivableAPI';

export default function AdminCustomerReceipts() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [postModal,  setPostModal]  = useState(null);
  const [revModal,   setRevModal]   = useState(null);
  const [form,    setForm]    = useState({ customerName: '', receiptDate: '', amount: '', receiptType: 'bank_transfer', referenceNo: '' });
  const [postForm, setPostForm] = useState({ bankAccount: '', arAccount: '' });
  const [saving,  setSaving]  = useState(false);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true); setError('');
    fetchReceipts({ page, limit: LIMIT, search, status })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setError('Failed to load receipts'))
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createReceipt(form); setShowCreate(false); load(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const handlePost = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await postReceipt(postModal._id, postForm); setPostModal(null); load(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const handleReverse = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await reverseReceipt(revModal._id, { reason: e.target.reason.value }); setRevModal(null); load(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const columns = [
    { key: 'receiptNumber', label: 'Receipt #', render: r => <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.receiptNumber}</span> },
    { key: 'customerName',  label: 'Customer' },
    { key: 'receiptDate',   label: 'Date', render: r => r.receiptDate ? new Date(r.receiptDate).toLocaleDateString('en-IN') : '-' },
    { key: 'receiptType',   label: 'Type', render: r => r.receiptType?.replace(/_/g,' ') },
    { key: 'amount',        label: 'Amount', render: r => fmt(r.amount) },
    { key: 'status',        label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions',       label: '', render: r => (
      <div className="flex gap-2">
        {r.status === 'draft'  && <button onClick={() => setPostModal(r)} className="text-[11px] px-3 py-1 rounded font-medium text-white" style={{ background: '#22c55e' }}>Post</button>}
        {r.status === 'posted' && <button onClick={() => setRevModal(r)}  className="text-[11px] px-3 py-1 rounded font-medium text-white" style={{ background: '#ef4444' }}>Reverse</button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Customer Receipts</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>{total} total receipts</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>+ New Receipt</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search receipts…" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-[12.5px] px-3 py-2 rounded-lg outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <option value="">All Statuses</option>
          {['draft','posted','reversed','bounced'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <DataTable columns={columns} data={data} />
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>New Customer Receipt</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {[['customerName','Customer Name','text'],['receiptDate','Receipt Date','date'],['amount','Amount','number'],['referenceNo','Reference No','text']].map(([k,l,t]) => (
                <div key={k}>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l}</label>
                  <input type={t} required={['customerName','receiptDate','amount'].includes(k)} value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))}
                    className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>Receipt Type</label>
                <select value={form.receiptType} onChange={e => setForm(f => ({...f, receiptType: e.target.value}))}
                  className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {['cash','cheque','bank_transfer','upi','card','online_gateway','advance'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>{saving ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post GL Modal */}
      {postModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Post Receipt to GL — {postModal.receiptNumber}</h3>
            <form onSubmit={handlePost} className="space-y-3">
              {[['bankAccount','Bank Account ID'],['arAccount','AR Account ID']].map(([k,l]) => (
                <div key={k}>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l}</label>
                  <input required value={postForm[k]} onChange={e => setPostForm(f => ({...f,[k]:e.target.value}))}
                    className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPostModal(null)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: '#22c55e' }}>{saving ? 'Posting…' : 'Post GL'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reverse Modal */}
      {revModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Reverse Receipt — {revModal.receiptNumber}</h3>
            <form onSubmit={handleReverse} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>Reversal Reason</label>
                <input name="reason" required className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRevModal(null)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: '#ef4444' }}>{saving ? 'Reversing…' : 'Reverse'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
