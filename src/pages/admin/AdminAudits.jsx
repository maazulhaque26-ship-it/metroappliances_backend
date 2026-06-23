import React, { useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { getQualityAudits, deleteQualityAudit } from '../../services/qmsAPI';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS  = { planned: 'yellow', in_progress: 'blue', completed: 'green', cancelled: 'gray', report_pending: 'orange', closed: 'teal' };
const RESULT_COLORS  = { satisfactory: 'green', satisfactory_with_observations: 'yellow', unsatisfactory: 'red', pending: 'gray' };

export default function AdminAudits() {
  const [audits, setAudits]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [auditType, setAuditType] = useState('');
  const [loading, setLoading]   = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getQualityAudits({ page, limit: 20, search, status, auditType })
      .then(r => { setAudits(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, status, auditType]);

  const handleDelete = async () => {
    await deleteQualityAudit(deleteId);
    setDeleteId(null);
    load();
  };

  const columns = [
    { header: 'Audit #', accessor: 'auditNumber' },
    { header: 'Title', accessor: 'title' },
    { header: 'Type', accessor: 'auditType' },
    { header: 'Standard', accessor: 'standard' },
    { header: 'Planned Date', render: r => new Date(r.plannedDate).toLocaleDateString() },
    { header: 'Lead Auditor', accessor: 'leadAuditorName' },
    { header: 'Findings', render: r => `${r.majorNCs}M / ${r.minorNCs}m / ${r.observations}O` },
    { header: 'Result', render: r => <StatusBadge status={r.overallResult} color={RESULT_COLORS[r.overallResult]} /> },
    { header: 'Status', render: r => <StatusBadge status={r.status} color={STATUS_COLORS[r.status]} /> },
    { header: 'Actions', render: r => (
      <div className="flex gap-2">
        <button onClick={() => navigate(`/admin/qms/audits/${r._id}`)} className="text-blue-500 text-sm">View</button>
        <button onClick={() => setDeleteId(r._id)} className="text-red-500 text-sm">Delete</button>
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Quality Audits</h1>
      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search audits..." />
        <FilterToolbar label="Status" value={status} onChange={v => { setStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'planned', label: 'Planned' }, { value: 'in_progress', label: 'In Progress' }, { value: 'closed', label: 'Closed' }]} />
        <FilterToolbar label="Type" value={auditType} onChange={v => { setAuditType(v); setPage(1); }}
          options={[{ value: '', label: 'All Types' }, { value: 'internal', label: 'Internal' }, { value: 'external', label: 'External' }, { value: 'supplier', label: 'Supplier' }]} />
      </div>
      {loading ? <LoadingState /> : audits.length === 0 ? <EmptyState message="No quality audits found." /> : (
        <>
          <DataTable columns={columns} data={audits} />
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Audit" message="Are you sure?"
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
