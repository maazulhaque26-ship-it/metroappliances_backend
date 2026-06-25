import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchCashFlowStatements, createCashFlowStatement, updateCashFlowStatement, deleteCashFlowStatement, finalizeCashFlowStatement, fetchCashPosition, fetchLiquidityPosition, fetchFreeCashFlow } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : `₹${Number(n||0).toLocaleString('en-IN')}`;

const EMPTY = { period:'', openingCash:0, netIncome:0, depreciation:0, amortization:0, receivablesChange:0, inventoryChange:0, payablesChange:0, otherWorkingCapital:0, capex:0, assetSales:0, investments:0, debtBorrowed:0, debtRepaid:0, equityRaised:0, dividendsPaid:0, notes:'' };

export default function AdminCashFlowDashboard() {
  const [statements, setStatements] = useState([]);
  const [cashPos, setCashPos]       = useState(null);
  const [liquidity, setLiquidity]   = useState(null);
  const [fcf, setFcf]               = useState([]);
  const [tab, setTab]               = useState('statements');
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const load = async () => {
    try {
      const [s, c, l, f] = await Promise.all([fetchCashFlowStatements(), fetchCashPosition(), fetchLiquidityPosition(), fetchFreeCashFlow()]);
      setStatements(s.data.data || []);
      setCashPos(c.data.data);
      setLiquidity(l.data.data);
      setFcf(f.data.data || []);
    } catch { setError('Load failed'); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'create') await createCashFlowStatement(form);
      else await updateCashFlowStatement(form._id, form);
      setModal(null); setForm(EMPTY); load();
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleFinalize = async (id) => {
    try { await finalizeCashFlowStatement(id); load(); } catch { alert('Finalize failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await deleteCashFlowStatement(id); load(); } catch { alert('Delete failed'); }
  };

  return (
    <div style={{ fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:0 }}>Cash Flow</h1>
          <p style={{ fontSize:12.5, color:'var(--text-4)', marginTop:2 }}>Operating, Investing & Financing Activities</p>
        </div>
        <button onClick={() => { setModal('create'); setForm(EMPTY); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          <FiPlus size={14} /> New Statement
        </button>
      </div>

      {/* Cash Position Cards */}
      {cashPos && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16 }}>
          {[['Total Cash',fmt(cashPos.totalCash),'#22c55e'], ['Accounts',cashPos.accounts?.length||0,'#3b82f6'], ['Currencies',Object.keys(cashPos.byCurrency||{}).length,'var(--accent)'], ['Liquidity',fmt(liquidity?.cashPosition?.[0]?.total||0),'#a855f7']].map(([l,v,c]) => (
            <div key={l} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1rem 1.25rem' }}>
              <p style={{ fontSize:11, color:'var(--text-4)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>{l}</p>
              <p style={{ fontSize:20, fontWeight:800, color:c }}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {['statements','fcf','liquidity'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 16px', fontSize:12.5, fontWeight:tab===t?700:500, color:tab===t?'var(--accent)':'var(--text-4)', background:'none', border:'none', borderBottom:tab===t?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer' }}>
            {t==='statements'?'Statements':t==='fcf'?'Free Cash Flow':'Liquidity Trend'}
          </button>
        ))}
      </div>

      {tab === 'statements' && (
        <>
          {error && <p style={{ color:'#ef4444', fontSize:12.5 }}>{error}</p>}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
              <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
                {['#','Period','Operating','Investing','Financing','Net Cash Flow','Closing Cash','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {statements.map((s, i) => (
                  <tr key={s._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                    <td style={{ padding:'9px 12px', color:'var(--text-4)', fontSize:11 }}>{s.statementNumber}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>{s.period}</td>
                    <td style={{ padding:'9px 12px', color:s.operatingActivities>=0?'#22c55e':'#ef4444', fontWeight:600 }}>{fmt(s.operatingActivities)}</td>
                    <td style={{ padding:'9px 12px', color:s.investingActivities>=0?'#22c55e':'#ef4444' }}>{fmt(s.investingActivities)}</td>
                    <td style={{ padding:'9px 12px', color:s.financingActivities>=0?'#22c55e':'#ef4444' }}>{fmt(s.financingActivities)}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700, color:s.netCashFlow>=0?'#22c55e':'#ef4444' }}>{fmt(s.netCashFlow)}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>{fmt(s.closingCash)}</td>
                    <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:s.status==='final'?'#22c55e20':'#6b728020', color:s.status==='final'?'#22c55e':'#6b7280' }}>{s.status}</span></td>
                    <td style={{ padding:'9px 12px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        {s.status !== 'final' && <button onClick={() => handleFinalize(s._id)} title="Finalize" style={{ padding:'3px 7px', fontSize:11, background:'#22c55e20', color:'#22c55e', border:'none', borderRadius:4, cursor:'pointer' }}><FiCheck size={11} /></button>}
                        {s.status !== 'final' && <button onClick={() => { setModal('edit'); setForm({...s}); }} style={{ padding:'3px 7px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text-4)' }}><FiEdit2 size={11} /></button>}
                        <button onClick={() => handleDelete(s._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {statements.length===0 && <tr><td colSpan={9} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No statements</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'fcf' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.5rem' }}>
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Free Cash Flow Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fcf}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:10 }} tickFormatter={v => `₹${(v/1e5).toFixed(0)}L`} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="operatingActivities" fill="#22c55e" name="Operating" radius={[3,3,0,0]} />
              <Bar dataKey="freeCashFlow" fill="var(--accent)" name="Free CF" radius={[3,3,0,0]} />
              <Bar dataKey="netCashFlow" fill="#3b82f6" name="Net CF" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'liquidity' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.5rem' }}>
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Liquidity Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={liquidity?.trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:10 }} tickFormatter={v => `₹${(v/1e5).toFixed(0)}L`} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Line dataKey="closingCash" stroke="#22c55e" name="Closing Cash" strokeWidth={2} dot />
              <Line dataKey="netCashFlow" stroke="var(--accent)" name="Net CF" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:540, maxHeight:'85vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>{modal==='create'?'New Cash Flow Statement':'Edit Statement'}</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {Object.keys(EMPTY).filter(k=>k!=='notes').map(k => (
                <div key={k}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-4)', marginBottom:4, textTransform:'capitalize' }}>{k.replace(/([A-Z])/g,' $1').trim()}</label>
                  <input type={k==='period'?'text':'number'} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'6px 9px', fontSize:12, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
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
