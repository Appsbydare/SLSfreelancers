const withNextIntl = require('next-intl/plugin')(
  './src/i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 16, no experimental flag needed
};

module.exports = withNextIntl(nextConfig);
