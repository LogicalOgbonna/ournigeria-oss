import type { Metadata } from "next";
import { typeLabel, fetchConstituency } from "../utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const c = await fetchConstituency(code);
  if (!c) return { title: "Constituency Not Found | OurNigeria" };

  const label = typeLabel(c.type);
  return {
    title: `${c.name} ${label}, ${c.stateName} State | OurNigeria`,
    description: `${c.name} ${label} in ${c.stateName} State — see who represents it and the local governments and wards it covers.`,
    alternates: { canonical: `https://ournigeria.ng/constituencies/${c.code}` },
  };
}
