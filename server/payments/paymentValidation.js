/**
 * PERSONAL DRIVER MARKETPLACE - PAYMENT VALIDATION & CURRENCY UTILITIES
 * Enforces integer paise arithmetic, INR currency compliance & user authorization
 */

/**
 * Converts Indian Rupee decimal to integer paise
 * e.g. 599.00 -> 59900 paise
 */
export function rupeesToPaise(rupees) {
  if (typeof rupees !== 'number' || isNaN(rupees)) {
    throw new Error(`Invalid rupee amount: ${rupees}`);
  }
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to Indian Rupee decimal
 * e.g. 59900 paise -> 599.00
 */
export function paiseToRupees(paise) {
  if (!Number.isInteger(paise)) {
    throw new Error(`Paise must be an integer, received: ${paise}`);
  }
  return Number((paise / 100).toFixed(2));
}

/**
 * Formats paise into Indian Rupee display string
 */
export function formatINR(paise) {
  const rs = paiseToRupees(paise);
  return `₹${rs.toLocaleString('en-IN')}`;
}

/**
 * Validates integer paise amount
 */
export function validatePaiseAmount(amountPaise, fieldName = 'Amount') {
  if (!Number.isInteger(amountPaise)) {
    return { valid: false, message: `${fieldName} must be an integer value in paise` };
  }
  if (amountPaise <= 0) {
    return { valid: false, message: `${fieldName} must be strictly positive` };
  }
  // Max safety cap: ₹2,00,000 (20,000,000 paise) per transaction
  if (amountPaise > 20000000) {
    return { valid: false, message: `${fieldName} exceeds platform transaction safety limit (₹2,00,000)` };
  }
  return { valid: true };
}

/**
 * Validates currency code
 */
export function validateCurrency(currency = 'INR') {
  if (currency.toUpperCase() !== 'INR') {
    return { valid: false, message: `Only INR (Indian Rupee) transactions are supported. Received: ${currency}` };
  }
  return { valid: true };
}
