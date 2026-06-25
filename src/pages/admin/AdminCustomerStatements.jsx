import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import EmptyState from '../../components/shared/EmptyState';
import { fetchStatements, generateStatement, deleteStatement } from '../../services/accountsReceivableAPI';

export default function AdminCustomerStatements() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [genModal, setGenModal] = useState(false);
  const [form,    setForm]    = useState({ customer: '', fromDate: '', toDate: '' });
  const [saving,  setSaving]  = useState(false);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    fetchStatements({ page, limit: LIMIT })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setError('Failed to load statements'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await generateStatement(form); setGenModal(false); load(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const columns = [
    { key: 'statementNumber', label: 'Statement #', render: r => <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.statementNumber}</span> },
    { key: 'customerName',    label: 'Customer' },
    { key: 'fromDate',        label: 'From', render: r => r.fromDate ? new Date(r.fromDate).toLocaleDateString('en-IN') : '-' },
    { key: 'toDate',          label: 'To',   render: r => r.toDate   ? new Date(r.toDate).toLocaleDateString('en-IN') : '-' },
    { key: 'closingBalance',  label: 'Closing Balance', render: r => fmt(r.closingBalance) },
    { key: 'reconciliationStatus', label: 'Status', render: r => <StatusBadge status={r.reconciliationStatus} /> },
    { key: 'actions', label: '', render: r => (
      <button onClick={() => deleteStatement(r._id).then(load)} className="text-[11px] px-3 py-1 rounded font-medium" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: '#ef4444' }}>Delete</button>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Customer Statements</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>{total} statements generated</p>
        </div>
        <button onClick={() => setGenModal(true)} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>+ Generate Statement</button>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : data.length === 0 ? <EmptyState message="No statements generated yet" /> : (
        <>
          <DataTable columns={columns} data={data} />
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}

      {genModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Generate Customer Statement</h3>
            <form onSubmit={handleGenerate} className="space-y-3">
              {[['customer','Customer ID','text'],['fromDate','From Date','date'],['toDate','To Date','date']].map(([k,l,t]) => (
                <div key={k}>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l}</label>
                  <input type={t} required value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))}
                    className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setGenModal(false)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>{saving ? 'Generating…' : 'Generate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
