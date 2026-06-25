import React, { useEffect, useState } from 'react';
import { fetchFixedDeposits, createFixedDeposit, updateFixedDeposit, closeFixedDeposit, fetchInterestPostings, fetchBankAccounts } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

const STATUS_COLORS = { active:'#27ae60',matured:'#3498db',prematurely_closed:'#f39c12',cancelled:'#e74c3c' };

export default function AdminFixedDeposits() {
  const [fds, setFDs]           = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [interests, setInterests] = useState([]);
  const [tab, setTab]           = useState('fds');
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [closeForm, setCloseForm] = useState({});

  const load = () => Promise.all([
    fetchFixedDeposits({}).then(r => setFDs(r.data.data || [])),
    fetchBankAccounts({}).then(r => setAccounts(r.data.data || [])),
    fetchInterestPostings({}).then(r => setInterests(r.data.data || [])),
  ]);
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'new') await createFixedDeposit(form);
      else if (modal === 'edit') await updateFixedDeposit(form._id, form);
      else await closeFixedDeposit(form._id, closeForm);
      setModal(null); setForm({}); setCloseForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const totalPrincipal = fds.filter(f=>f.status==='active').reduce((a,f)=>a+(f.principalAmount||0),0);
  const totalMaturity  = fds.filter(f=>f.status==='active').reduce((a,f)=>a+(f.maturityAmount||0),0);

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Fixed Deposits</h2>
        {tab === 'fds' && <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('new'); }}>+ New FD</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[['Active FDs',fds.filter(f=>f.status==='active').length,'var(--accent)'],['Total Principal',totalPrincipal,'#3498db'],['Total Maturity',totalMaturity,'#27ae60'],['Total Gain',totalMaturity-totalPrincipal,'#D4AF37']].map(([l,v,c]) => (
          <div key={l} style={{ background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',borderTop:`3px solid ${c}` }}>
            <div style={{ fontSize:typeof v==='number'&&v>100?20:26,fontWeight:700,color:c }}>{typeof v==='number'&&l!=='Active FDs'?fmt(v):v}</div>
            <div style={{ fontSize:12,color:'#888',marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex',gap:0,borderBottom:'2px solid #f0f0f0',marginBottom:20 }}>
        {[['fds','Fixed Deposits'],['interest','Interest Postings']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding:'9px 22px',border:'none',background:'none',fontWeight:tab===k?700:400,color:tab===k?'var(--accent)':'#888',borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent',cursor:'pointer',fontSize:14,marginBottom:-2 }}>{l}</button>
        ))}
      </div>

      {tab === 'fds' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#fafafa' }}>{['FD#','Account','Principal','Rate%','Tenure','Maturity Amt','Start','Maturity','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {fds.map(fd => {
                const daysLeft = fd.maturityDate ? Math.ceil((new Date(fd.maturityDate)-Date.now())/86400000) : null;
                return (
                  <tr key={fd._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                    <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{fd.fdNumber}</td>
                    <td style={{ padding:'9px 16px' }}>{fd.bankAccount?.accountName||'—'}</td>
                    <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(fd.principalAmount)}</td>
                    <td style={{ padding:'9px 16px',color:'#27ae60',fontWeight:700 }}>{fd.interestRate}%</td>
                    <td style={{ padding:'9px 16px',fontSize:12 }}>{fd.tenureDays} days</td>
                    <td style={{ padding:'9px 16px',fontWeight:700,color:'#3498db' }}>{fmt(fd.maturityAmount)}</td>
                    <td style={{ padding:'9px 16px',fontSize:12 }}>{fd.startDate?new Date(fd.startDate).toLocaleDateString('en-IN'):'—'}</td>
                    <td style={{ padding:'9px 16px',fontSize:12,color:daysLeft!==null&&daysLeft<=30?'#e74c3c':'inherit',fontWeight:daysLeft!==null&&daysLeft<=30?700:400 }}>
                      {fd.maturityDate?new Date(fd.maturityDate).toLocaleDateString('en-IN'):'—'}
                      {daysLeft!==null&&daysLeft<=30&&fd.status==='active'?<span style={{ display:'block',fontSize:10 }}>{daysLeft}d left</span>:null}
                    </td>
                    <td style={{ padding:'9px 16px' }}><span style={{ background:(STATUS_COLORS[fd.status]||'#888')+'20',color:STATUS_COLORS[fd.status]||'#888',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{fd.status}</span></td>
                    <td style={{ padding:'9px 16px',display:'flex',gap:4 }}>
                      <button onClick={()=>{setForm({...fd});setModal('edit');}} style={btn('#3498db')}>Edit</button>
                      {fd.status==='active'&&<button onClick={()=>{setForm({...fd});setModal('close');}} style={btn('#f39c12')}>Close</button>}
                    </td>
                  </tr>
                );
              })}
              {!fds.length && <tr><td colSpan={10} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No FDs</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'interest' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#fafafa' }}>{['Posting#','FD','Date','Interest Type','Amount','TDS','Net','Days'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {interests.map(i => (
                <tr key={i._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{i.postingNumber}</td>
                  <td style={{ padding:'9px 16px' }}>{i.fixedDeposit?.fdNumber||'—'}</td>
                  <td style={{ padding:'9px 16px' }}>{i.postingDate?new Date(i.postingDate).toLocaleDateString('en-IN'):'—'}</td>
                  <td style={{ padding:'9px 16px',textTransform:'capitalize' }}>{i.interestType}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700,color:'#27ae60' }}>{fmt(i.interestAmount)}</td>
                  <td style={{ padding:'9px 16px',color:'#e74c3c' }}>{fmt(i.tdsAmount)}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(i.netInterest)}</td>
                  <td style={{ padding:'9px 16px' }}>{i.interestDays}</td>
                </tr>
              ))}
              {!interests.length && <tr><td colSpan={8} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No interest postings</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && modal !== 'close' && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:520 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>{modal==='new'?'New Fixed Deposit':'Edit Fixed Deposit'}</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Bank Account *</label>
                <select style={inp} value={form.bankAccount||''} onChange={e=>setForm(f=>({...f,bankAccount:e.target.value}))}>
                  <option value="">Select</option>
                  {accounts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}
                </select>
              </div>
              {[['principalAmount','Principal *','number'],['interestRate','Interest Rate % *','number'],['tenureDays','Tenure (Days)','number']].map(([k,l,t])=>(
                <div key={k}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type={t} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
              ))}
              <div>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Interest Type</label>
                <select style={inp} value={form.interestType||'compound'} onChange={e=>setForm(f=>({...f,interestType:e.target.value}))}>
                  <option value="simple">Simple</option><option value="compound">Compound</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Compound Frequency</label>
                <select style={inp} value={form.compoundFreq||'quarterly'} onChange={e=>setForm(f=>({...f,compoundFreq:e.target.value}))}>
                  {['monthly','quarterly','semi_annual','annual'].map(o=><option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              {[['startDate','Start Date *'],['maturityDate','Maturity Date *']].map(([k,l])=>(
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

      {modal === 'close' && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:400 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>Close Fixed Deposit</h3>
            <div style={{ background:'#fafafa',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13 }}>
              <div>{form.fdNumber} — <strong>{fmt(form.principalAmount)}</strong></div>
              <div style={{ color:'#888',marginTop:4 }}>Maturity: {form.maturityDate?new Date(form.maturityDate).toLocaleDateString('en-IN'):'—'}</div>
            </div>
            {[['closureDate','Closure Date'],['maturityAmount','Final Amount']].map(([k,l])=>(
              <div key={k} style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type={k==='closureDate'?'date':'number'} style={inp} value={closeForm[k]||''} onChange={e=>setCloseForm(r=>({...r,[k]:e.target.value}))} /></div>
            ))}
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
              <button style={btn('#888')} onClick={()=>{setModal(null);setForm({});setCloseForm({});}}>Cancel</button>
              <button style={btn('#f39c12')} onClick={save} disabled={saving}>{saving?'Processing…':'Close FD'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
