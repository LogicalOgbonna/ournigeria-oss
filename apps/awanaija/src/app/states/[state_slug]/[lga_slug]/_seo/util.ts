import type { Metadata } from "next";
import { getLgaDetails } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ state_slug: string; lga_slug: string }> }): Promise<Metadata> {
  const { state_slug, lga_slug } = await params;
  let lga;
  try {
    lga = await getLgaDetails(state_slug, lga_slug);
  } catch (error) {
    return { title: "LGA Not Found" };
  }

  if (!lga || lga.error) return { title: "LGA Not Found" };

  return {
    title: `${lga.name} LGA, ${lga.stateName} State | Our Nigeria`,
    description: `Explore the FAAC allocation, internally generated revenue, and projects for ${lga.name} Local Government Area in ${lga.stateName} State.`,
    alternates: {
      canonical: `https://ournigeria.ng/states/${state_slug}/${lga_slug}`,
    },
    openGraph: {
      title: `${lga.name} LGA, ${lga.stateName} State`,
      description: `Explore FAAC allocation, revenue, and projects for ${lga.name} LGA.`,
      url: `https://ournigeria.ng/states/${state_slug}/${lga_slug}`,
    }
  };
}
