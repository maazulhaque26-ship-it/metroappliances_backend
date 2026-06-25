import React, { useState, useRef } from 'react';
import AdminLayout from './AdminLayout';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { FiPrinter, FiDownload, FiPlus, FiTrash2, FiPackage } from 'react-icons/fi';

const LABEL_TYPES = [
  { id: 'product',  label: 'Product Label',   desc: 'Name, SKU, barcode, price' },
  { id: 'shelf',    label: 'Shelf Label',     desc: 'Zone, rack, shelf, bin code + QR' },
  { id: 'bin',      label: 'Bin Label',       desc: 'Bin address, capacity, QR code' },
  { id: 'package',  label: 'Package Label',   desc: 'Recipient, order, weight, barcode' },
  { id: 'shipment', label: 'Shipment Label',  desc: 'Courier, AWB, destination, QR' },
  { id: 'courier',  label: 'Courier Label',   desc: 'Full courier shipping label' },
  { id: 'pallet',   label: 'Pallet Label',    desc: 'Pallet ID, contents, weight, SSCC' },
];

const LABEL_SIZES = [
  { id: '4x6',   label: '4"×6" (Thermal)' },
  { id: '2x1',   label: '2"×1" (Shelf)' },
  { id: 'a4',    label: 'A4 (Sheet)' },
  { id: 'a5',    label: 'A5' },
  { id: 'custom',label: 'Custom' },
];

function ProductLabel({ data }) {
  return (
    <div style={{ width: '288px', border: '1px solid #000', borderRadius: '4px', padding: '10px', fontFamily: 'Arial, sans-serif', background: '#fff' }}>
      <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FF7A00', marginBottom: '4px' }}>
        Metro Appliances
      </div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '2px', lineHeight: 1.2 }}>
        {data.name || 'Product Name'}
      </div>
      <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
        SKU: {data.sku || 'SKU-000'} | ₹{data.price || '0'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Barcode value={data.barcode || '8901234567890'} format="EAN13" width={1.2} height={40} fontSize={9} margin={0} />
      </div>
    </div>
  );
}

function ShelfLabel({ data }) {
  return (
    <div style={{ width: '144px', border: '2px solid #000', borderRadius: '4px', padding: '8px', fontFamily: 'Arial, sans-serif', background: '#fff', textAlign: 'center' }}>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#111', letterSpacing: '-0.02em' }}>
        {data.rack || 'A'}-{data.shelf || '01'}{data.bin ? '-' + data.bin : ''}
      </div>
      {data.aisle && <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Aisle {data.aisle}</div>}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
        <QRCodeSVG value={data.qrValue || `BIN:${data.rack || 'A'}-${data.shelf || '01'}`} size={64} />
      </div>
      <div style={{ fontSize: '8px', color: '#999', marginTop: '4px' }}>{data.zone || 'Storage'}</div>
    </div>
  );
}

function PackageLabel({ data }) {
  return (
    <div style={{ width: '288px', border: '1px solid #000', padding: '12px', fontFamily: 'Arial, sans-serif', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', color: '#FF7A00' }}>Metro Appliances</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#111', marginTop: '4px' }}>{data.orderNumber || 'ORD-000001'}</div>
        </div>
        <QRCodeSVG value={data.orderNumber || 'ORD-000001'} size={48} />
      </div>
      <div style={{ borderTop: '1px solid #000', paddingTop: '8px', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#111' }}>{data.recipient || 'Customer Name'}</div>
        <div style={{ fontSize: '10px', color: '#444', lineHeight: 1.4 }}>{data.address || '123 Main Street, Mumbai 400001'}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666' }}>
        <span>Wt: {data.weight || '2'} kg</span>
        <span>Pkg: {data.pkgNumber || 'PKG-001'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
        <Barcode value={data.barcode || 'MTR123456789'} format="CODE128" width={1} height={30} fontSize={8} margin={0} />
      </div>
    </div>
  );
}

const LABEL_COMPONENTS = { product: ProductLabel, shelf: ShelfLabel, bin: ShelfLabel, package: PackageLabel };

export default function AdminLabelCenter() {
  const [selectedType, setSelectedType] = useState('product');
  const [selectedSize, setSelectedSize] = useState('4x6');
  const [quantity, setQuantity]   = useState(1);
  const [formData, setFormData]   = useState({
    name: 'Samsung Refrigerator 450L', sku: 'SAM-REF-450L', price: '45999',
    barcode: '8901234567890', rack: 'A', shelf: '03', bin: '01', aisle: 'A',
    zone: 'Storage', qrValue: '', orderNumber: 'ORD-20240001',
    recipient: 'Rajesh Kumar', address: '42 MG Road, Bengaluru 560001',
    weight: '35', pkgNumber: 'PKG-001',
  });
  const printRef = useRef();

  const LabelComp = LABEL_COMPONENTS[selectedType] || ProductLabel;

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Print Labels</title><style>
      body { margin: 0; padding: 8px; font-family: Arial, sans-serif; }
      .label-grid { display: flex; flex-wrap: wrap; gap: 8px; }
      @media print { @page { margin: 4mm; } }
    </style></head><body><div class="label-grid">${printContent}</div></body></html>`);
    win.document.close();
    win.print();
    win.close();
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1100px' }}>
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Label Center</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>Design, preview, and print enterprise labels with barcode + QR</p>
          </div>
          <button onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#FF7A00', color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
            <FiPrinter size={16} /> Print {quantity > 1 ? `${quantity} Labels` : 'Label'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Label type */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', marginBottom: '12px' }}>Label Type</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {LABEL_TYPES.map(t => (
                  <button key={t.id} onClick={() => setSelectedType(t.id)}
                    style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${selectedType === t.id ? '#FF7A00' : 'var(--border)'}`,
                             background: selectedType === t.id ? '#FFF7ED' : 'transparent', cursor: 'pointer' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: selectedType === t.id ? '#FF7A00' : 'var(--text)' }}>{t.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Size + quantity */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', marginBottom: '12px' }}>Paper Size</h3>
              <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', marginBottom: '12px' }}>
                {LABEL_SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', display: 'block', marginBottom: '6px' }}>
                Quantity
              </label>
              <input type="number" min={1} max={100} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px' }} />
            </div>

            {/* Data fields */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-4)', marginBottom: '12px' }}>Label Data</h3>
              {Object.entries(formData).slice(0, 6).map(([k, v]) => (
                <div key={k} style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-4)', display: 'block', marginBottom: '4px' }}>{k.replace(/([A-Z])/g, ' $1')}</label>
                  <input value={v} onChange={e => setFormData(p => ({ ...p, [k]: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '12px' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Print Preview</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{quantity} × {LABEL_TYPES.find(t => t.id === selectedType)?.label}</span>
              </div>

              <div ref={printRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '16px', background: '#f9fafb', borderRadius: '10px', minHeight: '200px' }}>
                {Array.from({ length: Math.min(quantity, 6) }).map((_, i) => (
                  <LabelComp key={i} data={formData} />
                ))}
                {quantity > 6 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'var(--text-4)', fontSize: '12px' }}>
                    +{quantity - 6} more labels will print
                  </div>
                )}
              </div>

              <div style={{ marginTop: '16px', padding: '12px 16px', background: '#FFF7ED', borderRadius: '8px', fontSize: '12px', color: '#92400E' }}>
                <FiPrinter size={13} style={{ display: 'inline', marginRight: '6px' }} />
                Thermal printer ready — set paper size to {selectedSize.toUpperCase()} in printer settings for best results.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
