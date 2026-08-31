/**
 * Render sample proposal OG cards to PNGs without a dev server:
 *   npx tsx scripts/preview-og-proposal.tsx   (from apps/awanaija)
 * Writes to /tmp/og-proposal-*.png. Sample URLs are real deep-links observed in
 * production crawler logs.
 */
import { writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { OG_SIZE } from "../src/lib/og";
import { OgCardIdentity, ogIdentityFonts, ogIdentityHeadlineText } from "../src/lib/og-identity";
import { proposalCardFromParams } from "../src/lib/og-proposal";

const SAMPLES: { name: string; query: string }[] = [
  {
    name: "ward-councilor",
    query:
      "role=councilor&stateCode=lagos&lgaCode=lagos_ikorodu&wardCode=lagos_ikorodu_isele_iii",
  },
  {
    name: "ward-councilor-named",
    query:
      "role=councilor&stateCode=lagos&stateName=Lagos&lgaCode=lagos_alimosho&lgaName=Alimosho&wardCode=lagos_alimosho_ipaja_south&wardName=Ipaja%20South",
  },
  {
    name: "lga-chairman",
    query: "role=lga_chairman&stateCode=kano&lgaCode=kano_ungogo",
  },
  {
    name: "mha-constituency",
    query:
      "role=mha&stateCode=kaduna&constituencyCode=state_kaduna_unguwar_sanusi",
  },
  { name: "cold-visit", query: "" },
  // Geographic spread for the dynamic map highlight + arrow: far north-east,
  // and the state right under the avatar tile (worst case for the arrow).
  {
    name: "ward-councilor-borno",
    query:
      "role=councilor&stateCode=borno&stateName=Borno&lgaCode=borno_maiduguri&lgaName=Maiduguri&wardCode=borno_maiduguri_bolori_i&wardName=Bolori%20I",
  },
  {
    name: "senator",
    query: "role=senator&stateCode=abia&stateName=Abia&lgaCode=abia_aba_north&lgaName=Aba%20North",
  },
  {
    name: "rep",
    query:
      "role=rep&stateCode=abia&stateName=Abia&constituencyCode=fed_abia_aba_north_aba_south",
  },
  { name: "governor", query: "role=governor&stateCode=kano&stateName=Kano" },
  {
    name: "ward-councilor-abia",
    query:
      "role=councilor&stateCode=abia&stateName=Abia&lgaCode=abia_aba_north&lgaName=Aba%20North&wardCode=abia_aba_north_ariaria_market&wardName=Ariaria%20Market",
  },
];

async function main() {
  for (const { name, query } of SAMPLES) {
    const params = Object.fromEntries(new URLSearchParams(query));
    const card = proposalCardFromParams(params);
    const res = new ImageResponse(<OgCardIdentity {...card} />, {
      ...OG_SIZE,
      fonts: ogIdentityFonts(),
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const out = `/tmp/og-proposal-${name}.png`;
    writeFileSync(out, buf);
    console.log(`${out}  (${buf.length} bytes)  "${ogIdentityHeadlineText(card.headline)}"`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
