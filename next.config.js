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
  // Enhance routing
  async rewrites() {
    return {
      beforeFiles: [
        // These rewrites run before files in the standard route resolution
        {
          source: '/api/:path*',
          destination: '/api/:path*',
          has: [
            {
              type: 'header',
              key: 'host',
            },
          ],
        },
        {
          source: '/api/provider/:path*',
          destination: '/api/provider/:path*',
        },
        {
          source: '/api/providers/:path*',
          destination: '/api/providers/:path*',
        },
        {
          source: '/provider/:path*',
          destination: '/provider/:path*',
        },
        {
          source: '/client/:path*',
          destination: '/client/:path*',
        },
        {
          source: '/admin/:path*',
          destination: '/admin/:path*',
        },
        {
          source: '/_next/:path*',
          destination: '/_next/:path*',
        },
        {
          source: '/public/:path*',
          destination: '/public/:path*',
        },
        {
          source: '/static/:path*',
          destination: '/static/:path*',
        },
        {
          source: '/socket/:path*',
          destination: '/socket/:path*',
        },
      ],
      // Other rewrites would go here if needed
      afterFiles: [],
      fallback: []
    };
  },
  // Next.js 15 specific settings
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Adjust according to your needs
    },
    optimizePackageImports: [
      '@chakra-ui/react',
      '@chakra-ui/icons',
      'react-icons',
    ],
  }
}

module.exports = nextConfig 