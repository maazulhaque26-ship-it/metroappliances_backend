import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart, clearCoupon } from '../redux/slices/shopSlices';
import API from '../services/api';
import { toast } from 'react-toastify';
import { imgSrc } from '../utils/imageHelper';
import { calculateShipping } from '../utils/shippingLogic';
import { usePageTitle } from '../hooks/usePageTitle';
import { trackCheckoutStarted, trackPaymentFailure } from '../utils/analytics';
import { FiCheck, FiChevronRight, FiChevronDown, FiCreditCard, FiPackage, FiMapPin, FiShield, FiLock, FiTag, FiTruck, FiX, FiAward } from 'react-icons/fi';

const STEPS = ['Address', 'Payment', 'Review'];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh',
];

function Field({ label, name, type, placeholder, full, address, errors, onChange }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">{label}</label>
      <input
        type={type || 'text'}
        placeholder={placeholder || label}
        value={address[name] || ''}
        onChange={e => onChange(name, e.target.value)}
        className={`w-full bg-white border px-4 py-3 text-sm font-medium outline-none transition-colors ${errors[name] ? 'border-[#111111] bg-[#F7F6F3]' : 'border-[#E5E5E5] focus:border-[#111111]'}`}
      />
      {errors[name] && <p className="text-[#111111] font-bold text-xs mt-2">{errors[name]}</p>}
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector(s => s.auth);
  const { items, coupon: couponData, couponDiscount } = useSelector(s => s.cart);
  const { data: settings } = useSelector(s => s.settings);

  usePageTitle('Checkout');
  const [step,       setStep]       = useState(0);
  const [placing,    setPlacing]    = useState(false);
  const [orderError, setOrderError] = useState('');
  const [payMethod,  setPayMethod]  = useState('COD');

  const [address, setAddress] = useState({
    fullName: user?.name || '', phone: user?.phone || '',
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!token) navigate('/login?redirect=/checkout');
    if (items.length === 0) navigate('/cart');
  }, [token, items.length, navigate]);

  // Fire checkout_started once when page loads with items
  useEffect(() => {
    if (items.length > 0) trackCheckoutStarted(subtotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFieldChange = useCallback((name, value) => {
    setAddress(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const subtotal = items.reduce((s, item) => {
    // item.price is stored at cart-add time (variant-aware), always use it
    const unitPrice = item.price || item.product?.discountPrice || item.product?.price || 0;
    return s + unitPrice * item.quantity;
  }, 0);
  
  const shippingInfo = calculateShipping(settings, subtotal);
  const shipping = shippingInfo.charge;
  const taxRate  = settings?.taxRate || 0.18;
  const tax      = Math.round(subtotal * taxRate);
  const discount = couponDiscount || 0;
  const total    = subtotal + shipping + tax - discount;

  const validateAddress = () => {
    const e = {};
    if (!address.fullName.trim())          e.fullName     = 'Name is required';
    if (!address.phone.match(/^\d{10}$/))  e.phone        = 'Enter valid 10-digit phone';
    if (!address.addressLine1.trim())      e.addressLine1 = 'Address is required';
    if (!address.city.trim())              e.city         = 'City is required';
    if (!address.state)                    e.state        = 'State is required';
    if (!address.pincode.match(/^\d{6}$/)) e.pincode      = 'Enter valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (step === 0 && !validateAddress()) return; setStep(s => s + 1); };

  const placeOrder = async () => {
    setOrderError('');
    try {
      setPlacing(true);
      const orderItems = items.map(item => ({
        product:     item.product._id,
        name:        item.product.name,
        price:       item.price || (item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price),
        quantity:    item.quantity,
        image:       item.product.images?.[0]?.url || item.product.images?.[0] || '',
        variantId:   item.variantId   || '',
        variantName: item.variantName || '',
      }));
      let paymentStatus = 'Pending';
      if (payMethod === 'Stripe') {
        try { await API.post('/payment/create-intent', { amount: total, currency: 'inr' }); } catch { /* continue */ }
      }
      const { data } = await API.post('/orders', {
        items: orderItems, shippingAddress: address, paymentMethod: payMethod,
        itemsPrice: subtotal, shippingPrice: shipping, taxPrice: tax, totalPrice: total, paymentStatus,
        couponCode: couponData?.code || '', couponDiscount: discount,
      });
      dispatch(clearCart());
      navigate(`/orders/${data.order._id}?success=true`);
      toast.success('Order placed successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order. Try again.';
      toast.error(msg);
      setOrderError(msg);
      trackPaymentFailure(msg);
    } finally { setPlacing(false); }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header Steps */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-[#111111] mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>Checkout</h1>
          <div className="flex items-center gap-4 border-b border-[#E5E5E5] pb-6 overflow-x-auto no-scrollbar">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-4 flex-shrink-0">
                <div className={`flex items-center gap-2 ${i === step ? 'text-[#111111]' : i < step ? 'text-green-700' : 'text-[#666666]'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < step ? 'bg-green-50 border border-green-200 text-green-700' :
                    i === step ? 'bg-[#111111] text-white' :
                    'bg-white border border-[#E5E5E5] text-[#666666]'
                  }`}>
                    {i < step ? <FiCheck size={12} /> : i + 1}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">{s}</span>
                </div>
                {i < STEPS.length - 1 && <FiChevronRight size={14} className="text-[#CCCCCC]" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16">
          
          {/* Left Form Section */}
          <div>
            {/* Step 0: Address */}
            {step === 0 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-8">
                  <FiMapPin size={24} className="text-[#111111]" />
                  <h2 className="text-2xl font-bold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Delivery Address</h2>
                </div>

                {user?.addresses?.length > 0 && (
                  <div className="mb-8 p-6 bg-white border border-[#E5E5E5]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-4">Saved Addresses</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {user.addresses.map(a => (
                        <button key={a._id}
                          onClick={() => setAddress({
                            fullName: a.fullName, phone: a.phone || '',
                            addressLine1: a.addressLine1, addressLine2: a.addressLine2 || '',
                            city: a.city, state: a.state, pincode: a.pincode,
                          })}
                          className="text-left p-4 border border-[#E5E5E5] bg-[#F7F6F3] hover:border-[#111111] transition-colors">
                          <strong className="text-[#111111] text-sm block mb-1">{a.fullName}</strong>
                          <span className="text-[#666666] text-xs leading-relaxed line-clamp-2">{a.addressLine1}, {a.city}, {a.state} - {a.pincode}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6 bg-white border border-[#E5E5E5] p-6 sm:p-8">
                  <Field label="Full Name *"       name="fullName"     full address={address} errors={errors} onChange={handleFieldChange} />
                  <Field label="Phone Number *"    name="phone"        type="tel" placeholder="10-digit mobile" address={address} errors={errors} onChange={handleFieldChange} />
                  <Field label="Address Line 1 *"  name="addressLine1" full placeholder="House/Flat/Block No." address={address} errors={errors} onChange={handleFieldChange} />
                  <Field label="Address Line 2"    name="addressLine2" full placeholder="Area, Colony, Street"  address={address} errors={errors} onChange={handleFieldChange} />
                  <Field label="City *"            name="city"         placeholder="City"                       address={address} errors={errors} onChange={handleFieldChange} />
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">State *</label>
                    <div className="relative">
                      <select
                        value={address.state}
                        onChange={e => { setAddress(p => ({ ...p, state: e.target.value })); setErrors(p => ({ ...p, state: '' })); }}
                        className={`w-full bg-white border px-4 py-3 text-sm font-medium outline-none appearance-none transition-colors ${errors.state ? 'border-[#111111] bg-[#F7F6F3]' : 'border-[#E5E5E5] focus:border-[#111111]'}`}>
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <FiChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
                    </div>
                    {errors.state && <p className="text-[#111111] font-bold text-xs mt-2">{errors.state}</p>}
                  </div>
                  <Field label="Pincode *" name="pincode" placeholder="6-digit pincode" address={address} errors={errors} onChange={handleFieldChange} />
                </div>

                <div className="pt-4">
                  <button onClick={handleNext} className="w-full py-5 bg-[#111111] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Payment */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-8">
                  <FiCreditCard size={24} className="text-[#111111]" />
                  <h2 className="text-2xl font-bold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Payment Method</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { id: 'COD',    label: 'Cash on Delivery',   desc: 'Pay cash when your order arrives',               icon: '💵' },
                    { id: 'Stripe', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Rupay — secure checkout',      icon: '💳' },
                  ].map(m => (
                    <button key={m.id} onClick={() => setPayMethod(m.id)}
                      className={`w-full flex items-center gap-5 p-6 border transition-colors text-left bg-white ${
                        payMethod === m.id
                          ? 'border-[#111111]'
                          : 'border-[#E5E5E5] hover:border-[#CCCCCC]'
                      }`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${payMethod === m.id ? 'border-[#111111]' : 'border-[#CCCCCC]'}`}>
                        {payMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-[#111111]" />}
                      </div>
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <p className="text-[#111111] font-bold">{m.label}</p>
                        <p className="text-[#666666] text-sm mt-1">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button onClick={() => setStep(0)} className="w-full sm:w-1/3 py-5 border border-[#111111] text-[#111111] text-sm font-bold uppercase tracking-widest hover:bg-[#F7F6F3] transition-colors">Back</button>
                  <button onClick={handleNext} className="w-full sm:w-2/3 py-5 bg-[#111111] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors">Review Order</button>
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-8">
                  <FiPackage size={24} className="text-[#111111]" />
                  <h2 className="text-2xl font-bold text-[#111111]" style={{ fontFamily: 'Poppins, sans-serif' }}>Review Your Order</h2>
                </div>
                
                <div className="p-8 border border-[#E5E5E5] bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#666666] mb-4">Delivering to</p>
                  <p className="text-[#111111] font-bold mb-2">{address.fullName}</p>
                  <p className="text-[#666666] text-sm mb-2">{address.addressLine1}, {address.city}, {address.state} - {address.pincode}</p>
                  <p className="text-[#666666] text-sm">📞 {address.phone}</p>
                </div>

                <div className="p-5 bg-[#F7F6F3] border border-[#E5E5E5] flex items-center gap-4">
                  <FiTruck size={18} className="text-[#666666] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">Estimated Delivery</p>
                    <p className="text-[#111111] font-bold text-sm mt-0.5">3–7 Business Days</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button onClick={() => setStep(1)} className="w-full sm:w-1/3 py-5 border border-[#111111] text-[#111111] text-sm font-bold uppercase tracking-widest hover:bg-[#F7F6F3] transition-colors">Back</button>
                  <button onClick={placeOrder} disabled={placing} className="w-full sm:w-2/3 py-5 bg-[#111111] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors flex items-center justify-center disabled:opacity-50">
                    {placing
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" /> Placing…</>
                      : <><FiLock size={16} className="mr-3" /> Place Order — ₹{total.toLocaleString('en-IN')}</>
                    }
                  </button>
                </div>
                {orderError && (
                  <p className="text-red-600 text-xs font-bold p-4 bg-red-50 border border-red-200">{orderError}</p>
                )}
              </div>
            )}
          </div>

          {/* Right Order Summary */}
          <div>
            <div className="p-8 sticky top-28 bg-white border border-[#E5E5E5]">
              <h3 className="text-xl font-extrabold text-[#111111] mb-6 pb-4 border-b border-[#E5E5E5]" style={{ fontFamily: 'Poppins, sans-serif' }}>Order Summary</h3>
              
              <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                {items.map(item => {
                  const p = item.product;
                  const unitPrice = item.price || p?.discountPrice || p?.price || 0;
                  return p ? (
                    <div key={item._id} className="flex gap-4 items-start">
                      <div className="w-16 h-16 bg-[#F7F6F3] border border-[#E5E5E5] flex-shrink-0">
                        <img src={imgSrc(p.images?.[0])} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#111111] text-sm font-bold line-clamp-2 mb-1">{p.name}</p>
                        {item.variantName && (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF7A00] mb-1">{item.variantName}</p>
                        )}
                        <p className="text-[#666666] text-xs font-bold tracking-widest uppercase">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#111111] font-bold text-sm">₹{(unitPrice * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>

              {shippingInfo.isEnabled && !shippingInfo.isFree && shippingInfo.amountNeeded > 0 && (
                <div className="mb-5 px-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                    <span className="text-[#666666] flex items-center gap-1.5"><FiTruck size={12} /> Free Delivery</span>
                    <span className="text-[#999999]">₹{shippingInfo.amountNeeded.toLocaleString('en-IN')} away</span>
                  </div>
                  <div className="h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF7A00] rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((subtotal / (shippingInfo.threshold || 1)) * 100, 99)}%` }} />
                  </div>
                </div>
              )}
              {shippingInfo.isEnabled && shippingInfo.isFree && subtotal > 0 && (
                <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-700 px-1">
                  <FiTruck size={12} /> Free Delivery Unlocked
                </div>
              )}
              {couponData && (
                <div className="mb-5 flex items-center justify-between p-3 bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <FiTag size={12} />
                    <span className="font-bold text-xs uppercase tracking-widest">{couponData.code}</span>
                    <span className="text-xs font-bold">{couponData.type === 'percentage' ? `−${couponData.value}%` : `−₹${couponData.value}`}</span>
                  </div>
                  <button onClick={() => dispatch(clearCoupon())} className="text-green-700 hover:text-green-900 transition-colors" aria-label="Remove coupon"><FiX size={14} /></button>
                </div>
              )}
              <div className="space-y-4 border-t border-[#E5E5E5] pt-6 text-sm mb-6">
                {[
                  { l: 'Subtotal', v: `${settings?.currency || '₹'}${subtotal.toLocaleString('en-IN')}` },
                  { l: 'Shipping', v: shippingInfo.isFree ? 'FREE' : `${settings?.currency || '₹'}${shipping}` },
                  { l: `GST (${Math.round(taxRate * 100)}%)`, v: `${settings?.currency || '₹'}${tax.toLocaleString('en-IN')}` },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-[#666666] font-medium">{l}</span>
                    <span className="text-[#111111] font-bold">{v}</span>
                  </div>
                ))}
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span className="font-medium">Coupon ({couponData?.code})</span>
                    <span className="font-bold">−₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
              <div className="flex items-end justify-between border-t border-[#E5E5E5] pt-6">
                <span className="text-[#111111] font-bold text-lg uppercase tracking-widest">Total</span>
                <span className="text-[#111111] font-extrabold text-3xl" style={{ fontFamily: 'Poppins, sans-serif' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="mt-6 pt-6 border-t border-[#E5E5E5] grid grid-cols-2 gap-y-3">
                {[
                  { icon: <FiLock size={13} />,   label: 'SSL Secured'  },
                  { icon: <FiShield size={13} />,  label: 'Safe Payment' },
                  { icon: <FiAward size={13} />,   label: 'Warranty'     },
                  { icon: <FiTruck size={13} />,   label: 'Easy Returns' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#666666]">
                    <span className="text-[#111111]">{icon}</span> {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
