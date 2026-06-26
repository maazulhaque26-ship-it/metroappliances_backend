import React, { useEffect, useState } from 'react';
import { FiFileText, FiCheckSquare } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchPayslips, publishPayslip } from '../../services/payrollAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

export default function AdminPayslips() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState({ isPublished: '' });

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter.isPublished !== '') params.isPublished = filter.isPublished;
    fetchPayslips(params)
      .then(r => setItems(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const publish = async (id) => {
    try { await publishPayslip(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Publish failed'); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payslips</h1>
            <p className="text-sm text-gray-500 mt-1">Employee payslips generated after payroll run</p>
          </div>
          <select value={filter.isPublished} onChange={e => setFilter(f => ({ ...f, isPublished: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Payslips</option>
            <option value="true">Published</option>
            <option value="false">Unpublished</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Payslip #','Employee','Period','Run #','Net Pay','Generated','Published','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.payslipNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.employee?.displayName || p.employee?.firstName}</td>
                  <td className="px-4 py-3 text-gray-600">{p.period?.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.payrollRun?.runNumber}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{fmt(p.payrollEmployee?.netPay)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.generatedAt ? new Date(p.generatedAt).toLocaleDateString() : '–'}</td>
                  <td className="px-4 py-3">
                    {p.isPublished
                      ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Published</span>
                      : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Draft</span>}
                  </td>
                  <td className="px-4 py-3">
                    {!p.isPublished && (
                      <button onClick={() => publish(p._id)} className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded">
                        <FiCheckSquare size={12} /> Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No payslips generated</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
