import React, { useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import { getCAPAs } from '../../services/qmsAPI';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = { open: 'red', in_progress: 'blue', action_taken: 'yellow', verification: 'orange', closed: 'green', cancelled: 'gray' };
const SEV_COLORS    = { low: 'green', medium: 'yellow', high: 'orange', critical: 'red' };

export default function AdminCAPA() {
  const [capas, setCAPAs]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [capaType, setCapaType] = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getCAPAs({ page, limit: 20, search, status, capaType, severity })
      .then(r => { setCAPAs(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, status, capaType, severity]);

  const columns = [
    { header: 'CAPA #', accessor: 'capaNumber' },
    { header: 'Title', accessor: 'title' },
    { header: 'Type', accessor: 'capaType' },
    { header: 'Source', accessor: 'source' },
    { header: 'Severity', render: r => <StatusBadge status={r.severity} color={SEV_COLORS[r.severity]} /> },
    { header: 'Assigned To', accessor: 'assignedToName' },
    { header: 'Target Date', render: r => r.targetCloseDate ? new Date(r.targetCloseDate).toLocaleDateString() : '—' },
    { header: 'Status', render: r => <StatusBadge status={r.status} color={STATUS_COLORS[r.status]} /> },
    { header: 'Actions', render: r => (
      <button onClick={() => navigate(`/admin/qms/capas/${r._id}`)} className="text-blue-500 hover:text-blue-700 text-sm">View</button>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">CAPA Management</h1>
      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search CAPAs..." />
        <FilterToolbar label="Status" value={status} onChange={v => { setStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' }, { value: 'closed', label: 'Closed' }]} />
        <FilterToolbar label="Type" value={capaType} onChange={v => { setCapaType(v); setPage(1); }}
          options={[{ value: '', label: 'All Types' }, { value: 'corrective', label: 'Corrective' }, { value: 'preventive', label: 'Preventive' }, { value: 'both', label: 'Both' }]} />
        <FilterToolbar label="Severity" value={severity} onChange={v => { setSeverity(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
      </div>
      {loading ? <LoadingState /> : capas.length === 0 ? <EmptyState message="No CAPAs found." /> : (
        <>
          <DataTable columns={columns} data={capas} />
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
