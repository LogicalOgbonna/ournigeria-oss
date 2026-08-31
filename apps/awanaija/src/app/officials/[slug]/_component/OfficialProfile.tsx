"use client";

import { BackButton } from "@/components/ui/BackButton";
import { Show } from "@/components/ui/Show";
import type { Official, ChainEntry } from "@/lib/api";
import type { RelatedLink } from "@/components/civic/RelatedLinks";
import { WhereTheyServe } from "./WhereTheyServe";
import { ProposedBanner } from "./ProposedBanner";
import { OfficialHero } from "./OfficialHero";
import { ContactPills } from "./ContactPills";
import { ProfileTextSection } from "./ProfileTextSection";
import { HelpComplete } from "./HelpComplete";
import { ChallengeButton } from "./ChallengeButton";
import { CommunityProposals } from "./CommunityProposals";
import { PeerOfficials } from "./PeerOfficials";

const TRACKED_FIELDS = [
  "name",
  "imageUrl",
  "email",
  "phoneNumber",
  "officeAddress",
  "twitterHandle",
  "facebookUrl",
  "education",
  "biography",
  "gender",
  "partyAcronym",
];

export function OfficialProfile({
  official,
  peers = [],
  showHelpComplete = true,
  showChallenge = true,
  showProposals = true,
  showPeers = true,
  topSlot,
  bottomSlot,
  whereServeLast = false,
  partyLogos = {},
}: {
  official: Official;
  peers?: ChainEntry[];
  showHelpComplete?: boolean;
  showChallenge?: boolean;
  showProposals?: boolean;
  showPeers?: boolean;
  topSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  partyLogos?: Record<string, string>;
  /** Render the "Where they serve" block at the very end (after bottomSlot)
   *  instead of its default mid-body position — used by the seat-confirm view
   *  so the verify action precedes it. Real profile keeps the default order. */
  whereServeLast?: boolean;
}) {
  const position = official.positions?.[0];
  const peerAreaLabel = position?.ward || position?.lga || position?.state || "this area";
  const completeness = Math.round(official.completenessScore * 100);
  const missingFields = TRACKED_FIELDS.filter(
    (f) => f === "partyAcronym" ? !position?.party : !(official as unknown as Record<string, unknown>)[f],
  );
  const filledFields = TRACKED_FIELDS.filter(
    (f) => f === "partyAcronym" ? !!position?.party : !!(official as unknown as Record<string, unknown>)[f],
  );

  // Retention Phase 1 — link the jurisdictions this official serves so a one-shot
  // profile visitor can explore the place, not just the person. Data-gated:
  // a card renders only when its target page is reachable (state → LGA → ward).
  const serveLinks: RelatedLink[] = [];
  if (position?.state) {
    const stateSlug = position.state.toLowerCase().replace(/\s+/g, "-");
    serveLinks.push({ href: `/states/${stateSlug}`, label: position.state, sublabel: "State" });
    if (position.lga) {
      const lgaSlug = position.lga.toLowerCase().replace(/\s+/g, "-");
      serveLinks.push({
        href: `/states/${stateSlug}/${lgaSlug}`,
        label: position.lga,
        sublabel: "Local Government",
      });
      if (position.ward) {
        const wardSlug = position.ward.toLowerCase().split("/")[0].replace(/\s+/g, "-");
        serveLinks.push({
          href: `/states/${stateSlug}/${lgaSlug}/${wardSlug}`,
          label: position.ward,
          sublabel: "Ward",
        });
      }
    }
  }
  // Constituency is its own jurisdiction (senators/reps/MHAs) — link to its page.
  if (position?.constituency && position?.constituencyCode) {
    serveLinks.push({
      href: `/constituencies/${position.constituencyCode}`,
      label: position.constituency,
      sublabel: "Constituency",
    });
  }

  return (
    <main className="flex-grow pt-24 bg-[oklch(0.98_0.002_120)] dark:bg-[oklch(0.10_0.005_160)]">
      <div className="max-w-[672px] mx-auto px-6 pt-8 pb-16">
        {/* Back link */}
        <BackButton fallbackHref="/officials" fallbackLabel="officials" className="mb-8" />

        {topSlot}

        {/* Unverified-submission banner: this record exists only via a pending,
            admin-unapproved citizen "identify" proposal. */}
        <Show when={!!official.proposed}>
          <ProposedBanner />
        </Show>

        {/* Hero */}
        <OfficialHero official={official} position={position} completeness={completeness} />

        {/* Contact pills */}
        <ContactPills official={official} />

        {/* Office Address */}
        <Show when={!!official.officeAddress}>
          <ProfileTextSection label="Office Address" text={official.officeAddress!} />
        </Show>

        {/* Biography */}
        <Show when={!!official.biography}>
          <ProfileTextSection label="Biography" text={official.biography!} />
        </Show>

        {/* Education */}
        <Show when={!!official.education}>
          <ProfileTextSection label="Education" text={official.education!} />
        </Show>

        {/* Help Complete This Profile */}
        <Show when={showHelpComplete && missingFields.length > 0}>
          <HelpComplete officialId={official.id} missingFields={missingFields} />
        </Show>

        {/* Challenge / Correct Information */}
        <Show when={showChallenge && filledFields.length > 0}>
          <ChallengeButton officialId={official.id} fields={filledFields} />
        </Show>

        {/* Community Proposals */}
        <Show when={!!(showProposals && official.proposals && official.proposals.length > 0)}>
          <CommunityProposals proposals={official.proposals} />
        </Show>

        {/* Retention Phase 1 — explore the jurisdictions this official serves */}
        <Show when={!whereServeLast}>
          <div className="mt-10">
            <WhereTheyServe items={serveLinks} />
          </div>
        </Show>

        {/* Retention Phase 1 — the other people who represent this area */}
        <Show when={showPeers && peers.length > 0}>
          <PeerOfficials peers={peers} areaLabel={peerAreaLabel} partyLogos={partyLogos} />
        </Show>

        {bottomSlot}

        <Show when={whereServeLast}>
          <div className="mt-10">
            <WhereTheyServe items={serveLinks} />
          </div>
        </Show>
      </div>
    </main>
  );
}
