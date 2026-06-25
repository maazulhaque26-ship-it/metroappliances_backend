import React, { useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import FilterToolbar from '../../components/shared/FilterToolbar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { getAuditPrograms, deleteAuditProgram } from '../../services/qmsAPI';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = { planning: 'yellow', active: 'green', completed: 'blue', cancelled: 'gray' };

export default function AdminAuditPrograms() {
  const [programs, setPrograms] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState('');
  const [year, setYear]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getAuditPrograms({ page, limit: 20, status, year })
      .then(r => { setPrograms(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, status, year]);

  const handleDelete = async () => {
    await deleteAuditProgram(deleteId);
    setDeleteId(null);
    load();
  };

  const columns = [
    { header: 'Program #', accessor: 'programNumber' },
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'programType' },
    { header: 'Standard', accessor: 'standard' },
    { header: 'Year', accessor: 'year' },
    { header: 'Planned', accessor: 'totalAuditsPlanned' },
    { header: 'Completed', accessor: 'totalAuditsCompleted' },
    { header: 'Status', render: r => <StatusBadge status={r.status} color={STATUS_COLORS[r.status]} /> },
    { header: 'Actions', render: r => (
      <div className="flex gap-2">
        <button onClick={() => navigate(`/admin/qms/audit-programs/${r._id}`)} className="text-blue-500 hover:text-blue-700 text-sm">View</button>
        <button onClick={() => setDeleteId(r._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
      </div>
    )},
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = [{ value: '', label: 'All Years' }, ...Array.from({ length: 4 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }))];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Audit Programs</h1>
      <div className="flex gap-3 flex-wrap">
        <FilterToolbar label="Status" value={status} onChange={v => { setStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'planning', label: 'Planning' }, { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }]} />
        <FilterToolbar label="Year" value={year} onChange={v => { setYear(v); setPage(1); }} options={yearOptions} />
      </div>
      {loading ? <LoadingState /> : programs.length === 0 ? <EmptyState message="No audit programs found." /> : (
        <>
          <DataTable columns={columns} data={programs} />
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Audit Program" message="Are you sure?"
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
