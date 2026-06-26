import React, { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchPayrollSummary, fetchSalaryRegister, fetchBankTransferSheet, fetchDepartmentCost, fetchMonthlyPayroll, fetchAnnualPayroll, fetchRuns } from '../../services/payrollAPI';

const REPORT_TYPES = [
  { key: 'summary',      label: 'Payroll Summary' },
  { key: 'register',     label: 'Salary Register' },
  { key: 'bank',         label: 'Bank Transfer Sheet' },
  { key: 'dept-cost',    label: 'Department Cost' },
  { key: 'monthly',      label: 'Monthly Trend' },
  { key: 'annual',       label: 'Annual Summary' },
];

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

export default function AdminPayrollReports() {
  const [reportType, setReportType] = useState('summary');
  const [runs, setRuns]     = useState([]);
  const [runId, setRunId]   = useState('');
  const [year, setYear]     = useState(new Date().getFullYear());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    fetchRuns({ status: 'paid', limit: 50 }).then(r => setRuns(r.data.data || [])).catch(() => {});
  }, []);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      let res;
      if (reportType === 'summary')   res = await fetchPayrollSummary({ runId });
      if (reportType === 'register')  res = await fetchSalaryRegister({ runId });
      if (reportType === 'bank')      res = await fetchBankTransferSheet({ runId });
      if (reportType === 'dept-cost') res = await fetchDepartmentCost({ runId });
      if (reportType === 'monthly')   res = await fetchMonthlyPayroll({ year });
      if (reportType === 'annual')    res = await fetchAnnualPayroll({ year });
      setResult(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to generate report');
    } finally { setLoading(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Payroll analytics and statutory reports</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {REPORT_TYPES.map(r => (
              <button key={r.key} onClick={() => { setReportType(r.key); setResult(null); }}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${reportType === r.key ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            {['summary','register','bank','dept-cost'].includes(reportType) && (
              <div>
                <label className="text-xs font-medium text-gray-600">Payroll Run</label>
                <select value={runId} onChange={e => setRunId(e.target.value)}
                  className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select run</option>
                  {runs.map(r => <option key={r._id} value={r._id}>{r.runNumber} — {r.period?.name}</option>)}
                </select>
              </div>
            )}
            {['monthly','annual'].includes(reportType) && (
              <div>
                <label className="text-xs font-medium text-gray-600">Year</label>
                <input type="number" value={year} onChange={e => setYear(e.target.value)}
                  className="mt-1 w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}
            <button onClick={run} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              <FiSearch size={14} /> Generate
            </button>
          </div>
        </div>

        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : result && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {reportType === 'summary' && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[['Employees', result.run?.totalEmployees],['Total Gross',`₹${fmt(result.run?.totalGross)}`],['Net Pay',`₹${fmt(result.run?.totalNetPay)}`]].map(([l,v]) => (
                    <div key={l} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">{l}</p>
                      <p className="text-xl font-bold text-gray-900">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reportType === 'monthly' && Array.isArray(result) && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>{['Month','Employees','Gross','Deductions','Net Pay'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.map(row => (
                      <tr key={row.month} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{new Date(2026, row.month - 1).toLocaleString('default', { month: 'long' })}</td>
                        <td className="px-4 py-3 text-gray-600">{row.employees}</td>
                        <td className="px-4 py-3 text-gray-700">₹{fmt(row.totalGross)}</td>
                        <td className="px-4 py-3 text-red-600">₹{fmt(row.totalDeductions)}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">₹{fmt(row.totalNetPay)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {reportType === 'dept-cost' && Array.isArray(result) && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>{['Department','Headcount','Gross','Deductions','Net Pay'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.department}</td>
                        <td className="px-4 py-3 text-gray-600">{row.count}</td>
                        <td className="px-4 py-3 text-gray-700">₹{fmt(row.grossEarnings)}</td>
                        <td className="px-4 py-3 text-red-600">₹{fmt(row.totalDeductions)}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">₹{fmt(row.netPay)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {['register','bank'].includes(reportType) && result.rows && (
              <div className="p-4 text-sm text-gray-600">{result.rows.length} entries — summary: ₹{fmt(result.summary?.totalNetPay || result.totalTransfer)}</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
