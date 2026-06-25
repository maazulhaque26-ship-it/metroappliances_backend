import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import DataTable     from '../../components/shared/DataTable';
import SearchToolbar from '../../components/shared/SearchToolbar';
import SectionHeader from '../../components/shared/SectionHeader';
import ExportButton  from '../../components/shared/ExportButton';
import LoadingState  from '../../components/shared/LoadingState';
import { useNavigate } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';
import { useSearch } from '../../hooks/useSearch';
import { useExport } from '../../hooks/useExport';

const RatingBar = ({ value, max = 5 }) => {
  const pct = ((value || 0) / max) * 100;
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full h-1.5" style={{ background: 'var(--border)' }}>
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{value?.toFixed(1) || '—'}</span>
    </div>
  );
};

export default function AdminVendorPerformance() {
  const navigate  = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { query: search, setQuery: setSearch, debouncedQuery: debouncedSearch } = useSearch();
  const { exportCSV } = useExport();

  useEffect(() => {
    api.get('/admin/procurement/reports/vendor-performance')
      .then(r => setVendors(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter(v =>
    !debouncedSearch ||
    v.companyName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    v.vendorCode?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const columns = [
    { header: 'Vendor',       accessor: 'companyName', render: r => (
      <div>
        <p className="font-semibold text-sm cursor-pointer" style={{ color: '#FF7A00' }} onClick={() => navigate(`/admin/procurement/vendors/${r._id}`)}>{r.companyName}</p>
        <p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.vendorCode}</p>
      </div>
    )},
    { header: 'Overall',      accessor: 'overallRating',      render: r => <RatingBar value={r.overallRating} /> },
    { header: 'On-Time %',    accessor: 'onTimeDeliveryRate', render: r => <span className="text-sm font-bold" style={{ color: r.onTimeDeliveryRate >= 90 ? '#10B981' : r.onTimeDeliveryRate >= 70 ? '#F59E0B' : '#EF4444' }}>{r.onTimeDeliveryRate ? `${r.onTimeDeliveryRate}%` : '—'}</span> },
    { header: 'Quality Score',accessor: 'qualityScore',       render: r => <RatingBar value={(r.qualityScore || 0) / 20} /> },
    { header: 'Orders',       accessor: 'totalOrders',        render: r => <span className="font-bold text-sm">{r.totalOrders || 0}</span> },
    { header: 'Total Spend',  accessor: 'totalSpend',         render: r => <span className="text-sm font-bold" style={{ color: '#10B981' }}>₹{(r.totalSpend || 0).toLocaleString('en-IN')}</span> },
    { header: 'Lead Time',    accessor: 'averageLeadTime',    render: r => <span className="text-sm">{r.averageLeadTime ? `${r.averageLeadTime}d` : '—'}</span> },
  ];

  if (loading) return <LoadingState message="Loading vendor performance…" />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Vendor Performance" subtitle={`${filtered.length} vendors`} />
        <ExportButton onExport={() => exportCSV(filtered, 'vendor-performance')} />
      </div>
      <SearchToolbar value={search} onChange={setSearch} placeholder="Search vendor name or code…" />
      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No vendor performance data" />
    </div>
  );
}
