import React, { useEffect, useState } from 'react';
import { fetchPettyCashFunds, createPettyCashFund, updatePettyCashFund, replenishFund, fetchPettyCashVouchers, createPettyCashVoucher, approveVoucher } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

export default function AdminPettyCash() {
  const [funds, setFunds]       = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [selFund, setSelFund]   = useState('');
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [repAmt, setRepAmt]     = useState('');

  const load = () => Promise.all([
    fetchPettyCashFunds({}).then(r => setFunds(r.data.data || [])),
    fetchPettyCashVouchers({ pettyCash: selFund || undefined }).then(r => setVouchers(r.data.data || [])),
  ]);
  useEffect(() => { load(); }, [selFund]);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'newFund')    await createPettyCashFund(form);
      else if (modal === 'editFund') await updatePettyCashFund(form._id, form);
      else await createPettyCashVoucher(form);
      setModal(null); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const doReplenish = async (id) => {
    if (!repAmt) return alert('Enter amount');
    await replenishFund(id, { amount: repAmt });
    setRepAmt(''); load();
  };

  const doApprove = async (id) => {
    if (!window.confirm('Approve and pay this voucher?')) return;
    try { await approveVoucher(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Petty Cash</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('newFund'); }}>+ Fund</button>
          <button style={btn('#3498db')} onClick={() => { setForm({ pettyCash: selFund }); setModal('newVoucher'); }}>+ Voucher</button>
        </div>
      </div>

      {/* Funds */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14, marginBottom: 24 }}>
        {funds.map(f => {
          const pct = f.floatAmount > 0 ? Math.round((f.currentBalance / f.floatAmount) * 100) : 0;
          return (
            <div key={f._id} onClick={() => setSelFund(selFund === f._id ? '' : f._id)} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', cursor: 'pointer', borderLeft: `4px solid ${selFund===f._id?'var(--accent)':pct<20?'#e74c3c':pct<50?'#f39c12':'#27ae60'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{f.fundName}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{f.custodian} · {f.department||'—'}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setForm({...f}); setModal('editFund'); }} style={{ ...btn('#3498db'), padding: '4px 10px', fontSize: 11 }}>Edit</button>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: pct < 20 ? '#e74c3c' : '#27ae60' }}>{fmt(f.currentBalance)}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>of {fmt(f.floatAmount)} float ({pct}%)</div>
                <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, marginTop: 8 }}>
                  <div style={{ height: 4, width: `${Math.min(pct, 100)}%`, background: pct < 20 ? '#e74c3c' : pct < 50 ? '#f39c12' : '#27ae60', borderRadius: 2 }} />
                </div>
              </div>
              {pct <= f.replenishAt && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <input placeholder="Replenish amt" value={repAmt} onChange={e => setRepAmt(e.target.value)} onClick={e => e.stopPropagation()} style={{ ...inp, flex: 1, padding: '6px 10px' }} />
                  <button onClick={e => { e.stopPropagation(); doReplenish(f._id); }} style={btn('#27ae60')}>Add</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vouchers */}
      <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Vouchers {selFund && funds.find(f=>f._id===selFund) && `— ${funds.find(f=>f._id===selFund).fundName}`}</h3>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['Voucher#','Fund','Date','Purpose','Payee','Amount','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {vouchers.map(v => (
              <tr key={v._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{v.voucherNumber}</td>
                <td style={{ padding:'9px 16px' }}>{v.pettyCash?.fundName||'—'}</td>
                <td style={{ padding:'9px 16px' }}>{v.voucherDate?new Date(v.voucherDate).toLocaleDateString('en-IN'):'—'}</td>
                <td style={{ padding:'9px 16px' }}>{v.purpose}</td>
                <td style={{ padding:'9px 16px' }}>{v.payee||'—'}</td>
                <td style={{ padding:'9px 16px',fontWeight:700,color:'#e74c3c' }}>{fmt(v.amount)}</td>
                <td style={{ padding:'9px 16px' }}><span style={{ background:v.status==='approved'?'#27ae6020':v.status==='draft'?'#f39c1220':'#e74c3c20',color:v.status==='approved'?'#27ae60':v.status==='draft'?'#f39c12':'#e74c3c',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{v.status}</span></td>
                <td style={{ padding:'9px 16px' }}>
                  {v.status==='draft' && <button onClick={()=>doApprove(v._id)} style={btn('#27ae60')}>Approve</button>}
                </td>
              </tr>
            ))}
            {!vouchers.length && <tr><td colSpan={8} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No vouchers</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:460 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>{modal==='newFund'?'New Petty Cash Fund':modal==='editFund'?'Edit Fund':'New Voucher'}</h3>
            {(modal==='newFund'||modal==='editFund') && [['fundName','Fund Name *'],['custodian','Custodian *'],['department','Department'],['floatAmount','Float Amount'],['replenishAt','Replenish At (%)']].map(([k,l])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                <input style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
              </div>
            ))}
            {modal==='newVoucher' && <>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Fund *</label>
                <select style={inp} value={form.pettyCash||''} onChange={e=>setForm(f=>({...f,pettyCash:e.target.value}))}>
                  <option value="">Select</option>
                  {funds.map(f=><option key={f._id} value={f._id}>{f.fundName}</option>)}
                </select>
              </div>
              {[['voucherDate','Date'],['purpose','Purpose *'],['amount','Amount *'],['payee','Payee'],['expenseHead','Expense Head'],['receiptNo','Receipt No']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  <input type={k==='voucherDate'?'date':k==='amount'?'number':'text'} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
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
