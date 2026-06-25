import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiCheck, FiFileText } from 'react-icons/fi';
import { fetchGSTRegistrations, fetchGSTSettlements, fetchGSTReturns, createGSTRegistration, settleGST } from '../../services/taxAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n||0);

export default function AdminGSTDashboard() {
  const [regs, setRegs]         = useState([]);
  const [returns, setReturns]   = useState([]);
  const [settlements, setSetts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({ gstin:'', legalName:'', registrationType:'regular', state:'', stateCode:'', isDefault:false });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, ret, s] = await Promise.all([
        fetchGSTRegistrations({ limit:50 }),
        fetchGSTReturns({ limit:10, status:'draft' }),
        fetchGSTSettlements({ limit:10 }),
      ]);
      setRegs(r.data.data || []);
      setReturns(ret.data.data || []);
      setSetts(s.data.data || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveReg = async () => {
    setSaving(true);
    try { await createGSTRegistration(form); await load(); setModal(null); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#888' }}>Loading…</div>;

  return (
    <div style={{ padding:'24px 32px', fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>GST Management</h2>
        <button onClick={()=>setModal('reg')} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:600, cursor:'pointer', fontSize:14 }}><FiPlus />Add Registration</button>
      </div>

      <h3 style={{ fontSize:15, fontWeight:600, marginBottom:12 }}>GST Registrations</h3>
      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden', marginBottom:32 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ background:'#fafafa' }}>{['GSTIN','Legal Name','Type','State','Status','Default'].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {regs.map(r=>(
              <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                <td style={{ padding:'12px 16px', fontFamily:'monospace', fontWeight:600 }}>{r.gstin}</td>
                <td style={{ padding:'12px 16px' }}>{r.legalName}</td>
                <td style={{ padding:'12px 16px' }}><span style={{ background:'#3498db20', color:'#3498db', borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.registrationType}</span></td>
                <td style={{ padding:'12px 16px' }}>{r.state}</td>
                <td style={{ padding:'12px 16px' }}><span style={{ background:r.status==='active'?'#27ae6020':'#e74c3c20', color:r.status==='active'?'#27ae60':'#e74c3c', borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.status}</span></td>
                <td style={{ padding:'12px 16px' }}>{r.isDefault?<FiCheck color="#27ae60" />:'—'}</td>
              </tr>
            ))}
            {regs.length===0&&<tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'#aaa' }}>No registrations.</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        <div>
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:12 }}>Draft Returns</h3>
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr style={{ background:'#fafafa' }}>{['Number','Type','Period','Status'].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {returns.map(r=>(
                  <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                    <td style={{ padding:'10px 16px', fontSize:12 }}>{r.returnNumber}</td>
                    <td style={{ padding:'10px 16px' }}>{r.returnType}</td>
                    <td style={{ padding:'10px 16px' }}>{r.period}</td>
                    <td style={{ padding:'10px 16px' }}><span style={{ background:'#f39c1220', color:'#f39c12', borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.status}</span></td>
                  </tr>
                ))}
                {returns.length===0&&<tr><td colSpan={4} style={{ padding:20, textAlign:'center', color:'#aaa' }}>No draft returns.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize:15, fontWeight:600, marginBottom:12 }}>Recent Settlements</h3>
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr style={{ background:'#fafafa' }}>{['Number','Period','Payable','Status'].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {settlements.map(s=>(
                  <tr key={s._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                    <td style={{ padding:'10px 16px', fontSize:12 }}>{s.settlementNumber}</td>
                    <td style={{ padding:'10px 16px' }}>{s.period}</td>
                    <td style={{ padding:'10px 16px' }}>{fmt(s.totalPayable)}</td>
                    <td style={{ padding:'10px 16px' }}><span style={{ background:s.status==='paid'?'#27ae6020':'#f39c1220', color:s.status==='paid'?'#27ae60':'#f39c12', borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{s.status}</span></td>
                  </tr>
                ))}
                {settlements.length===0&&<tr><td colSpan={4} style={{ padding:20, textAlign:'center', color:'#aaa' }}>No settlements.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal==='reg' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:460, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin:'0 0 24px', fontWeight:700 }}>Add GST Registration</h3>
            {[['gstin','GSTIN (15 chars)'],['legalName','Legal Name'],['state','State'],['stateCode','State Code']].map(([k,ph])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{ph}</label>
                <input value={form[k]} onChange={e=>set(k,e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Registration Type</label>
              <select value={form.registrationType} onChange={e=>set('registrationType',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                {['regular','composition','casual','non_resident','input_service_distributor','ecommerce_operator','tax_deductor','sez'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, marginBottom:24, cursor:'pointer' }}>
              <input type="checkbox" checked={!!form.isDefault} onChange={e=>set('isDefault',e.target.checked)} />Set as Default
            </label>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(null)} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={saveReg} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
