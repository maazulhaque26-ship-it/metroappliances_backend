import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';
import { fetchAssets, fetchAssetHierarchy } from '../../services/eamAPI';

function HierarchyNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  if (!node) return null;
  const children = node.children || [];
  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className={`flex items-center gap-2 py-2 ${depth === 0 ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
        {children.length > 0 && (
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600 w-4 text-center">
            {expanded ? '▾' : '▸'}
          </button>
        )}
        {children.length === 0 && <span className="w-4" />}
        <span className="text-sm">{node.assetName || node.asset?.name || '—'}</span>
        {node.path && <span className="text-xs text-gray-400">({node.path})</span>}
      </div>
      {expanded && children.map((child, i) => <HierarchyNode key={i} node={child} depth={depth + 1} />)}
    </div>
  );
}

export default function AdminAssetHierarchy() {
  const [assets,    setAssets]    = useState([]);
  const [selected,  setSelected]  = useState('');
  const [hierarchy, setHierarchy] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    fetchAssets({ limit: 200, status: 'operational' })
      .then(r => setAssets(r.data.data || []))
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setAssetsLoading(false));
  }, []);

  const loadHierarchy = async id => {
    if (!id) return;
    setLoading(true);
    setHierarchy(null);
    try {
      const res = await fetchAssetHierarchy(id);
      setHierarchy(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <SectionHeader title="Asset Hierarchy" subtitle="Functional location tree" />

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Root Asset</label>
        {assetsLoading ? <LoadingState /> : (
          <select value={selected} onChange={e => { setSelected(e.target.value); loadHierarchy(e.target.value); }}
            className="w-full max-w-md border rounded-lg px-3 py-2 text-sm">
            <option value="">— Choose an asset —</option>
            {assets.map(a => <option key={a._id} value={a._id}>{a.name} ({a.assetNumber})</option>)}
          </select>
        )}
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> :
        !selected ? <EmptyState title="Select an asset to view its hierarchy" /> :
        !hierarchy ? <EmptyState title="No hierarchy data for this asset" /> : (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Hierarchy Tree</h3>
            <HierarchyNode node={hierarchy} depth={0} />
          </div>
        )
      }
    </div>
  );
}
