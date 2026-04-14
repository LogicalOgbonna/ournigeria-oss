import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronRight, MapPin, AlertCircle, CheckCircle2, Clock, Users, Activity } from "lucide-react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { LgaOfficialsAccordion } from "@/components/civic/LgaOfficialsAccordion";
import { notFound } from "next/navigation";
import { getLgaDetails } from "@/lib/api";

export default async function LgaPage({
  params,
}: {
  params: Promise<{ state_slug: string; lga_slug: string }>;
}) {
  const resolvedParams = await params;
  
  let lga;
  try {
    lga = await getLgaDetails(resolvedParams.state_slug, resolvedParams.lga_slug);
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

  const { stateName, name: lgaName, chairman, councilors, stats, wards } = lga;

  const displayStats = [
    { label: "2024 FAAC Allocation", value: stats?.faac || "N/A" },
    { label: "Internally Generated Rev", value: stats?.igr || "N/A" },
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
                <Link href="#" className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                  View all projects
                </Link>
              </div>
              <div className="space-y-4">
                {projects.map((project, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-[10px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {getStatusIcon(project.status)}
                          <span className="capitalize">{project.status}</span>
                        </span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {project.ward} Ward
                        </span>
                      </div>
                      <h3 className="font-sans text-base font-medium leading-snug">
                        {project.title}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-lg font-bold text-foreground">
                        {project.amount}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Contract Amount
                      </p>
                    </div>
                  </div>
                ))}
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
                    href={`/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}/${ward.name.toLowerCase().replace(/\s+/g, '-')}`}
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
              <Link 
                href={`/officials/${chairman?.id || 'unknown'}`}
                className="bg-card border border-border rounded-[10px] p-4 flex items-start gap-3 group hover:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                  {chairman?.image ? (
                    <Image src={chairman.image} alt={chairman.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <Users className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <p className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    LGA Chairman
                  </p>
                  <h3 className="font-heading text-base font-semibold leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {chairman?.name || "Information Unavailable"}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
                      {chairman?.party || "N/A"}
                    </span>
                    {chairman?.term && (
                      <>
                        <span>•</span>
                        <span>{chairman.term}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
              </Link>

              {/* Legislature Summary */}
              <LgaOfficialsAccordion councilors={councilors || []} wardCount={wards.length} />
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
