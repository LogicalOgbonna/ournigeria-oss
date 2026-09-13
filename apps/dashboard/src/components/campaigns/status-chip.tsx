"use client";

import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/campaigns";
import { TONE_CLASS } from "@/lib/tone";

/** One chip for a ticket's (status, reviewStatus, reviewRequestedAt) triple. */
export function StatusChip(props: Parameters<typeof statusLabel>[0]) {
  const { label, tone } = statusLabel(props);
  return (
    // The E2E suite reads a ticket's state off this chip; the label alone is
    // too generic to select on ("Draft", "Live") and its classes are styling.
    <Badge data-testid="status-chip" className={TONE_CLASS[tone]} variant="outline">
      {label}
    </Badge>
  );
}
