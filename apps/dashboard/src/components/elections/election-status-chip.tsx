"use client";

import { Badge } from "@/components/ui/badge";
import { electionStatusLabel } from "@/lib/elections";
import { TONE_CLASS } from "@/lib/tone";

/** One chip for an event's (published, status, reviewStatus) triple. */
export function ElectionStatusChip(
  props: Parameters<typeof electionStatusLabel>[0],
) {
  const { label, tone } = electionStatusLabel(props);
  return (
    // The E2E suite reads an event's state off this chip, same convention as
    // the campaign ticket chip (helpers/campaigns.ts statusChip()).
    <Badge data-testid="status-chip" className={TONE_CLASS[tone]} variant="outline">
      {label}
    </Badge>
  );
}
