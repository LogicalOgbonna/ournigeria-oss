import { ChevronRight } from "lucide-react";
import { Show } from "@/components/ui/Show";

type Props = {
  contact: any;
};

export function ContactAccountability({ contact }: Props) {
  if (!contact || !Object.values(contact).some(Boolean)) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-heading">
        Contact & Accountability
      </h3>
      <div className="bg-card border border-border rounded-[10px] divide-y divide-border text-sm">
        <Show when={!!contact.address}>
          <p className="p-4 font-sans text-muted-foreground">{contact.address}</p>
        </Show>
        <Show when={!!contact.phone}>
          <a href={`tel:${contact.phone}`} className="p-4 flex items-center justify-between hover:bg-muted/50">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-mono text-foreground">{contact.phone}</span>
          </a>
        </Show>
        <Show when={!!contact.email}>
          <a href={`mailto:${contact.email}`} className="p-4 flex items-center justify-between hover:bg-muted/50">
            <span className="text-muted-foreground">Email</span>
            <span className="font-mono text-emerald-600 truncate ml-2">{contact.email}</span>
          </a>
        </Show>
        <Show when={!!contact.complaintPortal}>
          <a href={contact.complaintPortal} target="_blank" rel="noopener noreferrer" className="p-4 flex items-center justify-between hover:bg-muted/50">
            <span className="text-muted-foreground">Citizen Complaints</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </a>
        </Show>
        <Show when={!!contact.whistleblower}>
          <a href={contact.whistleblower} target="_blank" rel="noopener noreferrer" className="p-4 flex items-center justify-between hover:bg-muted/50">
            <span className="text-muted-foreground">Report Corruption</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </a>
        </Show>
      </div>
    </div>
  );
}
