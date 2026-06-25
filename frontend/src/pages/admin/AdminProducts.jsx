import React, { useEffect, useState, useCallback } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import ImageUploader from '../../components/ui/ImageUploader';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiPackage, FiUpload, FiChevronDown, FiChevronUp, FiLayers } from 'react-icons/fi';

const BLANK = {
  name: '', brand: '', category: '', price: '', discountPrice: '', stock: '',
  description: '', warranty: '', energyRating: '', isNewArrival: false, isBestSeller: false,
  isActive: true, hasVariants: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(BLANK);
  const [images,        setImages]        = useState([]);
  const [imageData,     setImageData]     = useState([]); // ImageUploader state
  const [specs,         setSpecs]         = useState([]);
  const [variants,      setVariants]      = useState([]);
  const [variantFiles,  setVariantFiles]  = useState({});
  const [expandedVars,  setExpandedVars]  = useState({});
  const [saving,           setSaving]           = useState(false);
  const [deleting,         setDeleting]         = useState(null);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/admin/products', { params: { search, page, limit: 10 } });
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await API.get('/categories/all');
      setCategories(data.categories || []);
    } catch { toast.error('Failed to load categories'); }
  }, []);

  useEffect(() => { fetchProducts(); fetchCategories(); }, [fetchProducts, fetchCategories]);

  // ── Variant helpers ──────────────────────────────────────────────────────────
  const addVariant = () => {
    const newIdx = variants.length;
    setVariants(v => [...v, {
      name: '', sku: '', price: '', discountPrice: '', stock: '',
      images: [], specs: [], isDefault: newIdx === 0, isActive: true,
    }]);
    setExpandedVars(p => ({ ...p, [newIdx]: true }));
  };

  const removeVariant = (i) => {
    setVariants(v => v.filter((_, j) => j !== i));
    setVariantFiles(prev => {
      const next = {};
      Object.entries(prev).forEach(([k, files]) => {
        const ki = parseInt(k);
        if (ki < i) next[ki] = files;
        else if (ki > i) next[ki - 1] = files;
      });
      return next;
    });
    setExpandedVars(prev => {
      const next = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k);
        if (ki < i) next[ki] = v;
        else if (ki > i) next[ki - 1] = v;
      });
      return next;
    });
  };

  const updateVariant  = (i, field, val) =>
    setVariants(v => v.map((x, j) => j === i ? { ...x, [field]: val } : x));

  const setDefaultVariant = (i) =>
    setVariants(v => v.map((x, j) => ({ ...x, isDefault: j === i })));

  const addVariantSpec = (i) =>
    setVariants(v => v.map((x, j) => j === i ? { ...x, specs: [...x.specs, { key: '', value: '' }] } : x));

  const updateVariantSpec = (i, si, field, val) =>
    setVariants(v => v.map((x, j) => j === i
      ? { ...x, specs: x.specs.map((s, k) => k === si ? { ...s, [field]: val } : s) }
      : x));

  const removeVariantSpec = (i, si) =>
    setVariants(v => v.map((x, j) => j === i
      ? { ...x, specs: x.specs.filter((_, k) => k !== si) }
      : x));

  const removeVariantImage = (i, imgIdx) =>
    setVariants(v => v.map((x, j) => j === i
      ? { ...x, images: x.images.filter((_, k) => k !== imgIdx) }
      : x));

  const handleVariantFiles = (i, files) =>
    setVariantFiles(prev => ({ ...prev, [i]: files }));

  const toggleVarExpand = (i) =>
    setExpandedVars(p => ({ ...p, [i]: !p[i] }));

  const moveVariantUp = (i) => {
    if (i === 0) return;
    setVariants(v => {
      const next = [...v];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
    setExpandedVars(prev => {
      const next = { ...prev };
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };

  const moveVariantDown = (i) => {
    setVariants(v => {
      if (i >= v.length - 1) return v;
      const next = [...v];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
    setExpandedVars(prev => {
      const next = { ...prev };
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(BLANK); setEditing(null); setImages([]); setImageData([]); setSpecs([]);
    setVariants([]); setVariantFiles({}); setExpandedVars({});
    setModal(true);
  };
  const openEdit   = (p)  => {
    setForm({
      name: p.name, brand: p.brand || '', category: p.category?._id || p.category || '',
      price: p.price, discountPrice: p.discountPrice || '', stock: p.stock,
      description: p.description || '', warranty: p.warranty || '',
      energyRating: p.energyRating || '', isNewArrival: p.isNewArrival || false,
      isBestSeller: p.isBestSeller || false, isActive: p.isActive !== false,
      // Detect variant product: trust DB flag first, fall back to checking variants array
      // (covers products created before hasVariants field existed)
      hasVariants: p.hasVariants || (p.variants?.length > 0) || false,
    });
    setSpecs(p.specs && p.specs.length > 0 ? p.specs : []);
    setVariants(p.variants && p.variants.length > 0
      ? p.variants.map(v => ({
          _id:           v._id,
          name:          v.name          || '',
          sku:           v.sku           || '',
          price:         v.price         || '',
          discountPrice: v.discountPrice || '',
          stock:         v.stock         ?? '',
          images:        v.images        || [],
          specs:         v.specs         || [],
          isDefault:     v.isDefault     || false,
          isActive:      v.isActive      !== false,
        }))
      : []);
    setVariantFiles({});
    setExpandedVars({});
    setEditing(p._id);
    setImages([]);
    setImageData(p.images?.length ? p.images.map(src => ({ src })) : []);
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.category) { toast.error('Please select a category first!'); return; }

    // ── Variant product validation ─────────────────────────────────────────────
    if (form.hasVariants) {
      if (variants.length === 0) {
        toast.error('Add at least one variant before saving.'); return;
      }
      for (const v of variants) {
        if (!v.name?.trim())                                          { toast.error('Every variant requires a Name.');          return; }
        if (!v.sku?.trim())                                           { toast.error('Every variant requires a SKU.');           return; }
        if (!v.price || Number(v.price) <= 0)                        { toast.error('Every variant requires a Price > ₹0.');    return; }
        if (v.stock === '' || v.stock === null || v.stock === undefined) { toast.error('Every variant requires a Stock value.'); return; }
      }
    }

    try {
      setSaving(true);
      const fd = new FormData();

      const formToSend = { ...form };

      if (form.hasVariants && variants.length > 0) {
        // Derive product-level values from variants — backend mirrors this exactly
        formToSend.price         = Math.min(...variants.map(v => Number(v.price) || 0));
        const discPrices         = variants.filter(v => Number(v.discountPrice) > 0).map(v => Number(v.discountPrice));
        formToSend.discountPrice = discPrices.length > 0 ? Math.min(...discPrices) : 0;
        formToSend.stock         = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
      }

      Object.entries(formToSend).forEach(([k, v]) => fd.append(k, v));
      if (specs.length > 0) fd.append('specs', JSON.stringify(specs.filter(s => s.key.trim())));
      // Extract new files from ImageUploader; existing string-src items are already on server
      const newProductImages = imageData.filter(item => item.file).map(item => item.file);
      newProductImages.forEach(f => fd.append('images', f));
      // On update, send kept existing images so backend merges them with new uploads
      // (without this, uploading new images would replace all existing ones)
      if (editing) {
        const keptImages = imageData.filter(item => !item.file).map(item => item.src);
        fd.append('existingImages', JSON.stringify(keptImages));
      }

      // Variants payload — only send when hasVariants; otherwise send empty to clear
      const variantsPayload = form.hasVariants
        ? variants.map(v => ({
            ...(v._id ? { _id: v._id } : {}),
            name:          v.name,
            sku:           v.sku || '',
            price:         Number(v.price) || 0,
            discountPrice: Number(v.discountPrice) || 0,
            stock:         Number(v.stock) || 0,
            specs:         (v.specs || []).filter(s => s.key.trim()),
            images:        v.images || [],
            isDefault:     v.isDefault || false,
            isActive:      v.isActive !== false,
          }))
        : [];
      fd.append('variants', JSON.stringify(variantsPayload));

      // New variant image files per variant index
      Object.entries(variantFiles).forEach(([idx, files]) => {
        files.forEach(f => fd.append(`variantImages_${idx}`, f));
      });

      if (editing) {
        const { data } = await API.put(`/products/${editing}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setProducts(prev => prev.map(p => p._id === editing ? data.product : p));
        toast.success('Product updated!');
      } else {
        const { data } = await API.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setProducts(prev => [data.product, ...prev]);
        toast.success('Product created!');
      }
      setModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      setDeleting(id);
      await API.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Products</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">{total} total products</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
            <FiPlus size={16} /> Add Product
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-[var(--border)] text-sm outline-none focus:border-[#111111]"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-[var(--border)]">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={8} cols={6} /></div>
          ) : products.length > 0 ? (
            <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg)]">
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Product</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Brand</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Price / Variants</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Stock</th>
                    <th className="p-4 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest border-b border-[var(--border)]">Tags</th>
                    <th className="p-4 border-b border-[var(--border)]"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <React.Fragment key={p._id}>
                      <tr className="border-b border-[var(--border)] hover:bg-[var(--bg)] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white border border-[var(--border)] flex items-center justify-center flex-shrink-0 p-1">
                              <img src={imgSrc(p.images?.[0])} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                            </div>
                            <div>
                              <p className="text-[var(--text)] font-bold text-sm line-clamp-2 max-w-[200px] leading-tight mb-1">{p.name}</p>
                              <p className="text-[var(--text-3)] text-xs font-bold uppercase tracking-widest">{p.category?.name || p.category || '—'}</p>
                              {(p.hasVariants || p.variants?.length > 0) && (
                                <button
                                  onClick={() => setExpandedProducts(prev => ({ ...prev, [p._id]: !prev[p._id] }))}
                                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  {expandedProducts[p._id] ? <FiChevronUp size={10} /> : <FiChevronDown size={10} />}
                                  {expandedProducts[p._id] ? 'Hide variants' : `Show ${p.variants.length} variant${p.variants.length > 1 ? 's' : ''}`}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[var(--text)] text-sm font-medium">{p.brand || '—'}</td>
                        <td className="p-4">
                          {(p.hasVariants || p.variants?.length > 0) ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-widest">
                                <FiLayers size={10} /> {p.variants.length} Variant{p.variants.length > 1 ? 's' : ''}
                              </span>
                              <p className="text-[var(--text-3)] text-xs mt-1">
                                From ₹{Math.min(...p.variants.map(v => (v.discountPrice > 0 ? v.discountPrice : v.price) || 0))?.toLocaleString('en-IN')}
                              </p>
                            </div>
                          ) : (
                            <>
                              <p className="text-[var(--text)] font-bold text-sm">₹{p.discountPrice?.toLocaleString('en-IN') || p.price?.toLocaleString('en-IN')}</p>
                              {p.discountPrice > 0 && <p className="text-[var(--text-3)] text-xs line-through mt-0.5">₹{p.price?.toLocaleString('en-IN')}</p>}
                            </>
                          )}
                        </td>
                        <td className="p-4">
                          {(p.hasVariants || p.variants?.length > 0) ? (
                            <span className="text-[var(--text-3)] text-sm font-bold">
                              {p.variants.reduce((s, v) => s + (v.stock || 0), 0)} total
                            </span>
                          ) : (
                            <span className={`font-extrabold text-sm ${p.stock === 0 ? 'text-red-600' : p.stock < 5 ? 'text-yellow-600' : 'text-green-600'}`} style={{ fontFamily: 'var(--font-display)' }}>
                              {p.stock}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {!p.isActive && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-300 text-[10px] font-bold uppercase tracking-widest">INACTIVE</span>}
                            {p.isNewArrival && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-widest">NEW</span>}
                            {p.isBestSeller && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-widest">HOT</span>}
                            {p.stock === 0 && !(p.hasVariants || p.variants?.length) && <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-widest">OOS</span>}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(p)} className="p-2 text-[var(--text-3)] hover:text-[var(--text)] hover:bg-white border border-transparent hover:border-[var(--border)] transition-colors">
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(p._id, p.name)}
                              disabled={deleting === p._id}
                              className="p-2 text-[var(--text-3)] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors disabled:opacity-50"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Variant sub-rows — expanded when admin clicks "Show variants" */}
                      {p.variants?.length > 0 && expandedProducts[p._id] && p.variants.map((v, vi) => (
                        <tr key={v._id || vi} className="border-b border-blue-100 bg-blue-50/30">
                          <td className="pl-10 pr-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-8 bg-blue-200 rounded-full flex-shrink-0" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[var(--text)] font-bold text-xs">{v.name}</span>
                                  {v.isDefault && (
                                    <span className="px-1.5 py-0.5 bg-[var(--text)] text-white text-[9px] font-bold uppercase tracking-widest">DEFAULT</span>
                                  )}
                                  {v.isActive === false && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 border border-gray-300 text-[9px] font-bold uppercase tracking-widest">INACTIVE</span>
                                  )}
                                </div>
                                {v.sku && <p className="text-[var(--text-4)] text-[10px] font-medium mt-0.5">{v.sku}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-[var(--text-3)] text-xs font-medium">{v.sku || '—'}</td>
                          <td className="p-3">
                            <p className="text-[var(--text)] font-bold text-xs">
                              ₹{(v.discountPrice > 0 ? v.discountPrice : v.price)?.toLocaleString('en-IN')}
                            </p>
                            {v.discountPrice > 0 && (
                              <p className="text-[var(--text-4)] text-[10px] line-through">₹{v.price?.toLocaleString('en-IN')}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`font-bold text-xs ${v.stock === 0 ? 'text-red-600' : v.stock < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {v.stock}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
                              v.isActive !== false
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-100 text-gray-500 border-gray-300'
                            }`}>
                              {v.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3" />
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block lg:hidden divide-y divide-[#E5E5E5]">
              {products.map(p => (
                <div key={p._id} className="p-4 space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-20 h-20 bg-white border border-[var(--border)] flex items-center justify-center flex-shrink-0 p-1">
                      <img src={imgSrc(p.images?.[0])} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text)] font-bold text-sm line-clamp-2 leading-tight mb-1">{p.name}</p>
                      <p className="text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">{p.category?.name || p.category || '—'}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {!p.isActive && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-300 text-[10px] font-bold uppercase tracking-widest">INACTIVE</span>}
                        {p.isNewArrival && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-widest">NEW</span>}
                        {p.isBestSeller && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-widest">HOT</span>}
                        {p.stock === 0 && <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-widest">OOS</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[var(--bg)] border border-[var(--border)] p-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">Price</p>
                      <p className="text-[var(--text)] font-bold">₹{p.discountPrice?.toLocaleString('en-IN') || p.price?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[var(--text-3)] text-[10px] font-bold uppercase tracking-widest">Stock</p>
                      <p className={`font-extrabold ${p.stock === 0 ? 'text-red-600' : p.stock < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {p.stock}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button onClick={() => openEdit(p)} className="px-6 py-2.5 bg-white border border-[#111111] text-[var(--text)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id, p.name)}
                      disabled={deleting === p._id}
                      className="px-6 py-2.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <div className="text-center py-24 bg-[var(--bg)]">
              <FiPackage size={48} className="mx-auto mb-6 text-[#CCCCCC]" />
              <p className="text-[var(--text-3)] text-sm font-medium">No products found.</p>
              <button onClick={openCreate} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors mt-6 mx-auto">
                <FiPlus size={14} /> Add First Product
              </button>
            </div>
          )}

          {/* Pagination */}
          {total > 10 && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--bg)]">
              <p className="text-[var(--text-3)] text-xs font-bold uppercase tracking-widest">Showing {(page-1)*10+1}–{Math.min(page*10, total)} of {total}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Prev</button>
                <button disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white border border-[var(--border)] text-[var(--text)] text-xs font-bold uppercase disabled:opacity-50 hover:border-[#111111] transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-[var(--text)]/80 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="w-full max-w-4xl bg-white border border-[var(--border)] shadow-2xl my-auto">
            <div className="flex items-center justify-between p-8 border-b border-[var(--border)] sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setModal(false)} className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors"><FiX size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { label: 'Product Name *', key: 'name', full: true },
                  { label: 'Brand', key: 'brand' },
                ].map(({ label, key, type = 'text', full }) => (
                  <div key={key} className={full ? 'sm:col-span-2' : ''}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">{label}</label>
                    <input type={type} value={form[key]} onChange={set(key)} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
                      required={label.includes('*')} min={type === 'number' ? '0' : undefined} />
                  </div>
                ))}
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Category *</label>
                  <select value={form.category} onChange={set('category')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]" required>
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* ── Has Variants Toggle ─────────────────────────────────── */}
                <div className="sm:col-span-2 py-4 border-y border-[var(--border)]">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.hasVariants || false}
                      onChange={e => {
                        const checked = e.target.checked;
                        if (!checked && variants.length > 0) {
                          if (!window.confirm('Switching to simple product will remove all variants. Continue?')) return;
                          setVariants([]); setVariantFiles({}); setExpandedVars({});
                        }
                        setForm(p => ({ ...p, hasVariants: checked }));
                      }}
                      className="w-5 h-5 text-[var(--text)] bg-white border-[var(--border)] rounded focus:ring-[#111111]"
                    />
                    <span className="text-sm font-bold text-[var(--text)] uppercase tracking-widest">
                      This Product Has Variants
                    </span>
                  </label>
                  <p className="mt-1.5 ml-8 text-xs text-[var(--text-4)] font-medium">
                    {form.hasVariants
                      ? 'Price and stock are auto-calculated from variant data below.'
                      : 'Simple product — single price and stock (e.g. Kettle, Fan, Mixer).'}
                  </p>
                </div>

                {/* ── Price / Discount / Stock — hidden when hasVariants ─── */}
                {!form.hasVariants && [
                  { label: 'Price (₹) *', key: 'price', type: 'number', req: true },
                  { label: 'Discount Price (₹)', key: 'discountPrice', type: 'number', req: false },
                  { label: 'Stock *', key: 'stock', type: 'number', req: true },
                ].map(({ label, key, type, req }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">{label}</label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={set(key)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
                      required={req}
                      min="0"
                    />
                  </div>
                ))}

                {/* ── Warranty / Energy Rating — always visible ────────── */}
                {[
                  { label: 'Warranty', key: 'warranty', type: 'text' },
                  { label: 'Energy Rating (1–5 Star)', key: 'energyRating', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">{label}</label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={set(key)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Description</label>
                  <textarea value={form.description} onChange={set('description')} className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111] resize-none h-32" />
                </div>

                {/* Images */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">
                    Product Images <span className="normal-case font-normal text-[var(--text-4)]">(min 1, max 6 — first image is the main)</span>
                  </label>
                  <ImageUploader
                    value={imageData}
                    onChange={setImageData}
                    maxCount={6}
                    label="Upload Product Images"
                  />
                </div>

                {/* Flags */}
                <div className="sm:col-span-2 flex flex-wrap gap-8 py-4 border-t border-[var(--border)]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="w-5 h-5 text-[var(--text)] bg-white border-[var(--border)] rounded focus:ring-[#111111]" />
                    <span className="text-sm font-bold text-[var(--text)] uppercase tracking-widest">Active (visible in shop)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.isNewArrival} onChange={set('isNewArrival')} className="w-5 h-5 text-[var(--text)] bg-white border-[var(--border)] rounded focus:ring-[#111111]" />
                    <span className="text-sm font-bold text-[var(--text)] uppercase tracking-widest">Mark as New Arrival</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.isBestSeller} onChange={set('isBestSeller')} className="w-5 h-5 text-[var(--text)] bg-white border-[var(--border)] rounded focus:ring-[#111111]" />
                    <span className="text-sm font-bold text-[var(--text)] uppercase tracking-widest">Mark as Best Seller</span>
                  </label>
                </div>

                {/* Specs editor */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">Base Specifications</label>
                    <button type="button" onClick={() => setSpecs(s => [...s, { key: '', value: '' }])} className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00] hover:text-[#E66E00]">+ Add Spec</button>
                  </div>
                  <div className="space-y-2">
                    {specs.map((spec, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          placeholder="Key (e.g. Capacity)"
                          value={spec.key}
                          onChange={e => setSpecs(s => s.map((x, j) => j === i ? { ...x, key: e.target.value } : x))}
                          className="flex-1 bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[#111111]"
                        />
                        <input
                          placeholder="Value (e.g. 5 litres)"
                          value={spec.value}
                          onChange={e => setSpecs(s => s.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                          className="flex-1 bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[#111111]"
                        />
                        <button type="button" onClick={() => setSpecs(s => s.filter((_, j) => j !== i))} className="px-3 text-[var(--text-3)] hover:text-red-600 border border-[var(--border)] bg-white transition-colors">
                          <FiX size={14} />
                        </button>
                      </div>
                    ))}
                    {specs.length === 0 && <p className="text-xs text-[var(--text-4)] font-medium">No specs added. Click "+ Add Spec" to add product specifications.</p>}
                  </div>
                </div>

                {/* ── Variants — shown only when hasVariants is enabled ───── */}
                {form.hasVariants && <div className="sm:col-span-2 pt-6 border-t-2 border-[#111111]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FiLayers size={18} className="text-[var(--text)]" />
                      <label className="text-sm font-extrabold uppercase tracking-widest text-[var(--text)]">
                        Product Variants
                      </label>
                      {variants.length > 0 && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-widest">
                          {variants.length}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--text)] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors"
                    >
                      <FiPlus size={12} /> Add Variant
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <div className="border-2 border-dashed border-[var(--border)] bg-[var(--bg)] p-8 text-center">
                      <FiLayers size={32} className="mx-auto mb-3 text-[#CCCCCC]" />
                      <p className="text-[var(--text-3)] text-sm font-medium mb-1">No variants yet</p>
                      <p className="text-[var(--text-4)] text-xs">Add variants like "2 Burner / 3 Burner" or "500W / 750W / 1000W"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {variants.map((v, i) => (
                        <div key={i} className="border border-[var(--border)] bg-white">
                          {/* Variant header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg)] border-b border-[var(--border)]">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => toggleVarExpand(i)}
                                className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                              >
                                {expandedVars[i] ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                              </button>
                              <span className="text-xs font-black uppercase tracking-widest text-[var(--text)]">
                                Variant {i + 1}{v.name ? ` — ${v.name}` : ''}
                              </span>
                              {v.isDefault && (
                                <span className="px-2 py-0.5 bg-[var(--text)] text-white text-[9px] font-bold uppercase tracking-widest">Default</span>
                              )}
                              {v.stock === 0 && v.name && (
                                <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold uppercase tracking-widest">OOS</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {i > 0 && (
                                <button
                                  type="button"
                                  onClick={() => moveVariantUp(i)}
                                  title="Move up"
                                  className="p-1.5 text-[var(--text-3)] hover:text-[var(--text)] border border-transparent hover:border-[var(--border)] transition-colors"
                                >
                                  <FiChevronUp size={14} />
                                </button>
                              )}
                              {i < variants.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => moveVariantDown(i)}
                                  title="Move down"
                                  className="p-1.5 text-[var(--text-3)] hover:text-[var(--text)] border border-transparent hover:border-[var(--border)] transition-colors"
                                >
                                  <FiChevronDown size={14} />
                                </button>
                              )}
                              {!v.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => setDefaultVariant(i)}
                                  className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeVariant(i)}
                                className="ml-1 p-1.5 text-[var(--text-3)] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Variant body */}
                          {expandedVars[i] && (
                            <div className="p-5 space-y-5">
                              {/* Core fields */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Variant Name *</label>
                                  <input
                                    placeholder='e.g. "3 Burner" or "750W"'
                                    value={v.name}
                                    onChange={e => updateVariant(i, 'name', e.target.value)}
                                    className="w-full bg-[var(--bg)] border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[#111111]"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">SKU</label>
                                  <input
                                    placeholder='e.g. "CRYSTA-3B"'
                                    value={v.sku}
                                    onChange={e => updateVariant(i, 'sku', e.target.value)}
                                    className="w-full bg-[var(--bg)] border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[#111111]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Price (₹) *</label>
                                  <input
                                    type="number" min="0"
                                    placeholder="4999"
                                    value={v.price}
                                    onChange={e => updateVariant(i, 'price', e.target.value)}
                                    className="w-full bg-[var(--bg)] border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[#111111]"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Discount Price (₹)</label>
                                  <input
                                    type="number" min="0"
                                    placeholder="4499"
                                    value={v.discountPrice}
                                    onChange={e => updateVariant(i, 'discountPrice', e.target.value)}
                                    className="w-full bg-[var(--bg)] border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[#111111]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1.5">Stock *</label>
                                  <input
                                    type="number" min="0"
                                    placeholder="50"
                                    value={v.stock}
                                    onChange={e => updateVariant(i, 'stock', e.target.value)}
                                    className="w-full bg-[var(--bg)] border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[#111111]"
                                    required
                                  />
                                </div>
                                <div className="col-span-2 flex items-center pt-1">
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={v.isActive !== false}
                                      onChange={e => updateVariant(i, 'isActive', e.target.checked)}
                                      className="w-5 h-5 text-[var(--text)] bg-white border-[var(--border)] rounded focus:ring-[#111111]"
                                    />
                                    <span className="text-sm font-bold text-[var(--text)] uppercase tracking-widest">Active (Visible to customers)</span>
                                  </label>
                                </div>
                              </div>

                              {/* Variant images */}
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">Variant Images</label>
                                {v.images && v.images.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {v.images.map((img, imgIdx) => (
                                      <div key={imgIdx} className="relative w-16 h-16">
                                        <img src={imgSrc(img)} alt="" className="w-16 h-16 object-cover border border-[var(--border)]" />
                                        <button
                                          type="button"
                                          onClick={() => removeVariantImage(i, imgIdx)}
                                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 flex items-center justify-center text-white"
                                        >
                                          <FiX size={10} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <label className="flex items-center gap-3 p-4 border border-dashed border-[var(--border)] bg-[var(--bg)] cursor-pointer hover:border-[#111111] transition-colors">
                                  <FiUpload size={16} className="text-[#CCCCCC]" />
                                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)]">
                                    {variantFiles[i]?.length
                                      ? `${variantFiles[i].length} file(s) selected`
                                      : 'Upload variant images'}
                                  </span>
                                  <input
                                    type="file" multiple accept="image/*" className="hidden"
                                    onChange={e => handleVariantFiles(i, Array.from(e.target.files))}
                                  />
                                </label>
                              </div>

                              {/* Variant specs */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">Variant Specifications</label>
                                  <button
                                    type="button"
                                    onClick={() => addVariantSpec(i)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00] hover:text-[#E66E00]"
                                  >+ Add Spec</button>
                                </div>
                                <div className="space-y-2">
                                  {(v.specs || []).map((spec, si) => (
                                    <div key={si} className="flex gap-2">
                                      <input
                                        placeholder="Key"
                                        value={spec.key}
                                        onChange={e => updateVariantSpec(i, si, 'key', e.target.value)}
                                        className="flex-1 bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[#111111]"
                                      />
                                      <input
                                        placeholder="Value"
                                        value={spec.value}
                                        onChange={e => updateVariantSpec(i, si, 'value', e.target.value)}
                                        className="flex-1 bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[#111111]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeVariantSpec(i, si)}
                                        className="px-3 text-[var(--text-3)] hover:text-red-600 border border-[var(--border)] bg-white transition-colors"
                                      >
                                        <FiX size={14} />
                                      </button>
                                    </div>
                                  ))}
                                  {(v.specs || []).length === 0 && (
                                    <p className="text-xs text-[var(--text-4)] font-medium">No specs for this variant.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>}
              </div>

              <div className="flex gap-4 pt-8 border-t border-[var(--border)]">
                <button type="button" onClick={() => setModal(false)} className="w-1/3 py-4 border border-[#111111] text-[var(--text)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--bg)] transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="w-2/3 py-4 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50 flex items-center justify-center">
                  {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Saving…</> : editing ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
