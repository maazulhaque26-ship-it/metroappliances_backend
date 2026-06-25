import React, { useEffect, useState } from 'react';
import { fetchInvestments, createInvestment, updateInvestment, redeemInvestment } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtP = (n) => `${(n||0).toFixed(2)}%`;
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

const INV_TYPES = ['mutual_fund','equity','bonds','government_securities','liquid_fund','treasury_bill','other'];
const STATUS_COLORS = { active:'#27ae60',matured:'#3498db',redeemed:'#888',cancelled:'#e74c3c' };

export default function AdminInvestments() {
  const [investments, setInvestments] = useState([]);
  const [modal, setModal]             = useState(null);
  const [form, setForm]               = useState({});
  const [saving, setSaving]           = useState(false);
  const [filters, setFilters]         = useState({});
  const [redeemForm, setRedeemForm]   = useState({});

  const load = () => fetchInvestments(filters).then(r => setInvestments(r.data.data || []));
  useEffect(() => { load(); }, [JSON.stringify(filters)]);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'new') await createInvestment(form);
      else if (modal === 'edit') await updateInvestment(form._id, form);
      else await redeemInvestment(form._id, redeemForm);
      setModal(null); setForm({}); setRedeemForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const totals = investments.reduce((acc, inv) => {
    acc.principal += inv.principalAmount || 0;
    acc.current   += inv.currentValue || 0;
    return acc;
  }, { principal: 0, current: 0 });
  const totalReturn = totals.current - totals.principal;

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Investments</h2>
        <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('new'); }}>+ New Investment</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[['Total Invested',totals.principal,'#3498db'],['Current Value',totals.current,'#27ae60'],['Total Return',totalReturn,totalReturn>=0?'#27ae60':'#e74c3c'],['Active',investments.filter(i=>i.status==='active').length,'var(--accent)']].map(([l,v,c]) => (
          <div key={l} style={{ background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',borderTop:`3px solid ${c}` }}>
            <div style={{ fontSize:typeof v==='number'&&v>999?20:24,fontWeight:700,color:c }}>{typeof v==='number'&&l!=='Active'?fmt(v):v}</div>
            <div style={{ fontSize:12,color:'#888',marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select style={{ ...inp, maxWidth: 180 }} value={filters.investmentType||''} onChange={e=>setFilters(f=>({...f,investmentType:e.target.value||undefined}))}>
          <option value="">All Types</option>
          {INV_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
        </select>
        <select style={{ ...inp, maxWidth: 140 }} value={filters.status||''} onChange={e=>setFilters(f=>({...f,status:e.target.value||undefined}))}>
          <option value="">All Status</option>
          {['active','matured','redeemed','cancelled'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['Inv#','Type','Principal','Current Value','Return%','Units','NAV','Maturity','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {investments.map(inv => {
              const ret = inv.principalAmount > 0 ? ((inv.currentValue - inv.principalAmount) / inv.principalAmount * 100) : 0;
              return (
                <tr key={inv._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{inv.investmentNumber}</td>
                  <td style={{ padding:'9px 16px',textTransform:'capitalize',fontSize:12 }}>{(inv.investmentType||'').replace(/_/g,' ')}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(inv.principalAmount)}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700,color:'#27ae60' }}>{fmt(inv.currentValue)}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700,color:ret>=0?'#27ae60':'#e74c3c' }}>{fmtP(ret)}</td>
                  <td style={{ padding:'9px 16px' }}>{inv.units?.toFixed(4)||'—'}</td>
                  <td style={{ padding:'9px 16px' }}>{inv.nav?fmt(inv.nav):'—'}</td>
                  <td style={{ padding:'9px 16px' }}>{inv.maturityDate?new Date(inv.maturityDate).toLocaleDateString('en-IN'):'—'}</td>
                  <td style={{ padding:'9px 16px' }}><span style={{ background:(STATUS_COLORS[inv.status]||'#888')+'20',color:STATUS_COLORS[inv.status]||'#888',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{inv.status}</span></td>
                  <td style={{ padding:'9px 16px',display:'flex',gap:4 }}>
                    <button onClick={()=>{setForm({...inv});setModal('edit');}} style={btn('#3498db')}>Edit</button>
                    {inv.status==='active'&&<button onClick={()=>{setForm({...inv});setModal('redeem');}} style={btn('#f39c12')}>Redeem</button>}
                  </td>
                </tr>
              );
            })}
            {!investments.length && <tr><td colSpan={10} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No investments</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && modal !== 'redeem' && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:520 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>{modal==='new'?'New Investment':'Edit Investment'}</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Investment Type *</label>
                <select style={inp} value={form.investmentType||''} onChange={e=>setForm(f=>({...f,investmentType:e.target.value}))}>
                  <option value="">Select</option>
                  {INV_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              {[['investmentName','Name *','text'],['principalAmount','Principal *','number'],['currentValue','Current Value','number'],['units','Units','number'],['nav','NAV','number'],['expectedReturn','Expected Return %','number']].map(([k,l,t])=>(
                <div key={k}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type={t} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
              ))}
              {[['investmentDate','Investment Date'],['maturityDate','Maturity Date']].map(([k,l])=>(
                <div key={k}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type="date" style={inp} value={form[k]?form[k].slice(0,10):''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
              ))}
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button style={btn('#888')} onClick={()=>{setModal(null);setForm({});}}>Cancel</button>
              <button style={btn('var(--accent)')} onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'redeem' && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:400 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>Redeem Investment</h3>
            <div style={{ background:'#fafafa',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13 }}>
              <div>Principal: <strong>{fmt(form.principalAmount)}</strong></div>
              <div>Current Value: <strong>{fmt(form.currentValue)}</strong></div>
            </div>
            {[['redemptionAmount','Redemption Amount *'],['redemptionDate','Redemption Date']].map(([k,l])=>(
              <div key={k} style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type={k==='redemptionAmount'?'number':'date'} style={inp} value={redeemForm[k]||''} onChange={e=>setRedeemForm(r=>({...r,[k]:e.target.value}))} /></div>
            ))}
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
              <button style={btn('#888')} onClick={()=>{setModal(null);setForm({});setRedeemForm({});}}>Cancel</button>
              <button style={btn('#f39c12')} onClick={save} disabled={saving}>{saving?'Processing…':'Redeem'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
