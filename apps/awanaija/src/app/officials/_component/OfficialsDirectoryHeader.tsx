export function OfficialsDirectoryHeader({ total }: { total: number }) {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-1">
        Nigerian Officials
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        {total.toLocaleString()} officials across all levels of government.
        Help complete their profiles.
      </p>
    </>
  );
}
