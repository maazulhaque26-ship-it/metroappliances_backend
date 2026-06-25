import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import { fetchTaxRates, createTaxRate, fetchTaxCodes } from '../../services/taxAPI';

const EMPTY = { taxCode: '', effectiveFrom: '', effectiveTo: '', cgstRate: 0, sgstRate: 0, igstRate: 0, cessRate: 0, isReverseCharge: false, isActive: true };

export default function AdminTaxRates() {
  const [rows, setRows]       = useState([]);
  const [codes, setCodes]     = useState([]);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([fetchTaxRates(), fetchTaxCodes()]);
      setRows(r.data.data || []);
      setCodes(c.data.data || []);
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const save = async () => {
    setSaving(true);
    try { await createTaxRate(form); await load(); setModal(false); setForm(EMPTY); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding:'24px 32px', fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>Tax Rates</h2>
        <button onClick={()=>setModal(true)} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:600, cursor:'pointer', fontSize:14 }}><FiPlus />Add Rate</button>
      </div>
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ background:'#fafafa' }}>{['Tax Code','CGST%','SGST%','IGST%','Cess%','Rev Charge','Effective From','Active'].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                <td style={{ padding:'12px 16px', fontWeight:600 }}>{r.taxCode?.code || r.taxCode}</td>
                <td style={{ padding:'12px 16px' }}>{r.cgstRate}%</td>
                <td style={{ padding:'12px 16px' }}>{r.sgstRate}%</td>
                <td style={{ padding:'12px 16px' }}>{r.igstRate}%</td>
                <td style={{ padding:'12px 16px' }}>{r.cessRate}%</td>
                <td style={{ padding:'12px 16px' }}><span style={{ background:r.isReverseCharge?'#e74c3c20':'#f5f5f5', color:r.isReverseCharge?'#e74c3c':'#888', borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.isReverseCharge?'Yes':'No'}</span></td>
                <td style={{ padding:'12px 16px' }}>{r.effectiveFrom ? new Date(r.effectiveFrom).toLocaleDateString('en-IN') : '—'}</td>
                <td style={{ padding:'12px 16px' }}><span style={{ background:r.isActive?'#27ae6020':'#e74c3c20', color:r.isActive?'#27ae60':'#e74c3c', borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.isActive?'Active':'Inactive'}</span></td>
              </tr>
            ))}
            {rows.length===0&&<tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#aaa' }}>No rates configured.</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:480, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin:'0 0 24px', fontWeight:700 }}>Add Tax Rate</h3>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Tax Code</label>
              <select value={form.taxCode} onChange={e=>set('taxCode',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                <option value="">Select…</option>
                {codes.map(c=><option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              {['cgstRate','sgstRate','igstRate','cessRate'].map(k=>(
                <div key={k}>
                  <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{k.replace('Rate',' Rate (%)')}</label>
                  <input type="number" value={form[k]} onChange={e=>set(k,+e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              {['effectiveFrom','effectiveTo'].map(k=>(
                <div key={k}>
                  <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{k==='effectiveFrom'?'Effective From':'Effective To'}</label>
                  <input type="date" value={form[k]} onChange={e=>set(k,e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, marginBottom:20, cursor:'pointer' }}>
              <input type="checkbox" checked={!!form.isReverseCharge} onChange={e=>set('isReverseCharge',e.target.checked)} />Reverse Charge Applicable
            </label>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(false)} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
