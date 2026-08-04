const isVercel = !!process.env.VERCEL;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  ...(!isVercel
    ? {
        output: 'export',
        trailingSlash: true,
        assetPrefix: './',
      }
    : {}),
};

module.exports = nextConfig;