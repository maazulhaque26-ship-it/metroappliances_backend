import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { essGetLeaveBalance, essGetMyLeaves } from '../../services/employeeSelfServiceAPI';

const STATUS_STYLE = {
  approved:  { background: '#D1FAE5', color: '#065F46' },
  pending:   { background: '#FEF3C7', color: '#92400E' },
  rejected:  { background: '#FEE2E2', color: '#991B1B' },
  cancelled: { background: '#F3F4F6', color: '#374151' },
};

function LeaveCard({ type, total, used, pending, color = '#6366F1' }) {
  const available = (total || 0) - (used || 0);
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{type}</p>
          <p style={{ fontSize: 26, fontWeight: 700, color, margin: '6px 0 0' }}>{available}</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>available of {total}</p>
        </div>
        {pending > 0 && (
          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{pending} pending</span>
        )}
      </div>
      <div style={{ height: 5, background: '#F3F4F6', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{ height: 5, background: color, width: `${pct}%`, borderRadius: 9999 }} />
      </div>
      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '6px 0 0' }}>{used || 0} used</p>
    </div>
  );
}

export default function ESSMyLeave() {
  const navigate = useNavigate();
  const { token } = useSelector(s => s.employeeAuth);
  const [balance, setBalance]     = useState([]);
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = useCallback(() => {
    if (!token) { navigate('/employee/login'); return; }
    setLoading(true);
    Promise.all([essGetLeaveBalance(), essGetMyLeaves({ limit: 20 })])
      .then(([br, rr]) => {
        const bd = br.data.data || br.data;
        setBalance(Array.isArray(bd) ? bd : (bd?.balances || Object.entries(bd || {}).map(([type, v]) => ({ type, ...v }))));
        setRequests(rr.data.data || rr.data.requests || rr.data.leaves || []);
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load leave data'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  useEffect(() => { load(); }, [load]);

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <div style={{ padding: '32px 28px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>My Leave</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Leave balances and request history</p>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Loading…</div>}
      {error   && <div style={{ color: '#EF4444', fontSize: 13, padding: '12px 16px', background: '#FEF2F2', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {!loading && !error && (
        <>
          {/* Balance cards */}
          {balance.length > 0 && (
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Leave Balances</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                {balance.map((b, i) => (
                  <LeaveCard key={i} type={b.type || b.leaveType || `Leave ${i + 1}`} total={b.total || b.allocated || 0} used={b.used || b.consumed || 0} pending={b.pending || 0} color={COLORS[i % COLORS.length]} />
                ))}
              </div>
            </>
          )}

          {/* Leave request history */}
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Leave Requests</h2>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: '#F9FAFB' }}>
                <tr>
                  {['Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Applied On'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF' }}>No leave requests found</td></tr>
                ) : requests.map((r, i) => {
                  const st = (r.status || 'pending').toLowerCase();
                  const style = STATUS_STYLE[st] || { background: '#F3F4F6', color: '#374151' };
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500, color: '#374151' }}>{r.leaveType || r.type || '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#374151' }}>{r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#374151' }}>{r.endDate ? new Date(r.endDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#374151' }}>{r.numberOfDays || r.days || '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#6B7280', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reason || '—'}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ ...style, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{r.status || 'pending'}</span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#9CA3AF', fontSize: 12 }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
