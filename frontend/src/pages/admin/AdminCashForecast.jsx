import React, { useEffect, useState } from 'react';
import { fetchCashForecasts, createCashForecast, updateCashForecast, deleteCashForecast } from '../../services/bankingAPI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

const STATUS_COLORS = { draft:'#888',approved:'#27ae60',actual:'#3498db' };

export default function AdminCashForecast() {
  const [forecasts, setForecasts] = useState([]);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({});
  const [saving, setSaving]       = useState(false);
  const [filters, setFilters]     = useState({});

  const load = () => fetchCashForecasts(filters).then(r => setForecasts(r.data.data || []));
  useEffect(() => { load(); }, [JSON.stringify(filters)]);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'new') await createCashForecast(form);
      else await updateCashForecast(form._id, form);
      setModal(null); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const doDelete = async (id) => {
    if (!window.confirm('Delete this forecast?')) return;
    try { await deleteCashForecast(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const chartData = forecasts.slice(0, 6).map(f => ({
    period: f.forecastPeriod || '—',
    Receipts: f.expectedReceipts || 0,
    Payments: f.expectedPayments || 0,
    Net: f.netCashFlow || 0,
  }));

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Cash Forecast</h2>
        <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('new'); }}>+ New Forecast</button>
      </div>

      {chartData.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Cash Flow Forecast Overview</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/100000).toFixed(1)}L`} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend />
              <Bar dataKey="Receipts" fill="#27ae60" radius={[4,4,0,0]} />
              <Bar dataKey="Payments" fill="#e74c3c" radius={[4,4,0,0]} />
              <Bar dataKey="Net" fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select style={{ ...inp, maxWidth: 140 }} value={filters.status||''} onChange={e=>setFilters(f=>({...f,status:e.target.value||undefined}))}>
          <option value="">All Status</option>
          {['draft','approved','actual'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" style={{ ...inp, maxWidth: 160 }} value={filters.startDate||''} onChange={e=>setFilters(f=>({...f,startDate:e.target.value}))} placeholder="From" />
        <input type="date" style={{ ...inp, maxWidth: 160 }} value={filters.endDate||''} onChange={e=>setFilters(f=>({...f,endDate:e.target.value}))} placeholder="To" />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['Forecast#','Period','Opening','Expected In','Expected Out','Net Flow','Closing','Variance','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {forecasts.map(f => (
              <tr key={f._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{f.forecastNumber}</td>
                <td style={{ padding:'9px 16px',fontWeight:600 }}>{f.forecastPeriod}</td>
                <td style={{ padding:'9px 16px' }}>{fmt(f.openingBalance)}</td>
                <td style={{ padding:'9px 16px',color:'#27ae60',fontWeight:700 }}>{fmt(f.expectedReceipts)}</td>
                <td style={{ padding:'9px 16px',color:'#e74c3c',fontWeight:700 }}>{fmt(f.expectedPayments)}</td>
                <td style={{ padding:'9px 16px',fontWeight:700,color:f.netCashFlow>=0?'#27ae60':'#e74c3c' }}>{fmt(f.netCashFlow)}</td>
                <td style={{ padding:'9px 16px' }}>{fmt(f.closingForecast)}</td>
                <td style={{ padding:'9px 16px',fontSize:12,color:f.variance&&Math.abs(f.variance)>0?'#f39c12':'#888' }}>{f.variance!=null?fmt(f.variance):'—'}</td>
                <td style={{ padding:'9px 16px' }}><span style={{ background:(STATUS_COLORS[f.status]||'#888')+'20',color:STATUS_COLORS[f.status]||'#888',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{f.status}</span></td>
                <td style={{ padding:'9px 16px',display:'flex',gap:6 }}>
                  <button onClick={()=>{setForm({...f});setModal('edit');}} style={btn('#3498db')}>Edit</button>
                  <button onClick={()=>doDelete(f._id)} style={btn('#e74c3c')}>Del</button>
                </td>
              </tr>
            ))}
            {!forecasts.length && <tr><td colSpan={10} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No forecasts</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:520 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>{modal==='new'?'New Cash Forecast':'Edit Cash Forecast'}</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {[['forecastPeriod','Period (e.g. 2026-Q1) *','text'],['openingBalance','Opening Balance','number'],['expectedReceipts','Expected Receipts','number'],['expectedPayments','Expected Payments','number'],['actualReceipts','Actual Receipts','number'],['actualPayments','Actual Payments','number'],['confidenceLevel','Confidence %','number']].map(([k,l,t])=>(
                <div key={k} style={{ gridColumn:k==='forecastPeriod'?'1/-1':'auto' }}>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  <input type={t} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Status</label>
                <select style={inp} value={form.status||'draft'} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  {['draft','approved','actual'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button style={btn('#888')} onClick={()=>{setModal(null);setForm({});}}>Cancel</button>
              <button style={btn('var(--accent)')} onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
