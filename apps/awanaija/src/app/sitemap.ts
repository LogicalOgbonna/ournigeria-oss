import { MetadataRoute } from 'next';
import { getStates, getLgas, getWards, getOfficials, getConstituencies } from '@/lib/api';

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

      // Constituencies in this state (federal/state/senatorial) — SEO pages.
      try {
        const constituencies = await getConstituencies(state.code);
        for (const c of constituencies) {
          dynamicRoutes.push({
            url: `${baseUrl}/constituencies/${encodeURIComponent(c.code)}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          });
        }
      } catch {
        console.warn(`sitemap: constituencies for ${state.name} failed`);
      }

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
    
    // Fetch officials. The API caps `limit` at 100, so paginate through every
    // page to list all officials (~3.3k) — they are high-demand SEO pages
    // (~half of all impressions). Page 1 first to learn the page count, then
    // the rest in small parallel batches to keep generation fast.
    try {
      const PAGE_SIZE = 100;
      const first = await getOfficials({ page: '1', limit: String(PAGE_SIZE) });
      const allOfficials = [...first.data];
      const totalPages = Math.max(1, first.pages || 1);

      const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      const BATCH = 8;
      for (let i = 0; i < remaining.length; i += BATCH) {
        const batch = remaining.slice(i, i + BATCH);
        const pages = await Promise.all(
          batch.map((p) =>
            getOfficials({ page: String(p), limit: String(PAGE_SIZE) }).catch((e) => {
              console.warn(`sitemap: officials page ${p} failed`, e);
              return null;
            }),
          ),
        );
        for (const res of pages) {
          if (res?.data) allOfficials.push(...res.data);
        }
      }

      let emitted = 0;
      let skipped = 0;
      for (const official of allOfficials) {
        // Skip any official without a slug rather than emit a UUID URL.
        if (!official.slug) {
          skipped++;
          continue;
        }
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
        emitted++;
      }
      console.log(
        `sitemap: ${emitted} officials emitted of ${first.total} total` +
          (skipped ? ` (${skipped} skipped — no slug)` : '') +
          (allOfficials.length < first.total
            ? ` [WARN: only fetched ${allOfficials.length}/${first.total}]`
            : ''),
      );
    } catch (e) {
      console.warn('Failed to fetch officials for sitemap', e);
    }

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    // Fallback to static routes if API connection fails
    return staticRoutes;
  }
}
