import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchRun, fetchRunEmployees } from '../../services/payrollAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

export default function AdminPayrollProcessing() {
  const { id } = useParams();
  const [run, setRun]         = useState(null);
  const [emps, setEmps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    Promise.all([fetchRun(id), fetchRunEmployees(id, { limit: 100 })])
      .then(([r, e]) => { setRun(r.data.data); setEmps(e.data.data || []); })
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;
  if (!run)    return <AdminLayout><div className="p-8 text-center text-gray-500">Select a payroll run from the Payroll Runs page</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="text-sm text-gray-500 mt-1">Run: {run.runNumber} — {run.period?.name}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['Employees', run.totalEmployees],
            ['Total Gross', `₹${fmt(run.totalGross)}`],
            ['Total Deductions', `₹${fmt(run.totalDeductions)}`],
            ['Net Pay', `₹${fmt(run.totalNetPay)}`],
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Employee Payroll Details</h2>
            <span className="text-xs text-gray-500">{emps.length} employees</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee','Working Days','Paid Days','LOP','Basic','Gross','PF','ESI','PT','Net Pay','Status'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {emps.map(e => (
                  <tr key={e._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{e.employee?.displayName || e.employee?.firstName}</td>
                    <td className="px-3 py-3 text-gray-600 text-center">{e.workingDays}</td>
                    <td className="px-3 py-3 text-gray-600 text-center">{e.paidDays}</td>
                    <td className="px-3 py-3 text-red-600 text-center">{e.lopDays}</td>
                    <td className="px-3 py-3 text-gray-700">₹{fmt(e.basicSalary)}</td>
                    <td className="px-3 py-3 text-gray-700">₹{fmt(e.grossEarnings)}</td>
                    <td className="px-3 py-3 text-red-600">₹{fmt(e.employeePF)}</td>
                    <td className="px-3 py-3 text-red-600">₹{fmt(e.employeeESI)}</td>
                    <td className="px-3 py-3 text-red-600">₹{fmt(e.professionalTax)}</td>
                    <td className="px-3 py-3 font-semibold text-green-700">₹{fmt(e.netPay)}</td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium capitalize bg-gray-100 text-gray-600">{e.status}</span>
                    </td>
                  </tr>
                ))}
                {!emps.length && <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">No employees calculated</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
