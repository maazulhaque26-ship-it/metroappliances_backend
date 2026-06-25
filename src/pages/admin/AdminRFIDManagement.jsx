import { useState, useEffect } from 'react';
import { FiRadio, FiPlus, FiRefreshCw, FiSearch } from 'react-icons/fi';
import api from '../../services/api';

const STATUS_COLORS = { active: '#22c55e', inactive: '#6b7280', lost: '#ef4444', damaged: '#f97316', replaced: '#a855f7' };

function TagRow({ tag, onSelect }) {
  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }} onClick={() => onSelect(tag)}>
      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{tag.epc}</td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>{tag.entityType}</td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>{tag.label || '—'}</td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11,
          background: `${STATUS_COLORS[tag.status]}18`, color: STATUS_COLORS[tag.status], fontWeight: 600 }}>
          {tag.status}
        </span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#999' }}>
        {tag.lastSeenAt ? new Date(tag.lastSeenAt).toLocaleString() : 'Never'}
      </td>
    </tr>
  );
}

function ReaderRow({ reader }) {
  const color = reader.status === 'online' ? '#22c55e' : reader.status === 'offline' ? '#ef4444' : '#f59e0b';
  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600 }}>{reader.name}</td>
      <td style={{ padding: '11px 16px', fontSize: 12, color: '#666' }}>{reader.type?.replace(/_/g, ' ')}</td>
      <td style={{ padding: '11px 16px', fontSize: 12, color: '#666' }}>{reader.ipAddress || '—'}</td>
      <td style={{ padding: '11px 16px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
          {reader.status}
        </span>
      </td>
      <td style={{ padding: '11px 16px', fontSize: 12, color: '#999' }}>
        {reader.lastHeartbeat ? new Date(reader.lastHeartbeat).toLocaleTimeString() : '—'}
      </td>
    </tr>
  );
}

