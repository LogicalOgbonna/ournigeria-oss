export function ContactPill({
  icon,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="text-emerald-400 shrink-0">{icon}</span>
      <span className="truncate">{value}</span>
    </>
  );

  const cls =
    "inline-flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 rounded-full px-4 py-2 text-[13px] text-slate-600 dark:text-slate-300 transition-all hover:bg-emerald-400/[0.08] hover:border-emerald-400/25 max-w-full";

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={cls}
      >
        {inner}
      </a>
    );
  }
  return <span className={cls}>{inner}</span>;
}
