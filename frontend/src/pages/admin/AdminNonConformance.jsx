import React, { useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { getNCReports, deleteNCReport } from '../../services/qmsAPI';

const STATUS_COLORS = { open: 'red', under_review: 'blue', disposition_set: 'yellow', capa_raised: 'orange', closed: 'green', cancelled: 'gray' };
const TYPE_COLORS   = { minor: 'yellow', major: 'orange', critical: 'red' };

export default function AdminNonConformance() {
  const [ncrs, setNCRs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [ncType, setNcType]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    getNCReports({ page, limit: 20, search, status, ncType })
      .then(r => { setNCRs(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, status, ncType]);

  const handleDelete = async () => {
    await deleteNCReport(deleteId);
    setDeleteId(null);
    load();
  };

  const columns = [
    { header: 'NCR #', accessor: 'ncNumber' },
    { header: 'Title', accessor: 'title' },
    { header: 'Type', render: r => <StatusBadge status={r.ncType} color={TYPE_COLORS[r.ncType]} /> },
    { header: 'Product', accessor: 'productName' },
    { header: 'Vendor', accessor: 'vendorName' },
    { header: 'Qty', accessor: 'quantity' },
    { header: 'Category', accessor: 'defectCategory' },
    { header: 'Disposition', accessor: 'disposition' },
    { header: 'Status', render: r => <StatusBadge status={r.status} color={STATUS_COLORS[r.status]} /> },
    { header: 'Actions', render: r => (
      <button onClick={() => setDeleteId(r._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Non-Conformance Reports</h1>
      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search NCRs..." />
        <FilterToolbar label="Status" value={status} onChange={v => { setStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'under_review', label: 'Under Review' }, { value: 'closed', label: 'Closed' }]} />
        <FilterToolbar label="Type" value={ncType} onChange={v => { setNcType(v); setPage(1); }}
          options={[{ value: '', label: 'All Types' }, { value: 'minor', label: 'Minor' }, { value: 'major', label: 'Major' }, { value: 'critical', label: 'Critical' }]} />
      </div>
      {loading ? <LoadingState /> : ncrs.length === 0 ? <EmptyState message="No non-conformance reports found." /> : (
        <>
          <DataTable columns={columns} data={ncrs} />
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete NCR" message="Are you sure?"
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
