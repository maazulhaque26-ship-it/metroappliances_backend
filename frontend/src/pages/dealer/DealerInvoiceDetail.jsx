import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';

const STATUS_COLORS = { draft: '#9CA3AF', issued: '#3B82F6', paid: '#10B981', partially_paid: '#F59E0B', overdue: '#EF4444', cancelled: '#6B7280' };
const STATUS_LABELS = { draft: 'Draft', issued: 'Issued', paid: 'Paid', partially_paid: 'Partially Paid', overdue: 'Overdue', cancelled: 'Cancelled' };

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
      <span style={{ color: bold ? 'var(--text,#111)' : 'var(--text-4,#9CA3AF)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 500, color: 'var(--text,#111)' }}>{value}</span>
    </div>
  );
}

export default function DealerInvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    dealerAPI.get(`/dealer/finance/invoices/${id}`)
      .then(r => setInvoice(r.data.invoice))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return (
    <DealerLayout><div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-4,#9CA3AF)' }}>Loading invoice…</div></DealerLayout>
  );
  if (!invoice) return (
    <DealerLayout>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🧾</div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text,#111)', marginBottom: '6px' }}>Invoice not found</div>
        <Link to="/dealer/finance/invoices" style={{ color: 'var(--accent,#FF7A00)', fontSize: '13px' }}>← Back to Invoices</Link>
      </div>
    </DealerLayout>
  );

  const inv = invoice;
  const isIntrastate = inv.supplyType === 'intrastate';

  return (
    <DealerLayout>
      {/* Toolbar */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Link to="/dealer/finance/invoices" style={{ fontSize: '13px', color: 'var(--accent,#FF7A00)', textDecoration: 'none', fontWeight: 600 }}>← Invoices</Link>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: (STATUS_COLORS[inv.status] || '#6B7280') + '1A', color: STATUS_COLORS[inv.status] || '#6B7280' }}>
          {STATUS_LABELS[inv.status] || inv.status}
        </span>
        <button onClick={handlePrint}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--text,#111)' }}>
          🖨 Print
        </button>
        <button onClick={() => alert('PDF download coming soon.')}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent,#FF7A00)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
          ⇩ Download PDF
        </button>
      </div>

      {/* A4 Invoice Sheet */}
      <div ref={printRef} style={{ background: '#fff', border: '1px solid var(--border,#E5E7EB)', borderRadius: '12px', padding: '40px', maxWidth: '820px', margin: '0 auto', fontFamily: 'Poppins, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--accent,#FF7A00)', marginBottom: '4px' }}>Metro Appliances</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>123, Industrial Area, Phase 2</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>Gurugram, Haryana — 122002</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>GSTIN: 06ABCDE1234F1Z5</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>PAN: ABCDE1234F</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', marginBottom: '4px' }}>TAX INVOICE</div>
            <div style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--accent,#FF7A00)', fontWeight: 700 }}>{inv.invoiceNumber}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Date: {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            {inv.dueDate && <div style={{ fontSize: '12px', color: inv.status === 'overdue' ? '#EF4444' : '#6B7280' }}>Due: {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>}
            {inv.dealerOrder?.orderNumber && <div style={{ fontSize: '12px', color: '#6B7280' }}>Order: {inv.dealerOrder.orderNumber}</div>}
          </div>
        </div>

        {/* Billing / Shipping */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          {[{ title: 'Bill To', addr: inv.billingAddress }, { title: 'Ship To', addr: inv.shippingAddress }].map(({ title, addr }) => (
            <div key={title} style={{ padding: '16px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{title}</div>
              {addr ? <>
                {addr.businessName && <div style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{addr.businessName}</div>}
                <div style={{ fontSize: '12px', color: '#374151' }}>{addr.name}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{addr.city}, {addr.state} — {addr.pincode}</div>
                {addr.phone && <div style={{ fontSize: '12px', color: '#6B7280' }}>Ph: {addr.phone}</div>}
                {addr.gstNumber && <div style={{ fontSize: '12px', color: '#6B7280' }}>GSTIN: {addr.gstNumber}</div>}
              </> : <div style={{ fontSize: '12px', color: '#9CA3AF' }}>N/A</div>}
            </div>
          ))}
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#FF7A001A' }}>
                {['#', 'Item / HSN', 'Qty', 'Rate', 'MRP', isIntrastate ? 'CGST' : 'IGST', isIntrastate ? 'SGST' : '', 'Total'].filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--accent,#FF7A00)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid var(--accent,#FF7A00)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(inv.items || []).map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '10px', color: '#9CA3AF' }}>{i + 1}</td>
                  <td style={{ padding: '10px', color: '#111', fontWeight: 500 }}>
                    <div>{item.name}</div>
                    {item.sku && <div style={{ fontSize: '10px', color: '#9CA3AF' }}>SKU: {item.sku}</div>}
                    {item.hsn && <div style={{ fontSize: '10px', color: '#9CA3AF' }}>HSN: {item.hsn}</div>}
                  </td>
                  <td style={{ padding: '10px', color: '#374151' }}>{item.quantity}</td>
                  <td style={{ padding: '10px', color: '#374151', whiteSpace: 'nowrap' }}>₹{(item.rate || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>₹{(item.mrp || 0).toLocaleString('en-IN')}</td>
                  {isIntrastate ? <>
                    <td style={{ padding: '10px', color: '#374151', whiteSpace: 'nowrap' }}>₹{(item.cgstAmount || 0).toLocaleString('en-IN')} <span style={{ fontSize: '10px', color: '#9CA3AF' }}>({item.cgstRate || 0}%)</span></td>
                    <td style={{ padding: '10px', color: '#374151', whiteSpace: 'nowrap' }}>₹{(item.sgstAmount || 0).toLocaleString('en-IN')} <span style={{ fontSize: '10px', color: '#9CA3AF' }}>({item.sgstRate || 0}%)</span></td>
                  </> : (
                    <td style={{ padding: '10px', color: '#374151', whiteSpace: 'nowrap' }}>₹{(item.igstAmount || 0).toLocaleString('en-IN')} <span style={{ fontSize: '10px', color: '#9CA3AF' }}>({item.igstRate || 0}%)</span></td>
                  )}
                  <td style={{ padding: '10px', fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>₹{(item.lineTotal || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals + Tax Summary */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {/* Tax breakup */}
          <div style={{ flex: 1, minWidth: '240px', padding: '16px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Tax Breakup</div>
            <Row label="Subtotal"  value={`₹${(inv.subtotal || 0).toLocaleString('en-IN')}`} />
            {isIntrastate ? <>
              <Row label={`CGST`} value={`₹${(inv.cgstTotal || 0).toLocaleString('en-IN')}`} />
              <Row label={`SGST`} value={`₹${(inv.sgstTotal || 0).toLocaleString('en-IN')}`} />
            </> : (
              <Row label="IGST" value={`₹${(inv.igstTotal || 0).toLocaleString('en-IN')}`} />
            )}
            <Row label="Total Tax" value={`₹${(inv.totalTax || 0).toLocaleString('en-IN')}`} />
            {inv.transportDetails?.transportCharge > 0 && <Row label="Transport" value={`₹${inv.transportDetails.transportCharge.toLocaleString('en-IN')}`} />}
            {inv.roundOff !== 0 && inv.roundOff != null && <Row label="Round Off" value={`₹${inv.roundOff.toFixed(2)}`} />}
          </div>

          {/* Grand total */}
          <div style={{ minWidth: '200px', padding: '16px', background: 'var(--accent,#FF7A00)', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Grand Total</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>₹{(inv.grandTotal || 0).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{isIntrastate ? 'CGST + SGST' : 'IGST'} · B2B · {inv.supplyType}</div>
          </div>
        </div>

        {/* Transport details */}
        {inv.transportDetails && (inv.transportDetails.lrNumber || inv.transportDetails.transporterName) && (
          <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '24px', fontSize: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Transport Details</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {inv.transportDetails.lrNumber && <span><strong>LR#</strong>: {inv.transportDetails.lrNumber}</span>}
              {inv.transportDetails.transporterName && <span><strong>Transporter</strong>: {inv.transportDetails.transporterName}</span>}
              {inv.transportDetails.vehicleNumber && <span><strong>Vehicle</strong>: {inv.transportDetails.vehicleNumber}</span>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
            <div>This is a computer generated invoice and does not require a physical signature.</div>
            <div style={{ marginTop: '4px' }}>Supply Type: {inv.supplyType} · GST Type: {inv.gstType?.toUpperCase()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>For Metro Appliances</div>
            <div style={{ height: '32px' }} />
            <div style={{ fontSize: '11px', color: '#374151', fontWeight: 600 }}>Authorised Signatory</div>
          </div>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </DealerLayout>
  );
}
