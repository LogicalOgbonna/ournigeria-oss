import Link from "next/link";
import { User } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { Show } from "@/components/ui/Show";

export function WhoIsResponsible({ ward }: { ward: any }) {
  const { stateName, lgaName, name: wardName, councilor, code: wardCode, stateCode, lgaCode } = ward;

  return (
    <section className="space-y-6">
      <h2 className="font-heading text-2xl font-semibold">
        Who is Responsible?
      </h2>
      {councilor ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href={`/officials/${councilor.slug ?? councilor.id}`} className="bg-card border border-border rounded-[14px] p-6 flex flex-col sm:flex-row items-start gap-4 hover:border-emerald-500/50 transition-colors group cursor-pointer block">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              <OfficialAvatar
                src={councilor.image}
                alt={councilor.name}
                px={64}
                imgClassName="w-full h-full object-cover"
                fallback={<User className="w-8 h-8 text-muted-foreground" />}
              />
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
              <Show when={!!councilor.phone && councilor.phone !== "N/A"}>
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contact</span>
                  <span className="font-mono text-sm">{councilor.phone}</span>
                </div>
              </Show>
            </div>
          </Link>
        </div>
      ) : (
        <Link
          href={`/proposals/new?mode=identify&role=councilor&stateCode=${stateCode || ""}&lgaCode=${lgaCode || ""}&wardCode=${wardCode || ""}&wardName=${encodeURIComponent(wardName)}&lgaName=${encodeURIComponent(lgaName)}&stateName=${encodeURIComponent(stateName)}`}
          className="group bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-[14px] p-6 flex flex-col sm:flex-row items-start gap-4 hover:border-amber-400 dark:hover:border-amber-700 transition-colors"
        >
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
            <span className="inline-block px-4 py-2 bg-amber-600 group-hover:bg-amber-700 text-white rounded-md font-medium text-sm transition-colors">
              Identify Your Councilor →
            </span>
          </div>
        </Link>
      )}
    </section>
  );
}
