import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import api from '../../services/api';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge  from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import { usePagination } from '../../hooks/usePagination';
import { useSearch }     from '../../hooks/useSearch';
import { useFilters }    from '../../hooks/useFilters';
import { toast } from 'react-toastify';

const STATUS_OPTS = [
  { label: 'All',             value: '' },
  { label: 'Active',          value: 'active' },
  { label: 'Pending Approval',value: 'pending_approval' },
  { label: 'Inactive',        value: 'inactive' },
  { label: 'Blacklisted',     value: 'blacklisted' },
];

export default function AdminVendorList() {
  const navigate  = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);

  const { page, limit, setPage } = usePagination();
  const { query: search, setQuery: setSearch, debouncedQuery: debouncedSearch } = useSearch();
  const { filters, setFilter } = useFilters({ status: '' });

  const fetchVendors = useCallback(() => {
    setLoading(true);
    api.get('/admin/vendors', { params: { search: debouncedSearch, status: filters.status, page, limit } })
      .then(r => { setVendors(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters.status, page, limit]);

  React.useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const columns = [
    { header: 'Vendor Code', accessor: 'vendorCode', render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.vendorCode || '—'}</span> },
    { header: 'Company',     accessor: 'companyName', render: r => <div><p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.companyName}</p><p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.vendorType}</p></div> },
    { header: 'GST',         accessor: 'gstNumber', render: r => <span className="text-xs font-mono">{r.gstNumber || '—'}</span> },
    { header: 'Contact',     accessor: 'email', render: r => <div><p className="text-xs">{r.email || '—'}</p><p className="text-xs" style={{ color: 'var(--text-4)' }}>{r.phone || ''}</p></div> },
    { header: 'Rating',      accessor: 'overallRating', render: r => <span className="font-bold text-sm" style={{ color: '#F59E0B' }}>{r.overallRating ? `${r.overallRating}/5` : '—'}</span> },
    { header: 'Status',      accessor: 'status', render: r => <StatusBadge status={r.status} /> },
    { header: '',            accessor: 'actions', render: r => (
      <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/procurement/vendors/${r._id}`); }}
        className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--text-4)' }}>
        <FiEdit2 size={14} />
      </button>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Vendor Management" subtitle={`${total} vendors`} />
        <button onClick={() => navigate('/admin/procurement/vendors/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#FF7A00' }}>
          <FiPlus size={16} /> Add Vendor
        </button>
      </div>

      <SearchToolbar value={search} onChange={setSearch} placeholder="Search vendor name, code, GST…" />
      <FilterToolbar filters={[
        { key: 'status', label: 'Status', options: STATUS_OPTS, value: filters.status, onChange: v => setFilter('status', v) },
      ]} />

      <DataTable
        columns={columns}
        data={vendors}
        loading={loading}
        onRowClick={r => navigate(`/admin/procurement/vendors/${r._id}`)}
        emptyMessage="No vendors found"
      />
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
    </div>
  );
}
