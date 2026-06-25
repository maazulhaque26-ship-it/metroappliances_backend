import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartItem, removeFromCart, clearCart, setCoupon, clearCoupon } from '../redux/slices/shopSlices';
import { toast } from 'react-toastify';
import API from '../services/api';
import { imgSrc } from '../utils/imageHelper';
import { calculateShipping } from '../utils/shippingLogic';
import { Skeleton } from '../components/ui/Skeleton';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight, FiTag, FiX, FiTruck, FiShield, FiLock } from 'react-icons/fi';

export default function Cart() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { token } = useSelector(s => s.auth);
  const { items, loading, coupon: couponData, couponDiscount } = useSelector(s => s.cart);
  const { data: settings } = useSelector(s => s.settings);

  const [coupon,      setCouponCode]  = useState('');
  const [couponError, setCouponError] = useState('');
  const [validating,  setValidating]  = useState(false);
  const [updating,    setUpdating]    = useState({});

  useEffect(() => { if (token) dispatch(fetchCart()); }, [token, dispatch]);

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center pt-32 pb-24 bg-[#F7F6F3]">
      <div className="text-center p-12 bg-white border border-[#E5E5E5] max-w-md w-full mx-4">
        <FiShoppingBag size={64} className="mx-auto mb-6 text-[#CCCCCC]" />
        <h2 className="text-[#111111] font-extrabold text-2xl mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Your cart awaits</h2>
        <p className="text-[#666666] mb-8 text-sm">Login to view your saved cart items.</p>
        <Link to="/login" className="block w-full py-4 bg-[#111111] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#333333] transition-colors">Login to Continue</Link>
      </div>
    </div>
  );

  const handleQty = async (itemId, qty) => {
    if (qty < 1) return;
    try { setUpdating(p => ({ ...p, [itemId]: true })); await dispatch(updateCartItem({ itemId, quantity: qty })).unwrap(); }
    catch { toast.error('Failed to update'); }
    finally { setUpdating(p => ({ ...p, [itemId]: false })); }
  };

  const handleRemove = async (itemId, name) => {
    try { await dispatch(removeFromCart(itemId)).unwrap(); toast.success(`${name} removed`); }
    catch { toast.error('Failed to remove'); }
  };

  const handleCoupon = async (e) => {
    e.preventDefault();
    if (!coupon.trim()) return;
    try {
      setValidating(true); setCouponError('');
      const { data } = await API.post('/coupons/validate', { code: coupon.toUpperCase(), orderAmount: subtotal });
      const disc = data.coupon.type === 'percentage'
        ? Math.min(Math.round(subtotal * data.coupon.value / 100), data.coupon.maxDiscount > 0 ? data.coupon.maxDiscount : Infinity)
        : Math.min(data.coupon.value, subtotal);
      dispatch(setCoupon({ coupon: data.coupon, discount: disc }));
      const label = data.coupon.type === 'percentage' ? `${data.coupon.value}% off` : `₹${data.coupon.value} off`;
      toast.success(`Coupon applied! ${label}`);
    } catch (err) { dispatch(clearCoupon()); setCouponError(err.response?.data?.message || 'Invalid coupon'); }
    finally { setValidating(false); }
  };

  const removeCoupon = () => { dispatch(clearCoupon()); setCouponCode(''); setCouponError(''); };

  const subtotal = items.reduce((s, item) => {
    const p = item.product;
    const unitPrice = item.price || (p?.discountPrice > 0 ? p.discountPrice : p?.price) || 0;
    return s + unitPrice * item.quantity;
  }, 0);
  const shippingInfo = calculateShipping(settings, subtotal);
  const shipping = shippingInfo.charge;
  const discount = couponDiscount || 0;
  const total    = subtotal + shipping - discount;

  if (loading) return (
    <div className="min-h-screen pt-32 pb-24 bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Skeleton className="h-10 w-48 mb-12" />
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">{[1,2,3].map(i => <Skeleton key={i} className="h-32 bg-white" />)}</div>
          <div><Skeleton className="h-96 bg-white" /></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Shopping Cart
            {items.length > 0 && <span className="ml-3 text-[#666666] text-xl font-medium">({items.length})</span>}
          </h1>
          {items.length > 0 && (
            <button onClick={() => { dispatch(clearCart()); toast.success('Cart cleared'); }} className="text-[#666666] hover:text-red-600 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors">
              <FiTrash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-32 bg-white border border-[#E5E5E5]">
            <FiShoppingBag size={64} className="mx-auto mb-6 text-[#CCCCCC]" />
            <h2 className="text-[#111111] font-extrabold text-2xl mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Your cart is empty</h2>
            <p className="text-[#666666] mb-8">Discover premium home appliances at great prices.</p>
            <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-4 bg-[#111111] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#333333] transition-colors">
              Start Shopping <FiArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map(item => {
                const p = item.product;
                if (!p) return null;
                const unitPrice = item.price || (p.discountPrice > 0 ? p.discountPrice : p.price);
                const hasDisc   = p.discountPrice > 0 && p.discountPrice < p.price;
                return (
                  <div key={item._id} className="flex flex-col sm:flex-row gap-6 p-6 bg-white border border-[#E5E5E5] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                    <Link to={`/products/${p.slug}`} className="w-full sm:w-32 h-32 bg-[#F7F6F3] border border-[#E5E5E5] flex-shrink-0 group block">
                      <img
                        src={imgSrc(item.variantImage || p.images?.[0])}
                        alt={p.name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          {p.brand && <p className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] mb-1">{p.brand}</p>}
                          <Link to={`/products/${p.slug}`} className="text-[#111111] font-bold text-lg hover:text-[#FF7A00] transition-colors line-clamp-2 leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {p.name}
                          </Link>
                          {item.variantName && (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00] mt-1.5">
                              {item.variantName}
                            </p>
                          )}
                          {item.variantSku && (
                            <p className="text-[9px] font-medium text-[#999999] uppercase tracking-widest mt-0.5">
                              SKU: {item.variantSku}
                            </p>
                          )}
                        </div>
                        <button onClick={() => handleRemove(item._id, p.name)} className="p-2 -mr-2 -mt-2 text-[#666666] hover:text-red-600 transition-colors">
                          <FiX size={18} />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-end justify-between mt-5 gap-4">
                        <div className="flex flex-col gap-0.5">
                          {hasDisc && <span className="text-xs text-[#666666] line-through font-medium">₹{p.price?.toLocaleString('en-IN')}</span>}
                          <span className="text-2xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>₹{unitPrice?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center border border-[#E5E5E5] bg-white">
                            <button onClick={() => handleQty(item._id, item.quantity - 1)} disabled={item.quantity <= 1 || updating[item._id]} className="p-3 text-[#666666] hover:text-[#111111] disabled:opacity-50 transition-colors">
                              <FiMinus size={14} />
                            </button>
                            <span className="w-8 text-center text-[#111111] font-bold text-sm">
                              {updating[item._id] ? '…' : item.quantity}
                            </span>
                            <button onClick={() => handleQty(item._id, item.quantity + 1)} disabled={updating[item._id]} className="p-3 text-[#666666] hover:text-[#111111] disabled:opacity-50 transition-colors">
                              <FiPlus size={14} />
                            </button>
                          </div>
                          <div className="text-right min-w-[70px]">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-[#999999] mb-1">Subtotal</p>
                            <span className="text-lg font-bold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>₹{(unitPrice * item.quantity)?.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <div>
              <div className="bg-white border border-[#E5E5E5] p-8 sticky top-28 flex flex-col">
                <h3 className="text-xl font-extrabold text-[#111111] mb-8 pb-4 border-b border-[#E5E5E5]" style={{ fontFamily: 'Poppins, sans-serif' }}>Order Summary</h3>

                {/* Coupon */}
                <div className="mb-6">
                  {couponData ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200">
                      <div className="flex items-center gap-3">
                        <FiTag size={16} className="text-green-700" />
                        <span className="text-green-700 font-bold text-sm uppercase tracking-widest">{couponData.code}</span>
                        <span className="text-green-700 text-xs font-bold px-2 py-1 bg-white border border-green-200">
                          {couponData.type === 'percentage' ? `-${couponData.value}%` : `-₹${couponData.value}`}
                        </span>
                      </div>
                      <button onClick={removeCoupon} className="text-green-700 hover:text-green-900 transition-colors"><FiX size={16} /></button>
                    </div>
                  ) : (
                    <form onSubmit={handleCoupon} className="flex flex-col gap-3">
                      <input value={coupon} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code" className="w-full bg-[#F7F6F3] border border-[#E5E5E5] px-4 py-3.5 text-sm font-bold uppercase outline-none focus:border-[#111111] transition-colors" />
                      <button type="submit" disabled={validating} className="w-full py-4 bg-[#111111] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
                        {validating ? '…' : 'APPLY COUPON'}
                      </button>
                    </form>
                  )}
                  {couponError && <p className="text-red-600 text-xs mt-2 font-bold px-1">{couponError}</p>}
                </div>

                {/* Breakdown */}
                <div className="space-y-3.5 mb-8">
                  {[
                    { label: `Subtotal (${items.length} item${items.length !== 1 ? 's' : ''})`, value: `₹${subtotal.toLocaleString('en-IN')}` },
                    { label: 'Shipping', value: shipping === 0 ? 'FREE' : `₹${shipping}` },
                    ...(discount > 0 ? [{ label: 'Coupon Discount', value: `-₹${discount.toLocaleString('en-IN')}`, green: true }] : []),
                  ].map(({ label, value, green }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-[#666666] font-medium">{label}</span>
                      <span className={green ? 'text-green-600 font-bold' : 'text-[#111111] font-bold'}>{value}</span>
                    </div>
                  ))}
                  <div className="border-t border-[#E5E5E5] pt-5 mt-5 flex items-end justify-between">
                    <span className="text-[#111111] font-bold text-sm uppercase tracking-widest">Total</span>
                    <span className="text-3xl font-extrabold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[#999999] text-[10px] mt-2 text-right font-medium tracking-wide">
                    +{Math.round((settings?.taxRate || 0.18) * 100)}% GST will be added at checkout
                  </p>
                </div>

                {/* Free shipping progress */}
                {shippingInfo.isEnabled && !shippingInfo.isFree && shippingInfo.amountNeeded > 0 && (
                  <div className="mb-8 p-4 bg-[#F7F6F3] border border-[#E5E5E5]">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[#666666] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <FiTruck size={13} /> Free Delivery
                      </span>
                      <span className="text-[#111111] text-[10px] font-bold">₹{shippingInfo.amountNeeded.toLocaleString('en-IN')} away</span>
                    </div>
                    <div className="h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF7A00] rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((subtotal / (shippingInfo.threshold || 1)) * 100, 99)}%` }} />
                    </div>
                  </div>
                )}
                {shippingInfo.isEnabled && shippingInfo.isFree && subtotal > 0 && (
                  <div className="mb-8 p-4 bg-green-50 border border-green-200">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-green-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <FiTruck size={13} /> Free Delivery
                      </span>
                      <span className="text-green-700 text-[10px] font-bold">Unlocked ✓</span>
                    </div>
                    <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-green-500 rounded-full" />
                    </div>
                  </div>
                )}

                <div className="mt-auto space-y-4">
                  <button onClick={() => navigate('/checkout')} className="w-full py-4 flex items-center justify-center gap-2 bg-[#111111] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
                    Checkout <FiArrowRight size={16} />
                  </button>
                  <Link to="/shop" className="w-full block text-center py-4 border border-[#111111] text-[#111111] text-sm font-bold uppercase tracking-widest hover:bg-[#F7F6F3] transition-colors">
                    Continue Shopping
                  </Link>
                  <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#666666]">
                    <FiShield size={14} className="text-[#111111]" /> 100% Secure Checkout
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
