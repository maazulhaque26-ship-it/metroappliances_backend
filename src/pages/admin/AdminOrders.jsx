import React, { useEffect, useState, useCallback } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import ImageWithFallback from '../../components/ui/ImageWithFallback';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { FiEye, FiX, FiShoppingBag, FiSearch, FiChevronDown } from 'react-icons/fi';

const STATUSES   = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLORS = {
  Pending:    'bg-[var(--bg)] text-[var(--text-3)] border-[var(--border)]',
  Processing: 'bg-blue-50 text-blue-700 border-blue-200',
  Shipped:    'bg-purple-50 text-purple-700 border-purple-200',
  Delivered:  'bg-green-50 text-green-700 border-green-200',
  Cancelled:  'bg-red-50 text-red-700 border-red-200',
};

export default function AdminOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('All');
  const [search,   setSearch]   = useState('');
  const [detail,   setDetail]   = useState(null);
  const [updating, setUpdating] = useState(null);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 12 };
      if (filter !== 'All') params.status = filter;
      if (search) params.search = search;
      const { data } = await API.get('/admin/orders', { params });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [filter, search, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      setUpdating(orderId);
      const { data } = await API.put(`/admin/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      if (detail?._id === orderId) setDetail(d => ({ ...d, status }));
      toast.success(`Order updated to ${status}`);
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(null); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Orders</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">{total} total orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white border border-[var(--border)] p-4">
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => { setFilter(s); setPage(1); }}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors border ${
                  filter === s ? 'bg-[var(--text)] text-white border-[#111111]' : 'bg-[var(--bg)] text-[var(--text-3)] border-[var(--border)] hover:border-[#111111] hover:text-[var(--text)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search orders..." className="w-full pl-10 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] outline-none focus:border-[#111111] text-sm" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[var(--border)]">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={8} cols={6} /></div>
          ) : orders.length > 0 ? (
            <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg)]">
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Order ID</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Customer</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Items</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Total</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Status</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Date</th>
                    <th className="p-4 border-b border-[var(--border)]"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id} className="border-b border-[var(--border)] hover:bg-[var(--bg)] transition-colors">
                      <td className="p-4 font-mono font-bold text-[var(--text)] text-sm">
                        #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <p className="text-[var(--text)] text-sm font-bold">{order.user?.name || 'N/A'}</p>
                        <p className="text-[var(--text-3)] text-xs mt-0.5">{order.user?.email || ''}</p>
                      </td>
                      <td className="p-4 text-[var(--text-3)] text-sm font-medium">{order.items?.length || 0} items</td>
                      <td className="p-4 text-[var(--text)] font-bold text-sm">₹{order.totalPrice?.toLocaleString('en-IN')}</td>
                      <td className="p-4">
                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={e => updateStatus(order._id, e.target.value)}
                            disabled={updating === order._id}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer appearance-none ${STATUS_COLORS[order.status] || STATUS_COLORS.Pending}`}
                          >
                            {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => (
                              <option key={s} value={s} className="bg-white text-[var(--text)]">{s}</option>
                            ))}
                          </select>
                          <FiChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'inherit' }} />
                        </div>
                      </td>
                      <td className="p-4 text-[var(--text-3)] text-sm font-medium">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => setDetail(order)} className="p-2 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-white border border-transparent hover:border-[var(--border)] transition-colors inline-flex">
                          <FiEye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block lg:hidden divide-y divide-[#E5E5E5]">
              {orders.map(order => (
                <div key={order._id} className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono font-bold text-[var(--text)] text-sm">#{order.orderNumber || order._id?.slice(-6).toUpperCase()}</p>
                      <p className="text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[var(--text)] font-bold text-sm">₹{order.totalPrice?.toLocaleString('en-IN')}</p>
                      <p className="text-[var(--text-3)] text-xs font-medium mt-1">{order.items?.length || 0} items</p>
                    </div>
                  </div>
                  
                  <div className="bg-[var(--bg)] border border-[var(--border)] p-3 text-sm">
                    <p className="font-bold text-[var(--text)]">{order.user?.name || 'N/A'}</p>
                    <p className="text-[var(--text-3)] text-xs">{order.user?.email || ''}</p>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order._id, e.target.value)}
                        disabled={updating === order._id}
                        className={`w-full px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer appearance-none ${STATUS_COLORS[order.status] || STATUS_COLORS.Pending}`}
                      >
                        {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => (
                          <option key={s} value={s} className="bg-white text-[var(--text)]">{s}</option>
                        ))}
                      </select>
                      <FiChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'inherit' }} />
                    </div>
                    <button onClick={() => setDetail(order)} className="p-2.5 border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors">
                      <FiEye size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <div className="text-center py-16 bg-[var(--bg)]">
              <FiShoppingBag size={48} className="mx-auto mb-4 text-[#CCCCCC]" />
              <p className="text-[var(--text-3)] text-sm font-medium">No orders found.</p>
            </div>
          )}

          {total > 12 && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--bg)]">
              <p className="text-[var(--text-3)] text-xs font-bold uppercase tracking-widest">Page {page} of {Math.ceil(total/12)}</p>
              <div className="flex gap-2">
                <button disabled={page<=1} onClick={() => setPage(p => p-1)} className="px-4 py-2 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Prev</button>
                <button disabled={page*12>=total} onClick={() => setPage(p => p+1)} className="px-4 py-2 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-[var(--text)]/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-[var(--border)] shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Order #{detail.orderNumber || detail._id?.slice(-6).toUpperCase()}</h2>
                <p className="text-[var(--text-3)] text-xs mt-1 font-bold tracking-widest uppercase">{new Date(detail.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto no-scrollbar">
              {/* Status update */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Update Status</label>
                <select
                  value={detail.status}
                  onChange={e => updateStatus(detail._id, e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm font-bold outline-none focus:border-[#111111]"
                >
                  {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div>
                <p className="text-[10px] text-[var(--text-3)] font-bold uppercase tracking-widest mb-4 pb-2 border-b border-[var(--border)]">Items ({detail.items?.length})</p>
                <div className="space-y-4">
                  {detail.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <ImageWithFallback
                        src={item.image}
                        fallbackSrc={item.product?.images?.[0]}
                        alt={item.name}
                        className="w-16 h-16 flex-shrink-0"
                        imgClassName="w-full h-full object-contain mix-blend-multiply"
                        style={{ background: '#F7F6F3', border: '1px solid #E5E5E5' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text)] text-sm font-bold line-clamp-2 leading-tight mb-1">{item.name}</p>
                        <p className="text-[var(--text-3)] text-xs font-medium">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                      </div>
                      <span className="text-[var(--text)] font-bold text-sm">₹{(item.price * item.quantity)?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address */}
              {detail.shippingAddress && (
                <div>
                  <p className="text-[10px] text-[var(--text-3)] font-bold uppercase tracking-widest mb-4 pb-2 border-b border-[var(--border)]">Shipping to</p>
                  <div className="p-4 bg-[var(--bg)] border border-[var(--border)] text-sm">
                    <p className="text-[var(--text)] font-bold mb-1">{detail.shippingAddress.fullName}</p>
                    <p className="text-[var(--text-3)]">{detail.shippingAddress.addressLine1}, {detail.shippingAddress.city}, {detail.shippingAddress.state} - {detail.shippingAddress.pincode}</p>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div>
                <p className="text-[10px] text-[var(--text-3)] font-bold uppercase tracking-widest mb-4 pb-2 border-b border-[var(--border)]">Order Summary</p>
                <div className="space-y-3 text-sm">
                  {[
                    { l: 'Subtotal', v: `₹${detail.itemsPrice?.toLocaleString('en-IN')}` },
                    { l: 'Shipping', v: detail.shippingPrice === 0 ? 'FREE' : `₹${detail.shippingPrice}` },
                    { l: 'Tax', v: `₹${detail.taxPrice?.toLocaleString('en-IN')}` },
                    { l: 'Payment', v: `${detail.paymentMethod} — ${detail.paymentStatus}` },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-[var(--text-3)] font-medium">{l}</span>
                      <span className="text-[var(--text)] font-bold">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-[var(--border)] pt-4 mt-2">
                    <span className="text-[var(--text)] font-bold uppercase tracking-widest text-xs">Total</span>
                    <span className="text-[var(--text)] font-extrabold text-xl" style={{ fontFamily: 'var(--font-display)' }}>₹{detail.totalPrice?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
