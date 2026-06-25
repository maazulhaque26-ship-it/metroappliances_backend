import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import { fetchBoardReports, createBoardReport, updateBoardReport, deleteBoardReport, approveBoardReport } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : `₹${Number(n||0).toLocaleString('en-IN')}`;
const STATUS_COLOR = { draft:'#6b7280', review:'#f97316', approved:'#22c55e', published:'#3b82f6' };
const EMPTY = { reportTitle:'', boardDate:'', period:'', keyHighlights:[''], keyRisks:[''], keyOpportunities:[''], revenue:0, netProfit:0, ebitda:0, cashPosition:0, revenueVsBudget:0, revenueYoY:0, profitVsBudget:0, notes:'' };

export default function AdminBoardReports() {
  const [data, setData]   = useState([]);
  const [tab, setTab]     = useState('list');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try { const r = await fetchBoardReports(); setData(r.data.data || []); }
    catch { setError('Load failed'); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, keyHighlights: Array.isArray(form.keyHighlights)?form.keyHighlights:form.keyHighlights.split('\n'), keyRisks: Array.isArray(form.keyRisks)?form.keyRisks:form.keyRisks.split('\n'), keyOpportunities: Array.isArray(form.keyOpportunities)?form.keyOpportunities:form.keyOpportunities.split('\n') };
      if (modal === 'create') await createBoardReport(payload);
      else await updateBoardReport(form._id, payload);
      setModal(null); setForm(EMPTY); load();
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try { await approveBoardReport(id); load(); } catch { alert('Approve failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete board report?')) return;
    try { await deleteBoardReport(id); load(); } catch { alert('Delete failed'); }
  };

  const openEdit = (r) => {
    setModal('edit');
    setForm({ ...r, keyHighlights:(r.keyHighlights||[]).join('\n'), keyRisks:(r.keyRisks||[]).join('\n'), keyOpportunities:(r.keyOpportunities||[]).join('\n'), boardDate:r.boardDate?.slice(0,10)||'' });
  };

  return (
    <div style={{ fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:0 }}>Board Reports</h1>
          <p style={{ fontSize:12.5, color:'var(--text-4)', marginTop:2 }}>Executive Board Packs & Financial Presentations</p>
        </div>
        <button onClick={() => { setModal('create'); setForm(EMPTY); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          <FiPlus size={14} /> New Board Report
        </button>
      </div>
      {error && <p style={{ color:'#ef4444', fontSize:12.5, marginBottom:8 }}>{error}</p>}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {['list','detail'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 16px', fontSize:12.5, fontWeight:tab===t?700:500, color:tab===t?'var(--accent)':'var(--text-4)', background:'none', border:'none', borderBottom:tab===t?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer', textTransform:'capitalize' }}>
            {t==='list'?'Report Register':'Report Detail'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['#','Title','Board Date','Period','Revenue','Net Profit','vs Budget','Status','Actions'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                  <td style={{ padding:'9px 12px', fontSize:11, color:'var(--text-4)' }}>{r.reportNumber}</td>
                  <td style={{ padding:'9px 12px', fontWeight:600, cursor:'pointer', color:'var(--accent)' }} onClick={() => { setSelected(r); setTab('detail'); }}>{r.reportTitle}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{r.boardDate?.slice(0,10)}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{r.period}</td>
                  <td style={{ padding:'9px 12px', color:'#22c55e', fontWeight:600 }}>{fmt(r.revenue)}</td>
                  <td style={{ padding:'9px 12px', color:r.netProfit>=0?'#22c55e':'#ef4444', fontWeight:600 }}>{fmt(r.netProfit)}</td>
                  <td style={{ padding:'9px 12px', color:(r.revenueVsBudget||0)>=0?'#22c55e':'#ef4444', fontWeight:700 }}>{(r.revenueVsBudget||0).toFixed(1)}%</td>
                  <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:`${STATUS_COLOR[r.status]||'#6b7280'}20`, color:STATUS_COLOR[r.status]||'#6b7280' }}>{r.status}</span></td>
                  <td style={{ padding:'9px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      {(r.status==='draft'||r.status==='review') && <button onClick={() => handleApprove(r._id)} title="Approve" style={{ padding:'3px 7px', background:'#22c55e20', color:'#22c55e', border:'none', borderRadius:4, cursor:'pointer' }}><FiCheck size={11} /></button>}
                      <button onClick={() => openEdit(r)} style={{ padding:'3px 7px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text-4)' }}><FiEdit2 size={11} /></button>
                      <button onClick={() => handleDelete(r._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.length===0 && <tr><td colSpan={9} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No board reports</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'detail' && selected && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.75rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div>
              <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text)', margin:0 }}>{selected.reportTitle}</h2>
              <p style={{ fontSize:12.5, color:'var(--text-4)', marginTop:4 }}>Board Date: {selected.boardDate?.slice(0,10)} · Period: {selected.period}</p>
            </div>
            <span style={{ padding:'4px 12px', borderRadius:999, fontSize:12, fontWeight:700, background:`${STATUS_COLOR[selected.status]||'#6b7280'}20`, color:STATUS_COLOR[selected.status]||'#6b7280' }}>{selected.status}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:20 }}>
            {[['Revenue',fmt(selected.revenue),'#22c55e'],['Net Profit',fmt(selected.netProfit),selected.netProfit>=0?'#22c55e':'#ef4444'],['EBITDA',fmt(selected.ebitda),'var(--accent)'],['Cash Position',fmt(selected.cashPosition),'#3b82f6']].map(([l,v,c]) => (
              <div key={l} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 14px' }}>
                <p style={{ fontSize:10.5, color:'var(--text-4)', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>{l}</p>
                <p style={{ fontSize:16, fontWeight:800, color:c }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            {[['Key Highlights', selected.keyHighlights, '#22c55e'],['Key Risks', selected.keyRisks, '#ef4444'],['Key Opportunities', selected.keyOpportunities, '#3b82f6']].map(([title, items, color]) => (
              <div key={title} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'1rem' }}>
                <h4 style={{ fontSize:12, fontWeight:700, color, textTransform:'uppercase', marginBottom:8 }}>{title}</h4>
                <ul style={{ margin:0, padding:'0 0 0 16px', fontSize:12.5 }}>
                  {(items||[]).map((item, i) => <li key={i} style={{ marginBottom:4, color:'var(--text)' }}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
          {selected.notes && <p style={{ marginTop:16, fontSize:12.5, color:'var(--text-4)', borderTop:'1px solid var(--border)', paddingTop:12 }}>Notes: {selected.notes}</p>}
        </div>
      )}
      {tab === 'detail' && !selected && <p style={{ color:'var(--text-4)', textAlign:'center', padding:'2rem' }}>Select a board report to view</p>}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:560, maxHeight:'85vh', overflowY:'auto' }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>{modal==='create'?'New Board Report':'Edit Board Report'}</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['reportTitle','Title'],['boardDate','Board Date (YYYY-MM-DD)'],['period','Period'],['revenue','Revenue'],['netProfit','Net Profit'],['ebitda','EBITDA'],['cashPosition','Cash Position'],['revenueVsBudget','Revenue vs Budget %'],['revenueYoY','Revenue vs PY %'],['profitVsBudget','Net Profit vs Budget %']].map(([k,lbl]) => (
                <div key={k}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                  <input type={['revenue','netProfit','ebitda','cashPosition','revenueVsBudget','revenueYoY','profitVsBudget'].includes(k)?'number':'text'} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'6px 9px', fontSize:12, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
                </div>
              ))}
            </div>
            {[['keyHighlights','Key Highlights (one per line)'],['keyRisks','Key Risks (one per line)'],['keyOpportunities','Key Opportunities (one per line)'],['notes','Notes']].map(([k,lbl]) => (
              <div key={k} style={{ marginTop:10 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                <textarea value={Array.isArray(form[k])?form[k].join('\n'):form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} rows={3} style={{ width:'100%', padding:'6px 9px', fontSize:12, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)', resize:'vertical' }} />
              </div>
            ))}
            {error && <p style={{ color:'#ef4444', fontSize:12, marginTop:8 }}>{error}</p>}
            <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
              <button onClick={() => { setModal(null); setError(''); }} style={{ padding:'7px 16px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', cursor:'pointer' }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'7px 20px', fontSize:12.5, fontWeight:700, background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer' }}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
