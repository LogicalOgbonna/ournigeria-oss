import type { ReactNode } from "react";

export function Pill({
  href,
  icon,
  label,
  external,
}: {
  readonly href: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-black/[0.03] px-4 py-2 text-[13px] text-slate-700 transition-colors hover:border-emerald-400 dark:border-slate-700 dark:bg-white/[0.05] dark:text-slate-300"
    >
      {icon}
      {label}
    </a>
  );
}
