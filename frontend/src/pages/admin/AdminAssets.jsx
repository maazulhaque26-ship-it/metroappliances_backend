import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { fetchAssets, deleteAsset } from '../../services/eamAPI';

const STATUS_OPTS  = ['','operational','idle','maintenance','breakdown','disposed','retired'].map(v => ({ value: v, label: v || 'All Status' }));
const TYPE_OPTS    = ['','machinery','equipment','vehicle','facility','it_asset','instrument','utility','other'].map(v => ({ value: v, label: v || 'All Types' }));

export default function AdminAssets() {
  const [assets,  setAssets]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [assetType, setAssetType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [delId,   setDelId]   = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAssets({ page, limit: LIMIT, search, status, assetType });
      setAssets(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, assetType]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try { await deleteAsset(delId); setDelId(null); load(); } catch {}
  };

  const columns = [
    { key: 'assetNumber', label: 'Asset No.' },
    { key: 'name',        label: 'Name',
      render: (v, row) => <Link to={`/admin/eam/assets/${row._id}`} className="text-orange-600 hover:underline font-medium">{v}</Link> },
    { key: 'assetType',   label: 'Type', render: v => <span className="capitalize">{v}</span> },
    { key: 'location',    label: 'Location', render: (v, row) => row.location?.name || '—' },
    { key: 'status',      label: 'Status',   render: v => <StatusBadge status={v} /> },
    { key: 'healthScore', label: 'Health',   render: v => (
        <span className={v >= 80 ? 'text-green-600' : v >= 50 ? 'text-yellow-600' : 'text-red-600'}>
          {v ?? '—'}%
        </span>
      )},
    { key: '_id', label: 'Actions', render: (v, row) => (
        <div className="flex gap-2">
          <Link to={`/admin/eam/assets/${row._id}`} className="text-blue-600 hover:underline text-sm">View</Link>
          <button onClick={() => setDelId(v)} className="text-red-500 hover:underline text-sm">Delete</button>
        </div>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Asset Register" subtitle={`${total} assets`}>
        <Link to="/admin/eam/assets/new" className="btn-primary px-4 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600">+ Add Asset</Link>
      </SectionHeader>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <SearchToolbar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search assets..." />
        <FilterToolbar filters={[
          { label: 'Status',    value: status,    onChange: v => { setStatus(v);    setPage(1); }, options: STATUS_OPTS },
          { label: 'Type',      value: assetType, onChange: v => { setAssetType(v); setPage(1); }, options: TYPE_OPTS  },
        ]} />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        assets.length === 0 ? <EmptyState title="No assets found" /> :
        <>
          <DataTable columns={columns} data={assets} />
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </>
      }

      <ConfirmDialog
        open={!!delId}
        title="Delete Asset"
        message="This will soft-delete the asset. Continue?"
        onConfirm={handleDelete}
        onCancel={() => setDelId(null)}
      />
    </div>
  );
}
