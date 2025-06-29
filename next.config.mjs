/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true, // 프로덕션 빌드 시 소스맵 활성화
  
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
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
        },
      },
    };
    
    return config;
  }
};

export default nextConfig;
