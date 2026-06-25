import React, { useEffect, useState } from 'react';
import { fetchFXRates, createFXRate, updateFXRate, fetchFXTransactions, createFXTransaction, updateFXTransaction, settleFXTransaction, fetchFXGainLoss, fetchCurrencyAccounts, createCurrencyAccount, updateCurrencyAccount, revalueCurrencyAccount } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);
const fmtFX = (n, decimals = 4) => (n || 0).toFixed(decimals);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

const TABS = [['rates','FX Rates'],['transactions','FX Transactions'],['accounts','Currency Accounts'],['gainloss','Gain/Loss']];
const TX_TYPES = ['buy','sell','swap','forward','spot','revaluation'];

export default function AdminFXManagement() {
  const [tab, setTab]       = useState('rates');
  const [rates, setRates]   = useState([]);
  const [txns, setTxns]     = useState([]);
  const [accounts, setAccts]= useState([]);
  const [gl, setGL]         = useState([]);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetchFXRates({}).then(r => setRates(r.data.data || []));
    fetchFXTransactions({}).then(r => setTxns(r.data.data || []));
    fetchCurrencyAccounts({}).then(r => setAccts(r.data.data || []));
    fetchFXGainLoss({}).then(r => setGL(r.data.data || []));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'newRate') await createFXRate(form);
      else if (modal === 'editRate') await updateFXRate(form._id, form);
      else if (modal === 'newTx') await createFXTransaction(form);
      else if (modal === 'editTx') await updateFXTransaction(form._id, form);
      else if (modal === 'newAcct') await createCurrencyAccount(form);
      else if (modal === 'editAcct') await updateCurrencyAccount(form._id, form);
      setModal(null); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const doSettle = async (id) => {
    if (!window.confirm('Settle this FX transaction?')) return;
    try { await settleFXTransaction(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const doRevalue = async (id) => {
    const rate = window.prompt('Enter current exchange rate:');
    if (!rate) return;
    try { await revalueCurrencyAccount(id, { currentRate: parseFloat(rate) }); load(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>FX Management</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {tab === 'rates' && <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('newRate'); }}>+ Add Rate</button>}
          {tab === 'transactions' && <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('newTx'); }}>+ FX Transaction</button>}
          {tab === 'accounts' && <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('newAcct'); }}>+ Currency Account</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f0f0f0', marginBottom: 20 }}>
        {TABS.map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding:'9px 22px',border:'none',background:'none',fontWeight:tab===k?700:400,color:tab===k?'var(--accent)':'#888',borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent',cursor:'pointer',fontSize:14,marginBottom:-2 }}>{l}</button>
        ))}
      </div>

      {tab === 'rates' && (
        <div style={{ background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.07)',overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead><tr style={{ background:'#fafafa' }}>{['Currency','From','To','Rate','Buying Rate','Selling Rate','Date','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {rates.map(r => (
                <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px',fontWeight:700,fontSize:14 }}>{r.fromCurrency}/{r.toCurrency}</td>
                  <td style={{ padding:'9px 16px' }}>{r.fromCurrency}</td>
                  <td style={{ padding:'9px 16px' }}>{r.toCurrency}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700,color:'var(--accent)' }}>{fmtFX(r.rate)}</td>
                  <td style={{ padding:'9px 16px' }}>{r.buyingRate?fmtFX(r.buyingRate):'—'}</td>
                  <td style={{ padding:'9px 16px' }}>{r.sellingRate?fmtFX(r.sellingRate):'—'}</td>
                  <td style={{ padding:'9px 16px',fontSize:12,color:'#888' }}>{r.effectiveDate?new Date(r.effectiveDate).toLocaleDateString('en-IN'):'—'}</td>
                  <td style={{ padding:'9px 16px' }}><button onClick={()=>{setForm({...r});setModal('editRate');}} style={btn('#3498db')}>Edit</button></td>
                </tr>
              ))}
              {!rates.length && <tr><td colSpan={8} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No exchange rates</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'transactions' && (
        <div style={{ background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.07)',overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead><tr style={{ background:'#fafafa' }}>{['Txn#','Type','From','To','Rate','From Amt','To Amt','Spread','G/L','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {txns.map(t => (
                <tr key={t._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{t.transactionNumber}</td>
                  <td style={{ padding:'9px 16px',textTransform:'capitalize',fontSize:12 }}>{t.transactionType}</td>
                  <td style={{ padding:'9px 16px' }}>{t.fromCurrency}</td>
                  <td style={{ padding:'9px 16px' }}>{t.toCurrency}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700,color:'var(--accent)' }}>{fmtFX(t.exchangeRate)}</td>
                  <td style={{ padding:'9px 16px' }}>{(t.fromAmount||0).toLocaleString('en-IN')}</td>
                  <td style={{ padding:'9px 16px' }}>{(t.toAmount||0).toLocaleString('en-IN')}</td>
                  <td style={{ padding:'9px 16px',fontSize:12 }}>{fmtFX(t.spread)}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700,color:t.gainLossAmount>=0?'#27ae60':'#e74c3c' }}>{fmt(t.gainLossAmount)}</td>
                  <td style={{ padding:'9px 16px' }}><span style={{ background:t.status==='settled'?'#27ae6020':t.status==='confirmed'?'#3498db20':'#f39c1220',color:t.status==='settled'?'#27ae60':t.status==='confirmed'?'#3498db':'#f39c12',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{t.status}</span></td>
                  <td style={{ padding:'9px 16px',display:'flex',gap:4 }}>
                    {t.status!=='settled'&&t.status!=='cancelled'&&<button onClick={()=>doSettle(t._id)} style={btn('#27ae60')}>Settle</button>}
                  </td>
                </tr>
              ))}
              {!txns.length && <tr><td colSpan={11} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No FX transactions</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'accounts' && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14 }}>
          {accounts.map(a => (
            <div key={a._id} style={{ background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:15 }}>{a.currency}</div>
                  <div style={{ fontSize:11,color:'#888' }}>{a.accountNumber}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:700,fontSize:18 }}>{(a.currentBalance||0).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize:11,color:'#888' }}>{a.currency}</div>
                </div>
              </div>
              <div style={{ marginTop:12,display:'flex',justifyContent:'space-between',fontSize:12 }}>
                <span>INR: <strong>{fmt(a.currentBalanceINR)}</strong></span>
                <span style={{ color:a.unrealizedGainLoss>=0?'#27ae60':'#e74c3c' }}>
                  {a.unrealizedGainLoss>=0?'+':''}{fmt(a.unrealizedGainLoss)} (U)
                </span>
              </div>
              <div style={{ marginTop:8,fontSize:12,color:'#888' }}>Rate: {fmtFX(a.currentRate)}</div>
              <div style={{ display:'flex',gap:8,marginTop:12 }}>
                <button onClick={()=>{setForm({...a});setModal('editAcct');}} style={{ ...btn('#3498db'),flex:1 }}>Edit</button>
                <button onClick={()=>doRevalue(a._id)} style={{ ...btn('#9b59b6'),flex:1 }}>Revalue</button>
              </div>
            </div>
          ))}
          {!accounts.length && <div style={{ color:'#aaa',padding:40,textAlign:'center',gridColumn:'1/-1' }}>No currency accounts</div>}
        </div>
      )}

      {tab === 'gainloss' && (
        <div style={{ background:'#fff',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.07)',overflow:'hidden' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead><tr style={{ background:'#fafafa' }}>{['GL#','Type','Currency','Book Rate','Current Rate','Amount','Date'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {gl.map(g => (
                <tr key={g._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{g.glNumber}</td>
                  <td style={{ padding:'9px 16px' }}><span style={{ background:g.gainLossType==='realized'?'#27ae6020':'#f39c1220',color:g.gainLossType==='realized'?'#27ae60':'#f39c12',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{g.gainLossType}</span></td>
                  <td style={{ padding:'9px 16px',fontWeight:700 }}>{g.currency}</td>
                  <td style={{ padding:'9px 16px' }}>{fmtFX(g.bookRate)}</td>
                  <td style={{ padding:'9px 16px' }}>{fmtFX(g.currentRate)}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700,color:g.gainLossAmount>=0?'#27ae60':'#e74c3c' }}>{fmt(g.gainLossAmount)}</td>
                  <td style={{ padding:'9px 16px',fontSize:12 }}>{g.postingDate?new Date(g.postingDate).toLocaleDateString('en-IN'):'—'}</td>
                </tr>
              ))}
              {!gl.length && <tr><td colSpan={7} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No gain/loss records</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:480 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>
              {modal==='newRate'?'Add Exchange Rate':modal==='editRate'?'Edit Rate':modal==='newTx'?'New FX Transaction':modal==='editTx'?'Edit FX Transaction':modal==='newAcct'?'New Currency Account':'Edit Currency Account'}
            </h3>
            {(modal==='newRate'||modal==='editRate') && (
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[['fromCurrency','From Currency *'],['toCurrency','To Currency *'],['rate','Rate *'],['buyingRate','Buying Rate'],['sellingRate','Selling Rate']].map(([k,l])=>(
                  <div key={k}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type={k==='fromCurrency'||k==='toCurrency'?'text':'number'} step="0.0001" style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
                ))}
                <div><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Effective Date</label><input type="date" style={inp} value={form.effectiveDate?form.effectiveDate.slice(0,10):''} onChange={e=>setForm(f=>({...f,effectiveDate:e.target.value}))} /></div>
              </div>
            )}
            {(modal==='newTx'||modal==='editTx') && (
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Type *</label>
                  <select style={inp} value={form.transactionType||''} onChange={e=>setForm(f=>({...f,transactionType:e.target.value}))}>
                    <option value="">Select</option>
                    {TX_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {[['fromCurrency','From Currency *'],['toCurrency','To Currency *'],['exchangeRate','Exchange Rate *'],['fromAmount','From Amount *'],['bankRate','Bank Rate']].map(([k,l])=>(
                  <div key={k}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type={k==='fromCurrency'||k==='toCurrency'?'text':'number'} step={k.includes('Rate')?'0.0001':'1'} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
                ))}
                <div><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Value Date</label><input type="date" style={inp} value={form.valueDate?form.valueDate.slice(0,10):''} onChange={e=>setForm(f=>({...f,valueDate:e.target.value}))} /></div>
              </div>
            )}
            {(modal==='newAcct'||modal==='editAcct') && (
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[['accountName','Account Name *'],['currency','Currency *'],['currentBalance','Balance'],['currentRate','Current Rate'],['bankName','Bank Name'],['swiftCode','SWIFT Code']].map(([k,l])=>(
                  <div key={k}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label><input type={['currentBalance','currentRate'].includes(k)?'number':'text'} step={k==='currentRate'?'0.0001':'1'} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
                ))}
              </div>
            )}
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
