import { Construction } from "lucide-react";

type Props = {
  stateName: string;
};

export function LatestUpdates({ stateName }: Props) {
  return (
    <section className="space-y-6">
      <h2 className="font-heading text-2xl font-semibold">
        Latest Updates
      </h2>

      <div className="rounded-[10px] border border-border bg-muted/30 px-5 py-4 flex items-center gap-3">
        <Construction className="w-5 h-5 text-muted-foreground shrink-0" />
        <p className="font-sans text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Coming soon.</span>{" "}
          We&apos;re aggregating and verifying news, project updates, and civic reports for {stateName}.
        </p>
      </div>
    </section>
  );
}
