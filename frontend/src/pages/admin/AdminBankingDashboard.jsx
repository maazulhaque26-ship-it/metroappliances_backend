import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { fetchBankingDashboard, fetchBankingCompliance } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const COLORS = ['#3498db', '#27ae60', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];

export default function AdminBankingDashboard() {
  const [data, setData]         = useState(null);
  const [compliance, setComp]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([fetchBankingDashboard(), fetchBankingCompliance()])
      .then(([d, c]) => { setData(d.data.data); setComp(c.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#888' }}>Loading Banking Dashboard…</div>;
  const m = data?.metrics || {};

  const cashFlowData = (() => {
    const byMonth = {};
    (data?.monthlyFlow || []).forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2,'0')}`;
      if (!byMonth[key]) byMonth[key] = { month: key, receipts: 0, payments: 0 };
      if (['receipt','transfer_in','interest_credit','cash_deposit'].includes(item._id.type)) byMonth[key].receipts += item.total;
      else byMonth[key].payments += item.total;
    });
    return Object.values(byMonth).slice(-6);
  })();

  const bankPieData = (data?.bankAccounts || []).map(a => ({ name: a.accountName, value: a.currentBalance || 0 })).filter(a => a.value > 0);

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Banking & Treasury Dashboard</h2>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          ['Bank Balance', m.totalBankBalance, '#3498db'],
          ['Cash Balance', m.totalCashBalance, '#27ae60'],
          ["Today's Receipts", m.todayReceipts, '#2ecc71'],
          ["Today's Payments", m.todayPayments, '#e74c3c'],
          ['Total Investments', m.totalInvestment, '#9b59b6'],
          ['Unreconciled', m.unreconciledCount, m.unreconciledCount > 0 ? '#e74c3c' : '#27ae60'],
          ['Active FDs', m.activeFDs, '#f39c12'],
          ['Active BGs', m.activeBGs, '#1abc9c'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{typeof val === 'number' && val > 100 ? fmt(val) : val ?? 0}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Compliance Alerts */}
      {compliance && (compliance.expiringBGs > 0 || compliance.expiringLCs > 0 || compliance.maturingFDs?.length > 0) && (
        <div style={{ background: '#fff9e6', border: '1px solid #f39c12', borderRadius: 10, padding: '12px 18px', marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#e67e22', fontSize: 13 }}>Upcoming Expiry (30 days):</span>
          {compliance.expiringBGs > 0 && <span style={{ fontSize: 13, color: '#c0392b' }}>{compliance.expiringBGs} Bank Guarantee(s) expiring</span>}
          {compliance.expiringLCs > 0 && <span style={{ fontSize: 13, color: '#c0392b' }}>{compliance.expiringLCs} LC(s) expiring</span>}
          {compliance.maturingFDs?.length > 0 && <span style={{ fontSize: 13, color: '#e67e22' }}>{compliance.maturingFDs.length} FD(s) maturing</span>}
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Monthly Cash Flow</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend />
              <Bar dataKey="receipts" name="Receipts" fill="#27ae60" radius={[3,3,0,0]} />
              <Bar dataKey="payments" name="Payments" fill="#e74c3c" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Bank Balances</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={bankPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${fmt(value)}`}>
                {bankPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 14 }}>Recent Transactions</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#fafafa' }}>{['Txn #','Account','Type','Mode','Amount','Date','Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: '#888', fontWeight: 600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {(data?.recentTransactions || []).map(t => (
              <tr key={t._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                <td style={{ padding: '9px 16px', fontFamily: 'monospace', fontSize: 11 }}>{t.transactionNumber}</td>
                <td style={{ padding: '9px 16px' }}>{t.bankAccount?.accountName || '—'}</td>
                <td style={{ padding: '9px 16px', textTransform: 'capitalize' }}>{(t.transactionType || '').replace(/_/g, ' ')}</td>
                <td style={{ padding: '9px 16px', textTransform: 'uppercase', fontSize: 11 }}>{t.paymentMode || '—'}</td>
                <td style={{ padding: '9px 16px', fontWeight: 600, color: ['receipt','transfer_in','interest_credit'].includes(t.transactionType) ? '#27ae60' : '#e74c3c' }}>{fmt(t.amount)}</td>
                <td style={{ padding: '9px 16px', color: '#888' }}>{t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('en-IN') : '—'}</td>
                <td style={{ padding: '9px 16px' }}><span style={{ background: t.status === 'reconciled' ? '#27ae6020' : '#f39c1220', color: t.status === 'reconciled' ? '#27ae60' : '#f39c12', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
