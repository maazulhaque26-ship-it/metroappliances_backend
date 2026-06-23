import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import EmptyState from '../../components/shared/EmptyState';
import { fetchPromises, createPromise, updatePromise } from '../../services/accountsReceivableAPI';

export default function AdminPromiseToPay() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [updateModal, setUpdateModal] = useState(null);
  const [form,    setForm]    = useState({ customer: '', customerName: '', promisedAmount: '', promisedDate: '', notes: '' });
  const [saving,  setSaving]  = useState(false);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true); setError('');
    fetchPromises({ page, limit: LIMIT })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setError('Failed to load promises'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createPromise(form); setShowCreate(false); setForm({ customer: '', customerName: '', promisedAmount: '', promisedDate: '', notes: '' }); load(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await updatePromise(updateModal._id, { status: e.target.status.value }); setUpdateModal(null); load(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const columns = [
    { key: 'ptpNumber',     label: 'PTP #', render: r => <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.ptpNumber}</span> },
    { key: 'customerName',  label: 'Customer' },
    { key: 'promisedAmount',label: 'Amount', render: r => fmt(r.promisedAmount) },
    { key: 'promisedDate',  label: 'Promise Date', render: r => r.promisedDate ? new Date(r.promisedDate).toLocaleDateString('en-IN') : '-' },
    { key: 'status',        label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'notes',         label: 'Notes', render: r => <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>{r.notes || '-'}</span> },
    { key: 'actions', label: '', render: r => (
      <button onClick={() => setUpdateModal(r)} className="text-[11px] px-3 py-1 rounded font-medium"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
        Update Status
      </button>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Promise to Pay</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>Track payment commitments from customers</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>+ Record Promise</button>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : data.length === 0 ? <EmptyState message="No promises to pay recorded" /> : (
        <>
          <DataTable columns={columns} data={data} />
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Record Promise to Pay</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                ['customer','Customer ID','text'],
                ['customerName','Customer Name','text'],
                ['promisedAmount','Promised Amount','number'],
                ['promisedDate','Promise Date','date'],
                ['notes','Notes','text'],
              ].map(([k,l,t]) => (
                <div key={k}>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l}</label>
                  <input type={t} required={!['notes'].includes(k)} value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))}
                    className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>{saving ? 'Saving…' : 'Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {updateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Update Status — {updateModal.ptpNumber}</h3>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>New Status</label>
                <select name="status" defaultValue={updateModal.status}
                  className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {['active','fulfilled','broken','partial','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setUpdateModal(null)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>{saving ? 'Updating…' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
