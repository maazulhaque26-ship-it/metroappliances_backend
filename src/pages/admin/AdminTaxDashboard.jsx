import React, { useEffect, useState, useCallback } from 'react';
import { FiTrendingUp, FiAlertCircle, FiCheckCircle, FiClock, FiFileText, FiTruck } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { fetchTaxDashboard, fetchComplianceStatus } from '../../services/taxAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const card = (label, value, icon, color = 'var(--accent)') => (
  <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 200px', minWidth: 180 }}>
    <div style={{ background: color + '20', borderRadius: 10, padding: 12, color }}>{icon}</div>
    <div><div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{value}</div><div style={{ fontSize: 13, color: '#888' }}>{label}</div></div>
  </div>
);

export default function AdminTaxDashboard() {
  const [data, setData]       = useState(null);
  const [compliance, setComp] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [d, c] = await Promise.all([fetchTaxDashboard(), fetchComplianceStatus()]);
      setData(d.data.data);
      setComp(c.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading tax dashboard…</div>;
  if (!data)   return <div style={{ padding: 40, textAlign: 'center', color: '#e74c3c' }}>Failed to load dashboard.</div>;

  const m = data.metrics;
  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Tax & Compliance Dashboard</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        {card('GST Payable',        fmt(m.gstPayable),      <FiTrendingUp size={22} />, '#e74c3c')}
        {card('ITC Balance',        fmt(m.itcBalance),      <FiCheckCircle size={22} />, '#27ae60')}
        {card('Output Tax (Month)', fmt(m.outputTaxMonth),  <FiFileText size={22} />)}
        {card('TDS Payable',        fmt(m.tdsPayable),      <FiAlertCircle size={22} />, '#f39c12')}
        {card('Pending Returns',    m.pendingReturns,       <FiClock size={22} />, '#9b59b6')}
        {card('E-Invoice Pending',  m.eInvoicePending,      <FiFileText size={22} />, '#3498db')}
        {card('EWB Expiring Soon',  m.eWayBillExpiring,     <FiTruck size={22} />, '#e67e22')}
        {card('Overdue Compliance', m.overdueCompliance,    <FiAlertCircle size={22} />, '#c0392b')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Monthly GST Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyGST || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend />
              <Bar dataKey="taxable" name="Taxable" fill="#3498db" radius={[4,4,0,0]} />
              <Bar dataKey="output"  name="Tax"     fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Compliance Overview</h3>
          {compliance && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Overdue', compliance.overdue, '#e74c3c'], ['Upcoming', compliance.upcoming, '#f39c12'], ['Completed', compliance.completed, '#27ae60']].map(([label, tasks, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: color + '10', borderRadius: 8, borderLeft: `4px solid ${color}` }}>
                  <span style={{ fontWeight: 600, color }}>{label}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color }}>{tasks?.length || 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Recent E-Invoices</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Number','Status','Value'].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'#888', borderBottom:'1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
            <tbody>{(data.recentEInvoices || []).map(e => (
              <tr key={e._id}><td style={{ padding:'6px 8px' }}>{e.eInvoiceNumber}</td><td style={{ padding:'6px 8px' }}><span style={{ background: e.irnStatus==='generated'?'#27ae6020':'#f39c1220', color: e.irnStatus==='generated'?'#27ae60':'#f39c12', borderRadius:6, padding:'2px 8px', fontWeight:600, fontSize:12 }}>{e.irnStatus}</span></td><td style={{ padding:'6px 8px' }}>{fmt(e.totalValue)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Recent E-Way Bills</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Number','Status','To'].map(h => <th key={h} style={{ textAlign:'left', padding:'6px 8px', color:'#888', borderBottom:'1px solid #f0f0f0' }}>{h}</th>)}</tr></thead>
            <tbody>{(data.recentEWayBills || []).map(e => (
              <tr key={e._id}><td style={{ padding:'6px 8px' }}>{e.eWayBillNumber}</td><td style={{ padding:'6px 8px' }}><span style={{ background: e.status==='generated'?'#27ae6020':'#3498db20', color: e.status==='generated'?'#27ae60':'#3498db', borderRadius:6, padding:'2px 8px', fontWeight:600, fontSize:12 }}>{e.status}</span></td><td style={{ padding:'6px 8px' }}>{e.toName}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
