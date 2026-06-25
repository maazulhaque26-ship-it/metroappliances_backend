import React, { useEffect, useState } from 'react';
import { fetchLettersOfCredit, createLetterOfCredit, updateLetterOfCredit, deleteLetterOfCredit } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

const LC_TYPES = ['import','export','inland','standby','revolving','confirmed'];
const STATUS_COLORS = { draft:'#888',issued:'#3498db',active:'#27ae60',partially_utilized:'#f39c12',fully_utilized:'#9b59b6',expired:'#e67e22',cancelled:'#e74c3c' };

export default function AdminLettersOfCredit() {
  const [lcs, setLCs]         = useState([]);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [filters, setFilters] = useState({});

  const load = () => fetchLettersOfCredit(filters).then(r => setLCs(r.data.data || []));
  useEffect(() => { load(); }, [JSON.stringify(filters)]);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'new') await createLetterOfCredit(form);
      else await updateLetterOfCredit(form._id, form);
      setModal(null); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const doDelete = async (id, status) => {
    if (!['draft','cancelled','expired'].includes(status)) return alert('Only draft/cancelled/expired LCs can be deleted');
    if (!window.confirm('Delete this LC?')) return;
    try { await deleteLetterOfCredit(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const totalAmount    = lcs.filter(l=>['active','partially_utilized','issued'].includes(l.status)).reduce((a,l)=>a+(l.amount||0),0);
  const totalUtilized  = lcs.filter(l=>['active','partially_utilized','issued'].includes(l.status)).reduce((a,l)=>a+(l.utilizationAmount||0),0);
  const totalOutstanding = lcs.filter(l=>['active','partially_utilized','issued'].includes(l.status)).reduce((a,l)=>a+(l.outstandingAmount||0),0);
  const expiringSoon   = lcs.filter(l=>l.expiryDate&&['active','partially_utilized'].includes(l.status)&&Math.ceil((new Date(l.expiryDate)-Date.now())/86400000)<=30);

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Letters of Credit</h2>
        <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('new'); }}>+ New LC</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[['LC Amount',totalAmount,'#3498db'],['Utilized',totalUtilized,'#e74c3c'],['Outstanding',totalOutstanding,'#27ae60'],['Expiring 30d',expiringSoon.length,'#f39c12']].map(([l,v,c]) => (
          <div key={l} style={{ background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',borderTop:`3px solid ${c}` }}>
            <div style={{ fontSize:typeof v>10000?20:26,fontWeight:700,color:c }}>{typeof v==='number'&&l!=='Expiring 30d'?fmt(v):v}</div>
            <div style={{ fontSize:12,color:'#888',marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      {expiringSoon.length > 0 && (
        <div style={{ background:'#f39c1210',border:'1px solid #f39c1240',borderRadius:10,padding:'12px 18px',marginBottom:20 }}>
          <div style={{ fontWeight:700,color:'#f39c12',marginBottom:6 }}>LCs expiring within 30 days:</div>
          <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
            {expiringSoon.map(l => (
              <span key={l._id} style={{ background:'#f39c1220',color:'#f39c12',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:600 }}>
                {l.lcNumber} — {Math.ceil((new Date(l.expiryDate)-Date.now())/86400000)}d
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select style={{ ...inp, maxWidth: 140 }} value={filters.lcType||''} onChange={e=>setFilters(f=>({...f,lcType:e.target.value||undefined}))}>
          <option value="">All Types</option>
          {LC_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select style={{ ...inp, maxWidth: 160 }} value={filters.status||''} onChange={e=>setFilters(f=>({...f,status:e.target.value||undefined}))}>
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['LC#','Type','Amount','Utilized','Outstanding','Applicant','Beneficiary','Expiry','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {lcs.map(l => {
              const daysLeft = l.expiryDate ? Math.ceil((new Date(l.expiryDate)-Date.now())/86400000) : null;
              const utilizePct = l.amount > 0 ? Math.round((l.utilizationAmount / l.amount) * 100) : 0;
              return (
                <tr key={l._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11,fontWeight:700 }}>{l.lcNumber}</td>
                  <td style={{ padding:'9px 16px',textTransform:'capitalize',fontSize:12 }}>{l.lcType}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(l.amount)}</td>
                  <td style={{ padding:'9px 16px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <span style={{ fontWeight:700,color:'#e74c3c' }}>{fmt(l.utilizationAmount)}</span>
                      <div style={{ flex:1,height:4,background:'#f0f0f0',borderRadius:2,minWidth:60 }}>
                        <div style={{ height:4,width:`${Math.min(utilizePct,100)}%`,background:utilizePct>80?'#e74c3c':utilizePct>50?'#f39c12':'#27ae60',borderRadius:2 }} />
                      </div>
                      <span style={{ fontSize:11,color:'#888' }}>{utilizePct}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'9px 16px',fontWeight:700,color:'#27ae60' }}>{fmt(l.outstandingAmount)}</td>
                  <td style={{ padding:'9px 16px' }}>{l.applicant}</td>
                  <td style={{ padding:'9px 16px' }}>{l.beneficiary}</td>
                  <td style={{ padding:'9px 16px',fontSize:12,color:daysLeft!==null&&daysLeft<=30&&['active','partially_utilized'].includes(l.status)?'#f39c12':'inherit',fontWeight:daysLeft!==null&&daysLeft<=30&&['active','partially_utilized'].includes(l.status)?700:400 }}>
                    {l.expiryDate?new Date(l.expiryDate).toLocaleDateString('en-IN'):'—'}
                    {daysLeft!==null&&daysLeft<=30&&['active','partially_utilized'].includes(l.status)?<span style={{ display:'block',fontSize:10 }}>{daysLeft}d left</span>:null}
                  </td>
                  <td style={{ padding:'9px 16px' }}><span style={{ background:(STATUS_COLORS[l.status]||'#888')+'20',color:STATUS_COLORS[l.status]||'#888',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600,whiteSpace:'nowrap' }}>{(l.status||'').replace(/_/g,' ')}</span></td>
                  <td style={{ padding:'9px 16px',display:'flex',gap:4 }}>
                    <button onClick={()=>{setForm({...l});setModal('edit');}} style={btn('#3498db')}>Edit</button>
                    <button onClick={()=>doDelete(l._id,l.status)} style={btn('#e74c3c')}>Del</button>
                  </td>
                </tr>
              );
            })}
            {!lcs.length && <tr><td colSpan={10} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No letters of credit</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,overflowY:'auto' }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:520,margin:'20px auto' }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>{modal==='new'?'New Letter of Credit':'Edit LC'}</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>LC Type *</label>
                <select style={inp} value={form.lcType||''} onChange={e=>setForm(f=>({...f,lcType:e.target.value}))}>
                  <option value="">Select</option>
                  {LC_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {[['amount','LC Amount *'],['applicant','Applicant *'],['beneficiary','Beneficiary *'],['currency','Currency'],['purpose','Purpose'],['issuingBank','Issuing Bank']].map(([k,l])=>(
                <div key={k} style={{ gridColumn:k==='purpose'?'1/-1':'auto' }}>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  <input type={k==='amount'?'number':'text'} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
              {[['issueDate','Issue Date *'],['expiryDate','Expiry Date *']].map(([k,l])=>(
                <div key={k}>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  <input type="date" style={inp} value={form[k]?form[k].slice(0,10):''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
              {modal==='edit' && <>
                <div>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Utilization Amount</label>
                  <input type="number" style={inp} value={form.utilizationAmount||''} onChange={e=>setForm(f=>({...f,utilizationAmount:e.target.value}))} />
                </div>
                <div>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Status</label>
                  <select style={inp} value={form.status||''} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
              </>}
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
