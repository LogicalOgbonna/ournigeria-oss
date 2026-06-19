import Link from "next/link";

export const metadata = {
  title: "Open Knowledge Bundle | OurNigeria",
  description:
    "Browse and download OurNigeria's officials, corruption cases, parties and states as an Open Knowledge Format (OKF) bundle — portable markdown with sources.",
};

const BUNDLE_BASE =
  process.env.NEXT_PUBLIC_OKF_BASE_URL || "https://cdn.ournigeria.ng/okf/latest";
const GIT_MIRROR =
  process.env.NEXT_PUBLIC_OKF_GIT_URL || "https://github.com/ournigeria/ournigeria-knowledge";

export default function OkfPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <section className="container mx-auto w-full max-w-5xl px-4 pt-24 pb-16">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            &larr; Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">Open Knowledge Bundle</h1>
        <p className="mt-3 text-muted-foreground">
          Every Nigerian public-office fact we hold — officials, corruption cases, parties and
          states — as an{" "}
          <a
            className="underline"
            href="https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf"
            target="_blank"
            rel="noreferrer"
          >
            Open Knowledge Format
          </a>{" "}
          bundle: portable markdown with sources, readable by humans and AI alike.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            href={`${BUNDLE_BASE}/bundle.tar.gz`}
          >
            Download bundle (.tar.gz)
          </a>
          <a className="rounded-md border px-4 py-2" href={GIT_MIRROR} target="_blank" rel="noreferrer">
            View on GitHub
          </a>
          <a
            className="rounded-md border px-4 py-2"
            href={`${BUNDLE_BASE}/index.md`}
            target="_blank"
            rel="noreferrer"
          >
            Raw index
          </a>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border" style={{ height: "70vh" }}>
          <iframe title="OurNigeria knowledge graph" src={`${BUNDLE_BASE}/viz.html`} className="h-full w-full" />
        </div>
      </section>
    </main>
  );
}
