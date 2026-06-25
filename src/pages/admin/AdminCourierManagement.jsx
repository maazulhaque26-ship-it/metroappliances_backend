import React, { useState, useCallback, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import DataTable     from '../../components/shared/DataTable';
import SectionHeader from '../../components/shared/SectionHeader';
import StatusBadge   from '../../components/shared/StatusBadge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import LoadingState  from '../../components/shared/LoadingState';
import { useConfirm } from '../../hooks/useModal';
import { toast } from 'react-toastify';

const BLANK = { name: '', code: '', contactEmail: '', contactPhone: '', trackingUrl: '', website: '', avgDeliveryDays: 3, status: 'active', notes: '' };

export default function AdminCourierManagement() {
  const [couriers, setCouriers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(BLANK);
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/logistics/couriers')
      .then(r => setCouriers(r.data.data || []))
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(BLANK); setShowForm(true); };
  const openEdit   = (c)  => { setEditing(c._id); setForm({ name: c.name, code: c.code, contactEmail: c.contactEmail || '', contactPhone: c.contactPhone || '', trackingUrl: c.trackingUrl || '', website: c.website || '', avgDeliveryDays: c.avgDeliveryDays || 3, status: c.status, notes: c.notes || '' }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/logistics/couriers/${editing}`, form);
        toast.success('Courier updated');
      } else {
        await api.post('/admin/logistics/couriers', form);
        toast.success('Courier created');
      }
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = (id, name) => {
    ask({ title: 'Remove Courier', message: `Remove courier "${name}"?`, type: 'danger', onConfirm: async () => {
      await api.delete(`/admin/logistics/couriers/${id}`);
      toast.success('Courier removed');
      load();
    }});
  };

  const columns = [
    { header: 'Code',    accessor: 'code',    render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.code}</span> },
    { header: 'Name',    accessor: 'name',    render: r => <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{r.name}</span> },
    { header: 'Tracking URL', accessor: 'trackingUrl', render: r => <span className="text-xs truncate max-w-xs block" style={{ color: 'var(--text-4)' }}>{r.trackingUrl || '—'}</span> },
    { header: 'Avg Days', accessor: 'avgDeliveryDays', render: r => <span className="text-xs">{r.avgDeliveryDays || '—'} days</span> },
    { header: 'Status',  accessor: 'status',  render: r => <StatusBadge status={r.status} /> },
    { header: 'Actions', accessor: '_id', render: r => (
      <div className="flex gap-2">
        <button onClick={e => { e.stopPropagation(); openEdit(r); }} className="p-1.5 rounded-lg" style={{ background: 'var(--bg-2)' }}><FiEdit2 size={13} style={{ color: 'var(--text-4)' }} /></button>
        <button onClick={e => { e.stopPropagation(); handleDelete(r._id, r.name); }} className="p-1.5 rounded-lg" style={{ background: 'var(--bg-2)' }}><FiTrash2 size={13} style={{ color: '#EF4444' }} /></button>
      </div>
    )},
  ];

  if (loading && couriers.length === 0) return <LoadingState message="Loading couriers…" />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Courier Management" subtitle={`${couriers.length} couriers`} />
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>
          <FiPlus size={16} /> Add Courier
        </button>
      </div>

      <DataTable columns={columns} data={couriers} loading={loading} emptyMessage="No couriers added yet" />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg mx-4 rounded-2xl p-6" style={{ background: 'var(--card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>{editing ? 'Edit Courier' : 'Add Courier'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Code *</label>
                  <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none font-mono" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Tracking URL (use {'{trackingNumber}'} placeholder)</label>
                <input value={form.trackingUrl} onChange={e => setForm(f => ({ ...f, trackingUrl: e.target.value }))} placeholder="https://track.courier.com/{trackingNumber}"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Email</label>
                  <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Phone</label>
                  <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Avg Delivery Days</label>
                  <input type="number" min={1} value={form.avgDeliveryDays} onChange={e => setForm(f => ({ ...f, avgDeliveryDays: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>{editing ? 'Update' : 'Add Courier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMsg} onConfirm={runConfirm} onCancel={cancel} loading={confirming} type="danger" />
    </div>
  );
}
