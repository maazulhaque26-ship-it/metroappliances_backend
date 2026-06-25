import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import Pagination from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import EmptyState from '../../components/shared/EmptyState';
import { fetchCreditLimits, createCreditLimit, updateCreditLimit, blockCustomerCredit, unblockCustomerCredit } from '../../services/accountsReceivableAPI';

export default function AdminCreditManagement() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [blockModal, setBlockModal] = useState(null);
  const [form,    setForm]    = useState({ customer: '', customerName: '', creditLimit: '', riskRating: 'medium', creditTerms: 'net30' });
  const [saving,  setSaving]  = useState(false);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true); setError('');
    fetchCreditLimits({ page, limit: LIMIT, search })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setError('Failed to load credit limits'))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createCreditLimit(form); setShowCreate(false); load(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const handleBlock = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await blockCustomerCredit(blockModal._id, { reason: e.target.reason.value }); setBlockModal(null); load(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const handleUnblock = async (id) => {
    try { await unblockCustomerCredit(id); load(); }
    catch { /* handled */ }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const pct = (used, limit) => limit > 0 ? Math.round((used / limit) * 100) : 0;

  const columns = [
    { key: 'customerName',  label: 'Customer' },
    { key: 'creditLimit',   label: 'Credit Limit', render: r => fmt(r.creditLimit) },
    { key: 'usedCredit',    label: 'Used', render: r => fmt(r.usedCredit) },
    { key: 'availableCredit', label: 'Available', render: r => fmt(r.availableCredit) },
    { key: 'utilization',   label: 'Utilization%', render: r => {
      const p = pct(r.usedCredit, r.creditLimit);
      return <span style={{ color: p > 90 ? '#ef4444' : p > 70 ? '#f59e0b' : '#22c55e' }}>{p}%</span>;
    }},
    { key: 'riskRating',    label: 'Risk', render: r => <StatusBadge status={r.riskRating} /> },
    { key: 'isBlocked',     label: 'Blocked', render: r => r.isBlocked ? <span className="text-[11px] font-semibold" style={{ color: '#ef4444' }}>BLOCKED</span> : <span className="text-[11px]" style={{ color: '#22c55e' }}>Active</span> },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2">
        {!r.isBlocked && <button onClick={() => setBlockModal(r)} className="text-[11px] px-3 py-1 rounded font-medium text-white" style={{ background: '#ef4444' }}>Block</button>}
        {r.isBlocked  && <button onClick={() => handleUnblock(r._id)} className="text-[11px] px-3 py-1 rounded font-medium text-white" style={{ background: '#22c55e' }}>Unblock</button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Credit Management</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>Credit limits, utilization & risk ratings</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>+ Set Credit Limit</button>
      </div>

      <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search customers…" />

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : data.length === 0 ? <EmptyState message="No credit limits set yet" /> : (
        <>
          <DataTable columns={columns} data={data} />
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Set Customer Credit Limit</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {[['customer','Customer ID','text'],['customerName','Customer Name','text'],['creditLimit','Credit Limit','number']].map(([k,l,t]) => (
                <div key={k}>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l}</label>
                  <input type={t} required value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))}
                    className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>Risk Rating</label>
                  <select value={form.riskRating} onChange={e => setForm(f => ({...f, riskRating: e.target.value}))}
                    className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    {['low','medium','high'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>Credit Terms</label>
                  <select value={form.creditTerms} onChange={e => setForm(f => ({...f, creditTerms: e.target.value}))}
                    className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    {['immediate','net7','net15','net30','net45','net60','net90'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>{saving ? 'Saving…' : 'Set Limit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: '#ef4444' }}>Block Customer — {blockModal.customerName}</h3>
            <form onSubmit={handleBlock} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>Block Reason</label>
                <input name="reason" required className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setBlockModal(null)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: '#ef4444' }}>{saving ? 'Blocking…' : 'Block'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
