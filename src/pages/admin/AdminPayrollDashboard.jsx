import React, { useEffect, useState } from 'react';
import { FiDollarSign, FiUsers, FiCreditCard, FiAward, FiZap, FiTrendingUp } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchPayrollDashboard } from '../../services/payrollAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

const KpiCard = ({ icon: Icon, label, value, color = 'text-indigo-600' }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
    <div className={`p-3 rounded-lg bg-gray-50 ${color}`}><Icon size={22} /></div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default function AdminPayrollDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    fetchPayrollDashboard()
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  const k = data?.kpis || {};
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise payroll management overview</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KpiCard icon={FiZap}       label="Draft Runs"       value={k.draftRuns      ?? 0} color="text-yellow-600" />
          <KpiCard icon={FiTrendingUp} label="Calculated"      value={k.calculatedRuns ?? 0} color="text-blue-600" />
          <KpiCard icon={FiUsers}     label="Approved"         value={k.approvedRuns   ?? 0} color="text-purple-600" />
          <KpiCard icon={FiDollarSign} label="Paid Runs"       value={k.paidRuns       ?? 0} color="text-green-600" />
          <KpiCard icon={FiDollarSign} label="Net Paid (₹)"   value={`₹${fmt(k.totalNetPaid)}`} color="text-indigo-600" />
          <KpiCard icon={FiTrendingUp} label="Gross YTD (₹)"  value={`₹${fmt(k.totalGrossYTD)}`} color="text-indigo-600" />
          <KpiCard icon={FiCreditCard} label="Active Loans"    value={k.activeLoans    ?? 0} color="text-orange-600" />
          <KpiCard icon={FiAward}     label="Pending Bonuses"  value={k.pendingBonuses ?? 0} color="text-pink-600" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Payroll Runs</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Run #','Period','Employees','Net Pay','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.recentRuns || []).map(r => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.runNumber}</td>
                  <td className="px-4 py-3 text-gray-700">{r.period?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.totalEmployees}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{fmt(r.totalNetPay)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize
                      ${r.status === 'paid'       ? 'bg-green-100 text-green-700'
                      : r.status === 'posted'     ? 'bg-blue-100 text-blue-700'
                      : r.status === 'approved'   ? 'bg-purple-100 text-purple-700'
                      : r.status === 'calculated' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!data?.recentRuns?.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No payroll runs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
