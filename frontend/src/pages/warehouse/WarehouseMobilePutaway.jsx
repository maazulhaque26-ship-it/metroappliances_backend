import React, { useState } from 'react';
import WarehouseLayout from './WarehouseLayout';
import api from '../../services/api';
import { FiArrowUp, FiCheckCircle, FiThermometer, FiAlertTriangle, FiStar } from 'react-icons/fi';

const SCORE_COLOR = (score) => {
  if (score >= 80) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
};

function BinCard({ rec, onConfirm, confirming }) {
  const { bin, score, reasons } = rec;
  const color = SCORE_COLOR(score);
  return (
    <div style={{ background: 'var(--card)', border: '2px solid var(--border)', borderRadius: '14px', padding: '18px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text)', letterSpacing: '-0.01em' }}>{bin.code}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '2px' }}>
            Zone {bin.zone || '—'} · Aisle {bin.aisle || '—'} · Rack {bin.rack || '—'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '24px', fontWeight: 800, color }}>{score}</p>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color }}>Score</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {bin.temperatureZone && bin.temperatureZone !== 'ambient' && (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: '#EDE9FE', color: '#4C1D95', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <FiThermometer size={10} />{bin.temperatureZone}
          </span>
        )}
        {bin.isHazmat && (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <FiAlertTriangle size={10} />Hazmat
          </span>
        )}
        {bin.isFastMoving && (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <FiStar size={10} />Fast Moving
          </span>
        )}
        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: 'var(--bg)', color: 'var(--text-4)' }}>
          {bin.utilizationPct ?? 0}% full · cap {bin.capacity ?? '?'}
        </span>
      </div>

      {reasons?.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {reasons.map((r, i) => (
            <p key={i} style={{ fontSize: '11px', color: 'var(--text-4)', marginBottom: '2px' }}>• {r}</p>
          ))}
        </div>
      )}

      <button onClick={() => onConfirm(rec)} disabled={confirming}
        style={{ width: '100%', padding: '13px', background: color, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
        {confirming ? 'Confirming…' : `Confirm Putaway → ${bin.code}`}
      </button>
    </div>
  );
}

export default function WarehouseMobilePutaway() {
  const [sku, setSku]               = useState('');
  const [qty, setQty]               = useState(1);
  const [recs, setRecs]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess]       = useState(null);
  const [err, setErr]               = useState('');

  const getRecommendations = async () => {
    if (!sku.trim()) { setErr('Enter a SKU or scan a product'); return; }
    setLoading(true); setErr(''); setRecs([]); setSuccess(null);
    try {
      const r = await api.post('/warehouse/putaway/recommend', { sku: sku.trim(), quantity: qty });
      setRecs(r.data.data?.recommendations || []);
      if ((r.data.data?.recommendations || []).length === 0) setErr('No suitable bins found');
    } catch (e) { setErr(e.response?.data?.message || 'Failed to get recommendations'); }
    finally { setLoading(false); }
  };

  const confirmPutaway = async (rec) => {
    setConfirming(true); setErr('');
    try {
      await api.post('/warehouse/putaway/confirm', { binId: rec.bin._id, sku: sku.trim(), quantity: qty });
      setSuccess({ binCode: rec.bin.code, sku: sku.trim(), qty });
      setRecs([]);
    } catch (e) { setErr(e.response?.data?.message || 'Putaway failed'); }
    finally { setConfirming(false); }
  };

  return (
    <WarehouseLayout>
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>Smart Putaway</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '2px' }}>AI-scored bin recommendations for inbound stock</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--card)', borderRadius: '16px', border: '1px solid #10B981' }}>
            <FiCheckCircle size={48} style={{ color: '#10B981', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Putaway Confirmed!</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-4)' }}>
              {success.qty} × <b>{success.sku}</b> placed in <b style={{ fontFamily: 'monospace' }}>{success.binCode}</b>
            </p>
            <button onClick={() => { setSuccess(null); setSku(''); setQty(1); }}
              style={{ marginTop: '24px', padding: '14px 28px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              Putaway Another
            </button>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '7px' }}>Product SKU</label>
                <input value={sku} onChange={e => setSku(e.target.value)} onKeyDown={e => e.key === 'Enter' && getRecommendations()}
                  placeholder="Scan or type SKU…" autoComplete="off"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '16px', fontFamily: 'monospace', fontWeight: 600, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '7px' }}>Quantity</label>
                <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '16px', fontWeight: 700, boxSizing: 'border-box' }} />
              </div>
              {err && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>{err}</p>}
              <button onClick={getRecommendations} disabled={loading}
                style={{ width: '100%', padding: '15px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <FiArrowUp size={18} /> {loading ? 'Finding Bins…' : 'Get Recommendations'}
              </button>
            </div>

            {recs.length > 0 && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '14px' }}>
                  {recs.length} Recommended Bins
                </p>
                {recs.map((rec, i) => (
                  <BinCard key={rec.bin._id || i} rec={rec} onConfirm={confirmPutaway} confirming={confirming} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </WarehouseLayout>
  );
}
