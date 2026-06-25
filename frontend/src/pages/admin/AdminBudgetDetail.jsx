import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import { fetchBudget as fetchBudgetById, fetchBudgetLines, createBudgetLine, updateBudgetLine, deleteBudgetLine, approveBudget, lockBudget } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${Number(n||0).toLocaleString('en-IN')}`;
const STATUS_COLOR = { draft:'#6b7280', submitted:'#3b82f6', approved:'#22c55e', locked:'#a855f7', revised:'#f97316' };
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const EMPTY_LINE = { accountCode:'', accountName:'', category:'revenue', janBudget:0, febBudget:0, marBudget:0, aprBudget:0, mayBudget:0, junBudget:0, julBudget:0, augBudget:0, sepBudget:0, octBudget:0, novBudget:0, decBudget:0 };

export default function AdminBudgetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget]   = useState(null);
  const [lines, setLines]     = useState([]);
  const [editLine, setEditLine] = useState(null);
  const [newLine, setNewLine]   = useState(null);
  const [error, setError]       = useState('');

  const load = async () => {
    try {
      const [b, l] = await Promise.all([fetchBudgetById(id), fetchBudgetLines(id)]);
      setBudget(b.data.data);
      setLines(l.data.data || []);
    } catch { setError('Load failed'); }
  };

  useEffect(() => { load(); }, [id]);

  const saveNewLine = async () => {
    try {
      await createBudgetLine(id, newLine);
      setNewLine(null); load();
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
  };

  const saveEditLine = async () => {
    try {
      await updateBudgetLine(id, editLine._id, editLine);
      setEditLine(null); load();
    } catch (e) { setError(e.response?.data?.message || 'Update failed'); }
  };

  const handleDeleteLine = async (lineId) => {
    if (!confirm('Delete line?')) return;
    try { await deleteBudgetLine(id, lineId); load(); } catch { alert('Delete failed'); }
  };

  const handleApprove = async () => {
    try { await approveBudget(id); load(); } catch { alert('Approve failed'); }
  };

  const handleLock = async () => {
    try { await lockBudget(id); load(); } catch { alert('Lock failed'); }
  };

  if (!budget) return <div style={{ padding:'2rem', color:'var(--text-4)', fontFamily:'Poppins, sans-serif' }}>{error || 'Loading…'}</div>;

  const budgetTotal = (line) => MONTHS.reduce((s,m) => s + Number(line[`${m}Budget`]||0), 0);

  return (
    <div style={{ fontFamily:'Poppins, sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.5rem' }}>
        <button onClick={() => navigate('/admin/cfo/budgets')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer', color:'var(--text-4)', fontSize:12.5 }}>
          <FiArrowLeft size={13} /> Back
        </button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text)', margin:0 }}>{budget.budgetName}</h1>
          <p style={{ fontSize:12, color:'var(--text-4)', marginTop:2 }}>{budget.budgetNumber} · {budget.budgetType} · {budget.period||'—'}</p>
        </div>
        <span style={{ padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:700, background:`${STATUS_COLOR[budget.status]||'#6b7280'}20`, color:STATUS_COLOR[budget.status]||'#6b7280' }}>{budget.status}</span>
        {budget.status==='submitted' && <button onClick={handleApprove} style={{ padding:'7px 14px', background:'#22c55e', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:12.5, cursor:'pointer' }}>Approve</button>}
        {budget.status==='approved' && <button onClick={handleLock} style={{ padding:'7px 14px', background:'#a855f7', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:12.5, cursor:'pointer' }}>Lock</button>}
      </div>
      {error && <p style={{ color:'#ef4444', fontSize:12.5, marginBottom:8 }}>{error}</p>}

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16 }}>
        {[['Total Budget',fmt(budget.totalBudget),'var(--text)'],['Actual',fmt(budget.totalActual),'var(--text-4)'],['Variance',fmt(Math.abs(budget.variance||0)),budget.variance>=0?'#22c55e':'#ef4444'],['Variance%',`${(budget.variancePct||0).toFixed(1)}%`,budget.variancePct>=0?'#22c55e':'#ef4444']].map(([l,v,c]) => (
          <div key={l} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'10px 14px' }}>
            <p style={{ fontSize:10.5, color:'var(--text-4)', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>{l}</p>
            <p style={{ fontSize:18, fontWeight:800, color:c }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Budget Lines */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:13, fontWeight:700, margin:0 }}>Budget Lines</h3>
          {budget.status !== 'locked' && !newLine && (
            <button onClick={() => setNewLine({...EMPTY_LINE})} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontSize:12.5, fontWeight:700, cursor:'pointer' }}>
              <FiPlus size={12} /> Add Line
            </button>
          )}
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['Category','Account','Name',...MONTH_LABELS,'Annual Total','Actions'].map(h=>(
                <th key={h} style={{ padding:'7px 10px', textAlign:['Category','Account','Name'].includes(h)?'left':'right', fontWeight:700, fontSize:10, color:'var(--text-4)', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {lines.map((line, i) => (
                editLine?._id === line._id ? (
                  <tr key={line._id} style={{ background:'var(--accent)10', borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'6px 8px' }}><select value={editLine.category} onChange={e=>setEditLine(l=>({...l,category:e.target.value}))} style={{ fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }}>{['revenue','cogs','gross_profit','opex','ebitda','depreciation','ebit','interest','tax','net_profit'].map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                    <td style={{ padding:'6px 8px' }}><input value={editLine.accountCode} onChange={e=>setEditLine(l=>({...l,accountCode:e.target.value}))} style={{ width:70, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                    <td style={{ padding:'6px 8px' }}><input value={editLine.accountName} onChange={e=>setEditLine(l=>({...l,accountName:e.target.value}))} style={{ width:120, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                    {MONTHS.map(m => <td key={m} style={{ padding:'4px 6px' }}><input type="number" value={editLine[`${m}Budget`]||0} onChange={e=>setEditLine(l=>({...l,[`${m}Budget`]:e.target.value}))} style={{ width:72, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px', textAlign:'right' }} /></td>)}
                    <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:700 }}>{fmt(budgetTotal(editLine))}</td>
                    <td style={{ padding:'6px 8px' }}><div style={{ display:'flex', gap:4 }}><button onClick={saveEditLine} style={{ padding:'3px 8px', background:'#22c55e', color:'#fff', border:'none', borderRadius:3, cursor:'pointer', fontSize:11, fontWeight:700 }}>Save</button><button onClick={() => setEditLine(null)} style={{ padding:'3px 8px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:3, cursor:'pointer', fontSize:11 }}>×</button></div></td>
                  </tr>
                ) : (
                  <tr key={line._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                    <td style={{ padding:'6px 10px', textTransform:'capitalize' }}>{line.category?.replace(/_/g,' ')}</td>
                    <td style={{ padding:'6px 10px', color:'var(--text-4)' }}>{line.accountCode}</td>
                    <td style={{ padding:'6px 10px', fontWeight:600 }}>{line.accountName}</td>
                    {MONTHS.map(m => <td key={m} style={{ padding:'6px 10px', textAlign:'right', color:'var(--text-4)' }}>{fmt(line[`${m}Budget`]||0)}</td>)}
                    <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:700, color:'var(--accent)' }}>{fmt(budgetTotal(line))}</td>
                    <td style={{ padding:'6px 8px' }}>
                      {budget.status !== 'locked' && <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => setEditLine({...line})} style={{ padding:'3px 7px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:3, cursor:'pointer', color:'var(--text-4)' }}>✏</button>
                        <button onClick={() => handleDeleteLine(line._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:3, cursor:'pointer' }}><FiTrash2 size={10} /></button>
                      </div>}
                    </td>
                  </tr>
                )
              ))}
              {/* New Line Form */}
              {newLine && (
                <tr style={{ background:'#22c55e10', borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'6px 8px' }}><select value={newLine.category} onChange={e=>setNewLine(l=>({...l,category:e.target.value}))} style={{ fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }}>{['revenue','cogs','gross_profit','opex','ebitda','depreciation','ebit','interest','tax','net_profit'].map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                  <td style={{ padding:'6px 8px' }}><input value={newLine.accountCode} onChange={e=>setNewLine(l=>({...l,accountCode:e.target.value}))} placeholder="Code" style={{ width:70, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                  <td style={{ padding:'6px 8px' }}><input value={newLine.accountName} onChange={e=>setNewLine(l=>({...l,accountName:e.target.value}))} placeholder="Account Name" style={{ width:120, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                  {MONTHS.map(m => <td key={m} style={{ padding:'4px 6px' }}><input type="number" value={newLine[`${m}Budget`]||0} onChange={e=>setNewLine(l=>({...l,[`${m}Budget`]:e.target.value}))} style={{ width:72, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px', textAlign:'right' }} /></td>)}
                  <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:700, color:'#22c55e' }}>{fmt(budgetTotal(newLine))}</td>
                  <td style={{ padding:'6px 8px' }}><div style={{ display:'flex', gap:4 }}><button onClick={saveNewLine} style={{ padding:'3px 8px', background:'#22c55e', color:'#fff', border:'none', borderRadius:3, cursor:'pointer', fontSize:11, fontWeight:700 }}>Add</button><button onClick={() => setNewLine(null)} style={{ padding:'3px 8px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:3, cursor:'pointer', fontSize:11 }}>×</button></div></td>
                </tr>
              )}
              {lines.length===0 && !newLine && <tr><td colSpan={16} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No budget lines. Add a line to start.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
