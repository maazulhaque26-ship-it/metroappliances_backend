import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchConsolidationGroups, createConsolidationGroup, updateConsolidationGroup, deleteConsolidationGroup, fetchConsolidationCompanies, createConsolidationCompany, deleteConsolidationCompany, fetchICTransactions, createICTransaction, fetchEliminations as fetchEliminationEntries, fetchConsolidatedPnL, fetchConsolidatedBalanceSheet } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${Number(n||0).toLocaleString('en-IN')}`;
const ENTITY_TYPES = ['branch','factory','warehouse','company','division'];

export default function AdminConsolidationDashboard() {
  const [groups, setGroups]       = useState([]);
  const [companies, setCompanies] = useState([]);
  const [icTx, setIcTx]           = useState([]);
  const [elims, setElims]         = useState([]);
  const [pnl, setPnl]             = useState([]);
  const [bs, setBs]               = useState(null);
  const [tab, setTab]             = useState('groups');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [grpModal, setGrpModal]   = useState(null);
  const [grpForm, setGrpForm]     = useState({ groupName:'', description:'', currency:'INR' });
  const [coModal, setCoModal]     = useState(false);
  const [coForm, setCoForm]       = useState({ group:'', companyName:'', entityType:'branch', entityRef:'' });
  const [icModal, setIcModal]     = useState(false);
  const [icForm, setIcForm]       = useState({ fromCompany:'', toCompany:'', transactionType:'sale', amount:0, currency:'INR', description:'', transactionDate:'' });
  const [error, setError]         = useState('');

  const load = async () => {
    try {
      const [g, c, ic, el] = await Promise.all([fetchConsolidationGroups(), fetchConsolidationCompanies(), fetchICTransactions(), fetchEliminationEntries()]);
      setGroups(g.data.data || []);
      setCompanies(c.data.data || []);
      setIcTx(ic.data.data || []);
      setElims(el.data.data || []);
    } catch { setError('Load failed'); }
  };

  const loadConsolidated = async () => {
    if (!selectedGroup) return;
    try {
      const [p, b] = await Promise.all([fetchConsolidatedPnL({ groupId: selectedGroup }), fetchConsolidatedBalanceSheet({ groupId: selectedGroup })]);
      setPnl(p.data.data || []);
      setBs(b.data.data || null);
    } catch { setError('Consolidated load failed'); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedGroup) loadConsolidated(); }, [selectedGroup]);

  const saveGroup = async () => {
    try {
      if (grpModal === 'create') await createConsolidationGroup(grpForm);
      else await updateConsolidationGroup(grpForm._id, grpForm);
      setGrpModal(null); setGrpForm({ groupName:'', description:'', currency:'INR' }); load();
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
  };

  const deleteGroup = async (id) => {
    if (!confirm('Delete group?')) return;
    try { await deleteConsolidationGroup(id); load(); } catch { alert('Delete failed'); }
  };

  const saveCompany = async () => {
    try { await createConsolidationCompany(coForm); setCoModal(false); setCoForm({ group:'', companyName:'', entityType:'branch', entityRef:'' }); load(); }
    catch (e) { setError(e.response?.data?.message || 'Save failed'); }
  };

  const deleteCompany = async (id) => {
    if (!confirm('Delete company?')) return;
    try { await deleteConsolidationCompany(id); load(); } catch { alert('Delete failed'); }
  };

  const saveICTx = async () => {
    try { await createICTransaction(icForm); setIcModal(false); setIcForm({ fromCompany:'', toCompany:'', transactionType:'sale', amount:0, currency:'INR', description:'', transactionDate:'' }); load(); }
    catch (e) { setError(e.response?.data?.message || 'Save failed'); }
  };

  return (
    <div style={{ fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:0 }}>Consolidation</h1>
          <p style={{ fontSize:12.5, color:'var(--text-4)', marginTop:2 }}>Group Consolidation, IC Transactions & Eliminations</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setIcModal(true)} style={{ padding:'8px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:12.5, cursor:'pointer', color:'var(--text)' }}>+ IC Transaction</button>
          <button onClick={() => setCoModal(true)} style={{ padding:'8px 14px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:12.5, cursor:'pointer', color:'var(--text)' }}>+ Company</button>
          <button onClick={() => { setGrpModal('create'); setGrpForm({ groupName:'', description:'', consolidationCurrency:'INR' }); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            <FiPlus size={14} /> New Group
          </button>
        </div>
      </div>
      {error && <p style={{ color:'#ef4444', fontSize:12.5, marginBottom:8 }}>{error}</p>}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {['groups','companies','ic_transactions','eliminations','consolidated'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 16px', fontSize:12.5, fontWeight:tab===t?700:500, color:tab===t?'var(--accent)':'var(--text-4)', background:'none', border:'none', borderBottom:tab===t?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer' }}>
            {t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
          </button>
        ))}
      </div>

      {tab === 'groups' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['#','Group Name','Currency','Companies','Status','Actions'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={g._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                  <td style={{ padding:'9px 12px', fontSize:11, color:'var(--text-4)' }}>{g.groupCode}</td>
                  <td style={{ padding:'9px 12px', fontWeight:600 }}>{g.groupName}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{g.currency}</td>
                  <td style={{ padding:'9px 12px' }}>{companies.filter(c=>(c.group?._id||c.group)===g._id).length}</td>
                  <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:g.isActive?'#22c55e20':'#6b728020', color:g.isActive?'#22c55e':'#6b7280' }}>{g.isActive?'Active':'Inactive'}</span></td>
                  <td style={{ padding:'9px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => { setSelectedGroup(g._id); setTab('consolidated'); }} style={{ padding:'3px 8px', fontSize:11, background:'#3b82f620', color:'#3b82f6', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 }}>View</button>
                      <button onClick={() => { setGrpModal('edit'); setGrpForm({...g}); }} style={{ padding:'3px 7px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text-4)' }}><FiEdit2 size={11} /></button>
                      <button onClick={() => deleteGroup(g._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {groups.length===0 && <tr><td colSpan={6} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No groups</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'companies' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['#','Entity Name','Type','Code','Group','Status','Actions'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {companies.map((c, i) => {
                const grp = groups.find(g=>g._id===(c.group?._id||c.group));
                return (
                  <tr key={c._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                    <td style={{ padding:'9px 12px', fontSize:11, color:'var(--text-4)' }}>{c.companyCode}</td>
                    <td style={{ padding:'9px 12px', fontWeight:600 }}>{c.companyName}</td>
                    <td style={{ padding:'9px 12px', textTransform:'capitalize', color:'var(--text-4)' }}>{c.entityType}</td>
                    <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{c.entityRef}</td>
                    <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{grp?.groupName||'—'}</td>
                    <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:c.isActive?'#22c55e20':'#6b728020', color:c.isActive?'#22c55e':'#6b7280' }}>{c.isActive?'Active':'Inactive'}</span></td>
                    <td style={{ padding:'9px 12px' }}><button onClick={() => deleteCompany(c._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button></td>
                  </tr>
                );
              })}
              {companies.length===0 && <tr><td colSpan={7} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No companies</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ic_transactions' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['#','From','To','Type','Amount','Date','Status'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {icTx.map((t, i) => (
                <tr key={t._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                  <td style={{ padding:'9px 12px', fontSize:11, color:'var(--text-4)' }}>{t.txNumber}</td>
                  <td style={{ padding:'9px 12px', fontWeight:600 }}>{t.fromCompany?.companyName||t.fromCompany||'—'}</td>
                  <td style={{ padding:'9px 12px', fontWeight:600 }}>{t.toCompany?.companyName||t.toCompany||'—'}</td>
                  <td style={{ padding:'9px 12px', textTransform:'capitalize', color:'var(--text-4)' }}>{t.transactionType?.replace(/_/g,' ')}</td>
                  <td style={{ padding:'9px 12px', color:'var(--accent)', fontWeight:700 }}>{fmt(t.amount)}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{t.transactionDate?.slice(0,10)}</td>
                  <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:t.status==='matched'?'#22c55e20':t.status==='eliminated'?'#a855f720':'#6b728020', color:t.status==='matched'?'#22c55e':t.status==='eliminated'?'#a855f7':'#6b7280' }}>{t.status}</span></td>
                </tr>
              ))}
              {icTx.length===0 && <tr><td colSpan={7} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No IC transactions</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'eliminations' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['#','Type','Debit Acct','Credit Acct','Amount','Period','Status'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {elims.map((e, i) => (
                <tr key={e._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                  <td style={{ padding:'9px 12px', fontSize:11, color:'var(--text-4)' }}>{e.eliminationNumber}</td>
                  <td style={{ padding:'9px 12px', textTransform:'capitalize' }}>{e.eliminationType?.replace(/_/g,' ')}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{e.debitAccount}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{e.creditAccount}</td>
                  <td style={{ padding:'9px 12px', color:'#ef4444', fontWeight:600 }}>{fmt(e.amount)}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{e.period}</td>
                  <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:e.status==='posted'?'#22c55e20':'#6b728020', color:e.status==='posted'?'#22c55e':'#6b7280' }}>{e.status}</span></td>
                </tr>
              ))}
              {elims.length===0 && <tr><td colSpan={7} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No elimination entries</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'consolidated' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
            <select value={selectedGroup} onChange={e=>setSelectedGroup(e.target.value)} style={{ padding:'7px 12px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)', minWidth:200 }}>
              <option value="">Select Group</option>
              {groups.map(g=><option key={g._id} value={g._id}>{g.groupName}</option>)}
            </select>
            <button onClick={loadConsolidated} style={{ padding:'7px 14px', fontSize:12.5, background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, cursor:'pointer' }}>Refresh</button>
          </div>
          {pnl.length > 0 && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.25rem', marginBottom:16 }}>
              <h3 style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Consolidated P&L by Entity</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pnl}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="entityName" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`₹${(v/1e5).toFixed(0)}L`} />
                  <Tooltip formatter={v=>fmt(v)} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="totalRevenue" fill="#22c55e" name="Revenue" radius={[3,3,0,0]} />
                  <Bar dataKey="netProfit" fill="var(--accent)" name="Net Profit" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {bs && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[['Total Assets', fmt(bs.totalAssets), '#22c55e'],['Total Liabilities', fmt(bs.totalLiabilities), '#ef4444'],['Equity', fmt(bs.totalEquity), '#3b82f6'],['Net Worth', fmt(bs.netWorth||0), 'var(--accent)']].map(([l,v,c]) => (
                <div key={l} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1rem 1.25rem' }}>
                  <p style={{ fontSize:11, color:'var(--text-4)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>{l}</p>
                  <p style={{ fontSize:22, fontWeight:800, color:c }}>{v}</p>
                </div>
              ))}
            </div>
          )}
          {!selectedGroup && <p style={{ color:'var(--text-4)', textAlign:'center', padding:'2rem' }}>Select a consolidation group above</p>}
        </div>
      )}

      {/* Group Modal */}
      {grpModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:440 }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>{grpModal==='create'?'New Consolidation Group':'Edit Group'}</h2>
            {[['groupName','Group Name'],['description','Description'],['currency','Currency']].map(([k,lbl]) => (
              <div key={k} style={{ marginBottom:10 }}>
                <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                <input value={grpForm[k]||''} onChange={e=>setGrpForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <button onClick={() => setGrpModal(null)} style={{ padding:'7px 16px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', cursor:'pointer' }}>Cancel</button>
              <button onClick={saveGroup} style={{ padding:'7px 20px', fontSize:12.5, fontWeight:700, background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Company Modal */}
      {coModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:440 }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>Add Entity</h2>
            <div style={{ marginBottom:10 }}>
              <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>Group</label>
              <select value={coForm.group} onChange={e=>setCoForm(f=>({...f,group:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
                <option value="">Select Group</option>
                {groups.map(g=><option key={g._id} value={g._id}>{g.groupName}</option>)}
              </select>
            </div>
            {[['companyName','Company Name'],['entityRef','Entity Code/Ref']].map(([k,lbl]) => (
              <div key={k} style={{ marginBottom:10 }}>
                <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                <input value={coForm[k]||''} onChange={e=>setCoForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
              </div>
            ))}
            <div style={{ marginBottom:10 }}>
              <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>Entity Type</label>
              <select value={coForm.entityType} onChange={e=>setCoForm(f=>({...f,entityType:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
                {ENTITY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <button onClick={() => setCoModal(false)} style={{ padding:'7px 16px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', cursor:'pointer' }}>Cancel</button>
              <button onClick={saveCompany} style={{ padding:'7px 20px', fontSize:12.5, fontWeight:700, background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* IC Transaction Modal */}
      {icModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:480 }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>New IC Transaction</h2>
            {[['fromCompany','From Company (ID)'],['toCompany','To Company (ID)'],['description','Description'],['transactionDate','Date (YYYY-MM-DD)'],['amount','Amount'],['currency','Currency']].map(([k,lbl]) => (
              <div key={k} style={{ marginBottom:10 }}>
                <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                <input type={k==='amount'?'number':'text'} value={icForm[k]||''} onChange={e=>setIcForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
              </div>
            ))}
            <div style={{ marginBottom:10 }}>
              <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>Type</label>
              <select value={icForm.transactionType} onChange={e=>setIcForm(f=>({...f,transactionType:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
                {['sale','purchase','loan','dividend','service','royalty'].map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <button onClick={() => setIcModal(false)} style={{ padding:'7px 16px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', cursor:'pointer' }}>Cancel</button>
              <button onClick={saveICTx} style={{ padding:'7px 20px', fontSize:12.5, fontWeight:700, background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
