'use client';

import Script from 'next/script';
import { Show } from '@/components/ui/Show';

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <>
      <Script
        defer
        src="https://cloud.umami.is/script.js"
        data-website-id="3ba1d60c-3802-4751-a7e6-3b3cd839780f"
        strategy="afterInteractive"
      />

      {/* Google Analytics 4 */}
      <Show when={!!gaId}>
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      </Show>
    </>
  );
}
