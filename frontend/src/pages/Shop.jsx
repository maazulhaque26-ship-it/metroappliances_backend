import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, productAdded, productUpdated, productRemoved } from '../redux/slices/shopSlices';
import { getSocket } from '../services/socket';
import ProductCard from '../components/ui/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import useScrollReveal from '../hooks/useScrollReveal';
import { FiSliders, FiX, FiChevronDown, FiChevronUp, FiSearch, FiGrid, FiList, FiPackage } from 'react-icons/fi';

const SORT_OPTIONS = [
  { label: 'Newest First',       value: '-createdAt' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Most Popular',       value: '-averageRating' },
  { label: 'Best Selling',       value: '-reviewCount' },
];



function FilterSection({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-[#E5E5E5] last:border-0">
      <button onClick={onToggle}
        className="flex items-center justify-between w-full py-4 text-xs font-bold tracking-widest uppercase text-[#111111] hover:text-[#FF7A00] transition-colors">
        {title}
        {open ? <FiChevronUp size={14} className="text-[#666666]" /> : <FiChevronDown size={14} className="text-[#666666]" />}
      </button>
      {open && <div className="pb-6">{children}</div>}
    </div>
  );
}

export default function Shop() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: products, categories, loading, total, pages } = useSelector(s => s.products);

  useScrollReveal({}, [products]);

  const [mobileFilters, setMobileFilters] = useState(false);
  const [gridView,  setGridView]  = useState(true);
  const [openSects, setOpenSects] = useState({ category: true, price: true, rating: false });

  const [filters, setFilters] = useState({
    search:     searchParams.get('search')     || '',
    category:   searchParams.get('category')   || '',
    sort:       searchParams.get('sort')       || '-createdAt',
    minPrice:   searchParams.get('minPrice')   || '',
    maxPrice:   searchParams.get('maxPrice')   || '',
    rating:     searchParams.get('rating')     || '',
    newArrival: searchParams.get('newArrival') || '',
    bestSeller: searchParams.get('bestSeller') || '',
    page:       parseInt(searchParams.get('page') || '1'),
  });

  const [priceRange, setPriceRange] = useState([
    parseInt(filters.minPrice) || 0,
    parseInt(filters.maxPrice) || 200000,
  ]);

  // Local search state so the input stays responsive; debounce the URL update by 300ms
  const [localSearch, setLocalSearch] = useState(filters.search);
  const searchDebounceRef = useRef(null);

  // URL → state (single source of truth: URL drives both filters and priceRange)
  useEffect(() => {
    const f = {
      search:     searchParams.get('search')     || '',
      category:   searchParams.get('category')   || '',
      sort:       searchParams.get('sort')       || '-createdAt',
      minPrice:   searchParams.get('minPrice')   || '',
      maxPrice:   searchParams.get('maxPrice')   || '',
      rating:     searchParams.get('rating')     || '',
      newArrival: searchParams.get('newArrival') || '',
      bestSeller: searchParams.get('bestSeller') || '',
      page:       parseInt(searchParams.get('page') || '1'),
    };
    setFilters(f);
    setLocalSearch(f.search);
    // Keep priceRange in sync with URL so browser back/forward restores price filter
    setPriceRange([
      parseInt(searchParams.get('minPrice')) || 0,
      parseInt(searchParams.get('maxPrice')) || 200000,
    ]);
  }, [searchParams]);

  // state → API (fires only when filters or priceRange change, never double-dispatches)
  useEffect(() => {
    const params = {};
    if (filters.search)            params.search     = filters.search;
    if (filters.category)          params.category   = filters.category;
    if (filters.sort)              params.sort       = filters.sort;
    if (priceRange[0] > 0)         params.minPrice   = priceRange[0];
    if (priceRange[1] < 200000)    params.maxPrice   = priceRange[1];
    if (filters.rating)            params.minRating  = filters.rating;
    if (filters.newArrival)        params.newArrival = filters.newArrival;
    if (filters.bestSeller)        params.bestSeller = filters.bestSeller;
    params.page  = filters.page;
    params.limit = 12;
    dispatch(fetchProducts(params));
  }, [filters, priceRange, dispatch]);

  // Categories are fetched once by the always-mounted Navbar — avoid a duplicate /categories call here.

  // Fix #6: socket handlers are now filter-aware — a Washing Machine event won't
  // inject into a Refrigerators-filtered view (previous bug: no category/search check).
  useEffect(() => {
    const socket = getSocket();

    const matchesCurrentFilters = (product) => {
      if (!product?.isActive) return false;
      // Category: match by slug if filter is active
      if (filters.category) {
        const slug = product.category?.slug ?? product.categorySlug ?? '';
        if (slug !== filters.category) return false;
      }
      // Search: simple name/description substring check
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inName = product.name?.toLowerCase().includes(q) ?? false;
        const inDesc = product.description?.toLowerCase().includes(q) ?? false;
        if (!inName && !inDesc) return false;
      }
      // Price range
      const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      if (priceRange[0] > 0       && effectivePrice < priceRange[0]) return false;
      if (priceRange[1] < 200000  && effectivePrice > priceRange[1]) return false;
      // Rating
      if (filters.rating && (product.averageRating ?? 0) < parseFloat(filters.rating)) return false;
      // Collection flags
      if (filters.newArrival === 'true' && !product.isNewArrival) return false;
      if (filters.bestSeller === 'true' && !product.isBestSeller) return false;
      return true;
    };

    const onProductCreated = ({ product } = {}) => {
      if (!product?._id) return;
      if (matchesCurrentFilters(product)) dispatch(productAdded(product));
    };
    const onProductUpdated = ({ product } = {}) => {
      if (!product?._id) return;
      if (!product.isActive || !matchesCurrentFilters(product)) {
        // Product no longer visible under current filters — remove it from view
        dispatch(productRemoved(product._id));
      } else {
        dispatch(productUpdated(product));
      }
    };
    const onProductDeleted = ({ productId } = {}) => {
      if (productId) dispatch(productRemoved(productId));
    };

    socket.on('product:created', onProductCreated);
    socket.on('product:updated', onProductUpdated);
    socket.on('product:deleted', onProductDeleted);

    return () => {
      socket.off('product:created', onProductCreated);
      socket.off('product:updated', onProductUpdated);
      socket.off('product:deleted', onProductDeleted);
    };
  }, [dispatch, filters, priceRange]);

  // updateFilter: ONLY writes to the URL. useEffect above (URL→state) picks up the
  // change and sets filters, which triggers the API effect once — no double dispatch.
  // Uses the functional setSearchParams form so it always reads the current URL,
  // never stale closure state (fixes rapid-click filter-loss bug).
  const updateFilter = useCallback((key, value) => {
    setSearchParams(prev => {
      const sp = new URLSearchParams(prev);
      if (key !== 'page') sp.set('page', '1');
      if (value !== '' && value !== null && value !== undefined) {
        sp.set(key, String(value));
      } else {
        sp.delete(key);
      }
      return sp;
    });
  }, [setSearchParams]);

  // Price range writes both priceRange state (immediate UI feedback) and the URL
  // (persistence across refresh/share/back-forward navigation).
  const handlePriceChange = useCallback((newRange) => {
    setPriceRange(newRange);
    setSearchParams(prev => {
      const sp = new URLSearchParams(prev);
      sp.set('page', '1');
      if (newRange[0] > 0) sp.set('minPrice', String(newRange[0]));
      else sp.delete('minPrice');
      if (newRange[1] < 200000) sp.set('maxPrice', String(newRange[1]));
      else sp.delete('maxPrice');
      return sp;
    });
  }, [setSearchParams]);

  const clearFilters = () => {
    setPriceRange([0, 200000]);
    setSearchParams({});
  };

  const hasActiveFilters = filters.category || filters.search || filters.rating || filters.newArrival || filters.bestSeller || priceRange[0] > 0 || priceRange[1] < 200000;
  const toggleSect = (key) => setOpenSects(s => ({ ...s, [key]: !s[key] }));

  const SidebarContent = (
    <div>
      <div className="pb-6 border-b border-[#E5E5E5]">
        <div className="relative border border-[#E5E5E5] bg-white">
          <FiSearch size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            placeholder="Search products…"
            value={localSearch}
            onChange={e => {
              const val = e.target.value;
              setLocalSearch(val);
              clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(() => updateFilter('search', val), 300);
            }}
            className="w-full text-sm pl-10 pr-4 py-3 outline-none text-[#111111] placeholder-[#CCCCCC]"
          />
        </div>
      </div>

      <FilterSection title="Product Line" open={openSects.category} onToggle={() => toggleSect('category')}>
        <div className="space-y-1">
          <button onClick={() => updateFilter('category', '')}
            className={`w-full text-left text-sm px-4 py-2 transition-colors ${
              filters.category === ''
                ? 'text-[#111111] font-bold bg-[#F7F6F3]'
                : 'text-[#666666] hover:text-[#111111] hover:bg-[#F7F6F3]'
            }`}>All Products</button>
          {categories?.map((cat) => (
            <button key={cat.slug} onClick={() => updateFilter('category', cat.slug)}
              className={`w-full text-left text-sm px-4 py-2 transition-colors ${
                filters.category === cat.slug
                  ? 'text-[#111111] font-bold bg-[#F7F6F3]'
                  : 'text-[#666666] hover:text-[#111111] hover:bg-[#F7F6F3]'
              }`}>{cat.name}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range" open={openSects.price} onToggle={() => toggleSect('price')}>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold tracking-widest text-[#666666]">
            <span>Rs. {priceRange[0].toLocaleString('en-IN')}</span>
            <span>Rs. {priceRange[1].toLocaleString('en-IN')}</span>
          </div>
          <input type="range" min={0} max={200000} step={1000} value={priceRange[1]}
            onChange={e => handlePriceChange([priceRange[0], parseInt(e.target.value)])} className="w-full" />
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={priceRange[0] || ''}
              onChange={e => handlePriceChange([parseInt(e.target.value) || 0, priceRange[1]])}
              className="w-full text-sm py-2 px-3 border border-[#E5E5E5] outline-none focus:border-[#111111]" />
            <input type="number" placeholder="Max" value={priceRange[1] || ''}
              onChange={e => handlePriceChange([priceRange[0], parseInt(e.target.value) || 200000])}
              className="w-full text-sm py-2 px-3 border border-[#E5E5E5] outline-none focus:border-[#111111]" />
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Min Rating" open={openSects.rating} onToggle={() => toggleSect('rating')}>
        <div className="space-y-1">
          {[4, 3, 2].map(r => (
            <button key={r} onClick={() => updateFilter('rating', filters.rating == r ? '' : r)}
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors ${
                filters.rating == r ? 'text-[#111111] font-bold bg-[#F7F6F3]' : 'text-[#666666] hover:text-[#111111] hover:bg-[#F7F6F3]'
              }`}>
              <span className="text-[#111111]">{'★'.repeat(r)}</span>
              <span className="text-[#CCCCCC]">{'★'.repeat(5 - r)}</span>
              <span className="text-xs ml-1 font-medium">& above</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Collections" open={openSects.collections ?? false} onToggle={() => toggleSect('collections')}>
        <div className="space-y-1">
          {[
            { key: 'newArrival', label: 'New Arrivals' },
            { key: 'bestSeller', label: 'Best Sellers' },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => updateFilter(key, filters[key] === 'true' ? '' : 'true')}
              className={`w-full text-left text-sm px-4 py-2 transition-colors ${
                filters[key] === 'true'
                  ? 'text-[#111111] font-bold bg-[#F7F6F3]'
                  : 'text-[#666666] hover:text-[#111111] hover:bg-[#F7F6F3]'
              }`}>{label}</button>
          ))}
        </div>
      </FilterSection>

      {hasActiveFilters && (
        <button onClick={clearFilters} className="w-full mt-6 py-3 border border-[#111111] text-[#111111] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#111111] hover:text-white transition-colors">
          <FiX size={14} /> Clear Filters
        </button>
      )}
    </div>
  );

  const pageTitle = filters.category
    ? categories?.find(c => c.slug === filters.category)?.name || 'Products'
    : filters.search ? `Search: "${filters.search}"`
    : filters.newArrival === 'true' ? 'New Arrivals'
    : filters.bestSeller === 'true' ? 'Best Sellers'
    : 'Directory';

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#F7F6F3]">

      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 reveal">
          <div>
            <span className="block text-[11px] font-bold tracking-[0.2em] uppercase text-[#666666] mb-4">Metro Products</span>
            <h1 className="text-4xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>{pageTitle}</h1>
            <p className="text-[#666666] text-sm mt-3 font-medium">
              {loading ? 'Cataloging…' : `Showing ${total || products.length} appliances`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)} className="appearance-none bg-white border border-[#E5E5E5] text-[#111111] text-sm font-bold pl-4 pr-10 py-3 outline-none focus:border-[#111111]">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <FiChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
            </div>
            
            <div className="hidden sm:flex items-center border border-[#E5E5E5] bg-white p-1">
              <button onClick={() => setGridView(true)}
                className={`p-2 transition-colors ${gridView ? 'bg-[#111111] text-white' : 'text-[#666666] hover:text-[#111111]'}`}>
                <FiGrid size={16} />
              </button>
              <button onClick={() => setGridView(false)}
                className={`p-2 transition-colors ${!gridView ? 'bg-[#111111] text-white' : 'text-[#666666] hover:text-[#111111]'}`}>
                <FiList size={16} />
              </button>
            </div>
            <button onClick={() => setMobileFilters(true)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest">
              <FiSliders size={14} /> Filters
              {hasActiveFilters && <span className="w-2 h-2 bg-[#FF7A00] rounded-full ml-1" />}
            </button>
          </div>
        </div>

        {/* Active chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-8 reveal">
            {filters.category && (
              <button onClick={() => updateFilter('category', '')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:border-[#111111]">
                {categories?.find(c => c.slug === filters.category)?.name} <FiX size={12} className="text-[#666666]" />
              </button>
            )}
            {filters.search && (
              <button onClick={() => updateFilter('search', '')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:border-[#111111]">
                "{filters.search}" <FiX size={12} className="text-[#666666]" />
              </button>
            )}
            {filters.rating && (
              <button onClick={() => updateFilter('rating', '')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:border-[#111111]">
                {filters.rating}+ Stars <FiX size={12} className="text-[#666666]" />
              </button>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 200000) && (
              <button onClick={() => handlePriceChange([0, 200000])} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:border-[#111111]">
                Rs.{priceRange[0].toLocaleString('en-IN')}–{priceRange[1].toLocaleString('en-IN')} <FiX size={12} className="text-[#666666]" />
              </button>
            )}
            {filters.newArrival === 'true' && (
              <button onClick={() => updateFilter('newArrival', '')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:border-[#111111]">
                New Arrivals <FiX size={12} className="text-[#666666]" />
              </button>
            )}
            {filters.bestSeller === 'true' && (
              <button onClick={() => updateFilter('bestSeller', '')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E5E5] text-xs font-bold text-[#111111] hover:border-[#111111]">
                Best Sellers <FiX size={12} className="text-[#666666]" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-12">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-28 bg-white border border-[#E5E5E5] p-6 reveal-left">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[#111111] font-bold text-sm tracking-widest uppercase">Filters</span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs font-bold text-[#666666] hover:text-[#111111]">Reset</button>
              )}
            </div>
            {SidebarContent}
          </div>
        </aside>

        {/* Mobile filter drawer — always rendered, CSS transform avoids remount */}
        <div
          className="fixed inset-0 z-50 flex pointer-events-none"
          aria-hidden={!mobileFilters}
        >
          <div
            className="flex-1 transition-colors duration-300"
            style={{
              background: mobileFilters ? 'rgba(17,17,17,0.7)' : 'transparent',
              backdropFilter: mobileFilters ? 'blur(4px)' : 'none',
              WebkitBackdropFilter: mobileFilters ? 'blur(4px)' : 'none',
              pointerEvents: mobileFilters ? 'auto' : 'none',
            }}
            onClick={() => setMobileFilters(false)}
          />
          <div
            className="w-80 bg-white p-6 overflow-y-auto pointer-events-auto"
            style={{
              transform: mobileFilters ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-[#111111] font-bold tracking-widest uppercase">Filters</span>
              <button onClick={() => setMobileFilters(false)} aria-label="Close filters" className="text-[#666666] hover:text-[#111111]">
                <FiX size={24} />
              </button>
            </div>
            {SidebarContent}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? <ProductGridSkeleton count={12} /> : products.length > 0 ? (
            <>
              <div className={gridView
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 stagger-grid'
                : 'space-y-6 stagger-grid'}>
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-16 pt-8 border-t border-[#E5E5E5]">
                  <button disabled={filters.page <= 1} onClick={() => updateFilter('page', filters.page - 1)} className="px-4 py-2 border border-[#E5E5E5] bg-white text-[#111111] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Prev</button>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => updateFilter('page', p)}
                      className={`w-10 h-10 flex items-center justify-center text-xs font-bold transition-colors ${
                        p === filters.page ? 'bg-[#111111] text-white border border-[#111111]' : 'bg-white border border-[#E5E5E5] text-[#666666] hover:text-[#111111] hover:border-[#111111]'
                      }`}>{p}</button>
                  ))}
                  <button disabled={filters.page >= pages} onClick={() => updateFilter('page', filters.page + 1)} className="px-4 py-2 border border-[#E5E5E5] bg-white text-[#111111] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Next</button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 bg-white border border-[#E5E5E5] animate-liftIn">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full" style={{ background: '#F7F6F3' }}>
                <FiPackage size={36} className="text-[#CCCCCC]" />
              </div>
              <h3 className="text-[#111111] font-extrabold text-2xl mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {filters.search ? `No results for "${filters.search}"` : 'No appliances found'}
              </h3>
              <p className="text-[#666666] text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                {filters.search
                  ? 'Try a different search term or browse our popular categories below.'
                  : 'Try adjusting your filters to find what you\'re looking for.'}
              </p>
              {filters.search && (
                <div className="flex flex-wrap gap-2 justify-center mb-8">
                  {['Mixer Grinder', 'Gas Stove', 'Induction Cooktop', 'Pressure Cooker'].map(term => (
                    <button
                      key={term}
                      onClick={() => { setLocalSearch(term); updateFilter('search', term); }}
                      className="px-4 py-2 border border-[#E5E5E5] text-[#111111] text-xs font-semibold hover:border-[#111111] transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={clearFilters} className="px-8 py-4 bg-[#111111] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#333333] transition-colors">
                {hasActiveFilters ? 'Clear All Filters' : 'Browse All Products'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
