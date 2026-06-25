import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import Pagination from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import EmptyState from '../../components/shared/EmptyState';
import { fetchActivities, createActivity, fetchReminders, createReminder } from '../../services/accountsReceivableAPI';

export default function AdminCollections() {
  const [tab,     setTab]     = useState('activities');
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form,    setForm]    = useState({ customer: '', customerName: '', notes: '', activityType: 'call', outcome: 'contacted', dueAmount: '' });
  const [remForm, setRemForm] = useState({ customer: '', customerName: '', reminderLevel: 1, reminderType: 'email', dueAmount: '' });
  const [saving,  setSaving]  = useState(false);
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true); setError('');
    const fn = tab === 'activities' ? fetchActivities : fetchReminders;
    fn({ page, limit: LIMIT })
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [page, tab]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (tab === 'activities') await createActivity(form);
      else await createReminder(remForm);
      setShowCreate(false); load();
    } catch { /* handled */ } finally { setSaving(false); }
  };

  const actCols = [
    { key: 'activityNumber', label: '#', render: r => <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.activityNumber}</span> },
    { key: 'customerName',   label: 'Customer' },
    { key: 'activityType',   label: 'Type', render: r => r.activityType?.replace(/_/g,' ') },
    { key: 'activityDate',   label: 'Date', render: r => r.activityDate ? new Date(r.activityDate).toLocaleDateString('en-IN') : '-' },
    { key: 'outcome',        label: 'Outcome', render: r => <StatusBadge status={r.outcome} /> },
    { key: 'nextFollowUpDate', label: 'Next Follow-up', render: r => r.nextFollowUpDate ? new Date(r.nextFollowUpDate).toLocaleDateString('en-IN') : '-' },
  ];

  const remCols = [
    { key: 'reminderNumber',  label: '#', render: r => <span className="font-semibold" style={{ color: 'var(--accent)' }}>{r.reminderNumber}</span> },
    { key: 'customerName',    label: 'Customer' },
    { key: 'reminderLevel',   label: 'Level', render: r => `Level ${r.reminderLevel}` },
    { key: 'reminderType',    label: 'Type' },
    { key: 'reminderDate',    label: 'Date', render: r => r.reminderDate ? new Date(r.reminderDate).toLocaleDateString('en-IN') : '-' },
    { key: 'dueAmount',       label: 'Due', render: r => `₹${(r.dueAmount || 0).toLocaleString('en-IN')}` },
    { key: 'status',          label: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>Collections</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>Collection activities & reminders</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>+ Log Activity</button>
      </div>

      <div className="flex gap-2">
        {[['activities','Activities'],['reminders','Reminders']].map(([t,l]) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }} className="px-4 py-2 text-[12.5px] font-medium rounded-lg"
            style={{ background: tab === t ? 'var(--accent)' : 'var(--bg)', color: tab === t ? '#fff' : 'var(--text-3)', border: '1px solid var(--border)' }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : data.length === 0 ? <EmptyState message={`No ${tab} yet`} /> : (
        <>
          <DataTable columns={tab === 'activities' ? actCols : remCols} data={data} />
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{tab === 'activities' ? 'Log Collection Activity' : 'Create Reminder'}</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {tab === 'activities' ? (
                <>
                  {[['customer','Customer ID','text'],['customerName','Customer Name','text'],['notes','Notes','text'],['dueAmount','Due Amount','number']].map(([k,l,t]) => (
                    <div key={k}>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l}</label>
                      <input type={t} required={['customer','customerName','notes'].includes(k)} value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))}
                        className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>Type</label>
                      <select value={form.activityType} onChange={e => setForm(f => ({...f, activityType: e.target.value}))}
                        className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                        {['call','email','visit','letter','legal_notice','escalation','field_collection'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>Outcome</label>
                      <select value={form.outcome} onChange={e => setForm(f => ({...f, outcome: e.target.value}))}
                        className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                        {['contacted','not_reachable','promise_to_pay','partial_payment','disputed','escalated','legal'].map(o => <option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {[['customer','Customer ID','text'],['customerName','Customer Name','text'],['dueAmount','Due Amount','number']].map(([k,l,t]) => (
                    <div key={k}>
                      <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l}</label>
                      <input type={t} required value={remForm[k]} onChange={e => setRemForm(f => ({...f,[k]:e.target.value}))}
                        className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                    </div>
                  ))}
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
