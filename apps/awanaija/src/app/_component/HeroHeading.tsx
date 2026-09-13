import { cn } from "@/lib/utils";

/**
 * The hero's two-line title — Figma 132:1529 (DM Sans Medium 36, one word set
 * in italic) over 132:1528 (Instrument Serif Italic 64 with a left-to-right
 * emerald gradient fill).
 */
export function HeroHeading({
  kicker,
  kickerAccent,
  title,
  className,
}: {
  /** Muted line above — the word matching `kickerAccent` is italicised. */
  readonly kicker: string;
  readonly kickerAccent?: string;
  readonly title: string;
  readonly className?: string;
}) {
  const [before, after] = kickerAccent
    ? splitOnce(kicker, kickerAccent)
    : [kicker, ""];

  return (
    <div className={cn(className)}>
      <p className="font-heading text-[24px] font-medium leading-[28px] tracking-[-0.4px] text-muted-foreground lg:text-[36px] lg:leading-[40px]">
        {before}
        {kickerAccent ? <em className="font-normal italic">{kickerAccent}</em> : null}
        {after}
      </p>
      <h1 className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-200 bg-clip-text font-serif text-[37px] italic leading-[40px] tracking-[-0.4px] text-transparent lg:text-[64px] lg:leading-[64px]">
        {title}
      </h1>
    </div>
  );
}

/** Split around the first occurrence so the accent word can be styled inline. */
function splitOnce(text: string, needle: string): [string, string] {
  const at = text.indexOf(needle);
  if (at === -1) return [text, ""];
  return [text.slice(0, at), text.slice(at + needle.length)];
}
