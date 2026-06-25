import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchForecast as fetchForecastById, fetchForecastLines, createForecastLine, updateForecastLine, deleteForecastLine, approveForecast } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${Number(n||0).toLocaleString('en-IN')}`;
const SCENARIO_COLOR = { best_case:'#22c55e', expected:'#3b82f6', worst_case:'#ef4444' };
const LINE_CATEGORIES = ['revenue','cogs','gross_profit','opex','ebitda','depreciation','ebit','interest','tax','net_profit','capex','working_capital'];
const EMPTY_LINE = { period:'', category:'revenue', accountName:'', forecastAmount:0, actualAmount:0, notes:'' };

export default function AdminForecastDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [forecast, setForecast]   = useState(null);
  const [lines, setLines]         = useState([]);
  const [editLine, setEditLine]   = useState(null);
  const [newLine, setNewLine]     = useState(null);
  const [tab, setTab]             = useState('lines');
  const [error, setError]         = useState('');

  const load = async () => {
    try {
      const [f, l] = await Promise.all([fetchForecastById(id), fetchForecastLines(id)]);
      setForecast(f.data.data);
      setLines(l.data.data || []);
    } catch { setError('Load failed'); }
  };

  useEffect(() => { load(); }, [id]);

  const saveNewLine = async () => {
    try {
      await createForecastLine(id, newLine);
      setNewLine(null); load();
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
  };

  const saveEditLine = async () => {
    try {
      await updateForecastLine(id, editLine._id, editLine);
      setEditLine(null); load();
    } catch (e) { setError(e.response?.data?.message || 'Update failed'); }
  };

  const handleDeleteLine = async (lineId) => {
    if (!confirm('Delete forecast line?')) return;
    try { await deleteForecastLine(id, lineId); load(); } catch { alert('Delete failed'); }
  };

  const handleApprove = async () => {
    try { await approveForecast(id); load(); } catch { alert('Approve failed'); }
  };

  if (!forecast) return <div style={{ padding:'2rem', color:'var(--text-4)', fontFamily:'Poppins, sans-serif' }}>{error || 'Loading…'}</div>;

  const chartData = lines.reduce((acc, l) => {
    const existing = acc.find(a => a.period === l.period);
    if (existing) {
      existing.forecast = (existing.forecast||0) + Number(l.forecastAmount||0);
      existing.actual   = (existing.actual||0)   + Number(l.actualAmount||0);
    } else {
      acc.push({ period: l.period, forecast: Number(l.forecastAmount||0), actual: Number(l.actualAmount||0) });
    }
    return acc;
  }, []).sort((a,b) => a.period?.localeCompare(b.period));

  const scenColor = SCENARIO_COLOR[forecast.scenario] || 'var(--accent)';

  return (
    <div style={{ fontFamily:'Poppins, sans-serif' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1.5rem' }}>
        <button onClick={() => navigate('/admin/cfo/forecasts')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer', color:'var(--text-4)', fontSize:12.5 }}>
          <FiArrowLeft size={13} /> Back
        </button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text)', margin:0 }}>{forecast.forecastName}</h1>
          <p style={{ fontSize:12, color:'var(--text-4)', marginTop:2 }}>{forecast.forecastNumber} · {forecast.forecastType?.replace(/_/g,' ')}</p>
        </div>
        <span style={{ padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:700, background:`${scenColor}20`, color:scenColor }}>{forecast.scenario?.replace(/_/g,' ')}</span>
        <span style={{ padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:700, background:forecast.status==='approved'?'#22c55e20':'#6b728020', color:forecast.status==='approved'?'#22c55e':'#6b7280' }}>{forecast.status}</span>
        {forecast.status==='draft' && <button onClick={handleApprove} style={{ padding:'7px 14px', background:'#22c55e', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:12.5, cursor:'pointer' }}>Approve</button>}
      </div>
      {error && <p style={{ color:'#ef4444', fontSize:12.5, marginBottom:8 }}>{error}</p>}

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12, marginBottom:16 }}>
        {[['Total Revenue',fmt(forecast.totalRevenue),'#22c55e'],['Total Expenses',fmt(forecast.totalExpenses),'#ef4444'],['Gross Profit',fmt(forecast.grossProfit),'var(--accent)'],['Net Profit',fmt(forecast.netProfit),forecast.netProfit>=0?'#22c55e':'#ef4444'],['EBITDA',fmt(forecast.ebitda),'#D4AF37']].map(([l,v,c]) => (
          <div key={l} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'10px 14px' }}>
            <p style={{ fontSize:10.5, color:'var(--text-4)', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>{l}</p>
            <p style={{ fontSize:16, fontWeight:800, color:c }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {['lines','chart'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 16px', fontSize:12.5, fontWeight:tab===t?700:500, color:tab===t?'var(--accent)':'var(--text-4)', background:'none', border:'none', borderBottom:tab===t?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer' }}>
            {t==='lines'?'Forecast Lines':'Trend Chart'}
          </button>
        ))}
      </div>

      {tab === 'chart' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.5rem', marginBottom:16 }}>
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Forecast vs Actual by Period</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`₹${(v/1e5).toFixed(0)}L`} />
              <Tooltip formatter={v=>fmt(v)} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Line dataKey="forecast" stroke={scenColor} name="Forecast" strokeWidth={2} dot />
              <Line dataKey="actual" stroke="#a855f7" name="Actual" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'lines' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:13, fontWeight:700, margin:0 }}>Forecast Lines</h3>
            {forecast.status !== 'approved' && !newLine && (
              <button onClick={() => setNewLine({...EMPTY_LINE})} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontSize:12.5, fontWeight:700, cursor:'pointer' }}>
                <FiPlus size={12} /> Add Line
              </button>
            )}
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['Period','Category','Description','Forecast Amount','Actual Amount','Variance','Actions'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {lines.map((line, i) => (
                editLine?._id === line._id ? (
                  <tr key={line._id} style={{ background:'var(--accent)10', borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'6px 8px' }}><input value={editLine.period} onChange={e=>setEditLine(l=>({...l,period:e.target.value}))} style={{ width:90, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                    <td style={{ padding:'6px 8px' }}><select value={editLine.category} onChange={e=>setEditLine(l=>({...l,category:e.target.value}))} style={{ fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }}>{LINE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                    <td style={{ padding:'6px 8px' }}><input value={editLine.accountName} onChange={e=>setEditLine(l=>({...l,accountName:e.target.value}))} style={{ width:140, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                    <td style={{ padding:'6px 8px' }}><input type="number" value={editLine.forecastAmount} onChange={e=>setEditLine(l=>({...l,forecastAmount:e.target.value}))} style={{ width:100, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                    <td style={{ padding:'6px 8px' }}><input type="number" value={editLine.actualAmount} onChange={e=>setEditLine(l=>({...l,actualAmount:e.target.value}))} style={{ width:100, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                    <td style={{ padding:'6px 10px' }}>—</td>
                    <td style={{ padding:'6px 8px' }}><div style={{ display:'flex', gap:4 }}><button onClick={saveEditLine} style={{ padding:'3px 8px', background:'#22c55e', color:'#fff', border:'none', borderRadius:3, cursor:'pointer', fontSize:11, fontWeight:700 }}>Save</button><button onClick={() => setEditLine(null)} style={{ padding:'3px 8px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:3, cursor:'pointer', fontSize:11 }}>×</button></div></td>
                  </tr>
                ) : (
                  <tr key={line._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                    <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{line.period}</td>
                    <td style={{ padding:'9px 12px', textTransform:'capitalize' }}>{line.category?.replace(/_/g,' ')}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>{line.accountName||'—'}</td>
                    <td style={{ padding:'9px 12px', color:scenColor, fontWeight:600 }}>{fmt(line.forecastAmount)}</td>
                    <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{fmt(line.actualAmount)}</td>
                    <td style={{ padding:'9px 12px', color:(line.forecastAmount-line.actualAmount)>=0?'#22c55e':'#ef4444', fontWeight:700 }}>{fmt(Math.abs((line.forecastAmount||0)-(line.actualAmount||0)))}</td>
                    <td style={{ padding:'9px 12px' }}>
                      {forecast.status !== 'approved' && <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => setEditLine({...line})} style={{ padding:'3px 7px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text-4)' }}>✏</button>
                        <button onClick={() => handleDeleteLine(line._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button>
                      </div>}
                    </td>
                  </tr>
                )
              ))}
              {/* New Line Form */}
              {newLine && (
                <tr style={{ background:'#22c55e10', borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'6px 8px' }}><input value={newLine.period} onChange={e=>setNewLine(l=>({...l,period:e.target.value}))} placeholder="2025-06" style={{ width:90, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                  <td style={{ padding:'6px 8px' }}><select value={newLine.category} onChange={e=>setNewLine(l=>({...l,category:e.target.value}))} style={{ fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }}>{LINE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                  <td style={{ padding:'6px 8px' }}><input value={newLine.accountName} onChange={e=>setNewLine(l=>({...l,accountName:e.target.value}))} placeholder="Account Name" style={{ width:140, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                  <td style={{ padding:'6px 8px' }}><input type="number" value={newLine.forecastAmount} onChange={e=>setNewLine(l=>({...l,forecastAmount:e.target.value}))} style={{ width:100, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                  <td style={{ padding:'6px 8px' }}><input type="number" value={newLine.actualAmount} onChange={e=>setNewLine(l=>({...l,actualAmount:e.target.value}))} style={{ width:100, fontSize:11, border:'1px solid var(--border)', borderRadius:3, background:'var(--bg)', color:'var(--text)', padding:'3px 6px' }} /></td>
                  <td style={{ padding:'6px 10px' }}>—</td>
                  <td style={{ padding:'6px 8px' }}><div style={{ display:'flex', gap:4 }}><button onClick={saveNewLine} style={{ padding:'3px 8px', background:'#22c55e', color:'#fff', border:'none', borderRadius:3, cursor:'pointer', fontSize:11, fontWeight:700 }}>Add</button><button onClick={() => setNewLine(null)} style={{ padding:'3px 8px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:3, cursor:'pointer', fontSize:11 }}>×</button></div></td>
                </tr>
              )}
              {lines.length===0 && !newLine && <tr><td colSpan={7} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No forecast lines</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
