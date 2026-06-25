import { Metadata } from "next";
import React, { Suspense } from "react";
import Link from "next/link";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { ArrowLeft, ChevronRight, MapPin, AlertCircle, CheckCircle2, Clock, Users, Activity, Construction } from "lucide-react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { LgaOfficialsAccordion } from "@/components/civic/LgaOfficialsAccordion";
import { StateEconomyFilter } from "@/components/civic/StateEconomyFilter";
import { ReportDataIssueButton } from "@/components/civic/ReportDataIssueButton";
import { notFound, permanentRedirect } from "next/navigation";
import { getLgaDetails, getFaacPeriods, ApiError } from "@/lib/api";
import { ldJson, breadcrumbLd } from "@/lib/seo";

type Props = {
  params: Promise<{ state_slug: string; lga_slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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

export default async function LgaPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const year = typeof resolvedSearchParams.year === 'string' ? resolvedSearchParams.year : undefined;
  const month = typeof resolvedSearchParams.month === 'string' ? resolvedSearchParams.month : undefined;

  let faacPeriods: { years: number[]; monthsByYear: Record<number, number[]> } = { years: [], monthsByYear: {} };
  try {
    faacPeriods = await getFaacPeriods();
  } catch (err) {
    console.error("Failed to load FAAC periods:", err);
  }
  
  let lga = null;
  try {
    lga = await getLgaDetails(resolvedParams.state_slug, resolvedParams.lga_slug, year, month);
  } catch (error) {
    // 404 = LGA orphaned by the resync → fall through to the state redirect below. Other
    // errors (5xx / network) keep the prior not-found behavior.
    if (!(error instanceof ApiError && error.status === 404)) {
      console.error("Exception fetching LGA details:", error);
      notFound();
    }
  }

  // LGA missing / not found → 308 to the parent state page. permanentRedirect MUST be
  // outside the try/catch (it throws, which the catch would swallow).
  if (!lga || lga.error) {
    permanentRedirect(`/states/${resolvedParams.state_slug}`);
  }

  const { stateName, name: lgaName, chairman, senator, houseMembers, stateAssemblyMembers, councilors, stats, wards } = lga;

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

  const displayStats = [
    { label: year && month ? `FAAC Allocation (${months.find(m => m.value === month)?.label} ${year})` : year ? `FAAC Allocation (${year})` : "FAAC Allocation (12mo)", value: stats?.faac || "N/A" },
    { label: "Internally Generated Revenue", value: stats?.igr || "N/A" },
    { label: "Est. Population", value: stats?.population || "N/A" },
  ];

  // Dummy projects for now until we have project tracking
  const projects = [
    {
      title: "Construction of Primary Healthcare Center, Opebi",
      amount: "₦150.5M",
      status: "ongoing",
      ward: "Opebi",
    },
    {
      title: "Rehabilitation of Allen Avenue Road",
      amount: "₦850.2M",
      status: "completed",
      ward: "Allen",
    },
    {
      title: "Procurement of 5 Waste Management Trucks",
      amount: "₦220.0M",
      status: "abandoned",
      ward: "Multiple",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "ongoing":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "abandoned":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "ongoing":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "abandoned":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const renderOfficialCard = (official: any, roleLabel: string, subLabel?: string) => {
    if (!official) return null;
    return (
      <Link 
        key={official.id}
        href={`/officials/${official.slug ?? official.id}`}
        className="bg-card border border-border rounded-[10px] p-4 flex items-start gap-3 group hover:border-emerald-500/50 transition-colors cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
          <OfficialAvatar
            src={official.image}
            alt={official.name}
            px={48}
            imgClassName="w-full h-full object-cover"
            fallback={<Users className="w-6 h-6 text-muted-foreground" />}
          />
        </div>
        <div className="space-y-1 flex-1">
          <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {roleLabel}
          </p>
          <h3 className="font-heading text-base font-semibold leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {official.name || "Information Unavailable"}
          </h3>
          <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
              {official.party || "N/A"}
            </span>
            {subLabel && (
              <>
                <span>•</span>
                <span className="truncate max-w-[120px]" title={subLabel}>{subLabel}</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
      </Link>
    );
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    "name": `${lga.name} Local Government Area`,
    "url": `https://ournigeria.ng/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}`,
    "parentOrganization": {
      "@type": "GovernmentOrganization",
      "name": `${stateName} State Government`,
      "url": `https://ournigeria.ng/states/${resolvedParams.state_slug}`
    },
    ...(chairman ? {
      "member": {
        "@type": "Person",
        "name": chairman.name,
        "jobTitle": "LGA Chairman"
      }
    } : {}),
    ...(wards && wards.length > 0 ? {
      "subOrganization": wards.map((ward: any) => ({
        "@type": "GovernmentOrganization",
        "name": `${ward.name} Ward`,
        "url": `https://ournigeria.ng/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}/${ward.name.toLowerCase().split('/')[0].replace(/\s+/g, '-')}`
      }))
    } : {})
  };

  const breadcrumbJsonLd = breadcrumbLd([
    { name: "Home", item: "https://ournigeria.ng" },
    { name: "States", item: "https://ournigeria.ng/states" },
    { name: `${stateName} State`, item: `https://ournigeria.ng/states/${resolvedParams.state_slug}` },
    { name: `${lgaName} LGA`, item: `https://ournigeria.ng/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}` },
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [] as any[]
  };

  if (chairman) {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `Who is the current chairman of ${lga.name} LGA?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The current chairman of ${lga.name} Local Government Area is ${chairman.name}${chairman.party ? ` of the ${chairman.party}` : ''}.`
      }
    });
  }

  if (stats?.faac && stats.faac !== "N/A") {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `How much FAAC allocation did ${lga.name} LGA receive${year && month ? ` in ${months.find(m => m.value === month)?.label} ${year}` : year ? ` in ${year}` : ' recently'}?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `${lga.name} Local Government Area received a FAAC allocation of ${stats.faac}${year && month ? ` in ${months.find(m => m.value === month)?.label} ${year}` : year ? ` in ${year}` : ''}.`
      }
    });
  }

  if (stats?.population && stats.population !== "N/A") {
    faqJsonLd.mainEntity.push({
      "@type": "Question",
      "name": `What is the estimated population of ${lga.name} LGA?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `The estimated population of ${lga.name} Local Government Area is ${stats.population}.`
      }
    });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(jsonLd) }}
      />
      {faqJsonLd.mainEntity.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson(faqJsonLd) }}
        />
      )}
      <Navbar />

      <main className="container max-w-6xl mx-auto px-4 pt-24 pb-20 flex-1">
        <Link
          href={`/states/${resolvedParams.state_slug}`}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {stateName}
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-16">
            {/* Hero Section */}
            <section className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-sans text-muted-foreground">
                  <Link href={`/states/${resolvedParams.state_slug}`} className="hover:text-foreground transition-colors">
                    {stateName}
                  </Link>
                  <span>/</span>
                  <span className="text-foreground">{lgaName}</span>
                </div>
                <h1 className="font-serif text-5xl md:text-6xl text-foreground mt-4">
                  {lgaName} LGA
                </h1>
              </div>

              <Suspense fallback={<div className="h-10" />}>
                <StateEconomyFilter
                  availableYears={faacPeriods.years}
                  monthsByYear={faacPeriods.monthsByYear}
                />
              </Suspense>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {displayStats.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-[10px] p-6 space-y-2"
                  >
                    <p className="font-sans text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="font-mono text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Projects & Tracking */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-semibold">
                  Projects & Tracking
                </h2>
              </div>
              
              <div className="rounded-[10px] border border-border bg-muted/30 px-5 py-4 flex items-center gap-3">
                <Construction className="w-5 h-5 text-muted-foreground shrink-0" />
                <p className="font-sans text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Coming soon.</span>{" "}
                  We&apos;re aggregating and verifying contract data, project locations, and implementation statuses for {lgaName}.
                </p>
              </div>
            </section>

            {/* Wards Directory */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-semibold">
                  Wards in {lgaName}
                </h2>
                <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                  {wards.length} Wards
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {wards.map((ward: { name: string }, i: number) => (
                  <Link
                    href={`/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}/${ward.name.toLowerCase().split('/')[0].replace(/\s+/g, '-')}`}
                    key={i}
                    className="group bg-card border border-border hover:border-emerald-500/50 transition-colors rounded-[8px] p-4 flex items-center justify-between"
                  >
                    <span className="font-sans font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {ward.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 shrink-0 space-y-8">
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

              {/* Chairman Card */}
              {chairman ? renderOfficialCard(chairman, "LGA Chairman", chairman.term) : (
                <Link
                  href={`/proposals/new?role=lga_chairman&stateCode=${lga.stateCode || ""}&lgaCode=${lga.code}&stateName=${encodeURIComponent(stateName)}&lgaName=${encodeURIComponent(lgaName)}`}
                  className="block bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-[10px] p-4 flex items-start gap-3 group hover:border-amber-400 dark:hover:border-amber-700 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="font-heading text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                      LGA Chairman
                    </p>
                    <h3 className="font-heading text-base font-semibold leading-tight text-foreground">
                      Help identify this person
                    </h3>
                    <p className="font-sans text-xs text-amber-700 dark:text-amber-400 font-medium">
                      We don&apos;t know who holds this seat yet →
                    </p>
                  </div>
                </Link>
              )}

              {/* Senator */}
              {senator && renderOfficialCard(senator, "Senator", senator.constituency)}

              {/* House of Reps */}
              {houseMembers?.map((member: any) => 
                renderOfficialCard(member, "House of Reps", member.constituency)
              )}

              {/* State Assembly */}
              {stateAssemblyMembers?.map((member: any) => 
                renderOfficialCard(member, "State Assembly", member.constituency)
              )}

              {/* Legislature Summary */}
              <LgaOfficialsAccordion 
                councilors={councilors || []} 
                wardCount={wards.length} 
                wards={wards || []} 
                lgaCode={lga.code} 
                lgaName={lgaName}
                stateCode={lga.stateCode || ""}
                stateName={stateName}
              />
            </div>

            {/* Transparency Score / Call to Action */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-[10px] p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Activity className="w-5 h-5" />
                <h3 className="font-heading font-semibold">Missing Data?</h3>
              </div>
              <p className="font-sans text-sm text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed">
                We rely on public records and citizen reports. If you have verified data about projects or spending in {lgaName}, help us update the records.
              </p>
              <ReportDataIssueButton />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
