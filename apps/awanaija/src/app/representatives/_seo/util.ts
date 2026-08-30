import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Who Governs Me? | Find Your Representatives | Our Nigeria",
  description: "Find your local, state, and federal representatives in Nigeria. See who is responsible for your ward, LGA, and state.",
  alternates: {
    canonical: `${SITE_URL}/representatives`,
  },
  openGraph: {
    title: "Find Your Representatives",
    description: "See who is responsible for your ward, LGA, and state.",
    url: `${SITE_URL}/representatives`,
  }
};
