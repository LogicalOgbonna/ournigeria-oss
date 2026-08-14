"use client";

import { useSearchParams } from "next/navigation";
import { IdentifyOfficialContent } from "./IdentifyOfficialContent";
import { EditOfficialContent } from "./EditOfficialContent";

export function NewProposalContent() {
  const searchParams = useSearchParams();

  const officialId = searchParams.get("officialId");

  // Existing official → propose a field change. Otherwise → identify a new official
  // (handles both deep-links with role/location context and cold no-context visits).
  if (officialId) {
    return <EditOfficialContent />;
  }

  return <IdentifyOfficialContent />;
}
