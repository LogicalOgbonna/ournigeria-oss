"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RunProgress } from "@/components/ingestion/run-progress";

export default function RunProgressPage() {
  const params = useParams();
  const runId = params.runId as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/dashboard/ingestion">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Run {runId.slice(0, 8)}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Live ingestion progress</p>
        </div>
      </div>

      <RunProgress runId={runId} />
    </div>
  );
}
