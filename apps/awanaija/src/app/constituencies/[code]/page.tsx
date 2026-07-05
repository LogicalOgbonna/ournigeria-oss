import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, User, Construction, MapPin } from "lucide-react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { RelatedLinks, type RelatedLink } from "@/components/civic/RelatedLinks";
import { getConstituencyDetails, type ConstituencyDetails } from "@/lib/api";
import { notFound } from "next/navigation";
import { ldJson, breadcrumbLd } from "@/lib/seo";

export const revalidate = 120;

type Props = { params: Promise<{ code: string }> };

const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
const wardSlug = (name: string) =>
  name.toLowerCase().split("/")[0].replace(/\s+/g, "-");

function typeLabel(type: string): string {
  switch (type) {
    case "federal":
      return "Federal Constituency";
    case "state":
      return "State Constituency";
    case "senatorial":
      return "Senatorial District";
    default:
      return "Constituency";
  }
}

const ROLE_LABELS: Record<string, string> = {
  senator: "Senator",
  rep: "Federal Representative",
  representative: "Federal Representative",
  mha: "State House of Assembly Member",
};
const roleLabel = (role: string) => ROLE_LABELS[role] ?? role.replace(/_/g, " ");

async function fetchConstituency(code: string): Promise<ConstituencyDetails | null> {
  try {
    return await getConstituencyDetails(code);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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

export default async function ConstituencyPage({ params }: Props) {
  const { code } = await params;
  const c = await fetchConstituency(code);
  if (!c) notFound();

  const stateSlug = slug(c.stateName);
  const label = typeLabel(c.type);

  const lgaLinks: RelatedLink[] = c.lgas.map((lga) => ({
    href: `/states/${stateSlug}/${slug(lga.name)}`,
    label: lga.name,
    sublabel: "Local Government",
  }));

  const wardLinks: RelatedLink[] = c.wards.map((w) => ({
    href: `/states/${stateSlug}/${slug(w.lgaName)}/${wardSlug(w.name)}`,
    label: w.name,
    sublabel: w.lgaName,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    name: `${c.name} ${label}`,
    url: `https://ournigeria.ng/constituencies/${c.code}`,
    parentOrganization: {
      "@type": "GovernmentOrganization",
      name: `${c.stateName} State`,
      url: `https://ournigeria.ng/states/${stateSlug}`,
    },
    ...(c.representatives.length
      ? {
          member: c.representatives.map((r) => ({
            "@type": "Person",
            name: r.name,
            jobTitle: roleLabel(r.role),
          })),
        }
      : {}),
  };

  const breadcrumbJsonLd = breadcrumbLd([
    { name: "Home", item: "https://ournigeria.ng" },
    { name: "States", item: "https://ournigeria.ng/states" },
    { name: `${c.stateName} State`, item: `https://ournigeria.ng/states/${stateSlug}` },
    { name: `${c.name} ${label}`, item: `https://ournigeria.ng/constituencies/${c.code}` },
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.representatives.map((r) => ({
      "@type": "Question",
      name: `Who represents ${c.name} ${label} in ${c.stateName}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${r.name} is the ${roleLabel(r.role)} for ${c.name}${
          r.party && r.party !== "N/A" ? ` (${r.party})` : ""
        }.`,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }} />
      {faqJsonLd.mainEntity.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqJsonLd) }} />
      )}
      <Navbar />

      <main className="container max-w-5xl mx-auto px-4 pt-24 pb-20 space-y-16 flex-1">
        <Link
          href={`/states/${stateSlug}`}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {c.stateName} State
        </Link>

        {/* Hero */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-sans text-muted-foreground flex-wrap">
            <Link href={`/states/${stateSlug}`} className="hover:text-foreground transition-colors">
              {c.stateName}
            </Link>
            <span>/</span>
            <span className="text-foreground">{label}</span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground mt-4">{c.name}</h1>
          <p className="font-sans text-muted-foreground">{label}</p>
        </section>

        {/* Representative(s) */}
        <section className="space-y-6">
          <h2 className="font-heading text-2xl font-semibold">Who Represents You?</h2>
          {c.representatives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {c.representatives.map((rep) => (
                <Link
                  key={rep.id}
                  href={`/officials/${rep.slug ?? rep.id}`}
                  className="bg-card border border-border rounded-[14px] p-6 flex flex-col sm:flex-row items-start gap-4 hover:border-emerald-500/50 transition-colors group"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    <OfficialAvatar
                      src={rep.image}
                      alt={rep.name}
                      px={64}
                      imgClassName="w-full h-full object-cover"
                      fallback={<User className="w-8 h-8 text-muted-foreground" />}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {roleLabel(rep.role)}
                    </p>
                    <h3 className="font-heading text-xl font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {rep.name}
                    </h3>
                    {rep.party && rep.party !== "N/A" && (
                      <span className="inline-block px-2 py-0.5 rounded bg-muted text-foreground font-medium text-sm">
                        {rep.party}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[10px] border border-border bg-muted/30 px-5 py-4 flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground shrink-0" />
              <p className="font-sans text-sm text-muted-foreground">
                We don&apos;t have the current representative for this constituency yet.
              </p>
            </div>
          )}
        </section>

        {/* Constituency projects — placeholder until data lands */}
        <section className="space-y-6">
          <h2 className="font-heading text-2xl font-semibold">Constituency Projects</h2>
          <div className="rounded-[10px] border border-border bg-muted/30 px-5 py-4 flex items-center gap-3">
            <Construction className="w-5 h-5 text-muted-foreground shrink-0" />
            <p className="font-sans text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Coming soon.</span>{" "}
              We&apos;re aggregating constituency (zonal intervention) projects implemented by
              this constituency&apos;s representative.
            </p>
          </div>
        </section>

        {/* Coverage — LGAs + wards, or a compile note when neither is mapped yet
            (many state constituencies aren't ward-mapped in the source data). */}
        {lgaLinks.length === 0 && wardLinks.length === 0 ? (
          <section className="space-y-6">
            <h2 className="font-heading text-2xl font-semibold">Coverage</h2>
            <div className="rounded-[10px] border border-border bg-muted/30 px-5 py-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
              <p className="font-sans text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Coming soon.</span>{" "}
                The local governments and wards that make up this constituency are being compiled.
              </p>
            </div>
          </section>
        ) : (
          <>
            <RelatedLinks title="Local Governments in this constituency" items={lgaLinks} />
            <RelatedLinks title="Wards in this constituency" items={wardLinks} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
