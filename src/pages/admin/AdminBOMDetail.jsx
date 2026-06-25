import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiCheck } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import { getBOM, approveBOM } from '../../services/manufacturingAPI';
import api from '../../services/api';

const EMPTY_ITEM = { rawMaterialName: '', rawMaterialSKU: '', quantity: 1, unit: 'pcs', wasteAllowance: 0, unitCost: 0, sequence: 0, notes: '' };

export default function AdminBOMDetail() {
  const { id }         = useParams();
  const [bom,    setBOM]    = useState(null);
  const [items,  setItems]  = useState([]);
  const [loading,setLoad]   = useState(true);
  const [newItem,setNewItem] = useState(EMPTY_ITEM);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoad(true);
    getBOM(id)
      .then(r => { setBOM(r.data.data); setItems(r.data.data?.items || []); })
      .catch(console.error)
      .finally(() => setLoad(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleApprove = async () => {
    if (!window.confirm('Approve this BOM?')) return;
    try { await approveBOM(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put(`/admin/bom/${id}`, {
        items: [...items.map(i => ({ ...i, rawMaterial: i.rawMaterial?._id || i.rawMaterial })), { ...newItem }],
      });
      setNewItem(EMPTY_ITEM); setAdding(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error adding item'); }
    finally { setSaving(false); }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Remove this item?')) return;
    setSaving(true);
    try {
      await api.put(`/admin/bom/${id}`, {
        items: items.filter(i => i._id !== itemId).map(i => ({ ...i, rawMaterial: i.rawMaterial?._id || i.rawMaterial })),
      });
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading…</div>;
  if (!bom)    return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>BOM not found.</div>;

  const totalCost = items.reduce((s, i) => s + ((i.unitCost || 0) * (i.quantity || 0)), 0);
  const isEditable = bom.status === 'draft';

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif', maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/admin/manufacturing/bom" style={{ color: '#6B7280', display: 'flex' }}><FiArrowLeft size={18} /></Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{bom.bomNumber}</h1>
        <StatusBadge status={bom.status} size="lg" />
        {isEditable && (
          <button onClick={handleApprove} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
            <FiCheck size={13} /> Approve BOM
          </button>
        )}
      </div>

      {/* BOM Header */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[['Product', bom.productName], ['SKU', bom.productSKU || '—'], ['Version', bom.version], ['Est. Cost/Unit', `₹${Number(bom.estimatedCostPerUnit || 0).toLocaleString()}`],
            ['Approved By', bom.approvedBy?.name || '—'], ['Approved At', bom.approvedAt ? new Date(bom.approvedAt).toLocaleDateString() : '—'],
            ['Created', new Date(bom.createdAt).toLocaleDateString()], ['Revision', bom.revision]].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{val}</div>
            </div>
          ))}
        </div>
        {bom.notes && <p style={{ marginTop: 16, fontSize: 13, color: '#6B7280', background: '#F9FAFB', padding: '8px 12px', borderRadius: 8 }}>{bom.notes}</p>}
      </div>

      {/* Items Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Component Items ({items.length})</h3>
          {isEditable && !adding && (
            <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
              <FiPlus size={13} /> Add Item
            </button>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['#', 'Raw Material', 'SKU', 'Quantity', 'Unit', 'Waste %', 'Unit Cost', 'Total Cost', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item._id || i}>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>{i + 1}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#111827', borderBottom: '1px solid #F3F4F6' }}>{item.rawMaterialName || item.rawMaterial?.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace', borderBottom: '1px solid #F3F4F6' }}>{item.rawMaterialSKU || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F3F4F6' }}>{item.quantity}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F3F4F6' }}>{item.unit}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F3F4F6' }}>{item.wasteAllowance || 0}%</td>
                <td style={{ padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #F3F4F6' }}>₹{Number(item.unitCost || 0).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #F3F4F6' }}>₹{Number((item.unitCost || 0) * (item.quantity || 0)).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
                  {isEditable && (
                    <button onClick={() => handleDeleteItem(item._id)} disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><FiTrash2 size={13} /></button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={9} style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No items. Add raw material components.</td></tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr style={{ background: '#F9FAFB' }}>
                <td colSpan={7} style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Total Component Cost</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111827' }}>₹{totalCost.toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Add Item Form */}
      {adding && isEditable && (
        <div style={{ background: '#fff', border: '2px solid #FF7A00', borderRadius: 12, padding: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Add Raw Material Component</h4>
          <form onSubmit={handleAddItem}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
              {[['Material Name *', 'rawMaterialName', true, 'text'], ['SKU', 'rawMaterialSKU', false, 'text'], ['Quantity *', 'quantity', true, 'number'], ['Unit *', 'unit', true, 'text'], ['Waste % ', 'wasteAllowance', false, 'number'], ['Unit Cost (₹)', 'unitCost', false, 'number'], ['Sequence', 'sequence', false, 'number']].map(([lbl, k, req, type]) => (
                <div key={k}>
                  <label style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 3 }}>{lbl}</label>
                  <input type={type} value={newItem[k] || ''} onChange={e => setNewItem(i => ({ ...i, [k]: e.target.value }))} required={req}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving} style={{ padding: '8px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>{saving ? 'Adding…' : 'Add Item'}</button>
              <button type="button" onClick={() => setAdding(false)} style={{ padding: '8px 18px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
