import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { essGetAttendance } from '../../services/employeeSelfServiceAPI';

const STATUS_STYLE = {
  present:  { background: '#D1FAE5', color: '#065F46' },
  absent:   { background: '#FEE2E2', color: '#991B1B' },
  late:     { background: '#FEF3C7', color: '#92400E' },
  half_day: { background: '#DBEAFE', color: '#1E40AF' },
  on_leave: { background: '#EDE9FE', color: '#5B21B6' },
  holiday:  { background: '#F3F4F6', color: '#374151' },
};

function fmtTime(t) {
  if (!t) return '—';
  try { return new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); } catch { return t; }
}

export default function ESSMyAttendance() {
  const navigate = useNavigate();
  const { token } = useSelector(s => s.employeeAuth);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(() => {
    if (!token) { navigate('/employee/login'); return; }
    setLoading(true);
    essGetAttendance({ month, year, limit: 31 })
      .then(r => {
        const d = r.data.data || r.data;
        setRecords(Array.isArray(d) ? d : (d?.records || d?.attendance || []));
        setSummary(d?.summary || {});
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [token, navigate, month, year]);

  useEffect(() => { load(); }, [load]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years  = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div style={{ padding: '32px 28px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>My Attendance</h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Monthly attendance record</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: '7px 12px', fontSize: 13, background: '#fff', color: '#374151' }}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: '7px 12px', fontSize: 13, background: '#fff', color: '#374151' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary row */}
      {Object.keys(summary).length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {[['Present', summary.present, '#10B981'], ['Absent', summary.absent, '#EF4444'], ['Late', summary.late, '#F59E0B'], ['Leave', summary.onLeave, '#8B5CF6'], ['Holidays', summary.holidays, '#6B7280']].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 18px', minWidth: 90 }}>
              <p style={{ fontSize: 11, color: '#6B7280', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: c, margin: '4px 0 0' }}>{v ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Loading…</div>}
      {error   && <div style={{ color: '#EF4444', fontSize: 13, padding: '12px 16px', background: '#FEF2F2', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                {['Date', 'Day', 'Check In', 'Check Out', 'Hours', 'Status', 'Remarks'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF' }}>No attendance records found</td></tr>
              ) : records.map((r, i) => {
                const st = (r.status || '').toLowerCase().replace(/ /g, '_');
                const style = STATUS_STYLE[st] || { background: '#F3F4F6', color: '#374151' };
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td style={{ padding: '10px 16px', color: '#374151', fontWeight: 500 }}>{r.date ? new Date(r.date).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#6B7280' }}>{r.date ? new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' }) : '—'}</td>
                    <td style={{ padding: '10px 16px', color: '#374151' }}>{fmtTime(r.checkIn)}</td>
                    <td style={{ padding: '10px 16px', color: '#374151' }}>{fmtTime(r.checkOut)}</td>
                    <td style={{ padding: '10px 16px', color: '#374151' }}>{r.hoursWorked ? `${r.hoursWorked}h` : '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ ...style, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        {r.status || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: '#9CA3AF', fontSize: 12 }}>{r.remarks || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
