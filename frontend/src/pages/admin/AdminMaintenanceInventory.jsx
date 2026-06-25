import React, { useEffect, useState, useCallback } from 'react';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchMaintenanceLogs, fetchVendorServices } from '../../services/eamAPI';

const TYPE_OPTS = ['','issue','return','reservation','consumption'].map(v=>({value:v,label:v||'All Types'}));
const LOG_TYPE_OPTS = ['','preventive','corrective','breakdown','inspection','lubrication','other'].map(v=>({value:v,label:v||'All Log Types'}));

export default function AdminMaintenanceInventory() {
  const [logs,    setLogs]    = useState([]);
  const [vendors, setVendors] = useState([]);
  const [tab,     setTab]     = useState('logs');
  const [page,    setPage]    = useState(1);
  const [logType, setLogType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'logs') {
        const res = await fetchMaintenanceLogs({ page, limit: LIMIT, logType });
        setLogs(res.data.data || []);
      } else {
        const res = await fetchVendorServices({ page, limit: LIMIT });
        setVendors(res.data.data || []);
      }
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, tab, logType]);

  useEffect(() => { load(); }, [load]);

  const logColumns = [
    { key: 'logNumber',    label: 'Log No.' },
    { key: 'asset',        label: 'Asset',    render: (v, row) => row.asset?.name || '—' },
    { key: 'logType',      label: 'Type',     render: v => <span className="text-sm capitalize">{v?.replace(/_/g,' ')}</span> },
    { key: 'maintenanceDate', label: 'Date',  render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'laborHours',   label: 'Labor Hrs' },
    { key: 'totalCost',    label: 'Cost',     render: v => v ? `₹${v.toLocaleString('en-IN')}` : '—' },
    { key: 'result',       label: 'Result',   render: v => <span className={`capitalize text-sm ${v==='successful'?'text-green-600':v==='failed'?'text-red-600':'text-gray-600'}`}>{v}</span> },
  ];

  const vendorColumns = [
    { key: 'serviceNumber', label: 'Service No.' },
    { key: 'vendor',       label: 'Vendor',   render: (v, row) => row.vendor?.name || '—' },
    { key: 'asset',        label: 'Asset',    render: (v, row) => row.asset?.name || '—' },
    { key: 'serviceType',  label: 'Type',     render: v => <span className="text-sm capitalize">{v?.replace(/_/g,' ')}</span> },
    { key: 'serviceDate',  label: 'Date',     render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'totalCost',    label: 'Cost',     render: v => v ? `₹${v.toLocaleString('en-IN')}` : '—' },
    { key: 'qualityRating',label: 'Rating',   render: v => v ? `${v}/5` : '—' },
    { key: 'status',       label: 'Status',   render: v => <span className="capitalize text-sm">{v}</span> },
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Maintenance Inventory & Services" />

      <div className="flex border-b mb-6">
        {[['logs','Maintenance Logs'],['vendors','Vendor Services']].map(([v,l]) => (
          <button key={v} onClick={() => { setTab(v); setPage(1); }}
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${tab===v?'border-orange-500 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
          <FilterToolbar filters={[{ label: 'Log Type', value: logType, onChange: v => { setLogType(v); setPage(1); }, options: LOG_TYPE_OPTS }]} />
        </div>
      )}

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        <>
          {tab === 'logs' && (logs.length === 0 ? <EmptyState title="No logs found" /> : <DataTable columns={logColumns} data={logs} />)}
          {tab === 'vendors' && (vendors.length === 0 ? <EmptyState title="No vendor services found" /> : <DataTable columns={vendorColumns} data={vendors} />)}
        </>
      }
    </div>
  );
}
