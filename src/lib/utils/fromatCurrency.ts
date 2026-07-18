// src/lib/utils/formatCurrency.ts

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    // minimumFractionDigits: 0 keeps it clean (e.g., ₹3,000 instead of ₹3,000.00)
    // but allows up to 2 decimal places if there are actual paise (e.g., ₹3,000.50)
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}