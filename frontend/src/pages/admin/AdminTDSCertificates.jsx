import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiAward, FiTrash2 } from 'react-icons/fi';
import { fetchTDSCertificates, createTDSCertificate, issueTDSCertificate, deleteTDSCertificate } from '../../services/taxAPI';

const CERT_TYPES = ['16A','16B','16C','27D'];
const QUARTERS   = ['Q1','Q2','Q3','Q4'];
const EMPTY = { certificateType:'16A', assessmentYear:'2026-27', quarter:'Q1', deductorName:'', deductorTAN:'', deducteeName:'', deducteePAN:'', grossAmount:0, tdsDeducted:0, tdsDeposited:0 };
const statusColor = s => ({ draft:'#f39c12', issued:'#27ae60', cancelled:'#e74c3c' }[s]||'#888');

export default function AdminTDSCertificates() {
  const [rows, setRows]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [filter, setFilter] = useState({ assessmentYear:'', quarter:'', status:'' });
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetchTDSCertificates({ page, limit:15, ...filter });
      setRows(r.data.data || []);
      setTotal(r.data.total || 0);
    } catch(e) { console.error(e); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const pages = Math.ceil(total/15);

  const save = async () => {
    setSaving(true);
    try { await createTDSCertificate(form); await load(); setModal(false); setForm(EMPTY); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const issue = async (id) => {
    if (!window.confirm('Issue this TDS certificate?')) return;
    try { await issueTDSCertificate(id); await load(); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this certificate?')) return;
    try { await deleteTDSCertificate(id); await load(); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n||0);

  return (
    <div style={{ padding:'24px 32px', fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>TDS Certificates</h2>
        <button onClick={()=>setModal(true)} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:600, cursor:'pointer', fontSize:14 }}><FiPlus />New Certificate</button>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input placeholder="Assessment Year" value={filter.assessmentYear} onChange={e=>setFilter(p=>({...p,assessmentYear:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, width:140 }} />
        <select value={filter.quarter} onChange={e=>setFilter(p=>({...p,quarter:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
          <option value="">All Quarters</option>
          {QUARTERS.map(q=><option key={q} value={q}>{q}</option>)}
        </select>
        <select value={filter.status} onChange={e=>setFilter(p=>({...p,status:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
          <option value="">All Status</option>
          {['draft','issued','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ background:'#fafafa' }}>{['Cert#','Type','AY','Quarter','Deductee','TDS Deducted','Status',''].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                <td style={{ padding:'11px 16px', fontSize:12, fontFamily:'monospace' }}>{r.certificateNumber}</td>
                <td style={{ padding:'11px 16px', fontWeight:600 }}>Form {r.certificateType}</td>
                <td style={{ padding:'11px 16px' }}>{r.assessmentYear}</td>
                <td style={{ padding:'11px 16px' }}>{r.quarter}</td>
                <td style={{ padding:'11px 16px' }}>{r.deducteeName}</td>
                <td style={{ padding:'11px 16px', fontWeight:600 }}>{fmt(r.tdsDeducted)}</td>
                <td style={{ padding:'11px 16px' }}><span style={{ background:statusColor(r.status)+'20', color:statusColor(r.status), borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.status}</span></td>
                <td style={{ padding:'11px 16px' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    {r.status==='draft' && <button onClick={()=>issue(r._id)} title="Issue" style={{ background:'#27ae6015', color:'#27ae60', border:'1px solid #27ae6030', borderRadius:6, padding:'4px 8px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}><FiAward size={12}/>Issue</button>}
                    {r.status!=='issued' && <button onClick={()=>remove(r._id)} title="Delete" style={{ background:'none', border:'none', cursor:'pointer', color:'#e74c3c' }}><FiTrash2 size={14}/></button>}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length===0&&<tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#aaa' }}>No TDS certificates.</td></tr>}
          </tbody>
        </table>
        {pages>1 && (
          <div style={{ padding:'12px 16px', display:'flex', gap:8 }}>
            {Array.from({length:pages},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)} style={{ padding:'5px 10px', border:'1px solid #e0e0e0', borderRadius:6, background:page===p?'var(--accent)':'#fff', color:page===p?'#fff':'#333', cursor:'pointer', fontSize:12, fontWeight:600 }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:520, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)', maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 24px', fontWeight:700 }}>New TDS Certificate</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:14 }}>
              {[['certificateType','Form Type',CERT_TYPES],['quarter','Quarter',QUARTERS]].map(([k,label,opts])=>(
                <div key={k}>
                  <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{label}</label>
                  <select value={form[k]} onChange={e=>set(k,e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                    {opts.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Assessment Year</label>
                <input value={form.assessmentYear} onChange={e=>set('assessmentYear',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[['deductorName','Deductor Name','text'],['deductorTAN','Deductor TAN','text'],['deducteeName','Deductee Name','text'],['deducteePAN','Deductee PAN','text'],['grossAmount','Gross Amount','number'],['tdsDeducted','TDS Deducted','number'],['tdsDeposited','TDS Deposited','number']].map(([k,ph,t])=>(
                <div key={k} style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{ph}</label>
                  <input type={t} value={form[k]} onChange={e=>set(k,t==='number'?+e.target.value:e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:16 }}>
              <button onClick={()=>setModal(false)} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Saving…':'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
