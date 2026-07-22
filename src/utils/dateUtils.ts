import { ExpiryStatus, InventoryItem } from '../types/inventory';

/**
 * Returns today's date in YYYY-MM-DD format based on local time
 */
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a future date string YYYY-MM-DD offset by days
 */
export function getFutureDateString(daysToAdd: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format ISO YYYY-MM-DD into user-friendly date (e.g., "24 Jul 2026")
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculates number of days remaining until expiry date
 */
export function getDaysUntil(expiryDateStr: string): number {
  if (!expiryDateStr) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = expiryDateStr.split('-').map(Number);
  const expiry = new Date(year, month - 1, day);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Categorizes expiry urgency level and badge information
 */
export function getExpiryStatus(expiryDateStr: string): ExpiryStatus {
  const days = getDaysUntil(expiryDateStr);

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      urgency: 'EXPIRED',
      daysRemaining: days,
      label: `Expired ${absDays} ${absDays === 1 ? 'day' : 'days'} ago`,
    };
  }

  if (days === 0) {
    return {
      urgency: 'CRITICAL',
      daysRemaining: 0,
      label: 'Expires Today!',
    };
  }

  if (days <= 3) {
    return {
      urgency: 'CRITICAL',
      daysRemaining: days,
      label: `Expires in ${days} ${days === 1 ? 'day' : 'days'}`,
    };
  }

  if (days <= 7) {
    return {
      urgency: 'WARNING',
      daysRemaining: days,
      label: `Expires in ${days} days`,
    };
  }

  return {
    urgency: 'FRESH',
    daysRemaining: days,
    label: `${days} days left`,
  };
}

/**
 * Sorts inventory items strictly by nearest expiry date first.
 * If expiry dates are equal, secondary sort by received date (oldest first).
 */
export function sortByNearestExpiry(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => {
    if (a.expiryDate !== b.expiryDate) {
      return a.expiryDate.localeCompare(b.expiryDate);
    }
    // Secondary sort: earliest received date first
    return a.receivedDate.localeCompare(b.receivedDate);
  });
}

/**
 * Validates that expiry date is on or after received date
 */
export function isValidDateRange(receivedDate: string, expiryDate: string): boolean {
  if (!receivedDate || !expiryDate) return false;
  return expiryDate >= receivedDate;
}
