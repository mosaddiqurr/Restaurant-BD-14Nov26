import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/en/partner', '/bn/partner', '/en/admin', '/bn/admin', '/api/'] }], sitemap: 'https://khabo.app/sitemap.xml' };
}
