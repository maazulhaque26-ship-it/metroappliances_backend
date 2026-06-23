import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import EmptyState from '../../components/shared/EmptyState';
import { fetchWriteOffs, createWriteOff, approveWriteOff, postWriteOffToGL } from '../../services/accountsReceivableAPI';

export default function AdminWriteOffs() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [glModal,    setGlModal]    = useState(null);
  const [form,    setForm]    = useState({ customerInvoice: '', customerName: '', writeOffAmount: '', writeOffType: 'bad_debt', reason: '' });
  const [saving,  setSaving]  = useState(false);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true); setError('');
    fetchWriteOffs({ page, limit: LIMIT })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setError('Failed to load write-offs'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createWriteOff(form); setShowCreate(false); setForm({ customerInvoice: '', customerName: '', writeOffAmount: '', writeOffType: 'bad_debt', reason: '' }); load(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try { await approveWriteOff(id); load(); }
    catch { /* handled */ }
  };

  const handlePost = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await postWriteOffToGL(glModal._id, { writeOffAccount: e.target.writeOffAccount.value, arAccount: e.target.arAccount.value }); setGlModal(null); load(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const columns = [
    { key: 'writeOffNumber', label: 'Write-off #', render: r => <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.writeOffNumber}</span> },
    { key: 'customerName',   label: 'Customer' },
    { key: 'writeOffAmount', label: 'Amount', render: r => fmt(r.writeOffAmount) },
    { key: 'writeOffType',   label: 'Type', render: r => r.writeOffType?.replace(/_/g,' ') },
    { key: 'reason',         label: 'Reason', render: r => <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{r.reason}</span> },
    { key: 'status',         label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2">
        {r.status === 'pending' && (
          <button onClick={() => handleApprove(r._id)} className="text-[11px] px-3 py-1 rounded font-medium text-white" style={{ background: '#22c55e' }}>Approve</button>
        )}
        {r.status === 'approved' && !r.glPosted && (
          <button onClick={() => setGlModal(r)} className="text-[11px] px-3 py-1 rounded font-medium text-white" style={{ background: 'var(--accent)' }}>Post GL</button>
        )}
        {r.glPosted && <span className="text-[11px] font-semibold" style={{ color: '#22c55e' }}>Posted</span>}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Write-Offs</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>Discount, settlement, and rounding write-offs</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>+ Create Write-Off</button>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : data.length === 0 ? <EmptyState message="No write-offs recorded" /> : (
        <>
          <DataTable columns={columns} data={data} />
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Create Write-Off</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                ['customerInvoice','Invoice ID','text'],
                ['customerName','Customer Name','text'],
                ['writeOffAmount','Write-Off Amount','number'],
                ['reason','Reason','text'],
              ].map(([k,l,t]) => (
                <div key={k}>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l}</label>
                  <input type={t} required value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))}
                    className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>Type</label>
                <select value={form.writeOffType} onChange={e => setForm(f => ({...f, writeOffType: e.target.value}))}
                  className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {['discount','bad_debt','adjustment','settlement','rounding'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>{saving ? 'Saving…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post GL Modal */}
      {glModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Post to General Ledger</h3>
            <form onSubmit={handlePost} className="space-y-3">
              {[['writeOffAccount','Write-Off Expense Account'],['arAccount','AR Account']].map(([k,l]) => (
                <div key={k}>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l} (Account Code)</label>
                  <input name={k} required className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setGlModal(null)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>{saving ? 'Posting…' : 'Post GL'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
