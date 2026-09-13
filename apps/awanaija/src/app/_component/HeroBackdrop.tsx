/**
 * The hero's gradient wash and three drifting orbs — Figma `132:1516` plus the
 * `Overlay+Blur` circles at 320² / 288² / 448². Positions are the Figma
 * coordinates expressed as percentages of the 1920×1200 backdrop:
 *   orb 1  x=154   y=180  320px
 *   orb 2  x=816   y=423  288px
 *   orb 3  x=1376  y=632  448px
 */
export function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1200px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/40 dark:via-background" />
      <div className="animate-orb-1 absolute left-[8%] top-[15%] h-80 w-80 rounded-full bg-emerald-400/12 blur-[100px] dark:bg-emerald-400/6" />
      <div className="animate-orb-3 absolute left-[42.5%] top-[35%] h-72 w-72 rounded-full bg-emerald-300/8 blur-[80px] dark:bg-emerald-300/4" />
      <div className="animate-orb-2 absolute left-[71.6%] top-[52.6%] h-[28rem] w-[28rem] rounded-full bg-emerald-500/8 blur-[120px] dark:bg-emerald-500/4" />
    </div>
  );
}
