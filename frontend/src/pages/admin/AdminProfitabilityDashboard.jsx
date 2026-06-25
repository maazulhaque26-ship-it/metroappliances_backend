import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { fetchProfitabilityAnalyses, fetchProfitabilitySummary, createProfitabilityAnalysis, updateProfitabilityAnalysis, deleteProfitabilityAnalysis, fetchProductProfitability, fetchCustomerProfitability, fetchDealerProfitability } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${Number(n||0).toLocaleString('en-IN')}`;
const pct = (n) => `${Number(n||0).toFixed(1)}%`;
const COLORS = ['#FF7A00','#D4AF37','#22c55e','#3b82f6','#a855f7','#ef4444'];

const TYPES = ['product','customer','dealer','factory','warehouse','service','channel','region'];
const EMPTY = { analysisType:'product', period:'', entityName:'', revenue:0, cogs:0, directExpenses:0, allocatedOverhead:0, notes:'' };

export default function AdminProfitabilityDashboard() {
  const [analyses, setAnalyses]   = useState([]);
  const [summary, setSummary]     = useState([]);
  const [products, setProducts]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dealers, setDealers]     = useState([]);
  const [tab, setTab]             = useState('overview');
  const [typeFilter, setTypeFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    try {
      const [a, s, p, c, d] = await Promise.all([
        fetchProfitabilityAnalyses({ analysisType: typeFilter||undefined, period: periodFilter||undefined }),
        fetchProfitabilitySummary({ period: periodFilter||undefined }),
        fetchProductProfitability({ period: periodFilter||undefined }),
        fetchCustomerProfitability({ period: periodFilter||undefined }),
        fetchDealerProfitability({ period: periodFilter||undefined }),
      ]);
      setAnalyses(a.data.data || []);
      setSummary(s.data.data || []);
      setProducts(p.data.data || []);
      setCustomers(c.data.data || []);
      setDealers(d.data.data || []);
    } catch { setError('Failed to load'); }
  };

  useEffect(() => { load(); }, [typeFilter, periodFilter]);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'create') await createProfitabilityAnalysis(form);
      else await updateProfitabilityAnalysis(form._id, form);
      setModal(null); setForm(EMPTY); load();
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete analysis?')) return;
    try { await deleteProfitabilityAnalysis(id); load(); } catch { alert('Delete failed'); }
  };

  return (
    <div style={{ fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:0 }}>Profitability</h1>
          <p style={{ fontSize:12.5, color:'var(--text-4)', marginTop:2 }}>Product, Customer, Dealer & Segment Profitability</p>
        </div>
        <button onClick={() => { setModal('create'); setForm(EMPTY); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          <FiPlus size={14} /> New Analysis
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ padding:'7px 12px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
          <option value="">All Types</option>
          {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <input value={periodFilter} onChange={e=>setPeriodFilter(e.target.value)} placeholder="Period (e.g. 2025-06)" style={{ padding:'7px 12px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)', width:180 }} />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {['overview','product','customer','dealer','all'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 16px', fontSize:12.5, fontWeight:tab===t?700:500, color:tab===t?'var(--accent)':'var(--text-4)', background:'none', border:'none', borderBottom:tab===t?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer', textTransform:'capitalize' }}>
            {t==='all'?'All Analyses':t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.25rem' }}>
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Revenue by Segment</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={summary} dataKey="totalRevenue" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({_id,percent})=>`${_id} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {summary.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v=>fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.25rem' }}>
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Net Profit by Segment</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={summary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={v=>`₹${(v/1e5).toFixed(0)}L`} />
                <YAxis dataKey="_id" type="category" tick={{ fontSize:10 }} width={70} />
                <Tooltip formatter={v=>fmt(v)} />
                <Bar dataKey="totalNetProfit" fill="var(--accent)" radius={[0,3,3,0]} name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'product' && <ProfTable title="Product Profitability" data={products} />}
      {tab === 'customer' && <ProfTable title="Customer Profitability" data={customers} />}
      {tab === 'dealer'   && <ProfTable title="Dealer Profitability" data={dealers} />}

      {tab === 'all' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          {error && <p style={{ color:'#ef4444', fontSize:12.5, padding:'8px 12px' }}>{error}</p>}
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['Type','Entity','Period','Revenue','Gross Profit','Net Profit','Net Margin','Status','Actions'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {analyses.map((a, i) => (
                <tr key={a._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                  <td style={{ padding:'9px 12px', textTransform:'capitalize' }}>{a.analysisType}</td>
                  <td style={{ padding:'9px 12px', fontWeight:600 }}>{a.entityName||'—'}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{a.period}</td>
                  <td style={{ padding:'9px 12px' }}>{fmt(a.revenue)}</td>
                  <td style={{ padding:'9px 12px', color:'#22c55e' }}>{fmt(a.grossProfit)}</td>
                  <td style={{ padding:'9px 12px', color:a.netProfit>=0?'#22c55e':'#ef4444', fontWeight:600 }}>{fmt(a.netProfit)}</td>
                  <td style={{ padding:'9px 12px', color:a.netMargin>=0?'#22c55e':'#ef4444', fontWeight:700 }}>{pct(a.netMargin)}</td>
                  <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:a.status==='final'?'#22c55e20':'#6b728020', color:a.status==='final'?'#22c55e':'#6b7280' }}>{a.status}</span></td>
                  <td style={{ padding:'9px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => { setModal('edit'); setForm({...a}); }} style={{ padding:'3px 7px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text-4)' }}><FiEdit2 size={11} /></button>
                      <button onClick={() => handleDelete(a._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {analyses.length===0 && <tr><td colSpan={9} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No analyses</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:520, maxHeight:'85vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>{modal==='create'?'New Profitability Analysis':'Edit Analysis'}</h2>
            {[['analysisType','Type','select'],['period','Period','text'],['entityName','Entity Name','text'],['revenue','Revenue','number'],['cogs','COGS','number'],['directExpenses','Direct Expenses','number'],['allocatedOverhead','Allocated Overhead','number'],['notes','Notes','text']].map(([k,lbl,type]) => (
              <div key={k} style={{ marginBottom:10 }}>
                <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                {type==='select' ? (
                  <select value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
                    {TYPES.map(o=><option key={o} value={o}>{o}</option>)}
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

function ProfTable({ title, data }) {
  const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : `₹${Number(n||0).toLocaleString('en-IN')}`;
  const pct = (n) => `${Number(n||0).toFixed(1)}%`;
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:13, color:'var(--text)' }}>{title}</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
        <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
          {['Entity','Period','Revenue','Gross Profit','Net Profit','Gross Margin','Net Margin'].map(h=>(
            <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
              <td style={{ padding:'9px 12px', fontWeight:600 }}>{d.entityName||'—'}</td>
              <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{d.period}</td>
              <td style={{ padding:'9px 12px' }}>{fmt(d.revenue)}</td>
              <td style={{ padding:'9px 12px', color:'#22c55e' }}>{fmt(d.grossProfit)}</td>
              <td style={{ padding:'9px 12px', color:d.netProfit>=0?'#22c55e':'#ef4444', fontWeight:600 }}>{fmt(d.netProfit)}</td>
              <td style={{ padding:'9px 12px' }}>{pct(d.grossMargin)}</td>
              <td style={{ padding:'9px 12px', fontWeight:700, color:d.netMargin>=0?'#22c55e':'#ef4444' }}>{pct(d.netMargin)}</td>
            </tr>
          ))}
          {data.length===0 && <tr><td colSpan={7} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No data</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
