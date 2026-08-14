import Link from "next/link";
import { User } from "lucide-react";
import { OfficialAvatar } from "@/components/ui/OfficialAvatar";
import { Show } from "@/components/ui/Show";
import type { PartyOfficialMini } from "@/lib/api";

export function OfficialMiniCard({
  person,
  color,
}: {
  readonly person: PartyOfficialMini;
  readonly color: string;
}) {
  return (
    <Link
      href={`/officials/${person.slug ?? person.id}`}
      className="flex items-center gap-3 rounded-[10px] border border-border bg-card p-3 transition-all hover:border-emerald-400 hover:shadow-sm"
      style={{ borderLeftWidth: "3px", borderLeftColor: color }}
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
        <OfficialAvatar
          src={person.imageUrl}
          alt={person.name}
          px={44}
          imgClassName="w-11 h-11 rounded-full object-cover"
          fallback={<User className="h-5 w-5 text-slate-400" />}
        />
      </div>
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{person.name}</div>
        <Show when={!!person.contextLabel}>
          <div className="truncate text-xs text-muted-foreground">{person.contextLabel}</div>
        </Show>
      </div>
    </Link>
  );
}
