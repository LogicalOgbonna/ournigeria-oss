import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Nigerian Officials Directory | Our Nigeria",
  description: "Browse the directory of Nigerian government officials. Help complete their profiles with verified public information.",
  alternates: {
    canonical: `${SITE_URL}/officials`,
  },
  openGraph: {
    title: "Nigerian Officials Directory",
    description: "Browse the directory of Nigerian government officials.",
    url: `${SITE_URL}/officials`,
  }
};
