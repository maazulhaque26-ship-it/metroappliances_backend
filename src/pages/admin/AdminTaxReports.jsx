import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { fetchGSTR1Summary, fetchGSTR3BSummary, fetchTDSRegister, fetchGSTSettlementReport, fetchTaxAuditReport, fetchComplianceSummary } from '../../services/taxAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n||0);
const TABS = [['gstr1','GSTR-1 Summary'],['gstr3b','GSTR-3B Summary'],['tds','TDS Register'],['settlement','Settlement'],['compliance','Compliance']];
const COLORS = ['#3498db','#27ae60','#e74c3c','#f39c12','#9b59b6','#1abc9c'];

export default function AdminTaxReports() {
  const [tab, setTab]     = useState('gstr1');
  const [period, setPeriod] = useState('');
  const [ay, setAy]       = useState('');
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!period && !ay) { setError('Enter period (YYYY-MM) or assessment year first'); return; }
    setError(''); setLoading(true);
    try {
      let r;
      if (tab==='gstr1')      r = await fetchGSTR1Summary({ period });
      else if (tab==='gstr3b') r = await fetchGSTR3BSummary({ period });
      else if (tab==='tds')    r = await fetchTDSRegister({ assessmentYear: ay });
      else if (tab==='settlement') r = await fetchGSTSettlementReport({ period });
      else if (tab==='compliance') r = await fetchComplianceSummary({ period });
      setData(r.data.data);
    } catch(e) { setError(e.response?.data?.message||'Failed to load report'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding:'24px 32px', fontFamily:'Poppins, sans-serif' }}>
      <h2 style={{ margin:'0 0 24px', fontSize:22, fontWeight:700, color:'#1a1a2e' }}>Tax Reports</h2>

      <div style={{ display:'flex', gap:0, marginBottom:0, borderBottom:'2px solid #f0f0f0' }}>
        {TABS.map(([k,label])=>(
          <button key={k} onClick={()=>{setTab(k);setData(null);}} style={{ padding:'10px 22px', border:'none', background:'none', fontWeight:tab===k?700:400, color:tab===k?'var(--accent)':'#888', borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer', fontSize:14, marginBottom:-2 }}>{label}</button>
        ))}
      </div>

      <div style={{ background:'#fff', borderRadius:'0 0 12px 12px', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', padding:'20px 24px', marginBottom:24 }}>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          {tab==='tds' ? (
            <input placeholder="Assessment Year (e.g. 2026-27)" value={ay} onChange={e=>setAy(e.target.value)} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, width:200 }} />
          ) : (
            <input placeholder="Period (YYYY-MM)" value={period} onChange={e=>setPeriod(e.target.value)} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, width:160 }} />
          )}
          <button onClick={load} disabled={loading} style={{ padding:'9px 22px', border:'none', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{loading?'Loading…':'Generate Report'}</button>
          {error && <span style={{ color:'#e74c3c', fontSize:13 }}>{error}</span>}
        </div>
      </div>

      {data && tab==='gstr1' && <GSTR1Report data={data} />}
      {data && tab==='gstr3b' && <GSTR3BReport data={data} />}
      {data && tab==='tds' && <TDSReport data={data} />}
      {data && tab==='settlement' && <SettlementReport data={data} />}
      {data && tab==='compliance' && <ComplianceReport data={data} />}

      {!data && !loading && (
        <div style={{ textAlign:'center', padding:60, color:'#aaa', fontSize:14 }}>Select a period and click Generate Report to view data.</div>
      )}
    </div>
  );
}

