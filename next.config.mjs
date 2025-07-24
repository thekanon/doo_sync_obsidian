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
            chunks: (chunk) => {
              // Edge Runtime chunks는 vendor 번들링에서 제외
              return chunk.name !== 'middleware' && !chunk.name?.includes('edge');
            },
            priority: 10,
          },
          firebase: {
            test: /[\\/]node_modules[\\/](firebase|firebaseui)[\\/]/,
            name: 'firebase',
            chunks: (chunk) => {
              // Edge Runtime chunks는 firebase 번들링에서 제외
              return chunk.name !== 'middleware' && !chunk.name?.includes('edge');
            },
            priority: 20,
          },
          commons: {
            name: 'commons',
            chunks: (chunk) => {
              // Edge Runtime chunks는 commons 번들링에서 제외
              return chunk.name !== 'middleware' && !chunk.name?.includes('edge');
            },
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
