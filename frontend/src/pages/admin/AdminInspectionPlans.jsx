import React, { useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { getInspectionPlans, deleteInspectionPlan } from '../../services/qmsAPI';

const STATUS_COLORS = { draft: 'gray', active: 'green', inactive: 'yellow', obsolete: 'red' };

export default function AdminInspectionPlans() {
  const [plans, setPlans]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    getInspectionPlans({ page, limit: 20, search, status })
      .then(r => { setPlans(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, status]);

  const handleDelete = async () => {
    await deleteInspectionPlan(deleteId);
    setDeleteId(null);
    load();
  };

  const columns = [
    { header: 'Plan #', accessor: 'planNumber' },
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'inspectionType' },
    { header: 'Sampling', accessor: 'samplingMethod' },
    { header: 'AQL', accessor: 'aqlLevel' },
    { header: 'Status', render: r => <StatusBadge status={r.status} color={STATUS_COLORS[r.status]} /> },
    { header: 'Actions', render: r => (
      <button onClick={() => setDeleteId(r._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Inspection Plans</h1>
      </div>
      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search plans..." />
        <FilterToolbar label="Status" value={status} onChange={v => { setStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'draft', label: 'Draft' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'obsolete', label: 'Obsolete' }]} />
      </div>
      {loading ? <LoadingState /> : plans.length === 0 ? <EmptyState message="No inspection plans found." /> : (
        <>
          <DataTable columns={columns} data={plans} />
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Inspection Plan" message="Are you sure you want to delete this plan?"
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
