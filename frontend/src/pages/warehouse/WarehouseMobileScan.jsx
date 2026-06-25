import React, { useState, useRef, useEffect } from 'react';
import WarehouseLayout from './WarehouseLayout';
import api from '../../services/api';
import { FiCamera, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiList } from 'react-icons/fi';

const ACTION_OPTIONS = [
  { value: 'pick',       label: 'Pick' },
  { value: 'putaway',    label: 'Putaway' },
  { value: 'receive',    label: 'Receive' },
  { value: 'pack',       label: 'Pack' },
  { value: 'dispatch',   label: 'Dispatch' },
  { value: 'transfer',   label: 'Transfer' },
  { value: 'cycle_count',label: 'Cycle Count' },
  { value: 'lookup',     label: 'Lookup' },
];

const RESULT_STYLE = {
  success: { bg: '#D1FAE5', color: '#065F46', icon: FiCheckCircle },
  not_found: { bg: '#FEE2E2', color: '#991B1B', icon: FiAlertCircle },
  default: { bg: '#FEF3C7', color: '#92400E', icon: FiAlertCircle },
};

function ScanResultCard({ result, onDismiss }) {
  if (!result) return null;
  const style = RESULT_STYLE[result.result] || RESULT_STYLE.default;
  const Icon  = style.icon;
  return (
    <div style={{ background: style.bg, borderRadius: '14px', padding: '16px 20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Icon size={20} style={{ color: style.color, flexShrink: 0 }} />
        <span style={{ fontSize: '14px', fontWeight: 700, color: style.color, textTransform: 'capitalize' }}>
          {result.result?.replace(/_/g, ' ')}
        </span>
        <button onClick={onDismiss} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', color: style.color, opacity: 0.7 }}>×</button>
      </div>
      {result.message && <p style={{ fontSize: '13px', color: style.color, marginBottom: '6px' }}>{result.message}</p>}
      {result.resolved && (
        <div style={{ fontSize: '12px', color: style.color + 'CC' }}>
          {result.resolved.product && <p>Product: {result.resolved.product.name} (SKU: {result.resolved.product.sku})</p>}
          {result.resolved.location && <p>Location: {result.resolved.location.code}</p>}
          {result.resolved.barcode  && <p>Barcode: {result.resolved.barcode.value} [{result.resolved.barcode.format}]</p>}
        </div>
      )}
    </div>
  );
}

export default function WarehouseMobileScan() {
  const [action, setAction]       = useState('lookup');
  const [continuous, setContinuous] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [loading, setLoading]     = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory]     = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef();
  const seenRef  = useRef(new Set());

  useEffect(() => { inputRef.current?.focus(); }, [continuous, action]);

  const processValue = async (value) => {
    const v = value.trim();
    if (!v) return;

    if (continuous && seenRef.current.has(v)) {
      setLastResult({ result: 'duplicate', message: `Already scanned: ${v}` });
      setScanValue('');
      return;
    }

    setLoading(true);
    try {
      const r = await api.post('/warehouse/scan', { value: v, action });
      const res = { ...r.data.data, rawValue: v, ts: new Date() };
      setLastResult(res);
      setHistory(h => [res, ...h.slice(0, 49)]);
      if (continuous) seenRef.current.add(v);
    } catch (e) {
      const res = { result: 'error', message: e.response?.data?.message || 'Scan failed', rawValue: v, ts: new Date() };
      setLastResult(res);
      setHistory(h => [res, ...h.slice(0, 49)]);
    } finally {
      setLoading(false);
      setScanValue('');
      if (continuous) setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') processValue(scanValue);
  };

  const resetSession = () => {
    seenRef.current = new Set();
    setHistory([]);
    setLastResult(null);
    setScanValue('');
  };

  return (
    <WarehouseLayout>
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins', fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>Barcode Scanner</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '2px' }}>USB · Bluetooth · Manual entry</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={resetSession} title="Reset session"
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--text-4)' }}>
              <FiRefreshCw size={16} />
            </button>
            <button onClick={() => setShowHistory(h => !h)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: showHistory ? '#FF7A00' : 'var(--bg)', cursor: 'pointer', color: showHistory ? '#fff' : 'var(--text-4)' }}>
              <FiList size={16} />
            </button>
          </div>
        </div>

        {/* Action select */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '8px' }}>Scan Action</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ACTION_OPTIONS.map(a => (
              <button key={a.value} onClick={() => setAction(a.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${action === a.value ? '#FF7A00' : 'var(--border)'}`,
                  background: action === a.value ? '#FF7A00' : 'transparent', color: action === a.value ? '#fff' : 'var(--text)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Continuous toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', cursor: 'pointer' }}>
          <div onClick={() => setContinuous(c => !c)}
            style={{ width: '44px', height: '24px', borderRadius: '12px', background: continuous ? '#FF7A00' : 'var(--border)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', top: '3px', left: continuous ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Continuous Scan Mode</span>
        </label>

        {/* Scan input — large touch-friendly */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}>
            <FiCamera size={22} style={{ color: continuous ? '#FF7A00' : 'var(--text-4)' }} />
          </div>
          <input
            ref={inputRef}
            value={scanValue}
            onChange={e => setScanValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan barcode or type value…"
            autoComplete="off"
            autoFocus
            style={{ width: '100%', padding: '20px 20px 20px 52px', borderRadius: '14px', border: `2px solid ${continuous ? '#FF7A00' : 'var(--border)'}`, background: 'var(--card)', color: 'var(--text)', fontSize: '18px', fontFamily: 'monospace', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
          />
          {loading && (
            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', border: '2px solid #FF7A00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          )}
        </div>

        {!continuous && (
          <button onClick={() => processValue(scanValue)} disabled={loading || !scanValue.trim()}
            style={{ width: '100%', padding: '16px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginBottom: '20px' }}>
            Process Scan
          </button>
        )}

        {continuous && (
          <div style={{ padding: '12px 16px', background: '#FFF7ED', borderRadius: '10px', marginBottom: '20px', fontSize: '12px', color: '#92400E', textAlign: 'center' }}>
            Continuous mode — point scanner and pull trigger. Duplicates auto-rejected.
          </div>
        )}

        <ScanResultCard result={lastResult} onDismiss={() => setLastResult(null)} />

        {/* History */}
        {showHistory && history.length > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, color: 'var(--text-4)' }}>
              SCAN HISTORY ({history.length})
            </div>
            {history.slice(0, 20).map((h, i) => {
              const ok = h.result === 'success';
              return (
                <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ok ? '#10B981' : '#EF4444', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: 'var(--text)', flex: 1 }}>{h.rawValue?.slice(0, 24)}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-5)' }}>{h.ts?.toLocaleTimeString()}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: ok ? '#10B981' : '#EF4444', textTransform: 'capitalize' }}>{h.result?.replace(/_/g,' ')}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </WarehouseLayout>
  );
}
