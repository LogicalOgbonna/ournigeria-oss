import { Metadata } from "next";
import Link from "next/link";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { ArrowLeft, ChevronRight, Users, MapPin, TrendingUp, Landmark, Activity, FileText, Info, Construction } from "lucide-react";
import { Suspense } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { StateOfficialsAccordion } from "@/components/civic/StateOfficialsAccordion";
import { StateEconomyFilter } from "@/components/civic/StateEconomyFilter";
import { notFound } from "next/navigation";
import { getStateDetails } from "@/lib/api";

export const revalidate = 60; // Revalidate every 60 seconds

type Props = {
  params: Promise<{ state_slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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
      canonical: `https://ournigeria.ng/states/${state_slug}`,
    },
    openGraph: {
      title: `${state.name} State - Budget, FAAC & Economy`,
      description: `Explore the budget, FAAC allocation, and IGR for ${state.name} State.`,
      url: `https://ournigeria.ng/states/${state_slug}`,
    }
  };
}

export default async function StatePage({
  params,
  searchParams,
}: Props) {
  const { state_slug } = await params;
  const resolvedSearchParams = await searchParams;
  const year = typeof resolvedSearchParams.year === 'string' ? resolvedSearchParams.year : undefined;
  const month = typeof resolvedSearchParams.month === 'string' ? resolvedSearchParams.month : undefined;

  let state;
  try {
    state = await getStateDetails(state_slug, year, month);
    if (state.error) {
      console.error("Error fetching state details:", state.error);
      notFound();
    }
  } catch (error) {
    console.error("Exception fetching state details:", error);
    notFound();
  }

  if (!state) {
    notFound();
  }

  const { governor, stats, economy, lgas } = state;
  const profile = state.profile ?? null;
  const sourceDocuments: { fileName: string; fiscalYear: number; path: string }[] =
    state.sourceDocuments ?? [];

  const igrCardTitle = (() => {
    const y = stats?.igrFiscalYear;
    const p = stats?.igrPeriod;
    if (y != null && p) {
      if (p === "FY") return `IGR (FY ${y})`;
      return `IGR (${p} ${y})`;
    }
    if (y != null) return `IGR (${y})`;
    return "IGR";
  })();
  const budgetBreakdown = state.budgetBreakdown || {
    total: "N/A",
    capital: { amount: "N/A", percentage: 0, color: "bg-emerald-500" },
    recurrent: { amount: "N/A", percentage: 0, color: "bg-amber-500" },
    explanation: "Budget breakdown data is currently unavailable."
  };
  const sectorFallback = [
    { name: "Infrastructure", amount: "N/A", color: "bg-[#d97706]", percentage: 0 },
    { name: "Education", amount: "N/A", color: "bg-[#059669]", percentage: 0 },
    { name: "Health", amount: "N/A", color: "bg-[#0891b2]", percentage: 0 },
  ];
  const sectors =
    state.sectors?.length > 0
      ? [...state.sectors]
          .sort((a: { percentage: number }, b: { percentage: number }) => b.percentage - a.percentage)
          .slice(0, 3)
      : sectorFallback;

  const news = [
    {
      title: `${state.name} signs ₦100B infrastructure bond for Red Line rail`,
      type: "project",
      date: "2 days ago",
    },
    {
      title: "EFCC investigates former commissioner over ₦2.5B contract",
      type: "corruption",
      date: "1 week ago",
    },
    {
      title: "New primary healthcare centers commissioned",
      type: "project",
      date: "2 weeks ago",
    },
  ];

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "name": `${state.name} State Government`,
    "url": `https://ournigeria.ng/states/${state_slug}`,
    ...(governor ? {
      "member": {
        "@type": "Person",
        "name": governor.name,
        "jobTitle": "Governor"
      }
    } : {}),
    ...(lgas && lgas.length > 0 ? {
      "subOrganization": lgas.map((lga: any) => ({
        "@type": "GovernmentOrganization",
        "name": `${lga.name} Local Government Area`,
        "url": `https://ournigeria.ng/states/${state_slug}/${lga.name.toLowerCase().replace(/\s+/g, '-')}`
      }))
    } : {})
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [] as any[]
  };

  if (governor) {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `Who is the current governor of ${state.name} State?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The current governor of ${state.name} State is ${governor.name}${governor.party ? ` of the ${governor.party}` : ''}.`
      }
    });
  }

  if (stats?.budget && stats.budget !== "N/A") {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `What is the approved budget for ${state.name} State${year ? ` in ${year}` : ''}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The approved budget for ${state.name} State is ${stats.budget}.`
      }
    });
  }

  if (stats?.faac && stats.faac !== "N/A") {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `How much FAAC allocation did ${state.name} State receive${year && month ? ` in ${months.find(m => m.value === month)?.label} ${year}` : year ? ` in ${year}` : ' recently'}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `${state.name} State received a FAAC allocation of ${stats.faac}${year && month ? ` in ${months.find(m => m.value === month)?.label} ${year}` : year ? ` in ${year}` : ''}.`
      }
    });
  }

  if (economy?.population && economy.population !== "N/A") {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `What is the estimated population of ${state.name} State?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The estimated population of ${state.name} State is ${economy.population}.`
      }
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd.mainEntity.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <Navbar />

      <main className="container max-w-6xl mx-auto px-4 pt-24 pb-20 flex-1">
        <Link
          href="/states"
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to States
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-16">
            {/* Hero Section */}
            <section className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    State Snapshot
                  </p>
                    <span className="font-sans text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-muted text-foreground">
                      {governor?.party || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {profile?.sealImageUrl && (
                      // Plain <img>: our-origin asset, avoids next/image SVG config.
                      <img
                        src={profile.sealImageUrl}
                        alt={`${state.name} State seal`}
                        className="w-16 h-16 object-contain shrink-0"
                      />
                    )}
                    <div>
                      <h1 className="font-serif text-5xl md:text-6xl text-foreground">
                        {state.name}
                      </h1>
                      {profile?.motto && (
                        <p className="font-sans text-sm italic text-muted-foreground mt-1">
                          &ldquo;{profile.motto}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Suspense fallback={<div className="h-10" />}>
                  <StateEconomyFilter
                    availableYears={state.availablePeriods?.years || []}
                    monthsByYear={state.availablePeriods?.monthsByYear || {}}
                  />
                </Suspense>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-[10px] p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        {year ? `${year} Approved Budget` : "Approved Budget"}
                      </p>
                    </div>
                    <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats?.budget || "N/A"}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-[10px] p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-emerald-500" />
                      <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        {year && month ? `FAAC Allocation (${months.find(m => m.value === month)?.label} ${year})` : year ? `FAAC Allocation (${year})` : "FAAC Allocation (12mo)"}
                      </p>
                    </div>
                    <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats?.faac || "N/A"}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-[10px] p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        {igrCardTitle}
                      </p>
                    </div>
                    <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats?.igr || "N/A"}
                    </p>
                  </div>
                </div>
                {profile?.about && (
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-2xl pt-2">
                    {profile.about}
                  </p>
                )}
            </section>

            {/* Budget Breakdown & Explanation */}
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-heading text-2xl font-semibold">
                  Budget Breakdown
                </h2>
                {sourceDocuments.length > 0 && (
                  <a
                    href={`/api/sources/download?path=${encodeURIComponent(sourceDocuments[0].path)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Source budget ({sourceDocuments[0].fiscalYear})
                  </a>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visualization Card */}
                <div className="bg-card border border-border rounded-[10px] p-6 space-y-6">
                  <div className="space-y-1">
                    <p className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Capital vs Recurrent
                    </p>
                    <p className="font-mono text-3xl font-bold text-foreground">
                      {budgetBreakdown.total}
                    </p>
                  </div>

                  {/* Stacked Bar */}
                  <div className="h-8 w-full flex rounded-full overflow-hidden">
                    <div className={`${budgetBreakdown.capital.color} h-full transition-all`} style={{ width: `${budgetBreakdown.capital.percentage}%` }} />
                    <div className={`${budgetBreakdown.recurrent.color} h-full transition-all`} style={{ width: `${budgetBreakdown.recurrent.percentage}%` }} />
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${budgetBreakdown.capital.color}`} />
                        <span className="font-sans text-sm font-medium">Capital</span>
                      </div>
                      <p className="font-mono text-lg font-semibold">{budgetBreakdown.capital.amount}</p>
                      <p className="font-sans text-xs text-muted-foreground">{budgetBreakdown.capital.percentage}% of total</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${budgetBreakdown.recurrent.color}`} />
                        <span className="font-sans text-sm font-medium">Recurrent</span>
                      </div>
                      <p className="font-mono text-lg font-semibold">{budgetBreakdown.recurrent.amount}</p>
                      <p className="font-sans text-xs text-muted-foreground">{budgetBreakdown.recurrent.percentage}% of total</p>
                    </div>
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-[10px] p-6 flex flex-col justify-center space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Info className="w-5 h-5" />
                    <h3 className="font-heading font-semibold">Wetin this mean?</h3>
                  </div>
                  <p className="font-sans text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed">
                    {budgetBreakdown.explanation}
                  </p>
                </div>
              </div>
            </section>

            {/* Financial Overview */}
            <section className="space-y-6">
              <h2 className="font-heading text-2xl font-semibold">
                Sector Allocation
              </h2>
              <div className="bg-card border border-border rounded-[10px] p-6 space-y-6">
                <p className="font-sans text-sm text-muted-foreground">
                  Top COFOG function groups by approved expenditure in the{" "}
                  {year ? `${year} Approved Budget` : "Approved Budget"}
                </p>
                  <div className="space-y-4">
                    {sectors.map((sector: { name: string; amount: string; color: string; percentage: number }, i: number) => (
                      <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="font-sans font-medium">{sector.name}</span>
                        <span className="font-mono font-semibold">
                          {sector.amount}
                        </span>
                      </div>
                      {/* Progress bar visual */}
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${sector.color} rounded-full`}
                          style={{
                            width: `${sector.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Local Governments */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-semibold">
                  Local Governments
                </h2>
                <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                  {state.lgas.length} LGAs
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto scrollbar-theme pr-2 pb-2">
                {state.lgas.map((lga: { name: string; faac: string }, i: number) => {
                  const lgaUrl = year && month
                    ? `/states/${state_slug}/${lga.name.toLowerCase().replace(/\s+/g, '-')}?year=${year}&month=${month}`
                    : `/states/${state_slug}/${lga.name.toLowerCase().replace(/\s+/g, '-')}`;
                  
                  return (
                  <Link
                    href={lgaUrl}
                    key={i}
                    className="group bg-card border border-border hover:border-emerald-500/50 transition-colors rounded-[10px] p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-heading text-lg font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {lga.name}
                      </h3>
                      <p className="font-sans text-xs text-muted-foreground">
                        FAAC: <span className="font-mono">{lga.faac}</span>
                      </p>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </section>

            {/* Latest Information */}
            <section className="space-y-6">
              <h2 className="font-heading text-2xl font-semibold">
                Latest Updates
              </h2>
              
              <div className="relative overflow-hidden rounded-[10px] border border-border bg-card">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
                     style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                </div>
                
                <div className="relative p-8 md:p-12 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                    <Construction className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  
                  <h3 className="font-heading text-xl md:text-2xl font-semibold text-foreground">
                    State Updates Coming Soon
                  </h3>
                  
                  <p className="text-muted-foreground max-w-md mx-auto font-sans leading-relaxed">
                    We are currently aggregating and verifying news, project updates, and civic reports for {state.name}. Keep an eye on the site banners for updates on when this feature goes live.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 shrink-0 space-y-12">
            {/* Who Governs You? */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-heading">
                  Who Governs You?
                </h3>
                <Link href="/officials" className="text-xs text-emerald-600 hover:underline">
                  See all →
                </Link>
              </div>

              <div className="space-y-4">
                {/* Governor Card */}
                <Link 
                  href={`/officials/${governor?.slug ?? governor?.id ?? 'unknown'}`}
                  className="bg-card border border-border rounded-[10px] p-4 flex items-start gap-3 group hover:border-emerald-500/50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                    <OfficialAvatar
                      src={governor?.image}
                      alt={governor?.name ?? "Governor"}
                      px={48}
                      imgClassName="w-full h-full object-cover"
                      fallback={<Users className="w-6 h-6 text-muted-foreground" />}
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Governor
                    </p>
                    <h3 className="font-heading text-base font-semibold leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {governor?.name || "Information Unavailable"}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
                        {governor?.party || "N/A"}
                      </span>
                      <span>•</span>
                      <span>{governor?.term || "N/A"}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
                </Link>

                <StateOfficialsAccordion 
                  stateCode={state.code} 
                  stats={stats} 
                  officials={state.officials} 
                />
              </div>
            </div>

            {/* Official Resources */}
            {profile?.links &&
              Object.values(profile.links).some(Boolean) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-heading">
                    Official Resources
                  </h3>
                  <div className="bg-card border border-border rounded-[10px] divide-y divide-border">
                    {[
                      { label: "State Government", href: profile.links.official },
                      { label: "Ministry of Finance", href: profile.links.financeMinistry },
                      { label: "House of Assembly", href: profile.links.assembly },
                      { label: "INEC (Electoral)", href: profile.links.inec },
                    ]
                      .filter((l) => l.href)
                      .map((l) => (
                        <a
                          key={l.label}
                          href={l.href as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 flex items-center justify-between group hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-sans text-sm text-foreground">{l.label}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        </a>
                      ))}
                  </div>
                </div>
              )}

            {/* Contact & Accountability */}
            {profile?.contact &&
              Object.values(profile.contact).some(Boolean) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-heading">
                    Contact & Accountability
                  </h3>
                  <div className="bg-card border border-border rounded-[10px] divide-y divide-border text-sm">
                    {profile.contact.address && (
                      <p className="p-4 font-sans text-muted-foreground">{profile.contact.address}</p>
                    )}
                    {profile.contact.phone && (
                      <a href={`tel:${profile.contact.phone}`} className="p-4 flex items-center justify-between hover:bg-muted/50">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-mono text-foreground">{profile.contact.phone}</span>
                      </a>
                    )}
                    {profile.contact.email && (
                      <a href={`mailto:${profile.contact.email}`} className="p-4 flex items-center justify-between hover:bg-muted/50">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-mono text-emerald-600 truncate ml-2">{profile.contact.email}</span>
                      </a>
                    )}
                    {profile.contact.complaintPortal && (
                      <a href={profile.contact.complaintPortal} target="_blank" rel="noopener noreferrer" className="p-4 flex items-center justify-between hover:bg-muted/50">
                        <span className="text-muted-foreground">Citizen Complaints</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                    {profile.contact.whistleblower && (
                      <a href={profile.contact.whistleblower} target="_blank" rel="noopener noreferrer" className="p-4 flex items-center justify-between hover:bg-muted/50">
                        <span className="text-muted-foreground">Report Corruption</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              )}

            {/* Official Socials */}
            {profile?.socials &&
              Object.values(profile.socials).some(Boolean) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-heading">
                    Official Channels
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "X", href: profile.socials.twitter },
                      { label: "Facebook", href: profile.socials.facebook },
                      { label: "Instagram", href: profile.socials.instagram },
                      { label: "YouTube", href: profile.socials.youtube },
                      { label: "News", href: profile.socials.news },
                    ]
                      .filter((s) => s.href)
                      .map((s) => (
                        <a
                          key={s.label}
                          href={s.href as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-md border border-border bg-card text-xs font-sans hover:border-emerald-500/50 hover:text-emerald-600 transition-colors"
                        >
                          {s.label}
                        </a>
                      ))}
                  </div>
                </div>
              )}

            {/* State Economy & Demographics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-heading">
                  State Stats {year && `(${year})`}
                </h3>
              </div>

              <div className="bg-card border border-border rounded-[10px] divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <span className="font-sans text-sm text-muted-foreground">Created</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{profile?.dateCreated || "N/A"}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="font-sans text-sm text-muted-foreground">Land Area</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{profile?.landAreaSqKm ? `${profile.landAreaSqKm.toLocaleString()} km²` : "N/A"}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="font-sans text-sm text-muted-foreground">LGAs</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{state.lgas.length}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="font-sans text-sm text-muted-foreground">Est. Population</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{economy?.population || "N/A"}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="font-sans text-sm text-muted-foreground">GDP</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{economy?.gdp || "N/A"}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="font-sans text-sm text-muted-foreground">Domestic Debt</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{economy?.domesticDebt || "N/A"}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="font-sans text-sm text-muted-foreground">External Debt</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{economy?.externalDebt || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Transparency Score / Call to Action */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-[10px] p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Activity className="w-5 h-5" />
                <h3 className="font-heading font-semibold">Missing Data?</h3>
              </div>
              <p className="font-sans text-sm text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed">
                We rely on public records and citizen reports. If you have verified data about projects or spending in {state.name}, help us update the records.
              </p>
              <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-sm transition-colors mt-2">
                Submit Information
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
