import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronRight, MapPin, AlertCircle, CheckCircle2, Clock, Users, Activity, Construction } from "lucide-react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { LgaOfficialsAccordion } from "@/components/civic/LgaOfficialsAccordion";
import { StateEconomyFilter } from "@/components/civic/StateEconomyFilter";
import { notFound } from "next/navigation";
import { getLgaDetails, getFaacPeriods } from "@/lib/api";

export default async function LgaPage({
  params,
  searchParams,
}: {
  params: Promise<{ state_slug: string; lga_slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
  
  let lga;
  try {
    lga = await getLgaDetails(resolvedParams.state_slug, resolvedParams.lga_slug, year, month);
    if (lga.error) {
      console.error("Error fetching LGA details:", lga.error);
      notFound();
    }
  } catch (error) {
    console.error("Exception fetching LGA details:", error);
    notFound();
  }

  if (!lga) {
    notFound();
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
        href={`/officials/${official.id}`}
        className="bg-card border border-border rounded-[10px] p-4 flex items-start gap-3 group hover:border-emerald-500/50 transition-colors cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
          {official.image ? (
            <Image src={official.image} alt={official.name} fill className="object-cover" sizes="48px" />
          ) : (
            <Users className="w-6 h-6 text-muted-foreground" />
          )}
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                    Project Tracking Coming Soon
                  </h3>
                  
                  <p className="text-muted-foreground max-w-md mx-auto font-sans leading-relaxed">
                    We are currently aggregating and verifying contract data, project locations, and implementation statuses for {lgaName}. Keep an eye on the site banners for updates on when this feature goes live.
                  </p>
                </div>
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
                <div className="bg-card border border-border rounded-[10px] p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      LGA Chairman
                    </p>
                    <h3 className="font-heading text-base font-semibold leading-tight text-muted-foreground">
                      Information Unavailable
                    </h3>
                  </div>
                </div>
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
