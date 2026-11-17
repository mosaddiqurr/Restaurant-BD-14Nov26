import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  /* lets a phone on the same wifi open the dev server (npm run dev) by this computer's address; dev only */
  allowedDevOrigins: ['10.*.*.*', '192.168.*.*', '172.*.*.*'],
  /* the live site's address, used inside QR codes. Netlify gives URL while building; set NEXT_PUBLIC_SITE_URL to override */
  env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || '' },
  /* the offline worker must always be fresh, or phones keep an old one */
  async headers() {
    return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
