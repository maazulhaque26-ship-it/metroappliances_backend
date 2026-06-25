import React, { useEffect, useState } from 'react';
import { fetchReconciliations, createReconciliation, fetchReconciliation, autoMatchReconciliation, manualMatchReconciliation, completeReconciliation, deleteReconciliation, fetchUnmatched, fetchBankAccounts, fetchBankStatements } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

export default function AdminReconciliation() {
  const [list, setList]           = useState([]);
  const [accounts, setAccounts]   = useState([]);
  const [statements, setStmts]    = useState([]);
  const [detail, setDetail]       = useState(null);
  const [unmatched, setUnmatched] = useState({ unmatchedTxns: [], unmatchedLines: [] });
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({});
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState('');

  const load = () => Promise.all([
    fetchReconciliations({}).then(r => setList(r.data.data || [])),
    fetchBankAccounts({}).then(r => setAccounts(r.data.data || [])),
    fetchBankStatements({}).then(r => setStmts(r.data.data || [])),
  ]);
  useEffect(() => { load(); }, []);

  const openDetail = async (recon) => {
    const r = await fetchReconciliation(recon._id);
    setDetail(r.data.data);
    const u = await fetchUnmatched(recon._id);
    setUnmatched(u.data.data || { unmatchedTxns: [], unmatchedLines: [] });
  };

  const doAutoMatch = async () => {
    setLoading(true);
    try {
      const r = await autoMatchReconciliation(detail._id);
      setMsg(`Auto-matched: ${r.data.data.matched} transactions`);
      openDetail(detail);
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const doComplete = async () => {
    setLoading(true);
    try {
      await completeReconciliation(detail._id, { statementBalance: form.statementBalance, bookBalance: form.bookBalance });
      setMsg('Reconciliation completed!');
      setDetail(null); load();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    try {
      await createReconciliation(form);
      setModal(false); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
  };

  if (detail) return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <button onClick={() => { setDetail(null); setMsg(''); }} style={{ ...btn('#888'), marginBottom: 20 }}>← Back</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontWeight: 700 }}>{detail.reconciliationNumber}</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          {detail.status === 'in_progress' && <button style={btn('#f39c12')} onClick={doAutoMatch} disabled={loading}>Auto Match</button>}
          {detail.status === 'in_progress' && <button style={btn('#27ae60')} onClick={doComplete} disabled={loading}>Complete</button>}
        </div>
      </div>
      {msg && <div style={{ background: '#27ae6020', color: '#27ae60', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontWeight: 600 }}>{msg}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[['Matched', detail.totalMatched], ['Unmatched Txns', unmatched.unmatchedTxns?.length], ['Unmatched Lines', unmatched.unmatchedLines?.length], ['Status', detail.status]].map(([l,v]) => (
          <div key={l} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin: '0 0 12px' }}>Unmatched Transactions</h4>
          {(unmatched.unmatchedTxns || []).map(t => (
            <div key={t._id} style={{ display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#fafafa',borderRadius:8,marginBottom:6,fontSize:12 }}>
              <div><div style={{ fontWeight:600 }}>{t.transactionNumber}</div><div style={{ color:'#888' }}>{t.transactionType} · {t.paymentMode}</div></div>
              <div style={{ fontWeight:700,color:['receipt','transfer_in'].includes(t.transactionType)?'#27ae60':'#e74c3c' }}>{fmt(t.amount)}</div>
            </div>
          ))}
          {!unmatched.unmatchedTxns?.length && <div style={{ color:'#aaa',textAlign:'center',padding:20 }}>All matched!</div>}
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin: '0 0 12px' }}>Unmatched Statement Lines</h4>
          {(unmatched.unmatchedLines || []).map(l => (
            <div key={l._id} style={{ display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#fafafa',borderRadius:8,marginBottom:6,fontSize:12 }}>
              <div><div style={{ fontWeight:600 }}>{l.description||'—'}</div><div style={{ color:'#888' }}>{l.lineDate?new Date(l.lineDate).toLocaleDateString('en-IN'):''}</div></div>
              <div style={{ fontWeight:700 }}>{l.credit>0?'+':'-'}{fmt(Math.max(l.debit,l.credit))}</div>
            </div>
          ))}
          {!unmatched.unmatchedLines?.length && <div style={{ color:'#aaa',textAlign:'center',padding:20 }}>All matched!</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Bank Reconciliation</h2>
        <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal(true); }}>+ New Reconciliation</button>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['Recon#','Account','Period','Matched','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {list.map(r => (
              <tr key={r._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:12 }}>{r.reconciliationNumber}</td>
                <td style={{ padding:'9px 16px' }}>{r.bankAccount?.accountName||'—'}</td>
                <td style={{ padding:'9px 16px',fontSize:12,color:'#888' }}>{r.fromDate?new Date(r.fromDate).toLocaleDateString('en-IN'):''}–{r.toDate?new Date(r.toDate).toLocaleDateString('en-IN'):''}</td>
                <td style={{ padding:'9px 16px' }}>{r.totalMatched||0}</td>
                <td style={{ padding:'9px 16px' }}><span style={{ background:r.status==='completed'?'#27ae6020':r.status==='approved'?'#3498db20':'#f39c1220',color:r.status==='completed'?'#27ae60':r.status==='approved'?'#3498db':'#f39c12',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{r.status}</span></td>
                <td style={{ padding:'9px 16px' }}><button onClick={()=>openDetail(r)} style={btn('#3498db')}>Open</button></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No reconciliations yet</td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:440 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>Start Reconciliation</h3>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Bank Account *</label>
              <select style={inp} value={form.bankAccount||''} onChange={e=>setForm(f=>({...f,bankAccount:e.target.value}))}>
                <option value="">Select</option>
                {accounts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Bank Statement</label>
              <select style={inp} value={form.bankStatement||''} onChange={e=>setForm(f=>({...f,bankStatement:e.target.value}))}>
                <option value="">None</option>
                {statements.map(s=><option key={s._id} value={s._id}>{s.statementNumber}</option>)}
              </select>
            </div>
            {[['reconciliationDate','Reconciliation Date','date'],['fromDate','From Date','date'],['toDate','To Date','date']].map(([k,l,t])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                <input type={t} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
              </div>
            ))}
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button style={btn('#888')} onClick={()=>{setModal(false);setForm({});}}>Cancel</button>
              <button style={btn('var(--accent)')} onClick={save}>Start</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
