import React, { useEffect, useState } from 'react';
import DataTable from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import Pagination from '../../components/shared/Pagination';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import LoadingState from '../../components/shared/LoadingState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { getGauges, deleteGauge } from '../../services/qmsAPI';

const STATUS_COLORS      = { in_service: 'green', out_of_service: 'red', under_calibration: 'yellow', lost: 'gray', scrapped: 'gray', standby: 'blue' };
const CAL_STATUS_COLORS  = { calibrated: 'green', due: 'yellow', overdue: 'red', not_required: 'gray' };

export default function AdminGaugeManagement() {
  const [gauges, setGauges]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [calStatus, setCalStatus] = useState('');
  const [loading, setLoading]   = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    getGauges({ page, limit: 20, search, status, calibrationStatus: calStatus })
      .then(r => { setGauges(r.data.data); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, status, calStatus]);

  const handleDelete = async () => {
    await deleteGauge(deleteId);
    setDeleteId(null);
    load();
  };

  const columns = [
    { header: 'Gauge #', accessor: 'gaugeNumber' },
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'gaugeType' },
    { header: 'Serial #', accessor: 'serialNumber' },
    { header: 'Location', accessor: 'location' },
    { header: 'Last Cal.', render: r => r.lastCalibrationDate ? new Date(r.lastCalibrationDate).toLocaleDateString() : '—' },
    { header: 'Next Cal.', render: r => r.nextCalibrationDate ? new Date(r.nextCalibrationDate).toLocaleDateString() : '—' },
    { header: 'Cal. Status', render: r => <StatusBadge status={r.calibrationStatus} color={CAL_STATUS_COLORS[r.calibrationStatus]} /> },
    { header: 'Status', render: r => <StatusBadge status={r.status} color={STATUS_COLORS[r.status]} /> },
    { header: 'Actions', render: r => (
      <button onClick={() => setDeleteId(r._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Gauge Management</h1>
      <div className="flex gap-3 flex-wrap">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search gauges..." />
        <FilterToolbar label="Status" value={status} onChange={v => { setStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'in_service', label: 'In Service' }, { value: 'out_of_service', label: 'Out of Service' }, { value: 'under_calibration', label: 'Under Calibration' }]} />
        <FilterToolbar label="Cal. Status" value={calStatus} onChange={v => { setCalStatus(v); setPage(1); }}
          options={[{ value: '', label: 'All' }, { value: 'calibrated', label: 'Calibrated' }, { value: 'due', label: 'Due' }, { value: 'overdue', label: 'Overdue' }]} />
      </div>
      {loading ? <LoadingState /> : gauges.length === 0 ? <EmptyState message="No gauges found." /> : (
        <>
          <DataTable columns={columns} data={gauges} />
          <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
      <ConfirmDialog open={!!deleteId} title="Delete Gauge" message="Are you sure?"
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
