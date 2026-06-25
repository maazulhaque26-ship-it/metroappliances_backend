import React, { useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { getInspectionLots, deleteInspectionLot } from '../../services/qmsAPI';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = { pending: 'yellow', in_progress: 'blue', passed: 'green', failed: 'red', conditional: 'orange', cancelled: 'gray' };

export default function AdminInspectionLots() {
  const [lots, setLots]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getInspectionLots({ page, limit: 20, search, status })
      .then(r => { setLots(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, status]);

  const handleDelete = async () => {
    await deleteInspectionLot(deleteId);
    setDeleteId(null);
    load();
  };

  const columns = [
    { header: 'Lot #', accessor: 'lotNumber' },
    { header: 'Product', accessor: 'productName' },
    { header: 'Type', accessor: 'inspectionType' },
    { header: 'Source', accessor: 'source' },
    { header: 'Lot Size', accessor: 'lotSize' },
    { header: 'Sample Size', accessor: 'sampleSize' },
    { header: 'Status', render: r => <StatusBadge status={r.status} color={STATUS_COLORS[r.status]} /> },
    { header: 'Disposition', render: r => <span className="text-sm">{r.disposition}</span> },
    { header: 'Actions', render: r => (
      <div className="flex gap-2">
        <button onClick={() => navigate(`/admin/qms/inspection-lots/${r._id}`)} className="text-blue-500 hover:text-blue-700 text-sm">View</button>
        <button onClick={() => setDeleteId(r._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Inspection Lots</h1>
      </div>
      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search lots..." />
        <FilterToolbar label="Status" value={status} onChange={v => { setStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' }, { value: 'passed', label: 'Passed' }, { value: 'failed', label: 'Failed' }]} />
      </div>
      {loading ? <LoadingState /> : lots.length === 0 ? <EmptyState message="No inspection lots found." /> : (
        <>
          <DataTable columns={columns} data={lots} />
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Inspection Lot" message="Are you sure?"
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
