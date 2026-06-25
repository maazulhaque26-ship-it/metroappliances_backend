/**
 * Dynamic Shipping Logic
 * Central source of truth for shipping calculations derived from Admin Settings.
 */

export const calculateShipping = (settings, subtotal = 0) => {
  // Safe fallbacks for backward compatibility
  const isEnabled = settings?.freeShippingEnabled ?? false;
  const threshold = settings?.freeShippingThreshold ?? 0;
  const baseCharge = settings?.shippingCharge ?? 0;

  if (!isEnabled) {
    return {
      isEnabled: false,
      isFree: baseCharge === 0,
      charge: baseCharge,
      threshold,
      amountNeeded: null,
    };
  }

  if (subtotal >= threshold) {
    return {
      isEnabled: true,
      isFree: true,
      charge: 0,
      threshold,
      amountNeeded: 0,
    };
  }

  return {
    isEnabled: true,
    isFree: false,
    charge: baseCharge,
    threshold,
    amountNeeded: threshold - subtotal,
  };
};
