const nextConfig = {
  // ... other configurations ...
  publicRuntimeConfig: {
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL,
  },
  // Increase body size limit for image uploads
  serverRuntimeConfig: {
    bodySizeLimit: '50mb',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // ... other configurations ...
};

export default nextConfig; 