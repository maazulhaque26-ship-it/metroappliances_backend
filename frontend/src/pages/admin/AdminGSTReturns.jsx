import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiSend } from 'react-icons/fi';
import { fetchGSTReturns, createGSTReturn, fileGSTReturn, fetchGSTRegistrations } from '../../services/taxAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n||0);
const RETURN_TYPES = ['GSTR-1','GSTR-2A','GSTR-2B','GSTR-3B','GSTR-4','GSTR-9','GSTR-9C'];
const STATUSES = ['','draft','filed','revised','nil','late'];
const EMPTY = { returnType:'GSTR-3B', period:'', gstRegistration:'', totalIGST:0, totalCGST:0, totalSGST:0, totalCess:0, notes:'' };

export default function AdminGSTReturns() {
  const [rows, setRows]     = useState([]);
  const [regs, setRegs]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [filter, setFilter] = useState({ returnType:'', period:'', status:'' });
  const [modal, setModal]   = useState(null);
  const [fileModal, setFileModal] = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [fileForm, setFileForm] = useState({ arn:'', acknowledgementNumber:'' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, regsR] = await Promise.all([
        fetchGSTReturns({ page, limit:15, ...filter }),
        fetchGSTRegistrations({ limit:50 }),
      ]);
      setRows(r.data.data || []);
      setTotal(r.data.total || 0);
      setRegs(regsR.data.data || []);
    } catch(e) { console.error(e); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const pages = Math.ceil(total/15);

  const save = async () => {
    setSaving(true);
    try { await createGSTReturn(form); await load(); setModal(null); setForm(EMPTY); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const doFile = async () => {
    setSaving(true);
    try { await fileGSTReturn(fileModal._id, fileForm); await load(); setFileModal(null); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const statusColor = s => ({ draft:'#f39c12', filed:'#27ae60', revised:'#3498db', nil:'#888', late:'#e74c3c' }[s] || '#888');

  return (
    <div style={{ padding:'24px 32px', fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>GST Returns</h2>
        <button onClick={()=>setModal(true)} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:600, cursor:'pointer', fontSize:14 }}><FiPlus />New Return</button>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <select value={filter.returnType} onChange={e=>setFilter(p=>({...p,returnType:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
          <option value="">All Types</option>
          {RETURN_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <input placeholder="Period (YYYY-MM)" value={filter.period} onChange={e=>setFilter(p=>({...p,period:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, width:160 }} />
        <select value={filter.status} onChange={e=>setFilter(p=>({...p,status:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
          {STATUSES.map(s=><option key={s} value={s}>{s||'All Status'}</option>)}
        </select>
      </div>

      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ background:'#fafafa' }}>{['Return#','Type','Period','IGST','CGST','SGST','Total','Status',''].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                <td style={{ padding:'11px 16px', fontSize:12, fontFamily:'monospace' }}>{r.returnNumber}</td>
                <td style={{ padding:'11px 16px', fontWeight:600 }}>{r.returnType}</td>
                <td style={{ padding:'11px 16px' }}>{r.period}</td>
                <td style={{ padding:'11px 16px' }}>{fmt(r.totalIGST)}</td>
                <td style={{ padding:'11px 16px' }}>{fmt(r.totalCGST)}</td>
                <td style={{ padding:'11px 16px' }}>{fmt(r.totalSGST)}</td>
                <td style={{ padding:'11px 16px', fontWeight:600 }}>{fmt((r.totalIGST||0)+(r.totalCGST||0)+(r.totalSGST||0)+(r.totalCess||0))}</td>
                <td style={{ padding:'11px 16px' }}><span style={{ background:statusColor(r.status)+'20', color:statusColor(r.status), borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.status}</span></td>
                <td style={{ padding:'11px 16px' }}>
                  {r.status==='draft' && <button onClick={()=>setFileModal(r)} style={{ display:'flex', alignItems:'center', gap:4, background:'#27ae6015', color:'#27ae60', border:'1px solid #27ae6030', borderRadius:6, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}><FiSend size={12}/>File</button>}
                </td>
              </tr>
            ))}
            {rows.length===0&&<tr><td colSpan={9} style={{ padding:32, textAlign:'center', color:'#aaa' }}>No returns found.</td></tr>}
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
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:480, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin:'0 0 24px', fontWeight:700 }}>New GST Return</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Return Type</label>
                <select value={form.returnType} onChange={e=>set('returnType',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                  {RETURN_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Period (YYYY-MM)</label>
                <input value={form.period} onChange={e=>set('period',e.target.value)} placeholder="2026-04" style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>GST Registration</label>
              <select value={form.gstRegistration} onChange={e=>set('gstRegistration',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                <option value="">Select…</option>
                {regs.map(r=><option key={r._id} value={r._id}>{r.gstin} — {r.legalName}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {['totalIGST','totalCGST','totalSGST','totalCess'].map(k=>(
                <div key={k}>
                  <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{k.replace('total','')}</label>
                  <input type="number" value={form[k]} onChange={e=>set(k,+e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(null)} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Saving…':'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {fileModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:400, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin:'0 0 20px', fontWeight:700 }}>File Return — {fileModal.returnNumber}</h3>
            {[['arn','ARN (Acknowledgement Reference Number)'],['acknowledgementNumber','Acknowledgement Number']].map(([k,ph])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{ph}</label>
                <input value={fileForm[k]} onChange={e=>setFileForm(p=>({...p,[k]:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={()=>setFileModal(null)} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={doFile} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'#27ae60', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Filing…':'File Return'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
