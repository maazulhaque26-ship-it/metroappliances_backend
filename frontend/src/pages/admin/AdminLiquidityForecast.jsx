import React, { useEffect, useState } from 'react';
import { fetchLiquidityForecasts, createLiquidityForecast } from '../../services/bankingAPI';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

export default function AdminLiquidityForecast() {
  const [forecasts, setForecasts] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ horizon: 'daily', items: [] });
  const [saving, setSaving]       = useState(false);
  const [itemRow, setItemRow]     = useState({ period: '', inflow: '', outflow: '', description: '' });

  const load = () => fetchLiquidityForecasts({}).then(r => {
    const data = r.data.data || [];
    setForecasts(data);
    if (data.length && !selected) setSelected(data[0]);
  });
  useEffect(() => { load(); }, []);

  const addItem = () => {
    if (!itemRow.period || !itemRow.inflow) return;
    setForm(f => ({ ...f, items: [...(f.items || []), { ...itemRow }] }));
    setItemRow({ period: '', inflow: '', outflow: '', description: '' });
  };

  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_,i)=>i!==idx) }));

  const save = async () => {
    setSaving(true);
    try {
      await createLiquidityForecast(form);
      setModal(false); setForm({ horizon: 'daily', items: [] }); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const chartData = selected?.items?.map(item => ({
    period: item.period,
    Inflow: item.inflow || 0,
    Outflow: item.outflow || 0,
    Balance: item.cumulativeBalance || 0,
  })) || [];

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Liquidity Forecast</h2>
        <button style={btn('var(--accent)')} onClick={() => { setForm({ horizon: 'daily', items: [] }); setModal(true); }}>+ New Forecast</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div>
          {forecasts.map(f => (
            <div key={f._id} onClick={() => setSelected(f)} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', marginBottom: 10, cursor: 'pointer', borderLeft: `4px solid ${selected?._id===f._id?'var(--accent)':'#e0e0e0'}`, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{f.forecastNumber}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{f.horizon} · {f.items?.length||0} periods</div>
              <div style={{ fontSize: 12, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#27ae60' }}>In: {fmt(f.totalInflow)}</span>
                <span style={{ color: '#e74c3c' }}>Out: {fmt(f.totalOutflow)}</span>
              </div>
            </div>
          ))}
          {!forecasts.length && <div style={{ color: '#aaa', padding: 20, textAlign: 'center' }}>No forecasts</div>}
        </div>

        <div>
          {selected ? (
            <>
              <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700 }}>{selected.forecastNumber} — <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>{selected.horizon}</span></div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                    <span>Total In: <strong style={{ color: '#27ae60' }}>{fmt(selected.totalInflow)}</strong></span>
                    <span>Total Out: <strong style={{ color: '#e74c3c' }}>{fmt(selected.totalOutflow)}</strong></span>
                    <span>Net: <strong style={{ color: selected.totalInflow-selected.totalOutflow>=0?'#27ae60':'#e74c3c' }}>{fmt(selected.totalInflow-selected.totalOutflow)}</strong></span>
                  </div>
                </div>
                {chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/100000).toFixed(1)}L`} />
                      <Tooltip formatter={v => fmt(v)} />
                      <Line type="monotone" dataKey="Inflow" stroke="#27ae60" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="Outflow" stroke="#e74c3c" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="Balance" stroke="var(--accent)" dot={false} strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: '#fafafa' }}>{['Period','Description','Inflow','Outflow','Net Flow','Cum. Balance'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(selected.items || []).map((item, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #f5f5f5' }}>
                        <td style={{ padding:'9px 16px',fontWeight:600 }}>{item.period}</td>
                        <td style={{ padding:'9px 16px',fontSize:12,color:'#888' }}>{item.description||'—'}</td>
                        <td style={{ padding:'9px 16px',color:'#27ae60',fontWeight:700 }}>{fmt(item.inflow)}</td>
                        <td style={{ padding:'9px 16px',color:'#e74c3c',fontWeight:700 }}>{fmt(item.outflow)}</td>
                        <td style={{ padding:'9px 16px',fontWeight:700,color:item.netFlow>=0?'#27ae60':'#e74c3c' }}>{fmt(item.netFlow)}</td>
                        <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(item.cumulativeBalance)}</td>
                      </tr>
                    ))}
                    {!selected.items?.length && <tr><td colSpan={6} style={{ padding:30,textAlign:'center',color:'#aaa' }}>No items</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, padding: 60, textAlign: 'center', color: '#aaa', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>Select a forecast to view details</div>
          )}
        </div>
      </div>

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:1000,overflowY:'auto',paddingTop:40 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:600,marginBottom:40 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>New Liquidity Forecast</h3>
            <div style={{ marginBottom:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Horizon *</label>
                <select style={inp} value={form.horizon||'daily'} onChange={e=>setForm(f=>({...f,horizon:e.target.value}))}>
                  {['daily','weekly','monthly','quarterly'].map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Opening Balance</label>
                <input type="number" style={inp} value={form.openingBalance||''} onChange={e=>setForm(f=>({...f,openingBalance:e.target.value}))} />
              </div>
            </div>
            <div style={{ background:'#fafafa',borderRadius:10,padding:16,marginBottom:16 }}>
              <div style={{ fontWeight:600,fontSize:13,marginBottom:10 }}>Add Line Items</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginBottom:8 }}>
                {[['period','Period'],['inflow','Inflow'],['outflow','Outflow'],['description','Description']].map(([k,l])=>(
                  <div key={k}><label style={{ fontSize:11,color:'#888',display:'block',marginBottom:2 }}>{l}</label><input type={k==='inflow'||k==='outflow'?'number':'text'} style={{ ...inp,padding:'6px 10px' }} value={itemRow[k]||''} onChange={e=>setItemRow(r=>({...r,[k]:e.target.value}))} /></div>
                ))}
              </div>
              <button style={btn('#3498db')} onClick={addItem}>+ Add Row</button>
            </div>
            {form.items?.length > 0 && (
              <div style={{ maxHeight:180,overflowY:'auto',marginBottom:16 }}>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr>{['Period','Inflow','Outflow','Description',''].map(h=><th key={h} style={{ padding:'6px 10px',background:'#f5f5f5',textAlign:'left',color:'#888' }}>{h}</th>)}</tr></thead>
                  <tbody>{form.items.map((item,i)=>(
                    <tr key={i} style={{ borderTop:'1px solid #f0f0f0' }}>
                      <td style={{ padding:'5px 10px' }}>{item.period}</td>
                      <td style={{ padding:'5px 10px',color:'#27ae60' }}>{fmt(item.inflow)}</td>
                      <td style={{ padding:'5px 10px',color:'#e74c3c' }}>{fmt(item.outflow)}</td>
                      <td style={{ padding:'5px 10px',color:'#888' }}>{item.description}</td>
                      <td style={{ padding:'5px 10px' }}><button onClick={()=>removeItem(i)} style={{ ...btn('#e74c3c'),padding:'2px 8px',fontSize:11 }}>×</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
              <button style={btn('#888')} onClick={()=>setModal(false)}>Cancel</button>
              <button style={btn('var(--accent)')} onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
