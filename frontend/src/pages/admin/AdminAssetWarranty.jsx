import React, { useEffect, useState, useCallback } from 'react';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge   from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchAssets, fetchAssetWarranties } from '../../services/eamAPI';

export default function AdminAssetWarranty() {
  const [warranties, setWarranties] = useState([]);
  const [assets,     setAssets]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const LIMIT = 20;

  useEffect(() => {
    // Load all assets and gather warranties
    setLoading(true);
    fetchAssets({ limit: 200 })
      .then(async res => {
        const assetList = res.data.data || [];
        setAssets(assetList);
        // Gather warranties from all assets (simplified view)
        const allWarranties = [];
        await Promise.all(assetList.slice(0, 30).map(async a => {
          try {
            const r = await fetchAssetWarranties(a._id);
            (r.data.data || []).forEach(w => allWarranties.push({ ...w, assetName: a.name, assetNumber: a.assetNumber }));
          } catch {}
        }));
        setWarranties(allWarranties);
        setTotal(allWarranties.length);
      })
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [page]);

  const isExpiringSoon = endDate => {
    if (!endDate) return false;
    const days = (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  };

  const isExpired = endDate => endDate && new Date(endDate) < new Date();

  const filtered = warranties.filter(w => !search || w.assetName?.toLowerCase().includes(search.toLowerCase()) || w.warrantyNumber?.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { key: 'warrantyNumber', label: 'Warranty No.' },
    { key: 'assetName',      label: 'Asset',        render: (v, row) => <span>{v} <span className="text-xs text-gray-400">({row.assetNumber})</span></span> },
    { key: 'warrantyType',   label: 'Type',         render: v => <span className="capitalize text-sm">{v?.replace(/_/g,' ')}</span> },
    { key: 'vendor',         label: 'Vendor' },
    { key: 'startDate',      label: 'Start',        render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'endDate',        label: 'Expiry',       render: v => {
        if (!v) return '—';
        const label = new Date(v).toLocaleDateString();
        if (isExpired(v)) return <span className="text-red-500 font-medium">{label} (Expired)</span>;
        if (isExpiringSoon(v)) return <span className="text-yellow-600 font-medium">{label} (Expiring)</span>;
        return label;
      }},
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
  ];

  const expiring  = warranties.filter(w => isExpiringSoon(w.endDate));
  const expired   = warranties.filter(w => isExpired(w.endDate));
  const active    = warranties.filter(w => !isExpired(w.endDate) && w.status === 'active');

  return (
    <div className="p-6">
      <SectionHeader title="Asset Warranties" subtitle={`${total} warranties`} />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{active.length}</p>
          <p className="text-sm text-green-600">Active</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{expiring.length}</p>
          <p className="text-sm text-yellow-600">Expiring (30d)</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{expired.length}</p>
          <p className="text-sm text-red-600">Expired</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <SearchToolbar value={search} onChange={v => setSearch(v)} placeholder="Search warranties..." />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> :
        filtered.length === 0 ? <EmptyState title="No warranties found" /> :
        <DataTable columns={columns} data={filtered} />
      }
    </div>
  );
}
