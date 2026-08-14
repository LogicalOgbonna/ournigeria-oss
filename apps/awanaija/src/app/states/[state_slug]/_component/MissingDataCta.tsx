import { Activity } from "lucide-react";
import { ReportDataIssueButton } from "@/components/civic/ReportDataIssueButton";

type Props = {
  stateName: string;
};

export function MissingDataCta({ stateName }: Props) {
  return (
    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-[10px] p-5 space-y-3">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <Activity className="w-5 h-5" />
        <h3 className="font-heading font-semibold">Missing Data?</h3>
      </div>
      <p className="font-sans text-sm text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed">
        We rely on public records and citizen reports. If you have verified data about projects or spending in {stateName}, help us update the records.
      </p>
      <ReportDataIssueButton />
    </div>
  );
}
