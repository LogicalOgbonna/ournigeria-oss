import { Phone, Mail } from "lucide-react";
import type { Official } from "@/lib/api";
import { Show } from "@/components/ui/Show";
import { ContactPill } from "./ContactPill";

export function ContactPills({ official }: { official: Official }) {
  return (
    <div className="flex flex-wrap gap-2.5 mb-9">
      <Show when={!!official.phoneNumber}>
        <ContactPill
          icon={<Phone className="w-3.5 h-3.5" />}
          value={official.phoneNumber!}
          href={`tel:${official.phoneNumber}`}
        />
      </Show>
      <Show when={!!official.email}>
        <ContactPill
          icon={<Mail className="w-3.5 h-3.5" />}
          value={official.email!}
          href={`mailto:${official.email}`}
        />
      </Show>
      {official.twitterHandle && (() => {
        const handle = official.twitterHandle!;
        // Extract username from URL if stored as a link
        const match = handle.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/);
        const username = match ? match[1] : handle.replace(/^@/, "");
        return (
          <ContactPill
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            }
            value={`@${username}`}
            href={`https://x.com/${username}`}
            external
          />
        );
      })()}
      {official.facebookUrl && (() => {
        const raw = official.facebookUrl!;
        // Stored value may be a bare path (e.g. "facebook.com/page"); without a scheme the
        // browser resolves it relative to ournigeria.ng -> 404 on our own site. Mirror the
        // Twitter pill and rebuild an absolute URL.
        const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
        return (
          <ContactPill
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            }
            value="Facebook"
            href={href}
            external
          />
        );
      })()}
    </div>
  );
}
