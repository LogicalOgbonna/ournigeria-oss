import { MetadataRoute } from 'next';
import { getStates, getLgas, getWards, getOfficials } from '@/lib/api';

export const revalidate = 86400; // Revalidate every 24 hours

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
      const stateSlug = state.name.toLowerCase().replace(/\s+/g, '-');
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
              const lgaSlug = lga.name.toLowerCase().replace(/\s+/g, '-');
              dynamicRoutes.push({
                url: `${baseUrl}/states/${stateSlug}/${lgaSlug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
              });

              try {
                const wards = await getWards(lga.code);
                for (const ward of wards) {
                  const wardSlug = ward.name.split('/')[0].trim().toLowerCase().replace(/\s+/g, '-');
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
      for (const official of officialsRes.data) {
        dynamicRoutes.push({
          url: `${baseUrl}/officials/${official.id}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.5,
          ...(official.imageUrl ? { images: [official.imageUrl] } : {}),
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
