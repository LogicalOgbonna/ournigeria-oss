import React from "react";
import Link from "next/link";
import { ArrowLeft, User, MapPin, AlertCircle, CheckCircle2, Clock, MessageSquare, Construction } from "lucide-react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { getWardDetails } from "@/lib/api";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function WardPage({
  params,
}: {
  params: Promise<{ state_slug: string; lga_slug: string; ward_slug: string }>;
}) {
  const resolvedParams = await params;
  
  let ward;
  try {
    ward = await getWardDetails(resolvedParams.state_slug, resolvedParams.lga_slug, resolvedParams.ward_slug);
    if (ward?.error) {
      notFound();
    }
  } catch (error) {
    notFound();
  }

  if (!ward) {
    notFound();
  }

  const { stateName, lgaName, name: wardName, councilor, code: wardCode, stateCode, lgaCode } = ward;
  
  const projects = ward.projects || [];
  const civicUpdates = ward.civicUpdates || [];

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

      <main className="container max-w-5xl mx-auto px-4 pt-24 pb-20 space-y-16 flex-1">
        <Link
          href={`/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}`}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {lgaName} LGA
        </Link>

        {/* Hero Section */}
        <section className="space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-sans text-muted-foreground flex-wrap">
              <Link href={`/states/${resolvedParams.state_slug}`} className="hover:text-foreground transition-colors">
                {stateName}
              </Link>
              <span>/</span>
              <Link href={`/states/${resolvedParams.state_slug}/${resolvedParams.lga_slug}`} className="hover:text-foreground transition-colors">
                {lgaName}
              </Link>
              <span>/</span>
              <span className="text-foreground">{wardName}</span>
            </div>
            <h1 className="font-serif text-5xl md:text-6xl text-foreground mt-4">
              {wardName} Ward
            </h1>
          </div>
        </section>

        {/* Who is Responsible? */}
        <section className="space-y-6">
          <h2 className="font-heading text-2xl font-semibold">
            Who is Responsible?
          </h2>
          {councilor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href={`/officials/${councilor.id}`} className="bg-card border border-border rounded-[14px] p-6 flex flex-col sm:flex-row items-start gap-4 hover:border-emerald-500/50 transition-colors group cursor-pointer block">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {councilor.image ? (
                    <img src={councilor.image} alt={councilor.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-3 flex-1 w-full">
                  <div className="space-y-1">
                    <p className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Ward Councilor
                    </p>
                    <h3 className="font-heading text-xl font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {councilor.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm font-sans text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted text-foreground font-medium">
                        {councilor.party}
                      </span>
                    </div>
                  </div>
                  {councilor.phone && councilor.phone !== "N/A" && (
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Contact</span>
                      <span className="font-mono text-sm">{councilor.phone}</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-[14px] p-6 flex flex-col sm:flex-row items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="space-y-1">
                  <p className="font-heading text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                    Ward Councilor
                  </p>
                  <h3 className="font-heading text-xl font-semibold text-foreground">
                    Councilor details unavailable
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    We don&apos;t have information on who represents {wardName} Ward in the local council yet. If you know the councilor for this ward, help us identify them so citizens can hold their representatives accountable.
                  </p>
                </div>
                <Link
                  href={`/proposals/new?mode=identify&role=councilor&stateCode=${stateCode || ""}&lgaCode=${lgaCode || ""}&wardCode=${wardCode || ""}&wardName=${encodeURIComponent(wardName)}&lgaName=${encodeURIComponent(lgaName)}&stateName=${encodeURIComponent(stateName)}`}
                  className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium text-sm transition-colors"
                >
                  Identify Your Councilor
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Hyper-Local Projects */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-semibold">
              Projects in {wardName}
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
                We are currently aggregating and verifying contract data, project locations, and implementation statuses for {wardName}. Keep an eye on the site banners for updates on when this feature goes live.
              </p>
            </div>
          </div>
        </section>

        {/* Civic Updates / News Feed */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-semibold">
              Community Updates
            </h2>
          </div>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {civicUpdates.map((update: any, i: number) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Timeline dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                </div>
                
                {/* Content Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border rounded-[10px] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {update.author}
                    </span>
                    <span className="font-sans text-xs text-muted-foreground">
                      {update.date}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold leading-snug">
                    {update.title}
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                    {update.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
