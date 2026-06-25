import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiLock, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { fetchBudgets, createBudget, updateBudget, deleteBudget, approveBudget, lockBudget, fetchBudgetVariance } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${Number(n||0).toLocaleString('en-IN')}`;
const STATUS_COLOR = { draft:'#6b7280', submitted:'#3b82f6', approved:'#22c55e', locked:'#a855f7', revised:'#f97316' };

const EMPTY = { budgetName:'', budgetType:'annual', period:'', department:'', currency:'INR', totalBudget:0, notes:'' };

export default function AdminBudgets() {
  const [data, setData] = useState([]);
  const [variance, setVariance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState('budgets');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [b, v] = await Promise.all([fetchBudgets({ status: statusFilter || undefined }), fetchBudgetVariance()]);
      setData(b.data.data || []);
      setVariance(v.data.data || []);
    } catch { setError('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'create') await createBudget(form);
      else await updateBudget(form._id, form);
      setModal(null); setForm(EMPTY); load();
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleAction = async (action, id) => {
    try {
      if (action === 'approve') await approveBudget(id);
      else if (action === 'lock') await lockBudget(id);
      else if (action === 'delete') { if (!confirm('Delete budget?')) return; await deleteBudget(id); }
      load();
    } catch (e) { alert(e.response?.data?.message || 'Action failed'); }
  };

  const filtered = data.filter(b => !search || b.budgetName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Budgets</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-4)', marginTop: 2 }}>Annual, Department & Scenario Budgets</p>
        </div>
        <button onClick={() => { setModal('create'); setForm(EMPTY); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          <FiPlus size={14} /> New Budget
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {['budgets','variance'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: tab===t ? 700 : 500, color: tab===t ? 'var(--accent)' : 'var(--text-4)', background: 'none', border: 'none', borderBottom: tab===t ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', textTransform: 'capitalize' }}>
            {t === 'budgets' ? 'Budget Register' : 'Variance Analysis'}
          </button>
        ))}
      </div>

      {tab === 'budgets' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
              <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search budgets…" style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 12.5, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '7px 12px', fontSize: 12.5, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text)' }}>
              <option value="">All Statuses</option>
              {['draft','submitted','approved','locked','revised'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 12.5, marginBottom: 8 }}>{error}</p>}
          {loading ? <p style={{ color: 'var(--text-4)', fontSize: 13 }}>Loading…</p> : (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    {['Budget','Type','Period','Department','Budget Amt','Actual','Variance%','Status','Actions'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => (
                    <tr key={b._id} style={{ borderBottom: '1px solid var(--border)', background: i%2===0 ? 'transparent' : 'var(--bg)' }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--text)' }}>{b.budgetName}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-4)', textTransform: 'capitalize' }}>{b.budgetType}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-4)' }}>{b.period || '—'}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-4)' }}>{b.department || '—'}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text)', fontWeight: 600 }}>{fmt(b.totalBudget)}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-4)' }}>{fmt(b.totalActual)}</td>
                      <td style={{ padding: '9px 12px', color: (b.variancePct||0) < 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{(b.variancePct||0).toFixed(1)}%</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${STATUS_COLOR[b.status]}20`, color: STATUS_COLOR[b.status] }}>{b.status}</span></td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {b.status === 'submitted' && <button onClick={() => handleAction('approve', b._id)} title="Approve" style={{ padding: '3px 7px', fontSize: 11, background: '#22c55e20', color: '#22c55e', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}><FiCheck size={11} /></button>}
                          {b.status === 'approved'  && <button onClick={() => handleAction('lock', b._id)} title="Lock" style={{ padding: '3px 7px', fontSize: 11, background: '#a855f720', color: '#a855f7', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}><FiLock size={11} /></button>}
                          {b.status !== 'locked' && <button onClick={() => { setModal('edit'); setForm({...b}); }} title="Edit" style={{ padding: '3px 7px', fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-4)' }}><FiEdit2 size={11} /></button>}
                          {b.status !== 'locked' && <button onClick={() => handleAction('delete', b._id)} title="Delete" style={{ padding: '3px 7px', fontSize: 11, background: '#ef444420', color: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer' }}><FiTrash2 size={11} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-4)' }}>No budgets found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'variance' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Budget','Period','Budget Amt','Actual','Variance','Variance%'].map(h => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variance.map((b, i) => (
                <tr key={b._id} style={{ borderBottom: '1px solid var(--border)', background: i%2===0?'transparent':'var(--bg)' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600 }}>{b.budgetName}</td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-4)' }}>{b.period || '—'}</td>
                  <td style={{ padding: '9px 12px' }}>{fmt(b.totalBudget)}</td>
                  <td style={{ padding: '9px 12px' }}>{fmt(b.totalActual)}</td>
                  <td style={{ padding: '9px 12px', color: (b.variance||0)<0?'#ef4444':'#22c55e', fontWeight:600 }}>{fmt(Math.abs(b.variance||0))}</td>
                  <td style={{ padding: '9px 12px', color: (b.variancePct||0)<0?'#ef4444':'#22c55e', fontWeight:700 }}>{(b.variancePct||0).toFixed(1)}%</td>
                </tr>
              ))}
              {variance.length === 0 && <tr><td colSpan={6} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No data</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:520, maxHeight:'85vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>{modal==='create'?'New Budget':'Edit Budget'}</h2>
            {[['budgetName','Budget Name','text'],['budgetType','Type','select'],['period','Period','text'],['department','Department','text'],['currency','Currency','text'],['totalBudget','Total Budget','number'],['notes','Notes','text']].map(([k,lbl,type]) => (
              <div key={k} style={{ marginBottom:10 }}>
                <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                {type==='select' ? (
                  <select value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
                    {['annual','monthly','quarterly','department','factory','warehouse','project'].map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={type} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
                )}
              </div>
            ))}
            {error && <p style={{ color:'#ef4444', fontSize:12 }}>{error}</p>}
            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <button onClick={() => { setModal(null); setError(''); }} style={{ padding:'7px 16px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', cursor:'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'7px 20px', fontSize:12.5, fontWeight:700, background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer' }}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
