import { Construction } from "lucide-react";

export function WardProjects({ wardName }: { wardName: string }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold">
          Projects in {wardName}
        </h2>
      </div>

      <div className="rounded-[10px] border border-border bg-muted/30 px-5 py-4 flex items-center gap-3">
        <Construction className="w-5 h-5 text-muted-foreground shrink-0" />
        <p className="font-sans text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Coming soon.</span>{" "}
          We&apos;re aggregating and verifying contract data, project locations, and implementation statuses for {wardName}.
        </p>
      </div>
    </section>
  );
}
