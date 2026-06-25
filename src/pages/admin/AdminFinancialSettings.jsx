import React, { useEffect, useState } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import DataTable    from '../../components/shared/DataTable';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchFinancialSettings, updateFinancialSettings, fetchCurrencies, createCurrency, deleteCurrency, fetchExchangeRates, createExchangeRate } from '../../services/financeAPI';

export default function AdminFinancialSettings() {
  const [settings,  setSettings]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState('general');
  const [currencies, setCurrencies] = useState([]);
  const [rates,      setRates]    = useState([]);
  const [showCurr,   setShowCurr] = useState(false);
  const [showRate,   setShowRate] = useState(false);
  const [currForm,   setCurrForm] = useState({ code:'', name:'', symbol:'', isBase:false });
  const [rateForm,   setRateForm] = useState({ fromCurrency:'', toCurrency:'INR', rate:1, effectiveDate: new Date().toISOString().slice(0,10) });
  const [delCurrId,  setDelCurrId] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, c, r] = await Promise.all([fetchFinancialSettings(), fetchCurrencies(), fetchExchangeRates({})]);
      setSettings(s.data.data);
      setCurrencies(c.data.data || []);
      setRates(r.data.data || []);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const handleSaveSettings = async e => {
    e.preventDefault(); setSaving(true);
    try { await updateFinancialSettings(settings); alert('Settings saved!'); }
    catch (e) { alert(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const handleCreateCurrency = async e => {
    e.preventDefault();
    try { await createCurrency(currForm); setShowCurr(false); setCurrForm({ code:'', name:'', symbol:'', isBase:false }); loadAll(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const handleDeleteCurrency = async () => {
    try { await deleteCurrency(delCurrId); setDelCurrId(null); loadAll(); }
    catch (e) { alert(e.response?.data?.message || e.message); setDelCurrId(null); }
  };

  const handleCreateRate = async e => {
    e.preventDefault();
    try { await createExchangeRate(rateForm); setShowRate(false); setRateForm({ fromCurrency:'', toCurrency:'INR', rate:1, effectiveDate: new Date().toISOString().slice(0,10) }); loadAll(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const currCols = [
    { key: 'code',     label: 'Code',   render: v => <span className="font-mono font-bold text-xs">{v}</span> },
    { key: 'name',     label: 'Name' },
    { key: 'symbol',   label: 'Symbol' },
    { key: 'isBase',   label: 'Base',   render: v => v ? <span className="text-green-600 text-xs font-medium">Base</span> : '—' },
    { key: 'isActive', label: 'Active', render: v => <span className={`text-xs ${v ? 'text-green-600' : 'text-red-500'}`}>{v ? 'Yes' : 'No'}</span> },
    { key: '_id', label: 'Actions', render: (v, row) => !row.isBase && <button onClick={() => setDelCurrId(v)} className="text-xs text-red-500 hover:underline">Del</button> },
  ];

  const rateCols = [
    { key: 'fromCurrency', label: 'From', render: v => <span className="font-mono font-bold">{v}</span> },
    { key: 'toCurrency',   label: 'To',   render: v => <span className="font-mono font-bold">{v}</span> },
    { key: 'rate',         label: 'Rate' },
    { key: 'effectiveDate',label: 'Effective', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'isActive',     label: 'Active', render: v => <span className={`text-xs ${v ? 'text-green-600' : 'text-red-500'}`}>{v ? 'Yes' : 'No'}</span> },
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Financial Settings" subtitle="Company finance configuration" />

      <div className="flex gap-2 border-b">
        {['general','currencies','rates'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm capitalize ${tab === t ? 'border-b-2 border-orange-500 text-orange-600 font-medium' : 'text-gray-500'}`}>{t === 'rates' ? 'Exchange Rates' : t}</button>
        ))}
      </div>

      {tab === 'general' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl shadow-sm p-5 space-y-4 max-w-xl">
          <div><label className="text-sm text-gray-600 block mb-1">Company Name</label><input value={settings.company||''} onChange={e=>setSettings(s=>({...s,company:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-sm text-gray-600 block mb-1">Base Currency</label><input value={settings.baseCurrency||'INR'} onChange={e=>setSettings(s=>({...s,baseCurrency:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div className="flex gap-3">
            <div className="flex-1"><label className="text-sm text-gray-600 block mb-1">FY Start (MM-DD)</label><input value={settings.fiscalYearStart||'04-01'} onChange={e=>setSettings(s=>({...s,fiscalYearStart:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div className="flex-1"><label className="text-sm text-gray-600 block mb-1">FY End (MM-DD)</label><input value={settings.fiscalYearEnd||'03-31'} onChange={e=>setSettings(s=>({...s,fiscalYearEnd:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.requireApproval||false} onChange={e=>setSettings(s=>({...s,requireApproval:e.target.checked}))} /> Require journal approval before posting</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.autoPostJournals||false} onChange={e=>setSettings(s=>({...s,autoPostJournals:e.target.checked}))} /> Auto-post automatic journals</label>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving…' : 'Save Settings'}</button>
        </form>
      )}

      {tab === 'currencies' && (
        <div>
          <div className="flex justify-end mb-3"><button onClick={() => setShowCurr(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Currency</button></div>
          <DataTable columns={currCols} data={currencies} />
        </div>
      )}

      {tab === 'rates' && (
        <div>
          <div className="flex justify-end mb-3"><button onClick={() => setShowRate(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Exchange Rate</button></div>
          <DataTable columns={rateCols} data={rates} />
        </div>
      )}

      {showCurr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreateCurrency} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3">
            <h3 className="text-lg font-semibold">New Currency</h3>
            <input required placeholder="Code (e.g. USD)" value={currForm.code} onChange={e=>setCurrForm(f=>({...f,code:e.target.value.toUpperCase()}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Name (e.g. US Dollar)" value={currForm.name} onChange={e=>setCurrForm(f=>({...f,name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Symbol (e.g. $)" value={currForm.symbol} onChange={e=>setCurrForm(f=>({...f,symbol:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={currForm.isBase} onChange={e=>setCurrForm(f=>({...f,isBase:e.target.checked}))} /> Set as base currency</label>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCurr(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create</button>
            </div>
          </form>
        </div>
      )}

      {showRate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleCreateRate} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3">
            <h3 className="text-lg font-semibold">New Exchange Rate</h3>
            <div className="flex gap-2">
              <input required placeholder="From (e.g. USD)" value={rateForm.fromCurrency} onChange={e=>setRateForm(f=>({...f,fromCurrency:e.target.value.toUpperCase()}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <input required placeholder="To (e.g. INR)" value={rateForm.toCurrency} onChange={e=>setRateForm(f=>({...f,toCurrency:e.target.value.toUpperCase()}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input required type="number" step="0.000001" min="0" placeholder="Rate" value={rateForm.rate} onChange={e=>setRateForm(f=>({...f,rate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input required type="date" value={rateForm.effectiveDate} onChange={e=>setRateForm(f=>({...f,effectiveDate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowRate(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Create</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!delCurrId} title="Delete Currency" message="Delete this currency?" onConfirm={handleDeleteCurrency} onCancel={() => setDelCurrId(null)} />
    </div>
  );
}
