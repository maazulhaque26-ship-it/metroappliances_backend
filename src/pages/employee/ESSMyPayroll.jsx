import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { essGetPayslips } from '../../services/employeeSelfServiceAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

function PayslipRow({ ps }) {
  const [open, setOpen] = useState(false);

  const handleDownload = () => {
    alert('Download available — please contact HR for the PDF payslip.');
  };

  return (
    <div style={{ borderBottom: '1px solid #F3F4F6' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', transition: 'background 0.1s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{ps.period?.name || ps.periodName || ps.period || '—'}</p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
              {ps.payDate ? new Date(ps.payDate).toLocaleDateString('en-IN') : (ps.createdAt ? new Date(ps.createdAt).toLocaleDateString('en-IN') : '—')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <div>
              <span style={{ color: '#6B7280' }}>Gross: </span>
              <span style={{ fontWeight: 600, color: '#374151' }}>₹{fmt(ps.grossPay || ps.gross)}</span>
            </div>
            <div>
              <span style={{ color: '#6B7280' }}>Deductions: </span>
              <span style={{ fontWeight: 600, color: '#EF4444' }}>₹{fmt(ps.totalDeductions || ps.deductions)}</span>
            </div>
            <div>
              <span style={{ color: '#6B7280' }}>Net Pay: </span>
              <span style={{ fontWeight: 700, color: '#10B981' }}>₹{fmt(ps.netPay)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={e => { e.stopPropagation(); handleDownload(); }}
            style={{ padding: '5px 12px', border: '1px solid #D1D5DB', borderRadius: 6, background: '#fff', fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Download
          </button>
          <span style={{ color: '#9CA3AF', fontSize: 16 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 20px 16px', background: '#FAFAFA' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Earnings */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Earnings</p>
              {(ps.earnings || ps.salaryComponents || []).filter(c => c.type === 'earning' || !c.type).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <span style={{ color: '#374151' }}>{c.name || c.component}</span>
                  <span style={{ fontWeight: 500, color: '#111827' }}>₹{fmt(c.amount)}</span>
                </div>
              ))}
              {!(ps.earnings || ps.salaryComponents || []).length && (
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>Basic: ₹{fmt(ps.basicPay || ps.basic)}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#111827', marginTop: 8, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                <span>Total Earnings</span>
                <span>₹{fmt(ps.grossPay || ps.gross)}</span>
              </div>
            </div>

            {/* Deductions */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px' }}>Deductions</p>
              {(ps.deductionBreakdown || ps.salaryComponents || []).filter(c => c.type === 'deduction').map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #F9FAFB' }}>
                  <span style={{ color: '#374151' }}>{c.name || c.component}</span>
                  <span style={{ fontWeight: 500, color: '#EF4444' }}>₹{fmt(c.amount)}</span>
                </div>
              ))}
              {!(ps.deductionBreakdown || []).length && ps.totalDeductions > 0 && (
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>Total Deductions: ₹{fmt(ps.totalDeductions)}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#EF4444', marginTop: 8, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                <span>Total Deductions</span>
                <span>₹{fmt(ps.totalDeductions || ps.deductions)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 20px', textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Net Pay</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#10B981', margin: '4px 0 0' }}>₹{fmt(ps.netPay)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ESSMyPayroll() {
  const navigate = useNavigate();
  const { token } = useSelector(s => s.employeeAuth);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(() => {
    if (!token) { navigate('/employee/login'); return; }
    setLoading(true);
    essGetPayslips({ limit: 24 })
      .then(r => setPayslips(r.data.data || r.data.payslips || []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load payslips'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: '32px 28px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>My Payslips</h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Click a row to expand salary breakdown</p>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>Loading…</div>}
      {error   && <div style={{ color: '#EF4444', fontSize: 13, padding: '12px 16px', background: '#FEF2F2', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          {payslips.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No payslips found</div>
          ) : payslips.map((ps, i) => <PayslipRow key={ps._id || i} ps={ps} />)}
        </div>
      )}
    </div>
  );
}