export default function AdminRFIDManagement() {
  const [tab, setTab]           = useState('tags');
  const [tags, setTags]         = useState([]);
  const [readers, setReaders]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouses, setWarehouses]     = useState([]);
  const [selectedWH, setSelectedWH]     = useState('');

  const [showBulkScan, setShowBulkScan] = useState(false);
  const [bulkEPCs, setBulkEPCs]         = useState('');
  const [bulkResult, setBulkResult]     = useState(null);

  useEffect(() => {
    api.get('/admin/warehouses').then(r => {
      const whs = r.data.data || [];
      setWarehouses(whs);
      if (whs.length > 0) setSelectedWH(whs[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedWH) return;
    setLoading(true);
    const qp = `warehouseId=${selectedWH}&page=${page}&limit=50${statusFilter ? `&status=${statusFilter}` : ''}`;
    Promise.allSettled([
      api.get(`/admin/rfid/tags?${qp}`),
      api.get(`/admin/rfid/readers?warehouseId=${selectedWH}`),
      api.get(`/admin/rfid/stats?warehouseId=${selectedWH}`),
    ]).then(([t, r, s]) => {
      if (t.status === 'fulfilled') { setTags(t.value.data.data || []); setTotal(t.value.data.total || 0); }
      if (r.status === 'fulfilled') setReaders(r.value.data.data || []);
      if (s.status === 'fulfilled') setStats(s.value.data.data);
    }).finally(() => setLoading(false));
  }, [selectedWH, page, statusFilter]);

  const loadHistory = async (tag) => {
    setSelected(tag);
    const r = await api.get(`/admin/rfid/tags/${tag._id}/history`);
    setHistory(r.data.data?.scans || []);
  };

  const runBulkScan = async () => {
    const epcs = bulkEPCs.split(/[\n,\s]+/).map(e => e.trim()).filter(Boolean);
    if (!epcs.length) return;
    const r = await api.post('/admin/rfid/bulk-scan', { epcs, warehouseId: selectedWH, eventType: 'inventory_count' });
    setBulkResult(r.data.data);
  };

  const card = (label, value, color = '#1a1a2e') => (
    <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiRadio color="#FF7A00" /> RFID Management
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button onClick={() => setShowBulkScan(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: '#FF7A00', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            <FiPlus size={14} /> Bulk Scan
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 24 }}>
          {card('Total Tags', stats.total)}
          {card('Active', stats.active, '#22c55e')}
          {card('Inactive', stats.inactive, '#6b7280')}
          {card('Lost', stats.lost, '#ef4444')}
          {card('Scans Today', stats.scansToday, '#FF7A00')}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        {['tags', 'readers'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 24px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? '#FF7A00' : '#666',
              borderBottom: tab === t ? '2px solid #FF7A00' : '2px solid transparent',
              marginBottom: -2 }}>
            {t === 'tags' ? `RFID Tags (${total})` : `Readers (${readers.length})`}
          </button>
        ))}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, paddingBottom: 4 }}>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 12 }}>
            <option value="">All Statuses</option>
            {['active','inactive','lost','damaged','replaced'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div style={{ padding: 60, textAlign: 'center', color: '#999' }}>Loading…</div> : (
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          {tab === 'tags' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['EPC', 'Entity Type', 'Label', 'Status', 'Last Seen'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tags.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#999' }}>No RFID tags found</td></tr>
                ) : tags.map(t => <TagRow key={t._id} tag={t} onSelect={loadHistory} />)}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Name', 'Type', 'IP Address', 'Status', 'Last Heartbeat'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {readers.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#999' }}>No readers configured</td></tr>
                ) : readers.map(r => <ReaderRow key={r._id} reader={r} />)}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pagination */}
      {tab === 'tags' && total > 50 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>Prev</button>
          <span style={{ padding: '6px 12px', fontSize: 13, color: '#666' }}>Page {page}</span>
          <button disabled={tags.length < 50} onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>Next</button>
        </div>
      )}

      {/* Tag History Panel */}
      {selected && (
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: '#fff',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.12)', zIndex: 1000, padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Tag History</h2>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 13, background: '#f9fafb', padding: 10, borderRadius: 8, marginBottom: 16 }}>{selected.epc}</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}><b>Entity:</b> {selected.entityType} · {selected.status}</div>
          <h4 style={{ fontSize: 14, margin: '16px 0 10px', fontWeight: 600 }}>Scan History</h4>
          {history.length === 0 ? <div style={{ color: '#999', fontSize: 13 }}>No scans recorded</div>
            : history.map((s, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.eventType}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{new Date(s.scannedAt).toLocaleString()}</div>
              </div>
            ))}
        </div>
      )}

      {/* Bulk Scan Modal */}
      {showBulkScan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 480, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Bulk RFID Scan</h2>
              <button onClick={() => { setShowBulkScan(false); setBulkResult(null); setBulkEPCs(''); }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <textarea value={bulkEPCs} onChange={e => setBulkEPCs(e.target.value)}
              placeholder="Paste EPCs here (one per line, comma, or space separated)"
              style={{ width: '100%', height: 160, padding: 12, borderRadius: 8, border: '1px solid #e0e0e0',
                fontFamily: 'monospace', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
            <button onClick={runBulkScan}
              style={{ marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 8, background: '#FF7A00',
                color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              Process Scan
            </button>
            {bulkResult && (
              <div style={{ marginTop: 16, background: '#f9fafb', borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Results</div>
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <div>Total: <b>{bulkResult.results?.total}</b></div>
                  <div style={{ color: '#22c55e' }}>Known: <b>{bulkResult.results?.known}</b></div>
                  <div style={{ color: '#ef4444' }}>Unknown: <b>{bulkResult.results?.unknown}</b></div>
                  <div style={{ color: '#6b7280' }}>Duplicates: <b>{bulkResult.results?.duplicates}</b></div>
                  <div style={{ color: '#999', fontSize: 11, marginTop: 6 }}>Batch: {bulkResult.batchId}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
