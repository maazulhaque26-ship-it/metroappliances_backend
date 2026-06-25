import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import { FiHash, FiDownload, FiPrinter, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const FORMATS = ['EAN13', 'EAN8', 'UPCA', 'CODE128', 'CODE39', 'QR', 'INTERNAL'];
const ENTITY_TYPES = ['product', 'storage_location', 'package', 'shipment', 'delivery_challan',
                       'purchase_order', 'dealer_order', 'warehouse', 'bin'];

const BARCODE_FORMAT_MAP = {
  EAN13: 'EAN13', EAN8: 'EAN8', UPCA: 'upc', CODE128: 'CODE128', CODE39: 'CODE39',
};

export default function AdminBarcodeGenerator() {
  const [form, setForm]     = useState({ format: 'EAN13', entityType: 'product', entityId: '', label: '', prefix: '890' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [validateMode, setValidateMode] = useState(false);
  const [validateVal, setValidateVal]   = useState('');
  const [validateFmt, setValidateFmt]   = useState('EAN13');
  const [vResult, setVResult] = useState(null);

  const generate = async () => {
    if (!form.entityId) { setError('Entity ID is required'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const endpoint = form.format === 'QR' ? '/admin/barcodes/qr' : '/admin/barcodes/generate';
      const payload  = form.format === 'QR'
        ? { text: `https://metro.app/scan?type=${form.entityType}&id=${form.entityId}`, entityType: form.entityType, entityId: form.entityId, label: form.label }
        : { ...form };
      const r = await api.post(endpoint, payload);
      setResult(r.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Generation failed');
    } finally { setLoading(false); }
  };

  const validate = async () => {
    setVResult(null);
    try {
      const r = await api.post('/admin/barcodes/validate', { value: validateVal, format: validateFmt });
      setVResult(r.data.data);
    } catch (e) { setError(e.response?.data?.message || 'Validation failed'); }
  };

  const printBarcode = () => window.print();

  return (
    <AdminLayout>
      <div style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>
            Barcode Generator
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>
            Generate EAN-13, EAN-8, UPC-A, Code128, Code39, QR and Internal SKU barcodes
          </p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['Generate', 'Validate'].map(m => (
            <button key={m} onClick={() => setValidateMode(m === 'Validate')}
              style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                       background: (m === 'Validate') === validateMode ? '#FF7A00' : 'var(--card)',
                       color:      (m === 'Validate') === validateMode ? '#fff' : 'var(--text-4)',
                       border:     '1px solid var(--border)', cursor: 'pointer' }}>
              {m}
            </button>
          ))}
        </div>

        {!validateMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>Configuration</h3>
              {[
                { label: 'Format', key: 'format', type: 'select', options: FORMATS },
                { label: 'Entity Type', key: 'entityType', type: 'select', options: ENTITY_TYPES },
                { label: 'Entity ID', key: 'entityId', type: 'text', placeholder: 'MongoDB ObjectId or identifier' },
                { label: 'Label', key: 'label', type: 'text', placeholder: 'Display label (optional)' },
                ...(form.format === 'EAN13' ? [{ label: 'Prefix (3 digits)', key: 'prefix', type: 'text', placeholder: '890' }] : []),
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '6px' }}>
                    {f.label}
                  </label>
                  {f.type === 'select' ? (
                    <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }} />
                  )}
                </div>
              ))}
              {error && <p style={{ color: '#EF4444', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}
              <button onClick={generate} disabled={loading}
                style={{ width: '100%', padding: '12px', background: '#FF7A00', color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                {loading ? 'Generating…' : 'Generate Barcode'}
              </button>
            </div>

            {/* Preview */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>Preview</h3>
              {result ? (
                <div style={{ textAlign: 'center' }}>
                  {result.format === 'QR' ? (
                    result.qrDataUri ? (
                      <img src={result.qrDataUri} alt="QR Code" style={{ width: '180px', height: '180px', margin: '0 auto 16px' }} />
                    ) : (
                      <QRCodeSVG value={result.value || 'https://metro.app'} size={180} style={{ margin: '0 auto 16px', display: 'block' }} />
                    )
                  ) : BARCODE_FORMAT_MAP[result.format] ? (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                      <Barcode value={result.value} format={BARCODE_FORMAT_MAP[result.format]} width={1.5} height={60} fontSize={11} />
                    </div>
                  ) : (
                    <div style={{ padding: '20px', background: 'var(--bg)', borderRadius: '8px', marginBottom: '16px' }}>
                      <p style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em' }}>{result.value}</p>
                    </div>
                  )}

                  <div style={{ textAlign: 'left', fontSize: '12px', color: 'var(--text-4)' }}>
                    {[['Value', result.value], ['Format', result.format], ['Entity', result.entityType], ['Check Digit', result.checkDigit || 'N/A']].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                        <span>{k}</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600, fontFamily: k === 'Value' ? 'monospace' : 'inherit' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button onClick={printBarcode}
                      style={{ flex: 1, padding: '10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <FiPrinter size={14} /> Print
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-5)' }}>
                  <FiHash size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '13px' }}>Configure and generate a barcode to preview it here</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Validate mode */
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>Validate Barcode Value</h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '6px' }}>Barcode Value</label>
              <input value={validateVal} onChange={e => setValidateVal(e.target.value)}
                placeholder="Enter barcode value to validate"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '6px' }}>Format</label>
              <select value={validateFmt} onChange={e => setValidateFmt(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }}>
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <button onClick={validate}
              style={{ width: '100%', padding: '12px', background: '#FF7A00', color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
              Validate
            </button>
            {vResult && (
              <div style={{ marginTop: '16px', padding: '16px', borderRadius: '10px', background: vResult.formatValid ? '#D1FAE5' : '#FEE2E2' }}>
                {vResult.formatValid ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065F46' }}>
                    <FiCheckCircle size={18} />
                    <span style={{ fontWeight: 700 }}>Valid {validateFmt} format</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B' }}>
                    <FiAlertCircle size={18} />
                    <span style={{ fontWeight: 700 }}>Invalid {validateFmt} format</span>
                  </div>
                )}
                {vResult.registered && (
                  <p style={{ fontSize: '12px', marginTop: '8px', color: vResult.formatValid ? '#065F46' : '#991B1B' }}>
                    Registered to: {vResult.barcode?.entityType} ({String(vResult.barcode?.entityId).slice(-8)})
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