function GSTR1Report({ data }) {
  const s = data.summary || {};
  return (
    <div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24 }}>
        {[['Total Invoices', s.count||0, '#3498db'],['Taxable Value', fmt(s.taxableValue), '#f39c12'],['IGST', fmt(s.igst), '#9b59b6'],['CGST', fmt(s.cgst), '#27ae60'],['SGST', fmt(s.sgst), '#e74c3c'],['Total Tax', fmt(s.totalTax), 'var(--accent)']].map(([l,v,c])=>(
          <div key={l} style={{ background:'#fff', borderRadius:10, padding:'14px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', flex:'1 1 140px', minWidth:120 }}>
            <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:12, color:'#888', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', marginBottom:24 }}>
        <h4 style={{ margin:'0 0 16px', fontSize:14, fontWeight:600 }}>Tax by Invoice Type</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.byType||[]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" tick={{ fontSize:11 }} />
            <YAxis tick={{ fontSize:11 }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={v=>fmt(v)} />
            <Legend />
            <Bar dataKey="taxableValue" name="Taxable" fill="#3498db" radius={[3,3,0,0]} />
            <Bar dataKey="totalTax"     name="Tax"     fill="var(--accent)" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GSTR3BReport({ data }) {
  const out = data.outwardSupplies || {};
  const itc = data.itcAvailable || {};
  const net = data.netPayable || {};
  const heads = ['igst','cgst','sgst','cess'];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
      {[['Outward Supplies (Output Tax)', out],['ITC Available', itc],['Net Payable', net]].map(([title, values])=>(
        <div key={title} style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin:'0 0 14px', fontSize:13, fontWeight:600 }}>{title}</h4>
          {heads.map(h=>(
            <div key={h} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f5f5f5' }}>
              <span style={{ fontSize:13, color:'#555', textTransform:'uppercase', fontWeight:600 }}>{h}</span>
              <span style={{ fontSize:13, fontWeight:600 }}>{fmt(values[h])}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TDSReport({ data }) {
  return (
    <div>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24 }}>
        {(data.totals||[]).map(t=>(
          <div key={t._id} style={{ background:'#fff', borderRadius:10, padding:'14px 20px', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', flex:'1 1 140px', minWidth:120 }}>
            <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>AY {t._id}</div>
            <div style={{ fontSize:16, fontWeight:700 }}>TDS: {fmt(t.tdsAmount)}</div>
            <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{t.count} deductions, Gross: {fmt(t.grossAmount)}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ background:'#fafafa' }}>{['Deduction#','Party','Section','Gross','TDS%','TDS Amount','Quarter','Status'].map(h=><th key={h} style={{ textAlign:'left', padding:'11px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {(data.deductions||[]).map(r=>(
              <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                <td style={{ padding:'10px 16px', fontSize:12, fontFamily:'monospace' }}>{r.deductionNumber}</td>
                <td style={{ padding:'10px 16px' }}>{r.partyName}</td>
                <td style={{ padding:'10px 16px' }}>{r.tdsSection?.section||'—'}</td>
                <td style={{ padding:'10px 16px' }}>{fmt(r.grossAmount)}</td>
                <td style={{ padding:'10px 16px' }}>{r.tdsRate}%</td>
                <td style={{ padding:'10px 16px', fontWeight:600 }}>{fmt(r.tdsAmount)}</td>
                <td style={{ padding:'10px 16px' }}>{r.quarter}</td>
                <td style={{ padding:'10px 16px' }}><span style={{ background:'#f39c1220', color:'#f39c12', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettlementReport({ data }) {
  const pieData = (data.totals||[]).map((t,i)=>({ name:t._id, value:t.count, payable:t.totalPayable }));
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
      <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
        <h4 style={{ margin:'0 0 16px', fontSize:14, fontWeight:600 }}>Settlements by Status</h4>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value})=>`${name} (${value})`}>
              {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v,name,props)=>[`Count: ${v}, Payable: ${fmt(props.payload.payable)}`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflowY:'auto', maxHeight:320 }}>
        <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:600 }}>All Settlements</h4>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead><tr style={{ background:'#fafafa' }}>{['Number','Period','Payable','Status'].map(h=><th key={h} style={{ textAlign:'left', padding:'8px 10px', color:'#888' }}>{h}</th>)}</tr></thead>
          <tbody>{(data.settlements||[]).map(r=>(
            <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
              <td style={{ padding:'8px 10px', fontFamily:'monospace', fontSize:11 }}>{r.settlementNumber}</td>
              <td style={{ padding:'8px 10px' }}>{r.period}</td>
              <td style={{ padding:'8px 10px', fontWeight:600 }}>{fmt(r.totalPayable)}</td>
              <td style={{ padding:'8px 10px' }}><span style={{ background:r.status==='paid'?'#27ae6020':'#f39c1220', color:r.status==='paid'?'#27ae60':'#f39c12', borderRadius:5, padding:'2px 7px', fontSize:11, fontWeight:600 }}>{r.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function ComplianceReport({ data }) {
  const byStatus = {};
  (data.byStatus||[]).forEach(s=>{ const key=s._id.status; byStatus[key]=(byStatus[key]||0)+s.count; });
  const pieData = Object.entries(byStatus).map(([name,value])=>({name,value}));
  const statusColor = s => ({ pending:'#f39c12', in_progress:'#3498db', completed:'#27ae60', overdue:'#e74c3c', waived:'#888' }[s]||'#888');
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
      <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
        <h4 style={{ margin:'0 0 16px', fontSize:14, fontWeight:600 }}>Tasks by Status</h4>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value})=>`${name} (${value})`}>
              {pieData.map((e,i)=><Cell key={i} fill={statusColor(e.name)} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
        <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:600 }}>Overdue Tasks</h4>
        {(data.overdue||[]).length===0 ? (
          <div style={{ color:'#27ae60', fontWeight:600, fontSize:14, textAlign:'center', marginTop:32 }}>No overdue tasks!</div>
        ) : (data.overdue||[]).map(r=>(
          <div key={r._id} style={{ padding:'10px 14px', background:'#e74c3c10', borderLeft:'3px solid #e74c3c', borderRadius:6, marginBottom:8 }}>
            <div style={{ fontWeight:600, fontSize:13 }}>{r.taskName}</div>
            <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{r.complianceType} — Due: {r.dueDate?new Date(r.dueDate).toLocaleDateString('en-IN'):'—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
