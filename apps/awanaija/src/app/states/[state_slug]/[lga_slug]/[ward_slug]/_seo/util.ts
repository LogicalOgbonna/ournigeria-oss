import type { Metadata } from "next";
import { getWardDetails } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ state_slug: string; lga_slug: string; ward_slug: string }> }): Promise<Metadata> {
  const { state_slug, lga_slug, ward_slug } = await params;
  let ward;
  try {
    ward = await getWardDetails(state_slug, lga_slug, ward_slug);
  } catch (error) {
    return { title: "Ward Not Found" };
  }

  if (!ward || ward.error) return { title: "Ward Not Found" };

  // INEC ward names are sometimes already "Ward I N2" — avoid a redundant "Ward … Ward",
  // and include the state so the title matches how people actually search (place + state).
  const wardLabel = /^ward\b/i.test(ward.name) ? ward.name : `${ward.name} Ward`;

  return {
    title: `${wardLabel}, ${ward.lgaName} LGA, ${ward.stateName} State | Our Nigeria`,
    description: `Explore community updates and projects for ${wardLabel} in ${ward.lgaName} Local Government Area, ${ward.stateName} State.`,
    alternates: {
      canonical: `${SITE_URL}/states/${state_slug}/${lga_slug}/${ward_slug}`,
    },
    openGraph: {
      title: `${ward.name} Ward, ${ward.lgaName} LGA`,
      description: `Explore community updates and projects for ${ward.name} Ward.`,
      url: `${SITE_URL}/states/${state_slug}/${lga_slug}/${ward_slug}`,
    }
  };
}
