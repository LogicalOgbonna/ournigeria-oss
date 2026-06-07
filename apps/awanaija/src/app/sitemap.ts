import { MetadataRoute } from 'next';
import { getStates, getLgas, getWards, getOfficials } from '@/lib/api';

export const revalidate = 86400; // Revalidate every 24 hours

const slugify = (s: string) =>
  encodeURIComponent(s.toLowerCase().replace(/\s+/g, '-'));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ournigeria.ng';

  const staticRoutes = [
    '',
    '/states',
    '/officials',
    '/representatives',
    '/activity',
    '/donate',
    '/leaderboard',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    const dynamicRoutes: MetadataRoute.Sitemap = [];

    // Fetch states
    const states = await getStates();

    for (const state of states) {
      const stateSlug = slugify(state.name);
      dynamicRoutes.push({
        url: `${baseUrl}/states/${stateSlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      });

      try {
        const lgas = await getLgas(state.code);
        
        // We fetch wards in batches to speed up the process and prevent API timeout
        const chunkSize = 10;
        for (let i = 0; i < lgas.length; i += chunkSize) {
          const lgaChunk = lgas.slice(i, i + chunkSize);
          
          await Promise.all(
            lgaChunk.map(async (lga) => {
              const lgaSlug = slugify(lga.name);
              dynamicRoutes.push({
                url: `${baseUrl}/states/${stateSlug}/${lgaSlug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
              });

              try {
                const wards = await getWards(lga.code);
                for (const ward of wards) {
                  const wardSlug = slugify(ward.name.split('/')[0].trim());
                  dynamicRoutes.push({
                    url: `${baseUrl}/states/${stateSlug}/${lgaSlug}/${wardSlug}`,
                    lastModified: new Date(),
                    changeFrequency: 'monthly' as const,
                    priority: 0.5,
                  });
                }
              } catch (e) {
                console.warn(`Failed to fetch wards for LGA ${lga.name}`);
              }
            })
          );
        }
      } catch (e) {
        console.warn(`Failed to fetch LGAs for state ${state.name}`);
      }
    }
    
    // Fetch officials
    try {
      // Using a large limit to grab as many as possible for the sitemap
      const officialsRes = await getOfficials({ limit: '5000' });
      // Officials are high-demand SEO pages (~half of all impressions); surface
      // them with the human-readable slug and a slightly higher priority.
      if (officialsRes.total > officialsRes.data.length) {
        console.warn(
          `sitemap: officials truncated — ${officialsRes.data.length}/${officialsRes.total} included (raise the limit or paginate)`,
        );
      }
      for (const official of officialsRes.data) {
        // Skip any official without a slug rather than emit a UUID URL.
        if (!official.slug) continue;
        const imageUrl = official.imageUrl
          ? (/^https?:\/\//.test(official.imageUrl)
              ? official.imageUrl
              : `${baseUrl}${official.imageUrl.startsWith('/') ? '' : '/'}${official.imageUrl}`)
          : null;
        dynamicRoutes.push({
          url: `${baseUrl}/officials/${official.slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
          ...(imageUrl ? { images: [imageUrl] } : {}),
        });
      }
    } catch (e) {
      console.warn('Failed to fetch officials for sitemap');
    }

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    // Fallback to static routes if API connection fails
    return staticRoutes;
  }
}
