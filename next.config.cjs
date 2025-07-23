// next.config.cjs
/** @type {import('next').NextConfig} */
const nextConfig = {
 /*   eslint: {
    ignoreDuringBuilds: true,
  },
    typescript: {
    ignoreBuildErrors: true, // 型チェック無効化（ビルド通すだけ）
  },
  images: {
    unoptimized: true,
  },*/
   transpilePackages: ['@aws-amplify/ui-react'],
};

module.exports = nextConfig;

