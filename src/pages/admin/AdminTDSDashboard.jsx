import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import { fetchTDSSections, fetchTDSDeductions, fetchTDSDeposits, createTDSDeduction, createTDSDeposit, fetchTDSRates } from '../../services/taxAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n||0);
const PARTY_TYPES = ['individual','company','firm','huf','aop','boi','other'];
const EMPTY_DED = { tdsSection:'', partyType:'individual', partyName:'', partyPAN:'', grossAmount:0, tdsRate:10, assessmentYear:'2026-27', quarter:'Q1' };

export default function AdminTDSDashboard() {
  const [sections, setSections]   = useState([]);
  const [deductions, setDed]      = useState([]);
  const [deposits, setDep]        = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EMPTY_DED);
  const [saving, setSaving]       = useState(false);
  const [tab, setTab]             = useState('deductions');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, dep] = await Promise.all([
        fetchTDSSections(),
        fetchTDSDeductions({ limit:20 }),
        fetchTDSDeposits({ limit:10 }),
      ]);
      setSections(s.data.data || []);
      setDed(d.data.data || []);
      setDep(dep.data.data || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const saveDed = async () => {
    setSaving(true);
    try { await createTDSDeduction(form); await load(); setModal(null); setForm(EMPTY_DED); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const statusColor = s => ({ pending:'#f39c12', deposited:'#27ae60', certified:'#3498db', cancelled:'#e74c3c' }[s]||'#888');

  const totalTDS     = deductions.filter(d=>d.status==='pending').reduce((s,d)=>s+(d.tdsAmount||0),0);
  const totalDeposit = deposits.reduce((s,d)=>s+(d.totalDeposited||0),0);

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#888' }}>Loading TDS data…</div>;

  return (
    <div style={{ padding:'24px 32px', fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>TDS Management</h2>
        <button onClick={()=>setModal('deduction')} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:600, cursor:'pointer', fontSize:14 }}><FiPlus />Record Deduction</button>
      </div>

      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        {[['TDS Payable', fmt(totalTDS), '#e74c3c'], ['Total Deposited', fmt(totalDeposit), '#27ae60'], ['Sections', sections.length, '#3498db'], ['Pending Deductions', deductions.filter(d=>d.status==='pending').length, '#f39c12']].map(([l,v,c])=>(
          <div key={l} style={{ background:'#fff', borderRadius:12, padding:'16px 24px', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', flex:'1 1 160px', minWidth:140 }}>
            <div style={{ fontSize:20, fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:12, color:'#888', marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'2px solid #f0f0f0' }}>
        {[['deductions','Deductions'],['deposits','Deposits'],['sections','Sections']].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:'10px 22px', border:'none', background:'none', fontWeight:tab===k?700:400, color:tab===k?'var(--accent)':'#888', borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer', fontSize:14, marginBottom:-2 }}>{label}</button>
        ))}
      </div>

      {tab==='deductions' && (
        <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ background:'#fafafa' }}>{['Deduction#','Party','Section','Gross','TDS%','TDS Amount','AY','Status'].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {deductions.map(r=>(
                <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'11px 16px', fontSize:12, fontFamily:'monospace' }}>{r.deductionNumber}</td>
                  <td style={{ padding:'11px 16px' }}>{r.partyName}</td>
                  <td style={{ padding:'11px 16px' }}>{r.tdsSection?.section || r.section || '—'}</td>
                  <td style={{ padding:'11px 16px' }}>{fmt(r.grossAmount)}</td>
                  <td style={{ padding:'11px 16px' }}>{r.tdsRate}%</td>
                  <td style={{ padding:'11px 16px', fontWeight:600 }}>{fmt(r.tdsAmount)}</td>
                  <td style={{ padding:'11px 16px' }}>{r.assessmentYear}</td>
                  <td style={{ padding:'11px 16px' }}><span style={{ background:statusColor(r.status)+'20', color:statusColor(r.status), borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.status}</span></td>
                </tr>
              ))}
              {deductions.length===0&&<tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#aaa' }}>No deductions.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab==='deposits' && (
        <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ background:'#fafafa' }}>{['Deposit#','AY','Quarter','Total Deposited','Challan','Status'].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {deposits.map(r=>(
                <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'11px 16px', fontSize:12, fontFamily:'monospace' }}>{r.depositNumber}</td>
                  <td style={{ padding:'11px 16px' }}>{r.assessmentYear}</td>
                  <td style={{ padding:'11px 16px' }}>{r.quarter}</td>
                  <td style={{ padding:'11px 16px', fontWeight:600 }}>{fmt(r.totalDeposited)}</td>
                  <td style={{ padding:'11px 16px', fontFamily:'monospace', fontSize:12 }}>{r.challanNumber||'—'}</td>
                  <td style={{ padding:'11px 16px' }}><span style={{ background:r.status==='acknowledged'?'#27ae6020':'#f39c1220', color:r.status==='acknowledged'?'#27ae60':'#f39c12', borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.status}</span></td>
                </tr>
              ))}
              {deposits.length===0&&<tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:'#aaa' }}>No deposits.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab==='sections' && (
        <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr style={{ background:'#fafafa' }}>{['Section','Nature of Payment','Threshold','Individual Rate','Company Rate'].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {sections.map(r=>(
                <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'11px 16px', fontWeight:700 }}>{r.section}</td>
                  <td style={{ padding:'11px 16px' }}>{r.natureOfPayment}</td>
                  <td style={{ padding:'11px 16px' }}>{fmt(r.thresholdLimit)}</td>
                  <td style={{ padding:'11px 16px' }}>{r.individualRate}%</td>
                  <td style={{ padding:'11px 16px' }}>{r.companyRate}%</td>
                </tr>
              ))}
              {sections.length===0&&<tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'#aaa' }}>No TDS sections. Add sections first.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal==='deduction' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:500, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)', maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 24px', fontWeight:700 }}>Record TDS Deduction</h3>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>TDS Section</label>
              <select value={form.tdsSection} onChange={e=>set('tdsSection',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                <option value="">Select section…</option>
                {sections.map(s=><option key={s._id} value={s._id}>{s.section} — {s.natureOfPayment}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Party Type</label>
                <select value={form.partyType} onChange={e=>set('partyType',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                  {PARTY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Quarter</label>
                <select value={form.quarter} onChange={e=>set('quarter',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                  {['Q1','Q2','Q3','Q4'].map(q=><option key={q} value={q}>{q}</option>)}
                </select>
              </div>
            </div>
            {[['partyName','Party Name','text'],['partyPAN','Party PAN','text'],['grossAmount','Gross Amount','number'],['tdsRate','TDS Rate (%)','number'],['assessmentYear','Assessment Year (e.g. 2026-27)','text']].map(([k,ph,t])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{ph}</label>
                <input type={t} value={form[k]} onChange={e=>set(k,t==='number'?+e.target.value:e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 }}>
              <button onClick={()=>setModal(null)} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={saveDed} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
