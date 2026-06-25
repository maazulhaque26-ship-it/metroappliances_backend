import React, { useEffect, useState } from 'react';
import { fetchBankStatements, createBankStatement, fetchStatementLines, fetchBankAccounts } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '9px 20px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 });

const STATUS_COLORS = { imported: '#f39c12', reconciling: '#3498db', reconciled: '#27ae60' };

export default function AdminBankStatements() {
  const [statements, setStmts]  = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [lines, setLines]       = useState([]);
  const [viewStmt, setViewStmt] = useState(null);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [filterAcct, setFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);

  const load = () => Promise.all([
    fetchBankStatements({ bankAccount: filterAcct || undefined, page, limit: 15 }).then(r => { setStmts(r.data.data || []); setTotal(r.data.pagination?.total || 0); }),
    fetchBankAccounts({}).then(r => setAccounts(r.data.data || [])),
  ]);
  useEffect(() => { load(); }, [filterAcct, page]);

  const viewLines = async (stmt) => {
    setViewStmt(stmt);
    const r = await fetchStatementLines(stmt._id, { limit: 100 });
    setLines(r.data.data || []);
  };

  const save = async () => {
    setSaving(true);
    try {
      await createBankStatement(form);
      setModal(false); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  if (viewStmt) return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <button onClick={() => setViewStmt(null)} style={{ ...btn('#888'), marginBottom: 20 }}>← Back to Statements</button>
      <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>{viewStmt.statementNumber} — Lines</h3>
      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        {[['Opening', fmt(viewStmt.openingBalance)], ['Closing', fmt(viewStmt.closingBalance)], ['Credits', fmt(viewStmt.totalCredits)], ['Debits', fmt(viewStmt.totalDebits)], ['Lines', viewStmt.lineCount]].map(([l, v]) => (
          <div key={l} style={{ background: '#fff', borderRadius: 10, padding: '12px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{v}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['Date','Description','Reference','Debit','Credit','Balance','Match'].map(h=><th key={h} style={{ textAlign:'left',padding:'9px 14px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {lines.map(l => (
              <tr key={l._id} style={{ borderTop: '1px solid #f5f5f5', background: l.matchStatus==='matched'?'#27ae6008':l.matchStatus==='unmatched'?'transparent':'#f39c1208' }}>
                <td style={{ padding:'8px 14px' }}>{l.lineDate?new Date(l.lineDate).toLocaleDateString('en-IN'):'—'}</td>
                <td style={{ padding:'8px 14px' }}>{l.description||'—'}</td>
                <td style={{ padding:'8px 14px',color:'#888' }}>{l.reference||l.chequeNo||'—'}</td>
                <td style={{ padding:'8px 14px',color:'#e74c3c',fontWeight:600 }}>{l.debit>0?fmt(l.debit):'—'}</td>
                <td style={{ padding:'8px 14px',color:'#27ae60',fontWeight:600 }}>{l.credit>0?fmt(l.credit):'—'}</td>
                <td style={{ padding:'8px 14px' }}>{fmt(l.balance)}</td>
                <td style={{ padding:'8px 14px' }}><span style={{ background:l.matchStatus==='matched'?'#27ae6020':l.matchStatus==='unmatched'?'#e74c3c20':'#f39c1220',color:l.matchStatus==='matched'?'#27ae60':l.matchStatus==='unmatched'?'#e74c3c':'#f39c12',borderRadius:5,padding:'2px 7px',fontSize:11,fontWeight:600 }}>{l.matchStatus}</span></td>
              </tr>
            ))}
            {!lines.length && <tr><td colSpan={7} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No lines found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Bank Statements</h2>
        <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal(true); }}>+ Import Statement</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <select style={{ ...inp, maxWidth: 240 }} value={filterAcct} onChange={e => setFilter(e.target.value)}>
          <option value="">All Accounts</option>
          {accounts.map(a => <option key={a._id} value={a._id}>{a.accountName}</option>)}
        </select>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['Statement#','Account','Period','Opening','Closing','Lines','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {statements.map(s => (
              <tr key={s._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:12 }}>{s.statementNumber}</td>
                <td style={{ padding:'9px 16px' }}>{s.bankAccount?.accountName||'—'}</td>
                <td style={{ padding:'9px 16px',fontSize:12,color:'#888' }}>{s.fromDate?new Date(s.fromDate).toLocaleDateString('en-IN'):''}–{s.toDate?new Date(s.toDate).toLocaleDateString('en-IN'):''}</td>
                <td style={{ padding:'9px 16px' }}>{fmt(s.openingBalance)}</td>
                <td style={{ padding:'9px 16px',fontWeight:600 }}>{fmt(s.closingBalance)}</td>
                <td style={{ padding:'9px 16px' }}>{s.lineCount}</td>
                <td style={{ padding:'9px 16px' }}><span style={{ background:(STATUS_COLORS[s.status]||'#888')+'20',color:STATUS_COLORS[s.status]||'#888',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{s.status}</span></td>
                <td style={{ padding:'9px 16px' }}><button onClick={()=>viewLines(s)} style={{ ...btn('#3498db'),padding:'6px 14px',fontSize:12 }}>View Lines</button></td>
              </tr>
            ))}
            {!statements.length && <tr><td colSpan={8} style={{ padding:40,textAlign:'center',color:'#aaa' }}>No statements</td></tr>}
          </tbody>
        </table>
        <div style={{ padding:'12px 16px',borderTop:'1px solid #f0f0f0',fontSize:12,color:'#888' }}>Total: {total}</div>
      </div>

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:460 }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>Import Bank Statement</h3>
            <div>
              <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Bank Account *</label>
              <select style={{ ...inp,marginBottom:12 }} value={form.bankAccount||''} onChange={e=>setForm(f=>({...f,bankAccount:e.target.value}))}>
                <option value="">Select account</option>
                {accounts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}
              </select>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[['fromDate','From Date','date'],['toDate','To Date','date'],['openingBalance','Opening Balance','number'],['closingBalance','Closing Balance','number']].map(([k,l,t])=>(
                  <div key={k}>
                    <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                    <input type={t||'text'} style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                  </div>
                ))}
              </div>
            </div>
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
