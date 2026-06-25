import React, { useEffect, useState } from 'react';
import { fetchTreasuryPositions, createTreasuryPosition, fetchBankGuarantees, createBankGuarantee, updateBankGuarantee, fetchLettersOfCredit, createLetterOfCredit, updateLetterOfCredit, fetchGateways, createGateway, updateGateway, fetchGatewayTransactions } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

const TABS = [['positions','Treasury Positions'],['bg','Bank Guarantees'],['lc','Letters of Credit'],['gw','Payment Gateways']];

export default function AdminTreasury() {
  const [tab, setTab]         = useState('positions');
  const [positions, setPos]   = useState([]);
  const [bgs, setBGs]         = useState([]);
  const [lcs, setLCs]         = useState([]);
  const [gateways, setGWs]    = useState([]);
  const [gwTxns, setGWTxns]   = useState([]);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    fetchTreasuryPositions({}).then(r => setPos(r.data.data || []));
    fetchBankGuarantees({}).then(r => setBGs(r.data.data || []));
    fetchLettersOfCredit({}).then(r => setLCs(r.data.data || []));
    fetchGateways({}).then(r => setGWs(r.data.data || []));
    fetchGatewayTransactions({}).then(r => setGWTxns(r.data.data || []));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'newPos') await createTreasuryPosition(form);
      else if (modal === 'newBG') await createBankGuarantee(form);
      else if (modal === 'editBG') await updateBankGuarantee(form._id, form);
      else if (modal === 'newLC') await createLetterOfCredit(form);
      else if (modal === 'editLC') await updateLetterOfCredit(form._id, form);
      else if (modal === 'newGW') await createGateway(form);
      else if (modal === 'editGW') await updateGateway(form._id, form);
      setModal(null); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const latestPos = positions[0] || {};

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Treasury Management</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {tab === 'positions' && <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('newPos'); }}>Snapshot Position</button>}
          {tab === 'bg' && <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('newBG'); }}>+ Bank Guarantee</button>}
          {tab === 'lc' && <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('newLC'); }}>+ Letter of Credit</button>}
          {tab === 'gw' && <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('newGW'); }}>+ Gateway</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f0f0f0', marginBottom: 20 }}>
        {TABS.map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding:'9px 22px',border:'none',background:'none',fontWeight:tab===k?700:400,color:tab===k?'var(--accent)':'#888',borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent',cursor:'pointer',fontSize:14,marginBottom:-2 }}>{l}</button>
        ))}
      </div>

      {tab === 'positions' && (
        <>
          {latestPos.positionNumber && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
              {[['Bank Balance',latestPos.bankBalance,'#3498db'],['Cash Balance',latestPos.cashBalance,'#27ae60'],['Investments',latestPos.investmentBalance,'#9b59b6'],['Net Position',latestPos.netPosition,'var(--accent)']].map(([l,v,c]) => (
                <div key={l} style={{ background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',borderTop:`3px solid ${c}` }}>
                  <div style={{ fontSize:22,fontWeight:700,color:c }}>{fmt(v)}</div>
                  <div style={{ fontSize:12,color:'#888',marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.07)',overflow:'hidden' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
              <thead><tr style={{ background:'#fafafa' }}>{['Position#','Date','Bank Bal','Cash Bal','Investments','Net Position'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                    <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{p.positionNumber}</td>
                    <td style={{ padding:'9px 16px' }}>{p.positionDate?new Date(p.positionDate).toLocaleDateString('en-IN'):'—'}</td>
                    <td style={{ padding:'9px 16px',fontWeight:700,color:'#3498db' }}>{fmt(p.bankBalance)}</td>
                    <td style={{ padding:'9px 16px',fontWeight:700,color:'#27ae60' }}>{fmt(p.cashBalance)}</td>
                    <td style={{ padding:'9px 16px',fontWeight:700,color:'#9b59b6' }}>{fmt(p.investmentBalance)}</td>
                    <td style={{ padding:'9px 16px',fontWeight:700,color:'var(--accent)' }}>{fmt(p.netPosition)}</td>
                  </tr>
                ))}
                {!positions.length && <tr><td colSpan={6} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No positions</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'bg' && (
        <div style={{ background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.07)',overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead><tr style={{ background:'#fafafa' }}>{['BG#','Type','Amount','Beneficiary','Issue Date','Expiry','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {bgs.map(b => {
                const daysLeft = b.expiryDate ? Math.ceil((new Date(b.expiryDate)-Date.now())/86400000) : null;
                return (
                  <tr key={b._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                    <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{b.bgNumber}</td>
                    <td style={{ padding:'9px 16px',textTransform:'capitalize',fontSize:12 }}>{(b.guaranteeType||'').replace(/_/g,' ')}</td>
                    <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(b.amount)}</td>
                    <td style={{ padding:'9px 16px' }}>{b.beneficiary}</td>
                    <td style={{ padding:'9px 16px' }}>{b.issueDate?new Date(b.issueDate).toLocaleDateString('en-IN'):'—'}</td>
                    <td style={{ padding:'9px 16px',color:daysLeft!==null&&daysLeft<=30?'#e74c3c':'inherit',fontWeight:daysLeft!==null&&daysLeft<=30?700:400 }}>{b.expiryDate?new Date(b.expiryDate).toLocaleDateString('en-IN'):'—'}{daysLeft!==null&&daysLeft<=30?` (${daysLeft}d)`:''}</td>
                    <td style={{ padding:'9px 16px' }}><span style={{ background:'#27ae6020',color:'#27ae60',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{b.status}</span></td>
                    <td style={{ padding:'9px 16px' }}><button onClick={()=>{setForm({...b});setModal('editBG');}} style={btn('#3498db')}>Edit</button></td>
                  </tr>
                );
              })}
              {!bgs.length && <tr><td colSpan={8} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No bank guarantees</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'lc' && (
        <div style={{ background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.07)',overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead><tr style={{ background:'#fafafa' }}>{['LC#','Type','Amount','Utilized','Beneficiary','Expiry','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {lcs.map(l => (
                <tr key={l._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{l.lcNumber}</td>
                  <td style={{ padding:'9px 16px',textTransform:'capitalize',fontSize:12 }}>{(l.lcType||'').replace(/_/g,' ')}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(l.amount)}</td>
                  <td style={{ padding:'9px 16px' }}>{fmt(l.utilizationAmount)}</td>
                  <td style={{ padding:'9px 16px' }}>{l.beneficiary}</td>
                  <td style={{ padding:'9px 16px' }}>{l.expiryDate?new Date(l.expiryDate).toLocaleDateString('en-IN'):'—'}</td>
                  <td style={{ padding:'9px 16px' }}><span style={{ background:'#3498db20',color:'#3498db',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{l.status}</span></td>
                  <td style={{ padding:'9px 16px' }}><button onClick={()=>{setForm({...l});setModal('editLC');}} style={btn('#3498db')}>Edit</button></td>
                </tr>
              ))}
              {!lcs.length && <tr><td colSpan={8} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No letters of credit</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'gw' && (
        <>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14,marginBottom:24 }}>
            {gateways.map(g => (
              <div key={g._id} style={{ background:'#fff',borderRadius:12,padding:'16px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <div style={{ fontWeight:700 }}>{g.gatewayCode}</div>
                  <span style={{ background:g.isActive?'#27ae6020':'#e74c3c20',color:g.isActive?'#27ae60':'#e74c3c',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{g.isActive?'Active':'Inactive'}</span>
                </div>
                <div style={{ fontSize:12,color:'#888',marginTop:4 }}>{g.provider} · {g.mode}</div>
                <div style={{ fontSize:12,marginTop:8 }}>Fee: {g.feePercent||0}% + ₹{g.fixedFee||0}</div>
                <button onClick={()=>{setForm({...g});setModal('editGW');}} style={{ ...btn('#3498db'),marginTop:12,width:'100%' }}>Edit</button>
              </div>
            ))}
          </div>
          <div style={{ background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.07)',overflow:'hidden' }}>
            <div style={{ padding:'12px 20px',borderBottom:'1px solid #f0f0f0',fontWeight:700,fontSize:14 }}>Recent Gateway Transactions</div>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
              <thead><tr style={{ background:'#fafafa' }}>{['Txn#','Gateway','Order ID','Amount','Status'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {gwTxns.slice(0,10).map(t => (
                  <tr key={t._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                    <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{t.transactionNumber}</td>
                    <td style={{ padding:'9px 16px' }}>{t.paymentGateway?.gatewayCode||'—'}</td>
                    <td style={{ padding:'9px 16px',fontSize:12,color:'#888' }}>{t.gatewayOrderId||'—'}</td>
                    <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(t.amount)}</td>
                    <td style={{ padding:'9px 16px' }}><span style={{ background:t.status==='captured'?'#27ae6020':t.status==='failed'?'#e74c3c20':'#f39c1220',color:t.status==='captured'?'#27ae60':t.status==='failed'?'#e74c3c':'#f39c12',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{t.status}</span></td>
                  </tr>
                ))}
                {!gwTxns.length && <tr><td colSpan={5} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No transactions</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,overflowY:'auto' }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:480,margin:'20px auto' }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>
              {modal==='newPos'?'Snapshot Treasury Position':modal==='newBG'?'New Bank Guarantee':modal==='editBG'?'Edit Bank Guarantee':modal==='newLC'?'New Letter of Credit':modal==='editLC'?'Edit Letter of Credit':modal==='newGW'?'New Payment Gateway':'Edit Gateway'}
            </h3>
            {modal === 'newPos' && [['positionDate','Date','date'],['notes','Notes','text']].map(([k,l,t])=>(
              <div key={k} style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type={t} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
            ))}
            {(modal==='newBG'||modal==='editBG') && <>
              {[['guaranteeType','Type *'],['amount','Amount *'],['beneficiary','Beneficiary *'],['purpose','Purpose'],['issuingBank','Issuing Bank'],['referenceNumber','Ref#']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  {k==='guaranteeType'?<select style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}><option value="">Select</option>{['financial','performance','advance_payment','bid_bond','retention','customs','other'].map(o=><option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}</select>:<input type={k==='amount'?'number':'text'} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />}
                </div>
              ))}
              {[['issueDate','Issue Date'],['expiryDate','Expiry Date']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type="date" style={inp} value={form[k]?form[k].slice(0,10):''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
              ))}
            </>}
            {(modal==='newLC'||modal==='editLC') && <>
              {[['lcType','LC Type *'],['amount','Amount *'],['applicant','Applicant *'],['beneficiary','Beneficiary *'],['purpose','Purpose'],['currency','Currency']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  {k==='lcType'?<select style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}><option value="">Select</option>{['import','export','inland','standby','revolving','confirmed'].map(o=><option key={o} value={o}>{o}</option>)}</select>:<input type={k==='amount'?'number':'text'} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />}
                </div>
              ))}
              {[['issueDate','Issue Date'],['expiryDate','Expiry Date']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type="date" style={inp} value={form[k]?form[k].slice(0,10):''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
              ))}
            </>}
            {(modal==='newGW'||modal==='editGW') && <>
              {[['gatewayCode','Gateway Code *'],['provider','Provider *']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  {k==='provider'?<select style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}><option value="">Select</option>{['razorpay','stripe','cashfree','paypal','paytm','ccavenue','custom'].map(o=><option key={o} value={o}>{o}</option>)}</select>:<input style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />}
                </div>
              ))}
              <div style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Mode</label><select style={inp} value={form.mode||''} onChange={e=>setForm(f=>({...f,mode:e.target.value}))}><option value="test">Test</option><option value="live">Live</option></select></div>
              {[['feePercent','Fee %'],['fixedFee','Fixed Fee (₹)']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type="number" step="0.01" style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
              ))}
            </>}
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
