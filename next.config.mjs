/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true, // 프로덕션 빌드 시 소스맵 활성화

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
