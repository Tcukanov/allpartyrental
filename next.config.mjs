const nextConfig = {
  // ... other configurations ...
  publicRuntimeConfig: {
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL,
  },
  // ... other configurations ...
};

export default nextConfig; 