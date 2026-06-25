import React, { useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { getSupplierQualityRecords, deleteSupplierQualityRecord } from '../../services/qmsAPI';

const SUP_STATUS_COLORS = { approved: 'green', conditional: 'yellow', probation: 'orange', suspended: 'red', disqualified: 'red', under_evaluation: 'blue' };

export default function AdminSupplierQuality() {
  const [records, setRecords]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [recordType, setRecordType] = useState('');
  const [supplierStatus, setSupplierStatus] = useState('');
  const [loading, setLoading]   = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    getSupplierQualityRecords({ page, limit: 20, search, recordType, supplierStatus })
      .then(r => { setRecords(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, recordType, supplierStatus]);

  const handleDelete = async () => {
    await deleteSupplierQualityRecord(deleteId);
    setDeleteId(null);
    load();
  };

  const scoreColor = (v) => v >= 80 ? 'text-green-600' : v >= 60 ? 'text-yellow-600' : 'text-red-600';

  const columns = [
    { header: 'Record #', accessor: 'recordNumber' },
    { header: 'Vendor', accessor: 'vendorName' },
    { header: 'Code', accessor: 'vendorCode' },
    { header: 'Type', accessor: 'recordType' },
    { header: 'Quality', render: r => <span className={`font-semibold ${scoreColor(r.qualityScore)}`}>{r.qualityScore}</span> },
    { header: 'Delivery', render: r => <span className={`font-semibold ${scoreColor(r.deliveryScore)}`}>{r.deliveryScore}</span> },
    { header: 'Overall', render: r => <span className={`font-semibold ${scoreColor(r.overallScore)}`}>{r.overallScore}</span> },
    { header: 'Supplier Status', render: r => <StatusBadge status={r.supplierStatus} color={SUP_STATUS_COLORS[r.supplierStatus]} /> },
    { header: 'Date', render: r => new Date(r.recordDate).toLocaleDateString() },
    { header: 'Actions', render: r => (
      <button onClick={() => setDeleteId(r._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Supplier Quality</h1>
      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by vendor..." />
        <FilterToolbar label="Type" value={recordType} onChange={v => { setRecordType(v); setPage(1); }}
          options={[{ value: '', label: 'All Types' }, { value: 'evaluation', label: 'Evaluation' }, { value: 'audit', label: 'Audit' }, { value: 'inspection', label: 'Inspection' }, { value: 'complaint', label: 'Complaint' }]} />
        <FilterToolbar label="Status" value={supplierStatus} onChange={v => { setSupplierStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'approved', label: 'Approved' }, { value: 'conditional', label: 'Conditional' }, { value: 'probation', label: 'Probation' }, { value: 'suspended', label: 'Suspended' }]} />
      </div>
      {loading ? <LoadingState /> : records.length === 0 ? <EmptyState message="No supplier quality records." /> : (
        <>
          <DataTable columns={columns} data={records} />
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Record" message="Are you sure?"
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
