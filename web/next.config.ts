import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.notion.so',
        port: '',
        pathname: '/**',
      },
    ],
    // ローカル画像を許可
    localPatterns: [
      {
        pathname: '/api/image-proxy',
        search: '**',
      },
      {
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
