import { ImportsClient } from "./ImportsClient";

export default function ImportsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Data imports</h1>
        <p className="text-sm text-muted-foreground">
          Upload a curated dataset, preview the diff, then apply it through the
          audited enrichment pipeline.
        </p>
      </div>
      <ImportsClient />
    </div>
  );
}
