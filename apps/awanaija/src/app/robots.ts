import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://ournigeria.ng';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/_next/',
        '/login/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
