/**
 * Card copy for /proposals/new link previews.
 *
 * The identify flow deep-links the proposal form with role + location context in
 * the query string. The default card sells the site; these links are a specific
 * ask ("name your councilor"), so the preview should make the ask before the
 * click. Pure param → OgCardProps mapping; rendering stays in @/lib/og.
 *
 * Location names: in-app links carry human-readable stateName/lgaName/wardName
 * params, so prefer those. Campaign links (socials CTA) may carry only the slug
 * codes — humanize them instead. Codes nest (`wardCode` starts with `lgaCode`
 * starts with `stateCode`), so strip the parent prefix before de-slugging.
 */
import type { OgIdentityProps } from "./og-identity";

type Params = Record<string, string | string[] | undefined>;

const first = (p: Params, key: string): string | null => {
  const v = p[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : null;
};

/** Uppercase tokens that read as roman numerals so "isele iii" → "Isele III". */
const ROMAN = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)$/;

function deslug(slug: string, stripPrefix?: string | null): string {
  let s = slug;
  if (stripPrefix && s.startsWith(`${stripPrefix}_`)) {
    s = s.slice(stripPrefix.length + 1);
  }
  return s
    .split("_")
    .filter(Boolean)
    .map((w) => (ROMAN.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function place(p: Params) {
  const stateCode = first(p, "stateCode");
  const lgaCode = first(p, "lgaCode");
  const wardCode = first(p, "wardCode");
  const constituencyCode = first(p, "constituencyCode");

  const state = first(p, "stateName") ?? (stateCode ? deslug(stateCode) : null);
  const lga = first(p, "lgaName") ?? (lgaCode ? deslug(lgaCode, stateCode) : null);
  const ward = first(p, "wardName") ?? (wardCode ? deslug(wardCode, lgaCode) : null);
  // Constituency codes carry an arc prefix: state_ (assembly), sen_ (senate),
  // fed_ (house of reps), each followed by the state slug.
  const constituency = constituencyCode
    ? deslug(constituencyCode.replace(/^(state|sen|fed)_/, ""), stateCode)
    : null;

  return { state, lga, ward, constituency };
}

/** Joins present parts: "Ikorodu LGA, Lagos State". */
const breadcrumb = (parts: (string | null)[]) => parts.filter(Boolean).join(", ");

export function proposalCardFromParams(p: Params): OgIdentityProps {
  const role = first(p, "role");
  const stateCode = first(p, "stateCode");
  const { state, lga, ward, constituency } = place(p);
  const subAsk = "Know who holds this seat? Naming them takes two minutes.";
  const withCrumb = (crumb: string) => (crumb ? `${crumb}. ${subAsk}` : subAsk);

  if (role === "councilor" && ward) {
    return {
      headline: [
        { text: "Who is the councilor for " },
        { text: `${ward} Ward?`, accent: true },
      ],
      subline: withCrumb(breadcrumb([lga && `${lga} LGA`, state && `${state} State`])),
      stateCode,
    };
  }

  if (role === "lga_chairman" && lga) {
    return {
      headline: [
        { text: "Who chairs " },
        { text: `${lga} Local Government?`, accent: true },
      ],
      subline: withCrumb(breadcrumb([state && `${state} State`])),
      stateCode,
    };
  }

  if (role === "senator" && (constituency || state)) {
    return {
      headline: constituency
        ? [
            { text: "Who is the senator for " },
            { text: `${constituency}?`, accent: true },
          ]
        : [
            { text: "Who represents " },
            { text: `${state} State`, accent: true },
            { text: " in the Senate?" },
          ],
      subline: withCrumb(breadcrumb([lga && `${lga} LGA`, state && `${state} State`])),
      stateCode,
    };
  }

  if (role === "rep" && (constituency || lga || state)) {
    return {
      headline: [
        { text: "Who speaks for " },
        { text: constituency ?? lga ?? `${state} State`, accent: true },
        { text: " in the House of Reps?" },
      ],
      subline: withCrumb(breadcrumb([lga && `${lga} LGA`, state && `${state} State`])),
      stateCode,
    };
  }

  if (role === "governor" && state) {
    return {
      headline: [
        { text: "Who governs " },
        { text: `${state} State?`, accent: true },
      ],
      subline: withCrumb(breadcrumb([state && `${state} State`])),
      stateCode,
    };
  }

  // Assembly links from the chain view often carry only ward/LGA context, no
  // constituency code — fall back to the LGA as the seat's nearest name.
  if (role === "mha" && (constituency || lga || state)) {
    return {
      headline: [
        { text: "Who speaks for " },
        { text: constituency ?? lga ?? `${state} State`, accent: true },
        { text: " in the State Assembly?" },
      ],
      subline: withCrumb(
        breadcrumb([constituency && lga ? `${lga} LGA` : null, state && `${state} State`])
      ),
      stateCode,
    };
  }

  // Cold visit or unrecognized role: still an ask, just a general one.
  return {
    headline: [
      { text: "Help us name " },
      { text: "every official in Nigeria.", accent: true },
    ],
    subline:
      "Identify a missing official or correct an existing profile — from your ward councilor to the governor.",
    stateCode,
  };
}
