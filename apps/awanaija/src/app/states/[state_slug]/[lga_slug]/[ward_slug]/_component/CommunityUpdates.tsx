import { MessageSquare } from "lucide-react";

export function CommunityUpdates({ updates }: { updates: any[] }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold">
          Community Updates
        </h2>
      </div>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {updates.map((update: any, i: number) => (
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
  );
}
