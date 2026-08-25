import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

/**
 * True only for the real production deployment. VERCEL_ENV is the reliable signal on
 * Vercel ('production' | 'preview' | 'development'); NODE_ENV is the fallback for
 * self-hosted builds, where every production build is the production site.
 */
const IS_PRODUCTION =
  process.env.VERCEL_ENV === "production" ||
  (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  // Now that baseUrl follows the deployment, a preview host would otherwise publish
  // a crawlable robots.txt advertising its own sitemap — inviting duplicate content
  // against production. Previews say no to everything.
  if (!IS_PRODUCTION) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/_next/',
        '/login/',
        '/preview/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
