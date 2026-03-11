import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'U';
  const first = firstName?.charAt(0).toUpperCase() || '';
  const last = lastName?.charAt(0).toUpperCase() || '';
  return `${first}${last}`;
}

/**
 * Format large numbers with K, M, B suffixes for better readability
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Format currency with smart compact display for large amounts
 * Shows ₹1.5M instead of ₹1,500,000 for amounts >= 1 Lakh
 */
export function formatCurrency(amount: number, compact: boolean = true): string {
  if (compact && Math.abs(amount) >= 100000) {
    // For amounts >= 1 Lakh, use compact format
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    
    if (absAmount >= 10000000) {
      // >= 1 Crore
      return sign + '₹' + (absAmount / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
    }
    if (absAmount >= 100000) {
      // >= 1 Lakh
      return sign + '₹' + (absAmount / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    }
  }
  
  // Default: full format with Indian locale
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with compact display for large values
 * Shows 1.5M instead of 1,500,000
 */
export function formatNumber(num: number, compact: boolean = true): string {
  if (compact && Math.abs(num) >= 1000) {
    return formatCompactNumber(num);
  }
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format percentage with proper display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return value.toFixed(decimals).replace(/\.0$/, '') + '%';
}
