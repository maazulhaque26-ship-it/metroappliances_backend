import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../services/api';
import { FiSearch, FiMapPin, FiRefreshCw, FiBox } from 'react-icons/fi';

const TEMP_COLORS = { ambient: '#6B7280', cool: '#3B82F6', cold: '#0EA5E9', frozen: '#6366F1' };
const UTIL_COLOR = (pct) => {
  if (pct >= 90) return '#EF4444';
  if (pct >= 70) return '#F59E0B';
  if (pct >= 40) return '#10B981';
  return '#6B7280';
};

function BinCell({ bin, highlighted, onClick }) {
  const pct = bin.utilizationPct ?? 0;
  const bg  = highlighted ? '#FF7A00' : UTIL_COLOR(pct);
  return (
    <div onClick={() => onClick(bin)} title={`${bin.code} — ${pct}% full`} style={{
      width: '28px', height: '28px', borderRadius: '4px', background: bg, opacity: pct === 0 ? 0.25 : 1,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '7px', fontWeight: 700, color: '#fff', border: highlighted ? '2px solid #B45309' : 'none',
      transition: 'transform 0.1s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.25)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {pct > 0 ? pct : ''}
    </div>
  );
}

export default function AdminWarehouseMap() {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');
  const [mapData, setMapData]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [selectedBin, setSelectedBin]   = useState(null);

  useEffect(() => {
    api.get('/admin/warehouses').then(r => {
      const list = r.data.data || r.data.warehouses || [];
      setWarehouses(list);
      if (list.length > 0) setSelectedWH(list[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedWH) return;
    setLoading(true); setMapData(null); setSearchResult(null); setSelectedBin(null);
    api.get(`/admin/warehouse-map/${selectedWH}`).then(r => setMapData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [selectedWH]);

  const handleSearch = useCallback(async () => {
    if (!search.trim() || !selectedWH) return;
    try {
      const r = await api.get(`/admin/warehouse-map/${selectedWH}/search?q=${encodeURIComponent(search)}`);
      setSearchResult(r.data.data);
    } catch { setSearchResult(null); }
  }, [search, selectedWH]);

  // Group bins by zone > aisle > rack
  const grouped = {};
  if (mapData?.bins) {
    for (const bin of mapData.bins) {
      const z = bin.zone || 'Unzoned';
      const a = bin.aisle || '-';
      const r = bin.rack  || '-';
      if (!grouped[z]) grouped[z] = {};
      if (!grouped[z][a]) grouped[z][a] = {};
      if (!grouped[z][a][r]) grouped[z][a][r] = [];
      grouped[z][a][r].push(bin);
    }
  }

  const highlightedCodes = searchResult ? new Set((searchResult.bins || []).map(b => b.code)) : new Set();

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1200px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Warehouse Map</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>Visual occupancy heatmap — click any bin for details</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}>
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
            <button onClick={() => { setLoading(true); api.get(`/admin/warehouse-map/${selectedWH}`).then(r => setMapData(r.data.data)).catch(() => {}).finally(() => setLoading(false)); }}
              style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {mapData && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Bins',  value: mapData.totalBins ?? 0,      color: '#6B7280' },
              { label: 'Occupied',    value: mapData.occupiedBins ?? 0,    color: '#FF7A00' },
              { label: 'Available',   value: mapData.availableBins ?? 0,   color: '#10B981' },
              { label: 'Full (≥90%)', value: mapData.fullBins ?? 0,        color: '#EF4444' },
              { label: 'SKUs Stored', value: mapData.uniqueProducts ?? 0,  color: '#6366F1' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 20px', minWidth: '120px' }}>
                <p style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value.toLocaleString()}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by SKU, product name, or bin code…"
            style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }} />
          <button onClick={handleSearch}
            style={{ padding: '10px 18px', borderRadius: '8px', background: '#FF7A00', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
            <FiSearch size={14} /> Search
          </button>
          {searchResult && (
            <button onClick={() => setSearchResult(null)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: '13px' }}>
              Clear
            </button>
          )}
        </div>

        {searchResult && (
          <div style={{ marginBottom: '16px', padding: '14px 18px', background: '#FFF7ED', borderRadius: '10px', border: '1px solid #FED7AA', fontSize: '13px', color: '#92400E' }}>
            <FiMapPin size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Found in {searchResult.bins?.length ?? 0} bin(s): {(searchResult.bins || []).map(b => b.code).join(', ')}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '11px', flexWrap: 'wrap' }}>
          {[['Empty', '#6B7280', 0.25], ['1–39%', '#6B7280', 1], ['40–69%', '#10B981', 1], ['70–89%', '#F59E0B', 1], ['90–100%', '#EF4444', 1], ['Found', '#FF7A00', 1]].map(([l, c, o]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: c, opacity: o }} />
              <span style={{ color: 'var(--text-4)' }}>{l}</span>
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-4)' }}>Loading map…</div>
        )}

        {/* Map grid */}
        {!loading && Object.entries(grouped).map(([zone, aisles]) => (
          <div key={zone} style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBox size={14} style={{ color: '#FF7A00' }} /> Zone: {zone}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              {Object.entries(aisles).map(([aisle, racks]) => (
                <div key={aisle} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-4)', width: '50px', paddingTop: '6px' }}>Aisle {aisle}</div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {Object.entries(racks).map(([rack, bins]) => (
                      <div key={rack}>
                        <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-5)', marginBottom: '4px', textAlign: 'center' }}>R{rack}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {bins.map(bin => (
                              <BinCell key={bin._id || bin.code} bin={bin} highlighted={highlightedCodes.has(bin.code)} onClick={setSelectedBin} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bin detail panel */}
        {selectedBin && (
          <div style={{ position: 'fixed', right: '24px', top: '100px', width: '280px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{selectedBin.code}</h4>
              <button onClick={() => setSelectedBin(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: 'var(--text-4)' }}>×</button>
            </div>
            {[
              ['Zone',        selectedBin.zone],
              ['Aisle',       selectedBin.aisle],
              ['Rack',        selectedBin.rack],
              ['Shelf',       selectedBin.shelf],
              ['Utilization', `${selectedBin.utilizationPct ?? 0}%`],
              ['Capacity',    selectedBin.capacity ?? 'N/A'],
              ['Temp Zone',   selectedBin.temperatureZone ?? 'ambient'],
              ['Hazmat',      selectedBin.isHazmat ? 'Yes' : 'No'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-4)' }}>{k}</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
