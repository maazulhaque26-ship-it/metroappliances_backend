import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FiSearch, FiAlertTriangle } from 'react-icons/fi';
import warehouseAPI from '../../services/warehouseAPI';
import { toast } from 'react-toastify';

const fmtINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function WarehouseInventoryLookup() {
  const { warehouseUser } = useSelector(s => s.warehouseAuth);
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const limit = 20;

  const fetchData = useCallback(() => {
    setLoading(true);
    warehouseAPI.get('/warehouse/inventory', { params: { page, limit } })
      .then(r => { setRows(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = search
    ? rows.filter(r =>
        (r.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.product?.sku  || '').toLowerCase().includes(search.toLowerCase()))
    : rows;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Inventory Lookup</h2>
        <p className="text-sm" style={{ color: 'var(--text-4)' }}>Live stock in {warehouseUser?.warehouse?.name || 'your warehouse'}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-4)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by product name or SKU…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>Loading…</div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>No items found</div>
          )}
          {filtered.map(item => (
            <div key={item._id} className="rounded-2xl p-4 flex items-center justify-between gap-4"
                 style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-4 min-w-0">
                {item.product?.images?.[0] && (
                  <img src={item.product.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{item.product?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{item.product?.sku}</p>
                  {item.storageLocation && (
                    <p className="text-xs font-mono" style={{ color: 'var(--text-4)' }}>
                      {item.storageLocation.rack}-{item.storageLocation.shelf}-{item.storageLocation.bin}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1.5 justify-end">
                  {item.reorderLevel > 0 && item.availableQty <= item.reorderLevel && item.availableQty > 0 && (
                    <FiAlertTriangle size={14} style={{ color: '#F59E0B' }} />
                  )}
                  <p className="text-xl font-bold" style={{ color: item.availableQty === 0 ? '#EF4444' : 'var(--text)' }}>
                    {item.availableQty}
                  </p>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-4)' }}>
                  {item.availableQty === 0 ? 'Out of stock' : 'available'}
                </p>
                {item.reservedQty > 0 && (
                  <p className="text-xs" style={{ color: '#8B5CF6' }}>{item.reservedQty} reserved</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm border disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--card)' }}>
            Previous
          </button>
          <span className="flex items-center text-sm" style={{ color: 'var(--text-4)' }}>
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}
            className="px-4 py-2 rounded-lg text-sm border disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--card)' }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
