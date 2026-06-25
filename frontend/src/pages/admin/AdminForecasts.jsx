import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchForecasts, createForecast, updateForecast, deleteForecast, approveForecast, fetchForecastVariance } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${Number(n||0).toLocaleString('en-IN')}`;
const SCENARIO_COLOR = { best_case:'#22c55e', expected:'#3b82f6', worst_case:'#ef4444' };
const EMPTY = { forecastName:'', forecastType:'rolling_12', scenario:'expected', startDate:'', currency:'INR', totalRevenue:0, totalExpenses:0, notes:'' };

export default function AdminForecasts() {
  const [data, setData]  = useState([]);
  const [variance, setVariance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]    = useState('list');
  const [modal, setModal] = useState(null);
  const [form, setForm]  = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [f, v] = await Promise.all([fetchForecasts(), fetchForecastVariance()]);
      setData(f.data.data || []);
      setVariance(v.data.data || []);
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'create') await createForecast(form);
      else await updateForecast(form._id, form);
      setModal(null); setForm(EMPTY); load();
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete forecast?')) return;
    try { await deleteForecast(id); load(); } catch { alert('Delete failed'); }
  };

  const handleApprove = async (id) => {
    try { await approveForecast(id); load(); } catch { alert('Approve failed'); }
  };

  const filtered = data.filter(f => !search || f.forecastName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Financial Forecasts</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-4)', marginTop: 2 }}>Rolling 12-Month & Scenario Planning</p>
        </div>
        <button onClick={() => { setModal('create'); setForm(EMPTY); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          <FiPlus size={14} /> New Forecast
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {['list','chart'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: tab===t?700:500, color: tab===t?'var(--accent)':'var(--text-4)', background: 'none', border: 'none', borderBottom: tab===t?'2px solid var(--accent)':'2px solid transparent', cursor: 'pointer', textTransform: 'capitalize' }}>
            {t === 'list' ? 'Forecast Register' : 'Forecast Trend'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
              <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search forecasts…" style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 12.5, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 12.5 }}>{error}</p>}
          {loading ? <p style={{ color: 'var(--text-4)' }}>Loading…</p> : (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    {['Forecast','Type','Scenario','Revenue','Expenses','Net Profit','Status','Actions'].map(h=>(
                      <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, i) => (
                    <tr key={f._id} style={{ borderBottom: '1px solid var(--border)', background: i%2===0?'transparent':'var(--bg)' }}>
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--text)' }}>{f.forecastName}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-4)', textTransform: 'capitalize' }}>{f.forecastType?.replace(/_/g,' ')}</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${SCENARIO_COLOR[f.scenario]}20`, color: SCENARIO_COLOR[f.scenario] }}>{f.scenario?.replace(/_/g,' ')}</span></td>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{fmt(f.totalRevenue)}</td>
                      <td style={{ padding: '9px 12px', color: '#ef4444' }}>{fmt(f.totalExpenses)}</td>
                      <td style={{ padding: '9px 12px', color: f.netProfit>=0?'#22c55e':'#ef4444', fontWeight: 600 }}>{fmt(f.netProfit)}</td>
                      <td style={{ padding: '9px 12px' }}><span style={{ padding: '2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background: f.status==='approved'?'#22c55e20':'#6b728020', color: f.status==='approved'?'#22c55e':'#6b7280' }}>{f.status}</span></td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {f.status === 'draft' && <button onClick={() => handleApprove(f._id)} title="Approve" style={{ padding:'3px 7px', fontSize:11, background:'#22c55e20', color:'#22c55e', border:'none', borderRadius:4, cursor:'pointer' }}><FiCheck size={11} /></button>}
                          <button onClick={() => { setModal('edit'); setForm({...f, startDate: f.startDate?.slice(0,10)||''}); }} style={{ padding:'3px 7px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text-4)' }}><FiEdit2 size={11} /></button>
                          <button onClick={() => handleDelete(f._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={8} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No forecasts found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'chart' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Forecast vs Actual Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={variance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="forecastName" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1e5).toFixed(0)}L`} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="totalRevenue" stroke="#22c55e" name="Revenue" strokeWidth={2} dot={false} />
              <Line dataKey="grossProfit" stroke="var(--accent)" name="Gross Profit" strokeWidth={2} dot={false} />
              <Line dataKey="netProfit" stroke="#3b82f6" name="Net Profit" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:480, maxHeight:'85vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>{modal==='create'?'New Forecast':'Edit Forecast'}</h2>
            {[['forecastName','Forecast Name'],['forecastType','Type'],['scenario','Scenario'],['startDate','Start Date (YYYY-MM-DD)'],['currency','Currency'],['totalRevenue','Total Revenue'],['totalExpenses','Total Expenses'],['notes','Notes']].map(([k,lbl]) => (
              <div key={k} style={{ marginBottom:10 }}>
                <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                {k==='forecastType' ? (
                  <select value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
                    {['rolling_12','annual','quarterly','monthly'].map(o=><option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                  </select>
                ) : k==='scenario' ? (
                  <select value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
                    {['best_case','expected','worst_case'].map(o=><option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                  </select>
                ) : (
                  <input type={['totalRevenue','totalExpenses'].includes(k)?'number':'text'} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
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
