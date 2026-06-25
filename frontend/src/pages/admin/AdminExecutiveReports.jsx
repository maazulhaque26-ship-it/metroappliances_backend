import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiDownload } from 'react-icons/fi';
import { fetchFinancialReports, createFinancialReport, updateFinancialReport, deleteFinancialReport, approveFinancialReport, fetchExecutiveBoardPack, fetchMonthlyFinancialPack, fetchBalanceSheet, fetchProfitLoss, fetchCFOCashFlowReport as fetchCashFlowReport, fetchTrialBalance, fetchBudgetVarianceReport, fetchForecastVarianceReport } from '../../services/cfoAPI';

const fmt = (n) => n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr` : `₹${Number(n||0).toLocaleString('en-IN')}`;
const STATUS_COLOR = { draft:'#6b7280', under_review:'#f97316', approved:'#22c55e', published:'#3b82f6', archived:'#a855f7' };
const REPORT_TYPES = ['balance_sheet','pnl','cash_flow','trial_balance','budget_variance','forecast_variance','profitability','executive_board','monthly_pack','custom'];
const EMPTY = { reportName:'', reportType:'balance_sheet', period:'', currency:'INR', notes:'' };

export default function AdminExecutiveReports() {
  const [reports, setReports]   = useState([]);
  const [tab, setTab]           = useState('reports');
  const [reportType, setReportType] = useState('balance_sheet');
  const [period, setPeriod]     = useState('');
  const [reportData, setReportData] = useState(null);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const load = async () => {
    try { const r = await fetchFinancialReports(); setReports(r.data.data || []); }
    catch { setError('Load failed'); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (modal === 'create') await createFinancialReport(form);
      else await updateFinancialReport(form._id, form);
      setModal(null); setForm(EMPTY); load();
    } catch (e) { setError(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try { await approveFinancialReport(id); load(); } catch { alert('Approve failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete report?')) return;
    try { await deleteFinancialReport(id); load(); } catch { alert('Delete failed'); }
  };

  const generateReport = async () => {
    if (!period) return alert('Enter a period');
    setLoading(true); setReportData(null); setError('');
    try {
      let r;
      switch(reportType) {
        case 'balance_sheet':          r = await fetchBalanceSheet({ period }); break;
        case 'pnl':                    r = await fetchProfitLoss({ period }); break;
        case 'cash_flow':              r = await fetchCashFlowReport({ period }); break;
        case 'trial_balance':          r = await fetchTrialBalance({ period }); break;
        case 'budget_variance':        r = await fetchBudgetVarianceReport({ period }); break;
        case 'forecast_variance':      r = await fetchForecastVarianceReport({ period }); break;
        case 'executive_board':        r = await fetchExecutiveBoardPack({ period }); break;
        case 'monthly_pack':           r = await fetchMonthlyFinancialPack({ period }); break;
        default:                       r = await fetchBalanceSheet({ period });
      }
      setReportData(r.data.data);
    } catch (e) { setError(e.response?.data?.message || 'Report generation failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:0 }}>Executive Reports</h1>
          <p style={{ fontSize:12.5, color:'var(--text-4)', marginTop:2 }}>Balance Sheet, P&L, Cash Flow, Trial Balance & Board Packs</p>
        </div>
        <button onClick={() => { setModal('create'); setForm(EMPTY); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          <FiPlus size={14} /> New Report
        </button>
      </div>
      {error && <p style={{ color:'#ef4444', fontSize:12.5, marginBottom:8 }}>{error}</p>}

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
        {['reports','generate'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'8px 16px', fontSize:12.5, fontWeight:tab===t?700:500, color:tab===t?'var(--accent)':'var(--text-4)', background:'none', border:'none', borderBottom:tab===t?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer' }}>
            {t==='reports'?'Report Register':'Generate Report'}
          </button>
        ))}
      </div>

      {tab === 'reports' && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
              {['#','Report Name','Type','Period','Currency','Status','Actions'].map(h=>(
                <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={r._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                  <td style={{ padding:'9px 12px', fontSize:11, color:'var(--text-4)' }}>{r.reportNumber}</td>
                  <td style={{ padding:'9px 12px', fontWeight:600 }}>{r.reportName}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)', textTransform:'capitalize' }}>{r.reportType?.replace(/_/g,' ')}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{r.period}</td>
                  <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{r.currency}</td>
                  <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:`${STATUS_COLOR[r.status]||'#6b7280'}20`, color:STATUS_COLOR[r.status]||'#6b7280' }}>{r.status}</span></td>
                  <td style={{ padding:'9px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      {r.status==='draft' && <button onClick={() => handleApprove(r._id)} title="Approve" style={{ padding:'3px 7px', background:'#22c55e20', color:'#22c55e', border:'none', borderRadius:4, cursor:'pointer' }}><FiCheck size={11} /></button>}
                      <button onClick={() => { setModal('edit'); setForm({...r}); }} style={{ padding:'3px 7px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text-4)' }}><FiEdit2 size={11} /></button>
                      <button onClick={() => handleDelete(r._id)} style={{ padding:'3px 7px', background:'#ef444420', color:'#ef4444', border:'none', borderRadius:4, cursor:'pointer' }}><FiTrash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length===0 && <tr><td colSpan={7} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No reports</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'generate' && (
        <div>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.5rem', marginBottom:16 }}>
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Report Generator</h3>
            <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
              <div>
                <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>Report Type</label>
                <select value={reportType} onChange={e=>{setReportType(e.target.value); setReportData(null);}} style={{ padding:'8px 12px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)', minWidth:200 }}>
                  {REPORT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>Period</label>
                <input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="e.g. 2025-06 or 2025-Q2" style={{ padding:'8px 12px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)', width:160 }} />
              </div>
              <button onClick={generateReport} disabled={loading} style={{ padding:'8px 20px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', fontWeight:700, fontSize:12.5, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                {loading ? 'Generating…' : <><FiDownload size={13} /> Generate</>}
              </button>
            </div>
          </div>

          {reportData && (
            <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.5rem' }}>
              <h3 style={{ fontSize:14, fontWeight:800, marginBottom:16, color:'var(--text)', textTransform:'capitalize' }}>{reportType.replace(/_/g,' ')} — {period}</h3>
              {Array.isArray(reportData) ? (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                  <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
                    {Object.keys(reportData[0]||{}).slice(0,6).map(k=>(
                      <th key={k} style={{ padding:'8px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{k.replace(/([A-Z])/g,' $1').trim()}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {reportData.slice(0,50).map((row, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                        {Object.keys(row).slice(0,6).map(k => (
                          <td key={k} style={{ padding:'8px 12px', color:typeof row[k]==='number'&&row[k]<0?'#ef4444':'var(--text)' }}>
                            {typeof row[k]==='number'?fmt(row[k]):String(row[k]||'—').slice(0,40)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
                  {Object.entries(reportData).slice(0,9).map(([k,v]) => (
                    <div key={k} style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 14px' }}>
                      <p style={{ fontSize:10.5, color:'var(--text-4)', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>{k.replace(/([A-Z])/g,' $1').trim()}</p>
                      <p style={{ fontSize:15, fontWeight:800, color:typeof v==='number'&&v<0?'#ef4444':'var(--accent)' }}>{typeof v==='number'?fmt(v):String(v||'—').slice(0,30)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--card)', borderRadius:'var(--radius-md)', padding:'1.75rem', width:480 }}>
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>{modal==='create'?'New Report':'Edit Report'}</h2>
            {[['reportName','Report Name','text'],['reportType','Report Type','select'],['period','Period','text'],['currency','Currency','text'],['notes','Notes','text']].map(([k,lbl,type]) => (
              <div key={k} style={{ marginBottom:10 }}>
                <label style={{ display:'block', fontSize:11.5, fontWeight:700, color:'var(--text-4)', marginBottom:4 }}>{lbl}</label>
                {type==='select' ? (
                  <select value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
                    {REPORT_TYPES.map(o=><option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                  </select>
                ) : (
                  <input type={type} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{ width:'100%', padding:'7px 10px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }} />
                )}
              </div>
            ))}
            {error && <p style={{ color:'#ef4444', fontSize:12 }}>{error}</p>}
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
