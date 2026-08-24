export function ProfileTextSection({ label, text }: { label: string; text: string }) {
  return (
    <section className="mb-9">
      <div className="border-l-[3px] border-emerald-400 pl-5">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-emerald-400 mb-2.5">
          {label}
        </div>
        <p className="font-sans text-[15px] text-slate-600 dark:text-slate-300 leading-[1.65]">
          {text}
        </p>
      </div>
    </section>
  );
}
