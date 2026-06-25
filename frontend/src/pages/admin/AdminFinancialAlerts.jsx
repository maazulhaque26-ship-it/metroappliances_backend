import React, { useEffect, useState } from 'react';
import { FiCheck, FiX, FiAlertTriangle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { fetchFinancialAlerts, acknowledgeAlert as acknowledgeFinancialAlert, resolveAlert as resolveFinancialAlert } from '../../services/cfoAPI';

const SEVERITY_COLOR = { critical:'#ef4444', high:'#f97316', medium:'#eab308', low:'#3b82f6', info:'#6b7280' };
const SEVERITY_BG    = { critical:'#ef444415', high:'#f9731615', medium:'#eab30815', low:'#3b82f615', info:'#6b728015' };
const SEVERITY_ICON  = { critical:<FiAlertCircle size={14}/>, high:<FiAlertTriangle size={14}/>, medium:<FiAlertTriangle size={14}/>, low:<FiInfo size={14}/>, info:<FiInfo size={14}/> };
const STATUS_COLOR   = { active:'#ef4444', acknowledged:'#f97316', resolved:'#22c55e' };

const ALERT_TYPES = ['low_cash','budget_overrun','revenue_drop','margin_drop','overdue_receivables','overdue_payables','tax_due','compliance_due','kpi_breach','custom'];
const SEVERITIES   = ['critical','high','medium','low','info'];

export default function AdminFinancialAlerts() {
  const [alerts, setAlerts]           = useState([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter]   = useState('active');
  const [typeFilter, setTypeFilter]       = useState('');
  const [error, setError]                 = useState('');

  const load = async () => {
    try {
      const r = await fetchFinancialAlerts({ severity: severityFilter||undefined, status: statusFilter||undefined, alertType: typeFilter||undefined });
      setAlerts(r.data.data || []);
    } catch { setError('Load failed'); }
  };

  useEffect(() => { load(); }, [severityFilter, statusFilter, typeFilter]);

  const handleAck = async (id) => {
    try { await acknowledgeFinancialAlert(id); load(); } catch { alert('Acknowledge failed'); }
  };

  const handleResolve = async (id) => {
    try { await resolveFinancialAlert(id); load(); } catch { alert('Resolve failed'); }
  };

  const counts = SEVERITIES.reduce((acc, s) => {
    acc[s] = alerts.filter(a => a.severity === s).length;
    return acc;
  }, {});

  return (
    <div style={{ fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text)', margin:0 }}>Financial Alerts</h1>
          <p style={{ fontSize:12.5, color:'var(--text-4)', marginTop:2 }}>Cash, Budget, KPI & Compliance Alert Center</p>
        </div>
        <div style={{ display:'flex', gap:6, fontSize:12.5, fontWeight:700 }}>
          <span style={{ padding:'5px 12px', borderRadius:999, background:'#ef444415', color:'#ef4444' }}>{counts.critical} Critical</span>
          <span style={{ padding:'5px 12px', borderRadius:999, background:'#f9731615', color:'#f97316' }}>{counts.high} High</span>
          <span style={{ padding:'5px 12px', borderRadius:999, background:'#eab30815', color:'#eab308' }}>{counts.medium} Medium</span>
        </div>
      </div>
      {error && <p style={{ color:'#ef4444', fontSize:12.5, marginBottom:8 }}>{error}</p>}

      {/* Severity Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10, marginBottom:16 }}>
        {SEVERITIES.map(s => (
          <div key={s} onClick={() => setSeverityFilter(severityFilter===s?'':s)} style={{ background: severityFilter===s ? SEVERITY_BG[s] : 'var(--card)', border:`1px solid ${severityFilter===s?SEVERITY_COLOR[s]:'var(--border)'}`, borderRadius:'var(--radius-md)', padding:'10px 14px', cursor:'pointer', transition:'all 0.15s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, color:SEVERITY_COLOR[s], marginBottom:4 }}>{SEVERITY_ICON[s]}<span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase' }}>{s}</span></div>
            <p style={{ fontSize:20, fontWeight:800, color:SEVERITY_COLOR[s], margin:0 }}>{counts[s]}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:'7px 12px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ padding:'7px 12px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text)' }}>
          <option value="">All Types</option>
          {ALERT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
        </select>
        {(severityFilter||statusFilter||typeFilter) && (
          <button onClick={() => { setSeverityFilter(''); setStatusFilter(''); setTypeFilter(''); }} style={{ padding:'7px 12px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--bg)', color:'var(--text-4)', cursor:'pointer' }}>Clear Filters</button>
        )}
      </div>

      {/* Alerts Table */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
          <thead><tr style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
            {['Severity','Alert','Type','Message','Threshold','Actual','Status','Created','Actions'].map(h=>(
              <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'var(--text-4)', textTransform:'uppercase' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={a._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--bg)' }}>
                <td style={{ padding:'9px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, color:SEVERITY_COLOR[a.severity] }}>
                    {SEVERITY_ICON[a.severity]}
                    <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase' }}>{a.severity}</span>
                  </div>
                </td>
                <td style={{ padding:'9px 12px', fontWeight:600 }}>{a.title||a.alertCode}</td>
                <td style={{ padding:'9px 12px', color:'var(--text-4)', textTransform:'capitalize', fontSize:11 }}>{a.alertType?.replace(/_/g,' ')}</td>
                <td style={{ padding:'9px 12px', color:'var(--text-4)', maxWidth:200 }}>{a.message}</td>
                <td style={{ padding:'9px 12px', color:'var(--text-4)' }}>{a.threshold ?? '—'}</td>
                <td style={{ padding:'9px 12px', color:SEVERITY_COLOR[a.severity], fontWeight:600 }}>{a.actualValue ?? '—'}</td>
                <td style={{ padding:'9px 12px' }}><span style={{ padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:`${STATUS_COLOR[a.status]||'#6b7280'}20`, color:STATUS_COLOR[a.status]||'#6b7280' }}>{a.status}</span></td>
                <td style={{ padding:'9px 12px', color:'var(--text-4)', fontSize:11 }}>{new Date(a.createdAt).toLocaleDateString('en-IN')}</td>
                <td style={{ padding:'9px 12px' }}>
                  <div style={{ display:'flex', gap:4 }}>
                    {a.status === 'active' && <button onClick={() => handleAck(a._id)} title="Acknowledge" style={{ padding:'3px 7px', background:'#f9731620', color:'#f97316', border:'none', borderRadius:4, cursor:'pointer', fontWeight:700 }}><FiCheck size={11} /></button>}
                    {a.status !== 'resolved' && <button onClick={() => handleResolve(a._id)} title="Resolve" style={{ padding:'3px 7px', background:'#22c55e20', color:'#22c55e', border:'none', borderRadius:4, cursor:'pointer' }}><FiX size={11} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {alerts.length===0 && <tr><td colSpan={9} style={{ padding:'2rem', textAlign:'center', color:'var(--text-4)' }}>No alerts matching filters</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
