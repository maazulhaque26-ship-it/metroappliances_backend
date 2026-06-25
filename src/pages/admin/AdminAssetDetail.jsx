import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import Timeline     from '../../components/shared/Timeline';
import { fetchAsset } from '../../services/eamAPI';

const TABS = ['Overview','Documents','Warranties','Lifecycle'];

export default function AdminAssetDetail() {
  const { id }  = useParams();
  const [data,  setData]  = useState(null);
  const [tab,   setTab]   = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchAsset(id)
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;
  if (!data)   return <EmptyState title="Asset not found" />;

  const { asset, docs = [], warranties = [], lifecycle = [] } = data;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/admin/eam/assets" className="text-sm text-orange-500 hover:underline">← Assets</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{asset.name}</h1>
          <p className="text-gray-500 text-sm">{asset.assetNumber} · {asset.assetType}</p>
        </div>
        <div className="flex gap-3 items-center">
          <StatusBadge status={asset.status} />
          <Link to={`/admin/eam/assets/${id}/edit`} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">Edit</Link>
        </div>
      </div>

      {/* Health Score */}
      {asset.healthScore !== undefined && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Asset Health Score</p>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-4 rounded-full ${asset.healthScore >= 80 ? 'bg-green-500' : asset.healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${asset.healthScore}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-800">{asset.healthScore}%</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-700">Asset Details</h3>
            {[
              ['Serial Number', asset.serialNumber],
              ['Model',         asset.model],
              ['Manufacturer',  asset.manufacturer],
              ['Purchase Date', asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '—'],
              ['Purchase Cost', asset.purchaseCost ? `₹${asset.purchaseCost.toLocaleString('en-IN')}` : '—'],
              ['Location',      asset.location?.name],
              ['Category',      asset.category?.name],
              ['MTBF (hrs)',    asset.mtbf],
              ['MTTR (hrs)',    asset.mttr],
            ].map(([k, v]) => v ? (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ) : null)}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Quick Links</h3>
            <div className="space-y-2">
              {[
                ['Maintenance Work Orders', `/admin/eam/work-orders?assetId=${id}`],
                ['Maintenance History',     `/admin/eam/maintenance-history?assetId=${id}`],
                ['Condition Monitors',      `/admin/eam/condition-monitoring?assetId=${id}`],
                ['Breakdown Records',       `/admin/eam/breakdowns?assetId=${id}`],
                ['Asset Meters',            `/admin/eam/meters?assetId=${id}`],
              ].map(([label, to]) => (
                <Link key={label} to={to} className="block text-sm text-orange-600 hover:underline">→ {label}</Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Documents' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Documents ({docs.length})</h3>
          {docs.length === 0 ? <EmptyState title="No documents" /> : (
            <div className="space-y-2">
              {docs.map(d => (
                <div key={d._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-gray-500">{d.documentType}</p>
                  </div>
                  {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Warranties' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Warranties ({warranties.length})</h3>
          {warranties.length === 0 ? <EmptyState title="No warranties" /> : (
            <div className="space-y-2">
              {warranties.map(w => (
                <div key={w._id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div>
                    <p className="font-medium">{w.warrantyNumber} · {w.warrantyType}</p>
                    <p className="text-gray-500">{w.vendor} · Expires: {w.endDate ? new Date(w.endDate).toLocaleDateString() : '—'}</p>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Lifecycle' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Lifecycle Events</h3>
          {lifecycle.length === 0 ? <EmptyState title="No events recorded" /> : (
            <Timeline items={lifecycle.map(e => ({
              date:    new Date(e.eventDate).toLocaleDateString(),
              title:   e.eventType.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
              content: e.description || e.notes || '',
            }))} />
          )}
        </div>
      )}
    </div>
  );
}
