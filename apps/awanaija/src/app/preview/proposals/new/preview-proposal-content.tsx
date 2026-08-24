"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { RECORD_SCHEMAS } from "@ournigeria/official-records";
import { getOfficialById, type Official } from "@/lib/api";
import { RecordForm } from "@/components/proposals/record-form";

/** recordType → the Official profile payload key holding that section's rows. */
const RECORD_SECTIONS: Record<string, keyof Official> = {
  education: "educationRecords",
  career: "careerRecords",
  party_affiliation: "partyHistory",
  committee: "committees",
  sponsored_bill: "sponsoredBills",
  election: "elections",
  asset_declaration: "assetDeclarations",
  award: "awards",
  publication: "publications",
  family_member: "familyMembers",
  legal_case: "legalCases",
};

export function PreviewProposalContent() {
  const sp = useSearchParams();
  const officialId = sp.get("officialId") ?? "";
  const recordType = sp.get("recordType") ?? "";
  const editId = sp.get("edit");
  const targetField = sp.get("targetField"); // scalar gap → forward to the live form

  const [official, setOfficial] = useState<Official | null>(null);
  useEffect(() => {
    if (officialId) {
      getOfficialById(officialId)
        .then((o) => setOfficial(o as Official))
        .catch(() => setOfficial(null));
    }
  }, [officialId]);

  // Scalar gaps keep using the existing (unchanged) live form:
  useEffect(() => {
    if (officialId && targetField && !recordType) {
      window.location.replace(
        `/proposals/new?officialId=${encodeURIComponent(officialId)}&targetField=${encodeURIComponent(targetField)}`,
      );
    }
  }, [officialId, targetField, recordType]);
  if (officialId && targetField && !recordType) return null;

  const schema = RECORD_SCHEMAS[recordType];
  if (!officialId || !schema) {
    return (
      <p className="mx-auto max-w-xl px-4 text-white/60">
        Missing or unknown official / record type.
      </p>
    );
  }

  // Correction mode: locate the record on the fetched profile to show current values.
  let editRecord: { targetPk: string; current: Record<string, unknown> } | null = null;
  if (editId && official) {
    const rows = (official[RECORD_SECTIONS[recordType]] ?? []) as unknown as Array<
      Record<string, unknown> & { id?: string }
    >;
    const row = rows.find((r) => r?.id === editId);
    if (row) editRecord = { targetPk: editId, current: row };
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <p className="text-xs uppercase tracking-widest text-emerald-400/80">
        Help verify this profile
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-white">
        {editId ? `Correct a ${schema.label.toLowerCase()}` : `Add ${schema.labelPlural.toLowerCase()}`}
        {official ? ` — ${official.name}` : ""}
      </h1>
      {official && (
        <Link
          href={`/preview/officials/${official.slug ?? officialId}`}
          className="mt-1 inline-block text-sm text-white/50 hover:text-white/80"
        >
          ← back to profile
        </Link>
      )}
      <div className="mt-6">
        {editId && !editRecord ? (
          <p className="text-sm text-white/60">Loading record…</p>
        ) : (
          <RecordForm officialId={officialId} recordType={recordType} editRecord={editRecord} />
        )}
      </div>
    </div>
  );
}
