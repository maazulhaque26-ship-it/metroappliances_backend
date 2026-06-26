import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { essGetDashboard } from '../../services/employeeSelfServiceAPI';

function StatCard({ label, value, color = '#6366F1', sub }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px' }}>
      <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color, margin: '8px 0 4px' }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{sub}</p>}
    </div>
  );
}

export default function ESSDashboard() {
  const navigate = useNavigate();
  const { employee, token } = useSelector(s => s.employeeAuth);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!token) { navigate('/employee/login'); return; }
    essGetDashboard()
      .then(r => setData(r.data.data || r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  if (!token) return null;

  const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div style={{ padding: '32px 28px', fontFamily: 'Poppins, sans-serif' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
          Good day, {employee?.name || employee?.firstName || 'Employee'}!
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          Here's your self-service overview for {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 14 }}>Loading your dashboard…</div>
      )}

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px', color: '#EF4444', fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard label="Days Present (MTD)" value={data?.attendance?.daysPresent ?? 0} color="#10B981" sub={`of ${data?.attendance?.workingDays ?? 0} working days`} />
            <StatCard label="Leave Balance" value={data?.leaveBalance?.total ?? 0} color="#3B82F6" sub="available days" />
            <StatCard label="Latest Net Pay" value={data?.latestPayslip?.netPay ? `₹${fmt(data.latestPayslip.netPay)}` : '—'} color="#FF7A00" sub={data?.latestPayslip?.period || ''} />
            <StatCard label="Active Goals" value={data?.performance?.activeGoals ?? 0} color="#8B5CF6" sub="in progress" />
            <StatCard label="Training Enrolled" value={data?.training?.enrolled ?? 0} color="#06B6D4" sub="sessions" />
            <StatCard label="Recognitions" value={data?.recognitions ?? 0} color="#F59E0B" sub="received" />
          </div>

          {/* Recent announcements */}
          {(data?.announcements || []).length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Recent Announcements</h2>
              </div>
              {data.announcements.slice(0, 5).map((a, i) => (
                <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid #F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>{a.title}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{a.category}</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : ''}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
