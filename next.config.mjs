/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false, // Reduce build size for production
  compress: true,
  poweredByHeader: false,
  
  // Optimize worker configuration for deployment
  experimental: {
    workerThreads: false,
    cpus: 1
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = Array.isArray(config.externals)
        ? ['firebase-admin', ...config.externals]
        : ['firebase-admin'];
    }
    
    // Optimize build performance
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          firebase: {
            test: /[\\/]node_modules[\\/](firebase|firebaseui)[\\/]/,
            name: 'firebase',
            chunks: 'all',
            priority: 20,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 5,
          },
        },
      },
    };
    
    return config;
  }
};

export default nextConfig;
