import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import SectionHeader from '../../components/shared/SectionHeader';
import DataTable     from '../../components/shared/DataTable';
import ExportButton  from '../../components/shared/ExportButton';
import StatusBadge   from '../../components/shared/StatusBadge';
import ChartCard     from '../../components/shared/ChartCard';
import LoadingState  from '../../components/shared/LoadingState';
import { useExport } from '../../hooks/useExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => `₹${(v || 0).toLocaleString('en-IN')}`;
const COLORS      = ['#FF7A00','#3B82F6','#10B981','#8B5CF6','#F59E0B'];

export default function AdminProcurementReports() {
  const [tab,    setTab]    = useState('spend');
  const [data,   setData]   = useState(null);
  const [loading,setLoading]= useState(false);
  const { exportCSV } = useExport();

  useEffect(() => {
    setLoading(true);
    const endpointMap = {
      spend:        '/admin/procurement/reports/spend',
      performance:  '/admin/procurement/reports/vendor-performance',
      open_orders:  '/admin/procurement/reports/open-orders',
      delays:       '/admin/procurement/reports/delivery-delays',
      ratings:      '/admin/procurement/reports/supplier-ratings',
    };
    api.get(endpointMap[tab])
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, [tab]);

  const TABS = [
    { label: 'Purchase Spend',        value: 'spend' },
    { label: 'Vendor Performance',    value: 'performance' },
    { label: 'Open Orders',           value: 'open_orders' },
    { label: 'Delivery Delays',       value: 'delays' },
    { label: 'Supplier Ratings',      value: 'ratings' },
  ];

  const spendColumns = [
    { header: 'Vendor',  accessor: 'vendorName', render: r => <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.vendorName}</span> },
    { header: 'Orders',  accessor: 'count',      render: r => <span>{r.count}</span> },
    { header: 'Total',   accessor: 'total',      render: r => <span className="font-bold" style={{ color: '#10B981' }}>{fmtCurrency(r.total)}</span> },
  ];

  const delayColumns = [
    { header: 'PO #',      accessor: 'poNumber', render: r => <span className="font-mono text-xs" style={{ color: '#FF7A00' }}>{r.poNumber}</span> },
    { header: 'Vendor',    accessor: 'vendor',   render: r => <span className="text-sm">{r.vendor?.companyName}</span> },
    { header: 'Expected',  accessor: 'expected', render: r => <span className="text-xs text-red-500">{fmtDate(r.expected)}</span> },
    { header: 'Days Late', accessor: 'daysLate', render: r => <span className="font-bold text-red-500">{r.daysLate}d</span> },
    { header: 'Status',    accessor: 'status',   render: r => <StatusBadge status={r.status} /> },
  ];

  const ratingColumns = [
    { header: 'Vendor',        accessor: 'vendorName',      render: r => <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.vendorName}</span> },
    { header: 'Overall',       accessor: 'avgOverall',      render: r => <span className="font-bold" style={{ color: '#F59E0B' }}>{r.avgOverall}/5</span> },
    { header: 'Delivery',      accessor: 'avgDelivery',     render: r => <span className="text-sm">{r.avgDelivery}</span> },
    { header: 'Quality',       accessor: 'avgQuality',      render: r => <span className="text-sm">{r.avgQuality}</span> },
    { header: 'Communication', accessor: 'avgCommunication',render: r => <span className="text-sm">{r.avgCommunication}</span> },
    { header: 'Reviews',       accessor: 'count',           render: r => <span className="text-sm">{r.count}</span> },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <SectionHeader title="Procurement Reports" subtitle="Analytics & insights" />
        {data && <ExportButton onExport={() => exportCSV(Array.isArray(data) ? data : [data], 'procurement-report')} />}
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className="px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ background: tab === t.value ? '#FF7A00' : 'var(--bg-2)', color: tab === t.value ? '#fff' : 'var(--text-4)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingState message="Loading report…" /> : (
        <>
          {tab === 'spend' && data && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <p className="text-2xl font-bold" style={{ color: '#FF7A00' }}>{fmtCurrency(data.summary?.total)}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Total Spend</p>
                </div>
                <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{data.summary?.count || 0}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Completed POs</p>
                </div>
                <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <p className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{fmtCurrency(data.summary?.avg)}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Avg PO Value</p>
                </div>
              </div>
              <ChartCard title="Monthly Spend Trend">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="_id" tick={{ fontSize: 11, fill: 'var(--text-4)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-4)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => fmtCurrency(v)} />
                    <Bar dataKey="total" fill="#FF7A00" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DataTable columns={spendColumns} data={data.byVendor || []} emptyMessage="No spend data" />
                <ChartCard title="Spend by Vendor">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={(data.byVendor || []).slice(0, 5)} dataKey="total" nameKey="vendorName" cx="50%" cy="50%" outerRadius={80} label={({ vendorName, percent }) => `${vendorName?.split(' ')[0]} ${(percent*100).toFixed(0)}%`}>
                        {(data.byVendor || []).slice(0,5).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => fmtCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>
          )}
          {tab === 'performance' && <DataTable columns={[
            { header: 'Vendor', accessor: 'companyName', render: r => <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{r.companyName}</span> },
            { header: 'Rating',   accessor: 'overallRating',      render: r => <span className="font-bold" style={{ color: '#F59E0B' }}>{r.overallRating}/5</span> },
            { header: 'On-Time',  accessor: 'onTimeDeliveryRate',  render: r => <span>{r.onTimeDeliveryRate ? `${r.onTimeDeliveryRate}%` : '—'}</span> },
            { header: 'Quality',  accessor: 'qualityScore',        render: r => <span>{r.qualityScore ? `${r.qualityScore}%` : '—'}</span> },
            { header: 'Orders',   accessor: 'totalOrders',         render: r => <span>{r.totalOrders}</span> },
            { header: 'Spend',    accessor: 'totalSpend',          render: r => <span className="font-bold" style={{ color: '#10B981' }}>{fmtCurrency(r.totalSpend)}</span> },
          ]} data={Array.isArray(data) ? data : []} emptyMessage="No performance data" />}
          {tab === 'open_orders' && <DataTable columns={[
            { header: 'PO #',     accessor: 'poNumber',   render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.poNumber}</span> },
            { header: 'Vendor',   accessor: 'vendorName', render: r => <span className="text-sm">{r.vendorName}</span> },
            { header: 'Amount',   accessor: 'totalAmount',render: r => <span className="font-bold">{fmtCurrency(r.totalAmount)}</span> },
            { header: 'Expected', accessor: 'expectedDelivery', render: r => <span className={`text-xs ${r.isLate ? 'text-red-500 font-bold' : ''}`}>{fmtDate(r.expectedDelivery)}</span> },
            { header: 'Status',   accessor: 'status',     render: r => <StatusBadge status={r.status} /> },
          ]} data={Array.isArray(data) ? data : []} emptyMessage="No open orders" />}
          {tab === 'delays' && <DataTable columns={delayColumns} data={Array.isArray(data) ? data : []} emptyMessage="No delayed orders" />}
          {tab === 'ratings' && <DataTable columns={ratingColumns} data={Array.isArray(data) ? data : []} emptyMessage="No rating data" />}
        </>
      )}
    </div>
  );
}
