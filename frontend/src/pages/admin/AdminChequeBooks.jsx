import React, { useEffect, useState } from 'react';
import { fetchChequeBooks, createChequeBook, fetchCheques, createCheque, updateChequeStatus, fetchBankAccounts } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

const CHEQUE_STATUSES = ['draft','issued','presented','cleared','bounced','cancelled','stopped'];
const STATUS_COLORS = { draft:'#888',issued:'#3498db',presented:'#f39c12',cleared:'#27ae60',bounced:'#e74c3c',cancelled:'#e74c3c',stopped:'#e74c3c' };

export default function AdminChequeBooks() {
  const [books, setBooks]       = useState([]);
  const [cheques, setCheques]   = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [tab, setTab]           = useState('books');
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [filters, setFilters]   = useState({});

  const load = () => Promise.all([
    fetchChequeBooks({}).then(r => setBooks(r.data.data || [])),
    fetchCheques(filters).then(r => setCheques(r.data.data || [])),
    fetchBankAccounts({}).then(r => setAccounts(r.data.data || [])),
  ]);
  useEffect(() => { load(); }, [JSON.stringify(filters)]);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'newBook') await createChequeBook(form);
      else if (modal === 'newCheque') await createCheque(form);
      setModal(null); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (id, status) => {
    try { await updateChequeStatus(id, { status }); load(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Cheque Books & Cheques</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('newBook'); }}>+ Cheque Book</button>
          <button style={btn('#3498db')} onClick={() => { setForm({}); setModal('newCheque'); }}>+ Cheque</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f0f0f0', marginBottom: 20 }}>
        {[['books','Cheque Books'],['cheques','Cheques']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding:'9px 22px',border:'none',background:'none',fontWeight:tab===k?700:400,color:tab===k?'var(--accent)':'#888',borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent',cursor:'pointer',fontSize:14,marginBottom:-2 }}>{l}</button>
        ))}
      </div>

      {tab === 'books' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#fafafa' }}>{['Book#','Account','From-To','Total','Used','Available','Status'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {books.map(b => (
                <tr key={b._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{b.chequeBookNumber}</td>
                  <td style={{ padding:'9px 16px' }}>{b.bankAccount?.accountName||'—'}</td>
                  <td style={{ padding:'9px 16px',fontSize:12 }}>{b.fromChequeNo} – {b.toChequeNo}</td>
                  <td style={{ padding:'9px 16px' }}>{b.totalLeaves}</td>
                  <td style={{ padding:'9px 16px' }}>{b.usedLeaves}</td>
                  <td style={{ padding:'9px 16px',fontWeight:700,color:b.availableLeaves<5?'#e74c3c':'#27ae60' }}>{b.availableLeaves}</td>
                  <td style={{ padding:'9px 16px' }}><span style={{ background:b.status==='active'?'#27ae6020':'#e74c3c20',color:b.status==='active'?'#27ae60':'#e74c3c',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{b.status}</span></td>
                </tr>
              ))}
              {!books.length && <tr><td colSpan={7} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No cheque books</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'cheques' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <select style={{ ...inp, maxWidth: 180 }} value={filters.bankAccount||''} onChange={e=>setFilters(f=>({...f,bankAccount:e.target.value||undefined}))}>
              <option value="">All Accounts</option>
              {accounts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}
            </select>
            <select style={{ ...inp, maxWidth: 140 }} value={filters.chequeType||''} onChange={e=>setFilters(f=>({...f,chequeType:e.target.value||undefined}))}>
              <option value="">All Types</option>
              <option value="issued">Issued</option>
              <option value="received">Received</option>
            </select>
            <select style={{ ...inp, maxWidth: 140 }} value={filters.status||''} onChange={e=>setFilters(f=>({...f,status:e.target.value||undefined}))}>
              <option value="">All Status</option>
              {CHEQUE_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: '#fafafa' }}>{['Cheque#','Account','Date','Payee','Amount','Type','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
              <tbody>
                {cheques.map(c => (
                  <tr key={c._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                    <td style={{ padding:'9px 16px',fontFamily:'monospace',fontWeight:600 }}>{c.chequeNumber}</td>
                    <td style={{ padding:'9px 16px' }}>{c.bankAccount?.accountName||'—'}</td>
                    <td style={{ padding:'9px 16px' }}>{c.chequeDate?new Date(c.chequeDate).toLocaleDateString('en-IN'):'—'}</td>
                    <td style={{ padding:'9px 16px' }}>{c.payee}</td>
                    <td style={{ padding:'9px 16px',fontWeight:700 }}>{fmt(c.amount)}</td>
                    <td style={{ padding:'9px 16px',fontSize:12 }}>{c.chequeType}</td>
                    <td style={{ padding:'9px 16px' }}><span style={{ background:(STATUS_COLORS[c.status]||'#888')+'20',color:STATUS_COLORS[c.status]||'#888',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{c.status}</span></td>
                    <td style={{ padding:'9px 16px',display:'flex',gap:6 }}>
                      {c.status==='issued'&&<button onClick={()=>changeStatus(c._id,'presented')} style={btn('#f39c12')}>Presented</button>}
                      {c.status==='presented'&&<button onClick={()=>changeStatus(c._id,'cleared')} style={btn('#27ae60')}>Cleared</button>}
                      {c.status==='presented'&&<button onClick={()=>changeStatus(c._id,'bounced')} style={btn('#e74c3c')}>Bounced</button>}
                    </td>
                  </tr>
                ))}
                {!cheques.length && <tr><td colSpan={8} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No cheques</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:460 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>{modal==='newBook'?'New Cheque Book':'New Cheque'}</h3>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Bank Account *</label>
              <select style={inp} value={form.bankAccount||''} onChange={e=>setForm(f=>({...f,bankAccount:e.target.value}))}>
                <option value="">Select</option>
                {accounts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}
              </select>
            </div>
            {modal==='newBook' && [['fromChequeNo','From Cheque #'],['toChequeNo','To Cheque #']].map(([k,l])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                <input style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
              </div>
            ))}
            {modal==='newCheque' && <>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Type *</label>
                <select style={inp} value={form.chequeType||''} onChange={e=>setForm(f=>({...f,chequeType:e.target.value}))}>
                  <option value="">Select</option>
                  <option value="issued">Issued</option>
                  <option value="received">Received</option>
                </select>
              </div>
              {[['chequeNumber','Cheque # *'],['payee','Payee *'],['amount','Amount *'],['chequeDate','Cheque Date'],['narration','Narration']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  <input type={k==='chequeDate'?'date':k==='amount'?'number':'text'} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
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
