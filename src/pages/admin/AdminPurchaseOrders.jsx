import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import api from '../../services/api';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import FilterToolbar from '../../components/shared/FilterToolbar';
import StatusBadge   from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import { usePagination } from '../../hooks/usePagination';
import { useSearch }     from '../../hooks/useSearch';
import { useFilters }    from '../../hooks/useFilters';
import { toast } from 'react-toastify';

const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => `₹${(v || 0).toLocaleString('en-IN')}`;

const STATUS_OPTS = [
  { label: 'All', value: '' }, { label: 'Draft', value: 'draft' },
  { label: 'Pending Approval', value: 'pending_approval' }, { label: 'Approved', value: 'approved' },
  { label: 'Released', value: 'released' }, { label: 'Sent', value: 'sent' },
  { label: 'Acknowledged', value: 'acknowledged' }, { label: 'Accepted', value: 'supplier_accepted' },
  { label: 'Rejected', value: 'supplier_rejected' }, { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const isLate = (po) => po.expectedDeliveryDate && new Date(po.expectedDeliveryDate) < new Date() && !['completed','cancelled'].includes(po.status);

export default function AdminPurchaseOrders() {
  const navigate = useNavigate();
  const [pos,     setPOs]    = useState([]);
  const [total,   setTotal]  = useState(0);
  const [loading, setLoading] = useState(false);
  const { page, limit, setPage } = usePagination();
  const { query: search, setQuery: setSearch, debouncedQuery: debouncedSearch } = useSearch();
  const { filters, setFilter } = useFilters({ status: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [vendors,    setVendors]    = useState([]);
  const [form,       setForm]       = useState({ vendor: '', paymentTerms: 'net30', expectedDeliveryDate: '', items: [{ productName: '', quantity: 1, unit: 'pcs', unitPrice: 0, taxRate: 18 }] });

  const fetch = useCallback(() => {
    setLoading(true);
    api.get('/admin/procurement/orders', { params: { search: debouncedSearch, status: filters.status, page, limit } })
      .then(r => { setPOs(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters.status, page, limit]);

  React.useEffect(() => { fetch(); }, [fetch]);
  React.useEffect(() => {
    api.get('/admin/vendors', { params: { status: 'active', limit: 100 } }).then(r => setVendors(r.data.data || []));
  }, []);

  const calcTotals = (items) => {
    const subtotal  = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    const taxAmount = items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxRate || 0) / 100), 0);
    return { subtotal, taxAmount, totalAmount: subtotal + taxAmount };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { subtotal, taxAmount, totalAmount } = calcTotals(form.items);
      const items = form.items.map(i => ({
        ...i,
        totalAmount: i.quantity * i.unitPrice * (1 + (i.taxRate || 0) / 100),
        taxAmount:   i.quantity * i.unitPrice * (i.taxRate || 0) / 100,
      }));
      const r = await api.post('/admin/procurement/orders', { ...form, items, subtotal, taxAmount, totalAmount });
      toast.success('Purchase order created');
      setShowCreate(false);
      navigate(`/admin/procurement/orders/${r.data.data._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Create failed'); }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productName: '', quantity: 1, unit: 'pcs', unitPrice: 0, taxRate: 18 }] }));
  const updateItem = (i, k, v) => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items }; });

  const columns = [
    { header: 'PO #',       accessor: 'poNumber',    render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.poNumber}</span> },
    { header: 'Vendor',     accessor: 'vendorName',  render: r => <div><p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{r.vendorName}</p>{isLate(r) && <span className="text-xs text-red-500">LATE</span>}</div> },
    { header: 'Amount',     accessor: 'totalAmount', render: r => <span className="font-bold text-sm" style={{ color: '#10B981' }}>{fmtCurrency(r.totalAmount)}</span> },
    { header: 'Expected',   accessor: 'expectedDeliveryDate', render: r => <span className={`text-xs ${isLate(r) ? 'text-red-500 font-bold' : ''}`}>{fmtDate(r.expectedDeliveryDate)}</span> },
    { header: 'Created',    accessor: 'createdAt',   render: r => <span className="text-xs">{fmtDate(r.createdAt)}</span> },
    { header: 'Status',     accessor: 'status',      render: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Purchase Orders" subtitle={`${total} orders`} />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>
          <FiPlus size={16} /> New PO
        </button>
      </div>
      <SearchToolbar value={search} onChange={setSearch} placeholder="Search PO number, vendor…" />
      <FilterToolbar filters={[{ key: 'status', label: 'Status', options: STATUS_OPTS, value: filters.status, onChange: v => setFilter('status', v) }]} />
      <DataTable columns={columns} data={pos} loading={loading} onRowClick={r => navigate(`/admin/procurement/orders/${r._id}`)} emptyMessage="No purchase orders found" />
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl mx-4 rounded-2xl p-6 max-h-screen overflow-y-auto" style={{ background: 'var(--card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>New Purchase Order</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Vendor *</label>
                  <select required value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                    <option value="">Select vendor</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Expected Delivery</label>
                  <input type="date" value={form.expectedDeliveryDate} onChange={e => setForm(f => ({ ...f, expectedDeliveryDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-4)' }}>ITEMS</p>
                  <button type="button" onClick={addItem} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-2)', color: '#FF7A00' }}>+ Add</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
                    <input required placeholder="Product" value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)}
                      className="col-span-2 px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                    <input type="number" min={1} placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                      className="px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                    <input type="number" min={0} placeholder="Unit Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))}
                      className="px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                    <input type="number" min={0} placeholder="Tax%" value={item.taxRate} onChange={e => updateItem(i, 'taxRate', Number(e.target.value))}
                      className="px-2 py-1.5 rounded border text-xs outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                  </div>
                ))}
                {form.items.length > 0 && (
                  <div className="text-right text-sm font-bold" style={{ color: '#10B981' }}>
                    Total: {fmtCurrency(calcTotals(form.items).totalAmount)}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
