import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiZap, FiXCircle, FiTruck, FiTrash2 } from 'react-icons/fi';
import { fetchEWayBills, createEWayBill, generateEWB, cancelEWayBill, deleteEWayBill } from '../../services/taxAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n||0);
const TRANSPORT_MODES = ['road','rail','air','ship'];
const SUPPLY_TYPES    = ['outward','inward'];
const EMPTY = { fromGSTIN:'', fromName:'', fromState:'', fromPincode:'', toGSTIN:'', toName:'', toState:'', toPincode:'', supplyType:'outward', invoiceNo:'', invoiceDate:'', invoiceValue:0, taxableValue:0, totalTax:0, transportMode:'road', vehicleNo:'', distance:0 };
const statusColor = s => ({ pending:'#f39c12', generated:'#3498db', in_transit:'#e67e22', delivered:'#27ae60', cancelled:'#e74c3c', expired:'#888' }[s]||'#888');

export default function AdminEWayBill() {
  const [rows, setRows]   = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [filter, setFilter] = useState({ status:'', search:'' });
  const [modal, setModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [form, setForm]   = useState(EMPTY);
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetchEWayBills({ page, limit:15, ...filter });
      setRows(r.data.data || []);
      setTotal(r.data.total || 0);
    } catch(e) { console.error(e); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const pages = Math.ceil(total/15);

  const save = async () => {
    setSaving(true);
    try { await createEWayBill(form); await load(); setModal(null); setForm(EMPTY); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const generate = async (id) => {
    setSaving(true);
    try { await generateEWB(id); await load(); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const doCancel = async () => {
    setSaving(true);
    try { await cancelEWayBill(cancelModal._id, { reason: cancelReason }); await load(); setCancelModal(null); setCancelReason(''); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this e-way bill?')) return;
    try { await deleteEWayBill(id); await load(); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
  };

  const isExpiring = (ewb) => ewb.validUpto && new Date(ewb.validUpto) < new Date(Date.now() + 86400000);

  return (
    <div style={{ padding:'24px 32px', fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>E-Way Bills</h2>
        <button onClick={()=>setModal(true)} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:600, cursor:'pointer', fontSize:14 }}><FiPlus />New E-Way Bill</button>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <select value={filter.status} onChange={e=>setFilter(p=>({...p,status:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
          <option value="">All Status</option>
          {['pending','generated','in_transit','delivered','cancelled','expired'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="Search EWB#, vehicle, consignee…" value={filter.search} onChange={e=>setFilter(p=>({...p,search:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, width:280 }} />
      </div>

      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ background:'#fafafa' }}>{['EWB#','EWB No','To','Value','Vehicle','Valid Upto','Status',''].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5', background:isExpiring(r)&&r.status==='in_transit'?'#fff8e1':undefined }}>
                <td style={{ padding:'11px 16px', fontSize:12, fontFamily:'monospace' }}>{r.eWayBillNumber}</td>
                <td style={{ padding:'11px 16px', fontFamily:'monospace', fontSize:12 }}>{r.ewbNo||'—'}</td>
                <td style={{ padding:'11px 16px' }}>{r.toName}</td>
                <td style={{ padding:'11px 16px', fontWeight:600 }}>{fmt(r.invoiceValue)}</td>
                <td style={{ padding:'11px 16px', fontFamily:'monospace' }}>{r.vehicleNo||'—'}</td>
                <td style={{ padding:'11px 16px', color:isExpiring(r)&&r.status==='in_transit'?'#e74c3c':'inherit', fontWeight:isExpiring(r)?600:400 }}>{r.validUpto?new Date(r.validUpto).toLocaleDateString('en-IN'):'—'}</td>
                <td style={{ padding:'11px 16px' }}><span style={{ background:statusColor(r.status)+'20', color:statusColor(r.status), borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.status}</span></td>
                <td style={{ padding:'11px 16px' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    {r.status==='pending' && (
                      <button onClick={()=>generate(r._id)} disabled={saving} style={{ background:'#3498db15', color:'#3498db', border:'1px solid #3498db30', borderRadius:6, padding:'4px 8px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}><FiZap size={12}/>Generate</button>
                    )}
                    {r.status==='generated' && (
                      <button onClick={()=>setCancelModal(r)} style={{ background:'#e74c3c15', color:'#e74c3c', border:'1px solid #e74c3c30', borderRadius:6, padding:'4px 8px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}><FiXCircle size={12}/>Cancel</button>
                    )}
                    {r.status==='pending' && (
                      <button onClick={()=>remove(r._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#e74c3c' }}><FiTrash2 size={14}/></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length===0&&<tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#aaa' }}>No e-way bills found.</td></tr>}
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
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:560, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)', maxHeight:'92vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 20px', fontWeight:700 }}>New E-Way Bill</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[['fromGSTIN','From GSTIN','text'],['fromName','From Name','text'],['fromState','From State','text'],['fromPincode','From Pincode','text'],['toGSTIN','To GSTIN','text'],['toName','To Name','text'],['toState','To State','text'],['toPincode','To Pincode','text'],['invoiceNo','Invoice No','text'],['invoiceDate','Invoice Date','date'],['invoiceValue','Invoice Value','number'],['taxableValue','Taxable Value','number'],['totalTax','Total Tax','number'],['distance','Distance (km)','number'],['vehicleNo','Vehicle No','text']].map(([k,ph,t])=>(
                <div key={k} style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, color:'#888', fontWeight:600, display:'block', marginBottom:3 }}>{ph}</label>
                  <input type={t} value={form[k]} onChange={e=>set(k,t==='number'?+e.target.value:e.target.value)} style={{ width:'100%', padding:'8px 11px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color:'#888', fontWeight:600, display:'block', marginBottom:3 }}>Supply Type</label>
                <select value={form.supplyType} onChange={e=>set('supplyType',e.target.value)} style={{ width:'100%', padding:'8px 11px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                  {SUPPLY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color:'#888', fontWeight:600, display:'block', marginBottom:3 }}>Transport Mode</label>
                <select value={form.transportMode} onChange={e=>set('transportMode',e.target.value)} style={{ width:'100%', padding:'8px 11px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                  {TRANSPORT_MODES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:16 }}>
              <button onClick={()=>setModal(null)} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Saving…':'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {cancelModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:400, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin:'0 0 20px', fontWeight:700 }}>Cancel E-Way Bill — {cancelModal.eWayBillNumber}</h3>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Reason</label>
              <input value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="Reason for cancellation…" style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={()=>{setCancelModal(null);setCancelReason('');}} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Back</button>
              <button onClick={doCancel} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'#e74c3c', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Cancelling…':'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
