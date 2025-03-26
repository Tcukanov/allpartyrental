/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suppress specific warnings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Suppress specific warnings
  compiler: {
    styledComponents: true,
  },
  // Suppress specific warnings
  experimental: {
    // Suppress specific warnings
    suppressHydrationWarning: true,
  },
}

module.exports = nextConfig 