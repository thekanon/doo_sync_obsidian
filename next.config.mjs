/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      if (!Array.isArray(config.externals)) {
        config.externals = config.externals ? [config.externals] : [];
      }
      config.externals.push('firebase-admin');
    }
    return config;
  },
};

module.exports = nextConfig;
