import React, { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiZap } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchKPIs, calculateKPIs, deleteKPI, fetchKPITrendData, fetchKPIThresholds, createKPIThreshold, deleteKPIThreshold } from '../../services/cfoAPI';

const pct = (n) => `${Number(n||0).toFixed(2)}%`;
const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : `₹${Number(n||0).toLocaleString('en-IN')}`;

const MetricCard = ({ label, value, unit='', color='var(--text)' }) => (
  <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 14px' }}>
    <p style={{ fontSize:10.5, color:'var(--text-4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{label}</p>
    <p style={{ fontSize:18, fontWeight:800, color }}>{value}{unit}</p>
  </div>
);

export default function AdminFinancialKPIs() {
  const [kpis, setKpis]         = useState([]);
  const [trend, setTrend]       = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [latest, setLatest]     = useState(null);
  const [tab, setTab]           = useState('kpis');
  const [period, setPeriod]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [calculating, setCalc]  = useState(false);
  const [thForm, setThForm]     = useState({ kpiName:'', metric:'', unit:'%', warningMin:'', warningMax:'', criticalMin:'', criticalMax:'' });
  const [thModal, setThModal]   = useState(false);
  const [error, setError]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [k, t, th] = await Promise.all([fetchKPIs(), fetchKPITrendData(), fetchKPIThresholds()]);
      const rows = k.data.data || [];
      setKpis(rows);
      setLatest(rows[0] || null);
      setTrend(t.data.data || []);
      setThresholds(th.data.data || []);
    } catch { setError('Failed to load KPIs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCalculate = async () => {
    if (!period) return alert('Enter a period (e.g. 2025-06)');
    setCalc(true);
    try { await calculateKPIs({ period }); load(); } catch (e) { alert(e.response?.data?.message || 'Calculation failed'); }
    finally { setCalc(false); }
  };

  const handleDeleteKPI = async (id) => {
    if (!confirm('Delete KPI record?')) return;
    try { await deleteKPI(id); load(); } catch { alert('Delete failed'); }
  };

  const saveThreshold = async () => {
    try { await createKPIThreshold(thForm); setThModal(false); setThForm({ kpiName:'', metric:'', unit:'%', warningMin:'', warningMax:'', criticalMin:'', criticalMax:'' }); load(); } catch { alert('Save failed'); }
  };

  const deleteThresh = async (id) => {
    if (!confirm('Delete threshold?')) return;
    try { await deleteKPIThreshold(id); load(); } catch { alert('Delete failed'); }
  };

  if (loading) return <div style={{ padding:'2rem', color:'var(--text-4)' }}>Loading KPIs…</div>;

  return (
    <div style={{ fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:0 }}>Financial KPIs</h1>
          <p style={{ fontSize:12.5, color:'var(--text-4)', marginTop:2 }}>Revenue, Profitability, Liquidity & Efficiency Metrics</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="Period e.g. 2025-06" style={{ padding:'7px 12px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)', width:160 }} />
          <button onClick={handleCalculate} disabled={calculating} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            <FiZap size={14} />{calculating?'Calculating…':'Calculate KPIs'}
          </button>
        </div>
      </div>

      {/* Latest KPI Snapshot */}
      {latest && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.25rem', marginBottom:16 }}>
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12, color:'var(--text)' }}>Latest KPI Snapshot — {latest.period}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8, marginBottom:8 }}>
            <MetricCard label="Revenue"       value={fmt(latest.revenue)} color="#22c55e" />
            <MetricCard label="Gross Profit"  value={fmt(latest.grossProfit)} color="#22c55e" />
            <MetricCard label="Net Profit"    value={fmt(latest.netProfit)} color="var(--accent)" />
            <MetricCard label="EBIT"          value={fmt(latest.ebit)} color="var(--accent)" />
            <MetricCard label="EBITDA"        value={fmt(latest.ebitda)} color="#D4AF37" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8, marginBottom:8 }}>
            <MetricCard label="Gross Margin"  value={pct(latest.grossMargin)} color="#22c55e" />
            <MetricCard label="Op. Margin"    value={pct(latest.operatingMargin)} color="var(--accent)" />
            <MetricCard label="Net Margin"    value={pct(latest.netMargin)} color="#3b82f6" />
            <MetricCard label="ROA"           value={pct(latest.roa)} color="#a855f7" />
            <MetricCard label="ROE"           value={pct(latest.roe)} color="#a855f7" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
            <MetricCard label="Current Ratio" value={`${Number(latest.currentRatio||0).toFixed(2)}x`} color="var(--text)" />
            <MetricCard label="Quick Ratio"   value={`${Number(latest.quickRatio||0).toFixed(2)}x`} color="var(--text)" />
            <MetricCard label="DSO"           value={`${Number(latest.dso||0).toFixed(0)} days`} color="#f97316" />
            <MetricCard label="DPO"           value={`${Number(latest.dpo||0).toFixed(0)} days`} color="#f97316" />
            <MetricCard label="Inv. Turnover" value={`${Number(latest.inventoryTurnover||0).toFixed(1)}x`} color="var(--text)" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {['kpis','trend','thresholds'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 16px', fontSize:12.5, fontWeight:tab===t?700:500, color:tab===t?'var(--accent)':'var(--text-4)', background:'none', border:'none', borderBottom:tab===t?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer', textTransform:'capitalize' }}>
            {t==='kpis'?'History':t==='trend'?'KPI Trend':'Thresholds'}
          </button>
        ))}
      </div>

      {tab === 'kpis' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['Period','Revenue','Gross Margin','Net Margin','EBITDA','Current Ratio','DSO','ROE','Actions'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {kpis.map((k, i) => (
                <tr key={k._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                  <td style={{ padding:'9px 12px', fontWeight:600 }}>{k.period}</td>
                  <td style={{ padding:'9px 12px', color:'#22c55e', fontWeight:600 }}>{fmt(k.revenue)}</td>
                  <td style={{ padding:'9px 12px' }}>{pct(k.grossMargin)}</td>
                  <td style={{ padding:'9px 12px' }}>{pct(k.netMargin)}</td>
                  <td style={{ padding:'9px 12px' }}>{fmt(k.ebitda)}</td>
                  <td style={{ padding:'9px 12px' }}>{Number(k.currentRatio||0).toFixed(2)}x</td>
                  <td style={{ padding:'9px 12px' }}>{Number(k.dso||0).toFixed(0)} days</td>
                  <td style={{ padding:'9px 12px' }}>{pct(k.roe)}</td>
                  <td style={{ padding:'9px 12px' }}><button onClick={() => handleDeleteKPI(k._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button></td>
                </tr>
              ))}
              {kpis.length===0 && <tr><td colSpan={9} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No KPI records. Calculate to generate.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'trend' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.5rem' }}>
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Margin Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:10 }} unit="%" />
              <Tooltip formatter={v => `${Number(v||0).toFixed(2)}%`} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Line dataKey="grossMargin" stroke="#22c55e" name="Gross Margin" strokeWidth={2} dot={false} />
              <Line dataKey="operatingMargin" stroke="var(--accent)" name="Op. Margin" strokeWidth={2} dot={false} />
              <Line dataKey="netMargin" stroke="#3b82f6" name="Net Margin" strokeWidth={2} dot={false} />
              <Line dataKey="roa" stroke="#a855f7" name="ROA" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'thresholds' && (
        <>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button onClick={() => setThModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
              <FiPlus size={14} /> Add Threshold
            </button>
          </div>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
              <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
                {['KPI Name','Metric','Unit','Warning Min','Warning Max','Critical Min','Critical Max','Actions'].map(h=>(
                  <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {thresholds.map((t, i) => (
                  <tr key={t._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>{t.kpiName}</td>
                    <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{t.metric}</td>
                    <td style={{ padding:'9px 12px' }}>{t.unit}</td>
                    <td style={{ padding:'9px 12px', color:'#eab308' }}>{t.warningMin ?? '—'}</td>
                    <td style={{ padding:'9px 12px', color:'#eab308' }}>{t.warningMax ?? '—'}</td>
                    <td style={{ padding:'9px 12px', color:'#ef4444' }}>{t.criticalMin ?? '—'}</td>
                    <td style={{ padding:'9px 12px', color:'#ef4444' }}>{t.criticalMax ?? '—'}</td>
                    <td style={{ padding:'9px 12px' }}><button onClick={() => deleteThresh(t._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button></td>
                  </tr>
                ))}
                {thresholds.length===0 && <tr><td colSpan={8} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No thresholds</td></tr>}
              </tbody>
            </table>
          </div>
          {thModal && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
              <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:440 }}>
                <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>Add KPI Threshold</h2>
                {[['kpiName','KPI Name'],['metric','Metric Key'],['unit','Unit'],['warningMin','Warning Min'],['warningMax','Warning Max'],['criticalMin','Critical Min'],['criticalMax','Critical Max']].map(([k,lbl]) => (
                  <div key={k} style={{ marginBottom:10 }}>
                    <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                    <input value={thForm[k]||''} onChange={e=>setThForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
                  </div>
                ))}
                <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
                  <button onClick={() => setThModal(false)} style={{ padding:'7px 16px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', cursor:'pointer' }}>Cancel</button>
                  <button onClick={saveThreshold} style={{ padding:'7px 20px', fontSize:12.5, fontWeight:700, background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer' }}>Save</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
