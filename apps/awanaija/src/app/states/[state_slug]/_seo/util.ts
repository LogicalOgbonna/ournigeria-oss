import type { Metadata } from "next";
import { getStateDetails } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ state_slug: string }> }): Promise<Metadata> {
  const { state_slug } = await params;
  let state;
  try {
    state = await getStateDetails(state_slug);
  } catch (error) {
    return { title: "State Not Found" };
  }

  if (!state || state.error) return { title: "State Not Found" };

  return {
    title: `${state.name} State - Budget, FAAC & Economy | Our Nigeria`,
    description: `Explore the budget, FAAC allocation, and internally generated revenue (IGR) for ${state.name} State. See how public funds are spent.`,
    alternates: {
      canonical: `${SITE_URL}/states/${state_slug}`,
    },
    openGraph: {
      title: `${state.name} State - Budget, FAAC & Economy`,
      description: `Explore the budget, FAAC allocation, and IGR for ${state.name} State.`,
      url: `${SITE_URL}/states/${state_slug}`,
    }
  };
}
