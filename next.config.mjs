// next.config.mjs (ES Module 방식)
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = Array.isArray(config.externals)
        ? ['firebase-admin', ...config.externals]
        : ['firebase-admin'];
    }
    return config;
  }
};

export default nextConfig;
