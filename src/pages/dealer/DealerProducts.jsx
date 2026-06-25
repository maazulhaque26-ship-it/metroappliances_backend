import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import DealerLayout from '../../components/dealer/DealerLayout';
import dealerAPI from '../../services/dealerAPI';
import { addToCart } from '../../redux/slices/dealerCartSlice';

const imgUrl = (images) => images?.[0]?.url || images?.[0] || '/placeholder.png';

export default function DealerProducts() {
  const dispatch = useDispatch();

  const [products,    setProducts]    = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters,     setFilters]     = useState({ brands: [], categories: [] });
  const [loading,     setLoading]     = useState(true);
  const [addingId,    setAddingId]    = useState(null);
  const [addedId,     setAddedId]     = useState(null);
  const [toast,       setToast]       = useState('');

  const [search,   setSearch]   = useState('');
  const [brand,    setBrand]    = useState('');
  const [category, setCategory] = useState('');
  const [sort,     setSort]     = useState('name');
  const [page,     setPage]     = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 24, sort });
      if (search)   params.set('search', search);
      if (brand)    params.set('brand', brand);
      if (category) params.set('category', category);

      const { data } = await dealerAPI.get(`/dealer/products?${params}`);
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, brand, category]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    dealerAPI.get('/dealer/products/filters')
      .then(r => setFilters(r.data))
      .catch(() => {});
  }, []);

  const handleAddToCart = async (product) => {
    const moq = product.dealerPricing?.moq || 1;
    setAddingId(product._id);
    try {
      await dispatch(addToCart({ productId: product._id, quantity: moq })).unwrap();
      setAddedId(product._id);
      setToast('Added to cart!');
      setTimeout(() => setAddedId(null), 2000);
    } catch (err) {
      setToast(err || 'Failed to add to cart');
    } finally {
      setAddingId(null);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  return (
    <DealerLayout>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#111', color: '#fff', padding: '10px 18px', borderRadius: '8px',
          fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text,#111)', margin: '0 0 4px' }}>Dealer Catalog</h1>
        <div style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>{pagination.total} products available at dealer pricing</div>
      </div>

      {/* Search + filters bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          style={{ flex: '1', minWidth: '200px', padding: '9px 14px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)', color: 'var(--text,#111)' }}
        />
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)', color: 'var(--text,#111)' }}>
          <option value="">All Categories</option>
          {filters.categories?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)', color: 'var(--text,#111)' }}>
          <option value="">All Brands</option>
          {filters.brands?.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
          style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border,#E5E7EB)', fontSize: '13px', background: 'var(--card,#fff)', color: 'var(--text,#111)' }}>
          <option value="name">Name A-Z</option>
          <option value="-name">Name Z-A</option>
          <option value="price">Price Low-High</option>
          <option value="-price">Price High-Low</option>
          <option value="newest">Newest</option>
        </select>
      </form>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--border,#E5E7EB)', borderRadius: '12px', height: '300px' }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-4,#9CA3AF)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>No products found</div>
          <div style={{ fontSize: '13px' }}>Try adjusting your filters or search term</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px', marginBottom: '24px' }}>
            {products.map(p => {
              const dp = p.dealerPricing;
              const saving = dp ? Math.round(((dp.mrp - dp.dealerPrice) / dp.mrp) * 100) : 0;
              return (
                <div key={p._id} style={{
                  background: 'var(--card,#fff)',
                  border: '1px solid var(--border,#E5E7EB)',
                  borderRadius: '12px', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  transition: 'box-shadow 0.2s ease',
                }}>
                  <Link to={`/dealer/products/${p.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ height: '180px', overflow: 'hidden', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={imgUrl(p.images)}
                        alt={p.name}
                        style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain' }}
                        onError={e => { e.target.src = '/placeholder.png'; }}
                      />
                    </div>
                  </Link>
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)', marginBottom: '4px' }}>{p.brand}</div>
                    <Link to={`/dealer/products/${p.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text,#111)', marginBottom: '10px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {p.name}
                      </div>
                    </Link>
                    {dp && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent,#FF7A00)' }}>₹{dp.dealerPrice.toLocaleString('en-IN')}</span>
                          {saving > 0 && <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>-{saving}%</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-4,#9CA3AF)' }}>MRP ₹{dp.mrp.toLocaleString('en-IN')} · MOQ {dp.moq}</div>
                      </div>
                    )}
                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={addingId === p._id}
                      style={{
                        marginTop: 'auto',
                        width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
                        background: addedId === p._id ? '#10B981' : 'var(--accent,#FF7A00)',
                        color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        opacity: addingId === p._id ? 0.7 : 1,
                        transition: 'background 0.2s',
                      }}
                    >
                      {addingId === p._id ? 'Adding…' : addedId === p._id ? '✓ Added' : `Add to Cart (MOQ: ${dp?.moq || 1})`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '13px', color: 'var(--text,#111)', opacity: page <= 1 ? 0.4 : 1 }}>
                ← Prev
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-4,#9CA3AF)' }}>Page {page} of {pagination.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                style={{ padding: '7px 16px', borderRadius: '7px', border: '1px solid var(--border,#E5E7EB)', background: 'var(--card,#fff)', cursor: 'pointer', fontSize: '13px', color: 'var(--text,#111)', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </DealerLayout>
  );
}
