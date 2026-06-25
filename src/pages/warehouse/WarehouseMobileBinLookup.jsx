import React, { useState } from 'react';
import WarehouseLayout from './WarehouseLayout';
import api from '../../services/api';
import { FiSearch, FiBox, FiMapPin, FiPackage, FiThermometer } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';

const UTIL_COLOR = (pct) => pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981';

function BinDetail({ bin, contents }) {
  const pct = bin.utilizationPct ?? 0;
  return (
    <div>
      {/* Bin header */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <p style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text)', letterSpacing: '-0.02em' }}>{bin.code}</p>
            <p style={{ fontSize: '13px', color: 'var(--text-4)', marginTop: '4px' }}>
              <FiMapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {[bin.zone, bin.aisle && 'Aisle ' + bin.aisle, bin.rack && 'Rack ' + bin.rack, bin.shelf && 'Shelf ' + bin.shelf].filter(Boolean).join(' · ')}
            </p>
          </div>
          <QRCodeSVG value={`BIN:${bin.code}`} size={56} />
        </div>

        {/* Utilization bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-4)', marginBottom: '5px' }}>
            <span>Utilization</span>
            <span style={{ fontWeight: 700, color: UTIL_COLOR(pct) }}>{pct}%</span>
          </div>
          <div style={{ height: '8px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: UTIL_COLOR(pct), borderRadius: '99px', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Attributes */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {bin.temperatureZone && bin.temperatureZone !== 'ambient' && (
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px', background: '#EDE9FE', color: '#4C1D95', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiThermometer size={10} />{bin.temperatureZone}
            </span>
          )}
          {bin.isHazmat && <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px', background: '#FEE2E2', color: '#991B1B' }}>HAZMAT</span>}
          {bin.isFastMoving && <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px', background: '#D1FAE5', color: '#065F46' }}>FAST MOVING</span>}
          {bin.nearDispatch && <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px', background: '#FEF3C7', color: '#92400E' }}>NEAR DISPATCH</span>}
          <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '99px', background: 'var(--bg)', color: 'var(--text-4)' }}>
            Cap: {bin.capacity ?? '—'}
          </span>
          {bin.weightCapacity && (
            <span style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '99px', background: 'var(--bg)', color: 'var(--text-4)' }}>
              Wt: {bin.weightCapacity}kg max
            </span>
          )}
        </div>
      </div>

      {/* Contents */}
      {contents && contents.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)' }}>
            Contents ({contents.length} SKUs)
          </div>
          {contents.map((item, i) => (
            <div key={i} style={{ padding: '12px 18px', borderBottom: i < contents.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiPackage size={16} style={{ color: '#FF7A00', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{item.productName || item.sku}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-4)', fontFamily: 'monospace' }}>SKU: {item.sku}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{item.quantity}</p>
                <p style={{ fontSize: '10px', color: 'var(--text-5)' }}>units</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {contents && contents.length === 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', textAlign: 'center', color: 'var(--text-4)', fontSize: '13px' }}>
          <FiBox size={28} style={{ marginBottom: '8px', opacity: 0.4 }} />
          <p>This bin is empty</p>
        </div>
      )}
    </div>
  );
}

export default function WarehouseMobileBinLookup() {
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [contents, setContents]   = useState(null);
  const [err, setErr]             = useState('');

  const lookup = async () => {
    const q = query.trim();
    if (!q) { setErr('Enter a bin code or scan a QR'); return; }
    setLoading(true); setErr(''); setResult(null); setContents(null);
    try {
      const [binRes, contRes] = await Promise.all([
        api.get(`/warehouse/bins/lookup?q=${encodeURIComponent(q)}`),
        api.get(`/warehouse/bins/contents?q=${encodeURIComponent(q)}`).catch(() => ({ data: { data: [] } })),
      ]);
      setResult(binRes.data.data);
      setContents(contRes.data.data || []);
    } catch (e) { setErr(e.response?.data?.message || 'Bin not found'); }
    finally { setLoading(false); }
  };

  return (
    <WarehouseLayout>
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>Bin Lookup</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '2px' }}>Search by bin code, scan QR, or enter SKU to find location</p>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input
              value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="Bin code or SKU…" autoComplete="off" autoFocus
              style={{ width: '100%', padding: '15px 15px 15px 44px', borderRadius: '12px', border: '2px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '16px', fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box' }}
            />
          </div>
          <button onClick={lookup} disabled={loading}
            style={{ padding: '15px 20px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {loading ? '…' : 'Look Up'}
          </button>
        </div>

        {err && (
          <div style={{ padding: '14px 18px', background: '#FEE2E2', borderRadius: '10px', color: '#991B1B', fontSize: '13px', marginBottom: '16px' }}>
            {err}
          </div>
        )}

        {result && <BinDetail bin={result} contents={contents} />}
      </div>
    </WarehouseLayout>
  );
}
