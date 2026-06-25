import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchVarianceAnalyses, createVarianceAnalysis, updateVarianceAnalysis, deleteVarianceAnalysis } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${Number(n||0).toLocaleString('en-IN')}`;
const pct = (n) => `${Number(n||0).toFixed(1)}%`;
const varColor = (v) => Number(v||0) >= 0 ? '#22c55e' : '#ef4444';
const STATUS_COLOR = { favorable:'#22c55e', unfavorable:'#ef4444', on_track:'#3b82f6' };
const ANALYSIS_TYPES = ['budget_vs_actual','forecast_vs_actual','period_vs_period','yoy'];
const EMPTY = { analysisType:'budget_vs_actual', period:'', actualRevenue:0, budgetRevenue:0, actualExpenses:0, budgetExpenses:0, actualNetProfit:0, budgetNetProfit:0, notes:'' };

export default function AdminVarianceAnalysis() {
  const [data, setData]   = useState([]);
  const [tab, setTab]     = useState('table');
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { const r = await fetchVarianceAnalyses({ analysisType: typeFilter||undefined }); setData(r.data.data || []); }
    catch { setError('Load failed'); }
  };

  useEffect(() => { load(); }, [typeFilter]);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'create') await createVarianceAnalysis(form);
      else await updateVarianceAnalysis(form._id, form);
      setModal(null); setForm(EMPTY); load();
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete variance analysis?')) return;
    try { await deleteVarianceAnalysis(id); load(); } catch { alert('Delete failed'); }
  };

  const chartData = data.map(d => ({
    name: d.department || d.period || '—',
    revenueVariancePct: d.revenueVariancePct || 0,
    expenseVariancePct: d.expenseVariancePct || 0,
    netProfitVariancePct: d.netProfitVariancePct || 0,
  }));

  return (
    <div style={{ fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:0 }}>Variance Analysis</h1>
          <p style={{ fontSize:12.5, color:'var(--text-4)', marginTop:2 }}>Budget vs Actual, Forecast vs Actual, Year-over-Year</p>
        </div>
        <button onClick={() => { setModal('create'); setForm(EMPTY); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          <FiPlus size={14} /> New Analysis
        </button>
      </div>
      {error && <p style={{ color:'#ef4444', fontSize:12.5, marginBottom:8 }}>{error}</p>}

      <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ padding:'7px 12px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
          <option value="">All Types</option>
          {ANALYSIS_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {['table','chart'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 16px', fontSize:12.5, fontWeight:tab===t?700:500, color:tab===t?'var(--accent)':'var(--text-4)', background:'none', border:'none', borderBottom:tab===t?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer', textTransform:'capitalize' }}>
            {t==='table'?'Variance Table':'Variance Chart'}
          </button>
        ))}
      </div>

      {tab === 'table' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['Analysis','Type','Period','Rev Actual','Rev Budget','Rev Var%','Exp Var%','NP Var%','Status','Actions'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                  <td style={{ padding:'9px 12px', fontWeight:600 }}>{d.department||d.analysisNumber||'—'}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)', textTransform:'capitalize' }}>{d.analysisType?.replace(/_/g,' ')}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{d.period}</td>
                  <td style={{ padding:'9px 12px' }}>{fmt(d.actualRevenue)}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{fmt(d.budgetRevenue)}</td>
                  <td style={{ padding:'9px 12px', color:varColor(d.revenueVariancePct), fontWeight:700 }}>{pct(d.revenueVariancePct)}</td>
                  <td style={{ padding:'9px 12px', color:varColor(-d.expenseVariancePct), fontWeight:700 }}>{pct(d.expenseVariancePct)}</td>
                  <td style={{ padding:'9px 12px', color:varColor(d.netProfitVariancePct), fontWeight:700 }}>{pct(d.netProfitVariancePct)}</td>
                  <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:`${STATUS_COLOR[d.overallStatus]||'#6b728020'}20`, color:STATUS_COLOR[d.overallStatus]||'#6b7280' }}>{d.overallStatus}</span></td>
                  <td style={{ padding:'9px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => { setModal('edit'); setForm({...d}); }} style={{ padding:'3px 7px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text-4)' }}><FiEdit2 size={11} /></button>
                      <button onClick={() => handleDelete(d._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length===0 && <tr><td colSpan={10} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No variance analyses</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'chart' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.5rem' }}>
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Variance % by Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:10 }} unit="%" />
              <Tooltip formatter={v => `${Number(v||0).toFixed(1)}%`} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="revenueVariancePct" fill="#22c55e" name="Revenue Var%" radius={[3,3,0,0]} />
              <Bar dataKey="expenseVariancePct" fill="#ef4444" name="Expense Var%" radius={[3,3,0,0]} />
              <Bar dataKey="netProfitVariancePct" fill="var(--accent)" name="Net Profit Var%" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:540, maxHeight:'85vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>{modal==='create'?'New Variance Analysis':'Edit Analysis'}</h2>
            <div style={{ marginBottom:10 }}>
              <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>Analysis Type</label>
              <select value={form.analysisType||''} onChange={e=>setForm(f=>({...f,analysisType:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
                {ANALYSIS_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['department','Department'],['period','Period'],['actualRevenue','Revenue Actual'],['budgetRevenue','Revenue Budget'],['actualExpenses','Expense Actual'],['budgetExpenses','Expense Budget'],['actualNetProfit','Net Profit Actual'],['budgetNetProfit','Net Profit Budget']].map(([k,lbl]) => (
                <div key={k}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                  <input type={['actualRevenue','budgetRevenue','actualExpenses','budgetExpenses','actualNetProfit','budgetNetProfit'].includes(k)?'number':'text'} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'6px 9px', fontSize:12, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop:10 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>Notes</label>
              <input value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{ width:'100%', padding:'6px 9px', fontSize:12, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
            </div>
            {error && <p style={{ color:'#ef4444', fontSize:12, marginTop:8 }}>{error}</p>}
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
