import { HomeContent } from "@/components/pages/HomeContent";

// ISR: the homepage's initial (pre-personalization) snapshot is cached and
// revalidated every 5 min instead of re-running the SSR API waterfall on every
// request. Per-user personalization stays fully live (client-side fetches in
// PersonalizedDataClient hit the DB in real time and are never cached).
export const revalidate = 300;

export const metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return <HomeContent electionActive={false} />;
}
