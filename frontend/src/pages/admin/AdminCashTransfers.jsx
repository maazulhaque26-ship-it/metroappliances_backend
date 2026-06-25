import React, { useEffect, useState } from 'react';
import { fetchCashTransfers, createCashTransfer, completeTransfer, fetchBankAccounts, fetchCashAccounts } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '9px 20px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 });

const TRANSFER_TYPES = ['bank_to_bank', 'bank_to_cash', 'cash_to_bank', 'cash_to_cash'];

export default function AdminCashTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [bankAccts, setBankAccts] = useState([]);
  const [cashAccts, setCashAccts] = useState([]);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({});
  const [saving, setSaving]       = useState(false);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);

  const load = () => Promise.all([
    fetchCashTransfers({ page, limit: 20 }).then(r => { setTransfers(r.data.data || []); setTotal(r.data.pagination?.total || 0); }),
    fetchBankAccounts({}).then(r => setBankAccts(r.data.data || [])),
    fetchCashAccounts({}).then(r => setCashAccts(r.data.data || [])),
  ]);
  useEffect(() => { load(); }, [page]);

  const save = async () => {
    setSaving(true);
    try {
      await createCashTransfer(form);
      setModal(false); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const doComplete = async (id) => {
    try { await completeTransfer(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  const fromBankNeeded  = ['bank_to_bank', 'bank_to_cash'].includes(form.transferType);
  const toBankNeeded    = ['bank_to_bank', 'cash_to_bank'].includes(form.transferType);
  const fromCashNeeded  = ['cash_to_bank', 'cash_to_cash'].includes(form.transferType);
  const toCashNeeded    = ['bank_to_cash', 'cash_to_cash'].includes(form.transferType);

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Cash Transfers</h2>
        <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal(true); }}>+ New Transfer</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['Transfer#','Date','Type','From','To','Amount','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {transfers.map(t => (
              <tr key={t._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{t.transferNumber}</td>
                <td style={{ padding:'9px 16px' }}>{t.transferDate?new Date(t.transferDate).toLocaleDateString('en-IN'):'—'}</td>
                <td style={{ padding:'9px 16px',textTransform:'capitalize',fontSize:12 }}>{(t.transferType||'').replace(/_/g,' ')}</td>
                <td style={{ padding:'9px 16px',fontSize:12 }}>{t.fromAccount?.accountName||t.fromCashAccount?.accountName||'—'}</td>
                <td style={{ padding:'9px 16px',fontSize:12 }}>{t.toAccount?.accountName||t.toCashAccount?.accountName||'—'}</td>
                <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(t.amount)}</td>
                <td style={{ padding:'9px 16px' }}><span style={{ background:t.status==='completed'?'#27ae6020':t.status==='pending'?'#f39c1220':'#e74c3c20',color:t.status==='completed'?'#27ae60':t.status==='pending'?'#f39c12':'#e74c3c',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{t.status}</span></td>
                <td style={{ padding:'9px 16px' }}>
                  {t.status==='pending'&&<button onClick={()=>doComplete(t._id)} style={btn('#27ae60')}>Complete</button>}
                </td>
              </tr>
            ))}
            {!transfers.length && <tr><td colSpan={8} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No transfers</td></tr>}
          </tbody>
        </table>
        <div style={{ padding:'12px 16px',borderTop:'1px solid #f0f0f0',fontSize:12,color:'#888' }}>Total: {total}</div>
      </div>

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:480 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>New Cash Transfer</h3>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Transfer Type *</label>
              <select style={inp} value={form.transferType||''} onChange={e=>setForm(f=>({...f,transferType:e.target.value}))}>
                <option value="">Select type</option>
                {TRANSFER_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            {fromBankNeeded && <div style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>From Bank Account</label><select style={inp} value={form.fromAccount||''} onChange={e=>setForm(f=>({...f,fromAccount:e.target.value}))}><option value="">Select</option>{bankAccts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}</select></div>}
            {fromCashNeeded && <div style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>From Cash Account</label><select style={inp} value={form.fromCashAccount||''} onChange={e=>setForm(f=>({...f,fromCashAccount:e.target.value}))}><option value="">Select</option>{cashAccts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}</select></div>}
            {toBankNeeded   && <div style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>To Bank Account</label><select style={inp} value={form.toAccount||''} onChange={e=>setForm(f=>({...f,toAccount:e.target.value}))}><option value="">Select</option>{bankAccts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}</select></div>}
            {toCashNeeded   && <div style={{ marginBottom:12 }}><label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>To Cash Account</label><select style={inp} value={form.toCashAccount||''} onChange={e=>setForm(f=>({...f,toCashAccount:e.target.value}))}><option value="">Select</option>{cashAccts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}</select></div>}
            {[['transferDate','Transfer Date'],['amount','Amount *'],['narration','Narration'],['referenceNumber','Reference']].map(([k,l])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                <input type={k==='transferDate'?'date':k==='amount'?'number':'text'} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
              </div>
            ))}
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button style={btn('#888')} onClick={()=>{setModal(false);setForm({});}}>Cancel</button>
              <button style={btn('var(--accent)')} onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
