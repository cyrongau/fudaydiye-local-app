export const SHIPPING_RATES = {
    AMAZON_UAE: 12, // $12 per kg
    ALIBABA: 15,    // $15 per kg (Air)
    ALIEXPRESS: 18, // $18 per kg
    NONE: 0
};

export const DEFAULT_TAX_RATE = 0.05; // 5%

export const calculateLandedCost = (basePrice: number, weightKg: number, origin: keyof typeof SHIPPING_RATES): number => {
    const shippingRate = SHIPPING_RATES[origin] || 0;
    const shippingCost = weightKg * shippingRate;
    return basePrice + shippingCost;
};

export const calculateSellingPrice = (basePrice: number, weightKg: number, origin: string, markupPercent: number): number => {
    // 1. Landed Cost
    const rateOrigin = origin as keyof typeof SHIPPING_RATES;
    const landedCost = calculateLandedCost(basePrice, weightKg, rateOrigin);

    // 2. Tax (VAT on Landed Cost)
    const tax = landedCost * DEFAULT_TAX_RATE;

    // 3. Profit Margin
    const costBasis = landedCost + tax;
    const profit = costBasis * (markupPercent / 100);

    return parseFloat((costBasis + profit).toFixed(2));
};
