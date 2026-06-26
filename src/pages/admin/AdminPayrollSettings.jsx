import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchPayrollSettings, updatePayrollSettings } from '../../services/payrollAPI';

export default function AdminPayrollSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPayrollSettings()
      .then(r => setForm(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setSuccess(false);
    try {
      await updatePayrollSettings(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) { alert(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} /></AdminLayout>;
  if (!form)   return null;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure statutory rates and payroll parameters</p>
          </div>
          <button onClick={save} disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
        {success && <div className="px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm">Settings saved successfully.</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-semibold text-gray-800 border-b pb-2">Provident Fund (PF)</h2>
          <div className="grid grid-cols-2 gap-4">
            {[['pfRate','Employee PF Rate (%)'],['employerPFRate','Employer PF Rate (%)'],['pfWageCeiling','PF Wage Ceiling (₹)']].map(([k,l]) => (
              <div key={k}><label className="text-xs font-medium text-gray-600">{l}</label>
                <input type="number" value={form[k] ?? ''} onChange={e => set(k, Number(e.target.value))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            ))}
          </div>

          <h2 className="font-semibold text-gray-800 border-b pb-2 pt-2">ESI</h2>
          <div className="grid grid-cols-2 gap-4">
            {[['esiRate','Employee ESI Rate (%)'],['employerESIRate','Employer ESI Rate (%)'],['esiWageCeiling','ESI Wage Ceiling (₹)']].map(([k,l]) => (
              <div key={k}><label className="text-xs font-medium text-gray-600">{l}</label>
                <input type="number" step="0.01" value={form[k] ?? ''} onChange={e => set(k, Number(e.target.value))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            ))}
          </div>

          <h2 className="font-semibold text-gray-800 border-b pb-2 pt-2">Payroll Processing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600">Payroll Cycle</label>
              <select value={form.payrollCycle} onChange={e => set('payrollCycle', e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
              </select></div>
            <div><label className="text-xs font-medium text-gray-600">Pay Day (day of month)</label>
              <input type="number" min={1} max={31} value={form.payDay ?? ''} onChange={e => set('payDay', Number(e.target.value))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-600">Working Days per Month</label>
              <input type="number" value={form.workingDaysPerMonth ?? ''} onChange={e => set('workingDaysPerMonth', Number(e.target.value))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-600">LOP Deduction Basis</label>
              <select value={form.lopDeductionBasis} onChange={e => set('lopDeductionBasis', e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="working_days">Working Days</option>
                <option value="calendar_days">Calendar Days</option>
              </select></div>
            <div><label className="text-xs font-medium text-gray-600">Professional Tax State</label>
              <input value={form.professionalTaxState ?? ''} onChange={e => set('professionalTaxState', e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.tdsEnabled ?? true} onChange={e => set('tdsEnabled', e.target.checked)} />
                Enable TDS Calculation
              </label>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
