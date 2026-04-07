/* ═══════════════════════════════════════
   VAT & Discount Computation Utilities
   Philippine Tax Law (NIRC, RA 9994, RA 10754)
   ═══════════════════════════════════════ */

const VAT_RATE = 0.12;
const SC_PWD_DISCOUNT_RATE = 0.20;

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Compute VAT breakdown from a VAT-inclusive total.
 * Philippine VAT is inclusive — prices shown already contain VAT.
 */
export function computeVAT(vatInclusiveTotal: number) {
  const vatableSales = roundToTwo(vatInclusiveTotal / (1 + VAT_RATE));
  const vatAmount = roundToTwo(vatInclusiveTotal - vatableSales);

  return {
    vatableSales,
    vatAmount,
    vatExemptSales: 0,
    zeroRatedSales: 0,
    totalAmount: vatInclusiveTotal,
  };
}

/**
 * Compute SC / PWD discount per RA 9994 / RA 10754.
 *
 * Steps:
 *  1. Remove the embedded 12% VAT to get the VAT-exempt base price
 *  2. Apply 20% discount on that base price
 *  3. Final amount due = base - 20% discount (VAT is fully exempted)
 */
export function computeSCPWDDiscount(vatInclusiveTotal: number) {
  // Step 1 — Remove VAT
  const vatExemptSales = roundToTwo(vatInclusiveTotal / (1 + VAT_RATE));

  // Step 2 — 20% discount on VAT-exempt price
  const discountAmount = roundToTwo(vatExemptSales * SC_PWD_DISCOUNT_RATE);

  // Step 3 — Final amount
  const amountDue = roundToTwo(vatExemptSales - discountAmount);

  return {
    originalTotal: vatInclusiveTotal,
    vatExemptSales,
    discountAmount,
    amountDue,
    vatAmount: 0,      // VAT is fully EXEMPTED (not just removed)
    vatableSales: 0,   // Entire sale is VAT-exempt
  };
}

/**
 * Given a list of cart items (each with VAT-inclusive price × qty),
 * compute the full receipt breakdown.
 *
 * discountType: "none" | "senior" | "pwd" | "promo"
 */
export function computeCartTotals(
  items: Array<{ unit_price: number; quantity: number }>,
  discountType: "none" | "senior" | "pwd" | "promo" = "none"
) {
  const rawTotal = items.reduce(
    (sum, item) => sum + roundToTwo(item.unit_price * item.quantity),
    0
  );

  if (discountType === "none" || discountType === "promo") {
    const vat = computeVAT(rawTotal);
    return {
      subtotal: rawTotal,
      ...vat,
      discountAmount: 0,
      totalAmount: rawTotal,
    };
  }

  // SC / PWD path
  const discount = computeSCPWDDiscount(rawTotal);
  return {
    subtotal: rawTotal,
    vatableSales: 0,
    vatAmount: 0,
    vatExemptSales: discount.vatExemptSales,
    zeroRatedSales: 0,
    discountAmount: discount.discountAmount,
    totalAmount: discount.amountDue,
  };
}

/**
 * Format a number as Philippine Peso string.
 * e.g. 1234.5 → "₱1,234.50"
 */
export function formatPeso(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date as Philippine standard.
 * e.g. "April 7, 2026, 6:30 PM"
 */
export function formatDatePH(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

/**
 * Pad receipt number to 10 digits.
 * e.g. 1 → "0000000001"
 */
export function formatReceiptNumber(num: number): string {
  return String(num).padStart(10, "0");
}
