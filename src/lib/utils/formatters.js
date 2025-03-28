'use strict';

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (default: USD)
 * @param {string} locale - The locale to use for formatting (default: en-US)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD', locale = 'en-US') {
  if (amount === undefined || amount === null) {
    return '';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a date
 * @param {Date|string} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @param {string} locale - The locale to use for formatting (default: en-US)
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}, locale = 'en-US') {
  if (!date) {
    return '';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Format a datetime with time
 * @param {Date|string} datetime - The datetime to format
 * @param {string} locale - The locale to use for formatting (default: en-US)
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(datetime, locale = 'en-US') {
  return formatDate(datetime, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }, locale);
}

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - The date to format relative to now
 * @param {string} locale - The locale to use for formatting (default: en-US)
 * @returns {string} Formatted relative time string
 */
export function formatRelativeTime(date, locale = 'en-US') {
  if (!date) {
    return '';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(Math.round(diffInSeconds), 'second');
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, 'day');
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, 'month');
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return rtf.format(diffInYears, 'year');
}

/**
 * Format a number with commas for thousands
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '';
  
  return new Intl.NumberFormat('en-US').format(num);
}; 