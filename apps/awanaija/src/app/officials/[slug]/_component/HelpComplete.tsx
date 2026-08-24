import Link from "next/link";
import { Plus } from "lucide-react";
import { FIELD_LABELS } from "./constants";

export function HelpComplete({
  officialId,
  missingFields,
}: {
  officialId: string;
  missingFields: string[];
}) {
  return (
    <section className="mb-9">
      <h2 className="font-heading text-base font-semibold text-slate-900 dark:text-white mb-4">
        Help Complete This Profile
      </h2>
      <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
        {missingFields.map((field) => (
          <Link
            key={field}
            href={`/proposals/new?officialId=${officialId}&targetField=${field}`}
            className="flex items-center gap-2.5 border border-dashed border-emerald-400/40 rounded-xl px-4 py-4 transition-all hover:bg-emerald-400/[0.06] hover:border-emerald-400/70 group"
          >
            <Plus className="w-[18px] h-[18px] text-emerald-400 shrink-0" />
            <span className="text-[13px] text-emerald-400">
              Add {FIELD_LABELS[field] || field}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
