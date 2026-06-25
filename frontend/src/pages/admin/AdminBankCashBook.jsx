import React, { useEffect, useState } from 'react';
import { fetchCashAccounts, createCashAccount, fetchCashTransactions, createCashTransaction } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '9px 20px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 });

const TX_TYPES = ['receipt', 'payment', 'transfer_in', 'transfer_out', 'adjustment'];

export default function AdminBankCashBook() {
  const [accounts, setAccounts] = useState([]);
  const [txns, setTxns]         = useState([]);
  const [selAcct, setSelAcct]   = useState('');
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [filters, setFilters]   = useState({});

  const loadAccounts = () => fetchCashAccounts({}).then(r => setAccounts(r.data.data || []));
  const loadTxns = () => {
    const p = { page, limit: 20, cashAccount: selAcct || undefined, ...filters };
    fetchCashTransactions(p).then(r => { setTxns(r.data.data || []); setTotal(r.data.pagination?.total || 0); });
  };
  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { loadTxns(); }, [selAcct, page, filters]);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'newAcct') await createCashAccount(form);
      else await createCashTransaction(form);
      setModal(null); setForm({}); loadAccounts(); loadTxns();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const selAccount = accounts.find(a => a._id === selAcct);

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Cash Book (Banking)</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btn('#3498db')} onClick={() => { setForm({}); setModal('newAcct'); }}>+ Cash Account</button>
          <button style={btn('var(--accent)')} onClick={() => { setForm({ cashAccount: selAcct }); setModal('newTx'); }}>+ Transaction</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
        {accounts.map(a => (
          <div key={a._id} onClick={() => setSelAcct(selAcct === a._id ? '' : a._id)} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)', cursor: 'pointer', borderLeft: `4px solid ${selAcct === a._id ? 'var(--accent)' : '#e0e0e0'}` }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{a.accountName}</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{a.accountNumber}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#27ae60' }}>{fmt(a.currentBalance)}</div>
          </div>
        ))}
      </div>

      {selAccount && (
        <div style={{ background: '#fff9e6', border: '1px solid #f39c12', borderRadius: 10, padding: '10px 18px', marginBottom: 16, fontSize: 13 }}>
          Showing: <strong>{selAccount.accountName}</strong> — Balance: <strong>{fmt(selAccount.currentBalance)}</strong>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select style={{ ...inp, maxWidth: 160 }} value={filters.transactionType || ''} onChange={e => setFilters(f => ({ ...f, transactionType: e.target.value || undefined }))}>
          <option value="">All Types</option>
          {TX_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
        </select>
        <input type="date" style={{ ...inp, maxWidth: 150 }} value={filters.startDate || ''} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
        <input type="date" style={{ ...inp, maxWidth: 150 }} value={filters.endDate || ''} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['Txn#','Account','Date','Type','Party','Amount','Ref','Status'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {txns.map(t => (
              <tr key={t._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{t.transactionNumber}</td>
                <td style={{ padding:'9px 16px' }}>{t.cashAccount?.accountName||'—'}</td>
                <td style={{ padding:'9px 16px' }}>{t.transactionDate?new Date(t.transactionDate).toLocaleDateString('en-IN'):'—'}</td>
                <td style={{ padding:'9px 16px',textTransform:'capitalize' }}>{(t.transactionType||'').replace(/_/g,' ')}</td>
                <td style={{ padding:'9px 16px' }}>{t.partyName||'—'}</td>
                <td style={{ padding:'9px 16px',fontWeight:700,color:['receipt','transfer_in'].includes(t.transactionType)?'#27ae60':'#e74c3c' }}>{fmt(t.amount)}</td>
                <td style={{ padding:'9px 16px',fontSize:11,color:'#888' }}>{t.referenceNumber||'—'}</td>
                <td style={{ padding:'9px 16px' }}><span style={{ background:t.status==='completed'?'#27ae6020':'#f39c1220',color:t.status==='completed'?'#27ae60':'#f39c12',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{t.status}</span></td>
              </tr>
            ))}
            {!txns.length && <tr><td colSpan={8} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No transactions</td></tr>}
          </tbody>
        </table>
        <div style={{ padding:'12px 16px',borderTop:'1px solid #f0f0f0',fontSize:12,color:'#888',display:'flex',justifyContent:'space-between' }}>
          <span>Total: {total}</span>
          <div style={{ display:'flex',gap:8 }}>
            {page>1&&<button style={btn('#888')} onClick={()=>setPage(p=>p-1)}>← Prev</button>}
            <span style={{ lineHeight:'34px' }}>Page {page}</span>
            {txns.length===20&&<button style={btn('#888')} onClick={()=>setPage(p=>p+1)}>Next →</button>}
          </div>
        </div>
      </div>

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:460 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>{modal==='newAcct'?'New Cash Account':'Record Cash Transaction'}</h3>
            {modal==='newAcct' && [['accountName','Account Name *'],['location','Location'],['maxLimit','Max Limit'],['currency','Currency']].map(([k,l])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                <input style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
              </div>
            ))}
            {modal==='newTx' && <>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Cash Account *</label>
                <select style={inp} value={form.cashAccount||''} onChange={e=>setForm(f=>({...f,cashAccount:e.target.value}))}>
                  <option value="">Select</option>
                  {accounts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}
                </select>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[['transactionDate','Date','date'],['amount','Amount *','number'],['partyName','Party Name','text'],['referenceNumber','Reference','text'],['narration','Narration','text']].map(([k,l,t])=>(
                  <div key={k} style={{ gridColumn:k==='narration'?'1/-1':'auto' }}>
                    <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                    <input type={t} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Type *</label>
                  <select style={inp} value={form.transactionType||''} onChange={e=>setForm(f=>({...f,transactionType:e.target.value}))}>
                    <option value="">Select</option>
                    {TX_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
              </div>
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
