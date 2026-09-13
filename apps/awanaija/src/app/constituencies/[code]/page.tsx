import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { User, Construction, MapPin } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { Show } from "@/components/ui/Show";
import { RelatedLinks, type RelatedLink } from "@/components/civic/RelatedLinks";
import { notFound } from "next/navigation";
import { slug, typeLabel, roleLabel, fetchConstituency } from "./utils";
import { StructuredData } from "./_seo/structured-data";
import { wardSlug } from "@/lib/utils";
import { getElectionGate, isElectionEnabledFor, offGate } from "@/lib/election-gate";
import { ElectionSection } from "@/components/civic/ElectionSection";

export { generateMetadata } from "./_seo/util";

export const revalidate = 120;

type Props = { params: Promise<{ code: string }> };


export default async function ConstituencyPage({ params }: Props) {
  const { code } = await params;
  const c = await fetchConstituency(code);
  if (!c) notFound();

  const stateSlug = slug(c.stateName);
  const label = typeLabel(c.type);

  // Unknown gate (unreachable, nothing stale) hides election UI, same as off.
  const gate = (await getElectionGate()) ?? offGate();
  const showElection = isElectionEnabledFor(gate, { state: c.stateCode, constituency: code });

  const lgaLinks: RelatedLink[] = c.lgas.map((lga) => ({
    href: `/states/${stateSlug}/${slug(lga.name)}`,
    label: lga.name,
    sublabel: "Local Government",
  }));

  // Wards are grouped under the local government they belong to — a state or
  // federal constituency routinely straddles several LGAs, and a flat list of
  // 30+ ward names doesn't tell a citizen which part of the constituency they
  // are looking at. Insertion order follows `c.wards`, which the API sorts by
  // ward name, so each LGA's wards stay alphabetical.
  const wardsByLga = new Map<string, RelatedLink[]>();
  for (const w of c.wards) {
    const links = wardsByLga.get(w.lgaName) ?? [];
    links.push({
      href: `/states/${stateSlug}/${slug(w.lgaName)}/${wardSlug(w.name)}`,
      label: w.name,
    });
    wardsByLga.set(w.lgaName, links);
  }
  const wardGroups = [...wardsByLga.entries()].sort(([a], [b]) => a.localeCompare(b));
  const wardCount = c.wards.length;

  return (
    <PageLayout navLabel={c.name} className="bg-background" mainClassName="container max-w-5xl mx-auto px-4 pt-24 pb-20 space-y-16">
      {showElection && <ElectionSection scope="constituency" name={c.name} />}
      <StructuredData c={c} label={label} stateSlug={stateSlug} />
        <BackButton
          fallbackHref={`/states/${stateSlug}`}
          fallbackLabel={`${c.stateName} State`}
          className="mb-8"
        />

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
          <Show when={c.representatives.length > 0}>
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
          </Show>
          <Show when={c.representatives.length === 0}>
            <div className="rounded-[10px] border border-border bg-muted/30 px-5 py-4 flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground shrink-0" />
              <p className="font-sans text-sm text-muted-foreground">
                We don&apos;t have the current representative for this constituency yet.
              </p>
            </div>
          </Show>
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
        <Show when={lgaLinks.length === 0 && wardCount === 0}>
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
        </Show>
        <Show when={!(lgaLinks.length === 0 && wardCount === 0)}>
          <div className="space-y-16">
            <RelatedLinks title="Local Governments in this constituency" items={lgaLinks} />
            {wardGroups.map(([lgaName, links]) => (
              <RelatedLinks
                key={lgaName}
                title={
                  wardGroups.length > 1
                    ? `Wards in this constituency — ${lgaName} LGA`
                    : "Wards in this constituency"
                }
                items={links}
              />
            ))}
          </div>
        </Show>
    </PageLayout>
  );
}
