import React, { useEffect, useState } from 'react';
import { fetchBankGuarantees, createBankGuarantee, updateBankGuarantee, deleteBankGuarantee } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

const BG_TYPES = ['financial','performance','advance_payment','bid_bond','retention','customs','other'];
const STATUS_COLORS = { draft:'#888',issued:'#3498db',active:'#27ae60',expired:'#f39c12',cancelled:'#e74c3c',invoked:'#9b59b6' };

export default function AdminBankGuarantees() {
  const [bgs, setBGs]       = useState([]);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({});

  const load = () => fetchBankGuarantees(filters).then(r => setBGs(r.data.data || []));
  useEffect(() => { load(); }, [JSON.stringify(filters)]);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'new') await createBankGuarantee(form);
      else await updateBankGuarantee(form._id, form);
      setModal(null); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const doDelete = async (id, status) => {
    if (!['draft','cancelled','expired'].includes(status)) return alert('Only draft/cancelled/expired BGs can be deleted');
    if (!window.confirm('Delete this bank guarantee?')) return;
    try { await deleteBankGuarantee(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const totals = bgs.reduce((acc, b) => {
    if (['active','issued'].includes(b.status)) acc.active += b.amount || 0;
    if (b.status === 'expired') acc.expired += b.amount || 0;
    return acc;
  }, { active: 0, expired: 0 });

  const expiringSoon = bgs.filter(b => b.expiryDate && b.status === 'active' && Math.ceil((new Date(b.expiryDate)-Date.now())/86400000) <= 30);

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Bank Guarantees</h2>
        <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('new'); }}>+ New BG</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[['Total Active',bgs.filter(b=>['active','issued'].includes(b.status)).length,'#27ae60'],['Active Amount',totals.active,'#3498db'],['Expiring in 30d',expiringSoon.length,'#e74c3c'],['Expired',totals.expired,'#888']].map(([l,v,c]) => (
          <div key={l} style={{ background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',borderTop:`3px solid ${c}` }}>
            <div style={{ fontSize:typeof v==='number'&&v>10000?20:26,fontWeight:700,color:c }}>{typeof v==='number'&&l!=='Total Active'&&l!=='Expiring in 30d'?fmt(v):v}</div>
            <div style={{ fontSize:12,color:'#888',marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      {expiringSoon.length > 0 && (
        <div style={{ background:'#e74c3c10',border:'1px solid #e74c3c40',borderRadius:10,padding:'12px 18px',marginBottom:20 }}>
          <div style={{ fontWeight:700,color:'#e74c3c',marginBottom:6 }}>Expiring within 30 days:</div>
          <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
            {expiringSoon.map(b => (
              <span key={b._id} style={{ background:'#e74c3c20',color:'#e74c3c',borderRadius:6,padding:'3px 10px',fontSize:12,fontWeight:600 }}>
                {b.bgNumber} — {Math.ceil((new Date(b.expiryDate)-Date.now())/86400000)}d
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select style={{ ...inp, maxWidth: 160 }} value={filters.guaranteeType||''} onChange={e=>setFilters(f=>({...f,guaranteeType:e.target.value||undefined}))}>
          <option value="">All Types</option>
          {BG_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
        </select>
        <select style={{ ...inp, maxWidth: 140 }} value={filters.status||''} onChange={e=>setFilters(f=>({...f,status:e.target.value||undefined}))}>
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['BG#','Type','Amount','Beneficiary','Purpose','Issuing Bank','Issue Date','Expiry','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {bgs.map(b => {
              const daysLeft = b.expiryDate ? Math.ceil((new Date(b.expiryDate)-Date.now())/86400000) : null;
              return (
                <tr key={b._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11,fontWeight:700 }}>{b.bgNumber}</td>
                  <td style={{ padding:'9px 16px',textTransform:'capitalize',fontSize:12 }}>{(b.guaranteeType||'').replace(/_/g,' ')}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(b.amount)}</td>
                  <td style={{ padding:'9px 16px' }}>{b.beneficiary}</td>
                  <td style={{ padding:'9px 16px',fontSize:12,color:'#888',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{b.purpose||'—'}</td>
                  <td style={{ padding:'9px 16px' }}>{b.issuingBank||'—'}</td>
                  <td style={{ padding:'9px 16px',fontSize:12 }}>{b.issueDate?new Date(b.issueDate).toLocaleDateString('en-IN'):'—'}</td>
                  <td style={{ padding:'9px 16px',fontSize:12,color:daysLeft!==null&&daysLeft<=30&&b.status==='active'?'#e74c3c':'inherit',fontWeight:daysLeft!==null&&daysLeft<=30&&b.status==='active'?700:400 }}>
                    {b.expiryDate?new Date(b.expiryDate).toLocaleDateString('en-IN'):'—'}
                    {daysLeft!==null&&daysLeft<=30&&b.status==='active'?<span style={{ display:'block',fontSize:10 }}>{daysLeft}d left</span>:null}
                  </td>
                  <td style={{ padding:'9px 16px' }}><span style={{ background:(STATUS_COLORS[b.status]||'#888')+'20',color:STATUS_COLORS[b.status]||'#888',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{b.status}</span></td>
                  <td style={{ padding:'9px 16px',display:'flex',gap:4 }}>
                    <button onClick={()=>{setForm({...b});setModal('edit');}} style={btn('#3498db')}>Edit</button>
                    <button onClick={()=>doDelete(b._id,b.status)} style={btn('#e74c3c')}>Del</button>
                  </td>
                </tr>
              );
            })}
            {!bgs.length && <tr><td colSpan={10} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No bank guarantees</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,overflowY:'auto' }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:520,margin:'20px auto' }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>{modal==='new'?'New Bank Guarantee':'Edit Bank Guarantee'}</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Type *</label>
                <select style={inp} value={form.guaranteeType||''} onChange={e=>setForm(f=>({...f,guaranteeType:e.target.value}))}>
                  <option value="">Select</option>
                  {BG_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              {[['amount','Amount *'],['beneficiary','Beneficiary *'],['purpose','Purpose'],['issuingBank','Issuing Bank'],['referenceNumber','Reference #'],['counterPartyBank','Counter Party Bank']].map(([k,l])=>(
                <div key={k} style={{ gridColumn:k==='purpose'||k==='counterPartyBank'?'1/-1':'auto' }}>
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
              {modal==='edit' && (
                <div>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Status</label>
                  <select style={inp} value={form.status||''} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    {Object.keys(STATUS_COLORS).map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
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
