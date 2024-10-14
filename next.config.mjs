/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = ['firebase-admin', ...config.externals];
    }
    return config;
  }
};

export default nextConfig;
