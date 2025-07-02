// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    appDir: true,
    output: 'standalone',
    transpilePackages: ['@aws-amplify/ui-react'],
};

module.exports = nextConfig;

