import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import { fetchITCLedger, createITCEntry } from '../../services/taxAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n||0);
const ENTRY_TYPES = ['credit','reversal','utilization','lapse','opening','closing'];
const TAX_HEADS   = ['igst','cgst','sgst','cess'];
const EMPTY = { entryType:'credit', taxHead:'igst', period:'', amount:0, referenceNumber:'', narration:'' };

export default function AdminInputCredit() {
  const [rows, setRows]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [filter, setFilter] = useState({ period:'', taxHead:'' });
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetchITCLedger({ page, limit:20, ...filter });
      setRows(r.data.data || []);
      setTotal(r.data.total || 0);
    } catch(e) { console.error(e); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const pages = Math.ceil(total/20);

  const save = async () => {
    setSaving(true);
    try { await createITCEntry(form); await load(); setModal(false); setForm(EMPTY); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const typeColor = t => ({ credit:'#27ae60', reversal:'#e74c3c', utilization:'#3498db', lapse:'#888', opening:'#9b59b6', closing:'#f39c12' }[t]||'#888');

  return (
    <div style={{ padding:'24px 32px', fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>Input Tax Credit Ledger</h2>
        <button onClick={()=>setModal(true)} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:600, cursor:'pointer', fontSize:14 }}><FiPlus />Add Entry</button>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <input placeholder="Period (YYYY-MM)" value={filter.period} onChange={e=>setFilter(p=>({...p,period:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, width:160 }} />
        <select value={filter.taxHead} onChange={e=>setFilter(p=>({...p,taxHead:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
          <option value="">All Heads</option>
          {TAX_HEADS.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
      </div>

      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ background:'#fafafa' }}>{['Entry#','Type','Tax Head','Period','Amount','Running Balance','Narration'].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                <td style={{ padding:'11px 16px', fontSize:12, fontFamily:'monospace' }}>{r.entryNumber}</td>
                <td style={{ padding:'11px 16px' }}><span style={{ background:typeColor(r.entryType)+'20', color:typeColor(r.entryType), borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.entryType}</span></td>
                <td style={{ padding:'11px 16px', fontWeight:600, textTransform:'uppercase' }}>{r.taxHead}</td>
                <td style={{ padding:'11px 16px' }}>{r.period}</td>
                <td style={{ padding:'11px 16px', fontWeight:600 }}>{fmt(r.amount)}</td>
                <td style={{ padding:'11px 16px' }}>{fmt(r.runningBalance)}</td>
                <td style={{ padding:'11px 16px', color:'#888', fontSize:12 }}>{r.narration||'—'}</td>
              </tr>
            ))}
            {rows.length===0&&<tr><td colSpan={7} style={{ padding:32, textAlign:'center', color:'#aaa' }}>No ITC ledger entries.</td></tr>}
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
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:440, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin:'0 0 24px', fontWeight:700 }}>Add ITC Entry</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Entry Type</label>
                <select value={form.entryType} onChange={e=>set('entryType',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                  {ENTRY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Tax Head</label>
                <select value={form.taxHead} onChange={e=>set('taxHead',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                  {TAX_HEADS.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            {[['period','Period (YYYY-MM)','text'],['amount','Amount','number'],['referenceNumber','Reference Number','text'],['narration','Narration','text']].map(([k,ph,t])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{ph}</label>
                <input type={t} value={form[k]} onChange={e=>set(k,t==='number'?+e.target.value:e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 }}>
              <button onClick={()=>setModal(false)} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
