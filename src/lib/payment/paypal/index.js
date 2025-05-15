import { PayPalClient } from './service';

// Create singleton instance of PayPalClient
const paypalClient = new PayPalClient();

// Export the singleton instance
export default paypalClient;

// Re-export the class for type checking
export { PayPalClient }; 