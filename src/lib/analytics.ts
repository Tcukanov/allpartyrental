/**
 * Google Analytics 4 Helper Functions
 * Use these to track custom events throughout your application
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Track a page view
 * @param url - The page URL
 */
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-5DLQJN7KCH', {
      page_path: url,
    });
  }
};

/**
 * Track a custom event
 * @param action - The action name
 * @param category - The event category
 * @param label - Optional event label
 * @param value - Optional numeric value
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Track a service view
 * @param serviceId - The service ID
 * @param serviceName - The service name
 */
export const trackServiceView = (serviceId: string, serviceName: string) => {
  trackEvent('view_item', 'Services', `${serviceName} (${serviceId})`);
};

/**
 * Track a booking request
 * @param serviceId - The service ID
 * @param serviceName - The service name
 * @param value - The service price
 */
export const trackBookingRequest = (
  serviceId: string,
  serviceName: string,
  value?: number
) => {
  trackEvent('begin_checkout', 'Bookings', `${serviceName} (${serviceId})`, value);
};

/**
 * Track a completed booking
 * @param transactionId - The transaction ID
 * @param value - The transaction value
 */
export const trackBookingComplete = (transactionId: string, value: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: 'USD',
    });
  }
};

/**
 * Track a search
 * @param searchTerm - The search term
 */
export const trackSearch = (searchTerm: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
    });
  }
};

/**
 * Track user signup
 * @param method - The signup method (e.g., 'email', 'google')
 */
export const trackSignUp = (method: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method,
    });
  }
};

/**
 * Track user login
 * @param method - The login method (e.g., 'email', 'google')
 */
export const trackLogin = (method: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'login', {
      method: method,
    });
  }
};

