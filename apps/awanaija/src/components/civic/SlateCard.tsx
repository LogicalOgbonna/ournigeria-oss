import Link from "next/link";
import { Show } from "@/components/ui/Show";
import { cn } from "@/lib/utils";

/** One person on a party's slate for a location. */
export interface SlatePerson {
  readonly id: string;
  readonly name: string;
  /** Seat they're contesting — "SENATE - Abia South". */
  readonly office?: string | null;
  /** Government tier — "Federal", "State", "Local". */
  readonly tier?: string | null;
  readonly imageUrl?: string | null;
  readonly slug?: string | null;
  /** No confirmed candidate for this seat yet. */
  readonly unverified?: boolean;
}

/**
 * Square-photo candidate card used in the party slate panel (Figma 132:7205).
 * Width comes from the parent grid — the photo is always square, the label
 * stack always the same three lines.
 */
export function SlateCard({
  person,
  className,
}: {
  readonly person: SlatePerson;
  readonly className?: string;
}) {
  const body = (
    <>
      <div className="relative w-full overflow-hidden rounded-[11px]">
        <Show when={Boolean(person.imageUrl) && !person.unverified}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={person.imageUrl ?? ""}
            alt={person.name}
            className="aspect-square w-full max-w-none object-cover object-top"
          />
        </Show>
        <Show when={!person.imageUrl || Boolean(person.unverified)}>
          <div className="flex aspect-square w-full items-end justify-center bg-emerald-500 dark:bg-emerald-500">
            <svg viewBox="0 0 100 100" className="h-[86%] w-[70%] text-white" aria-hidden>
              <circle cx="50" cy="30" r="21" fill="currentColor" />
              <path d="M6 100c0-24 20-44 44-44s44 20 44 44z" fill="currentColor" />
            </svg>
          </div>
        </Show>
      </div>

      {/* Mobile type is the design's 0.675 scale of the desktop stack
          (Figma 132:7115 vs 132:7208) — long names must wrap, not collide. */}
      <div className="mt-2 flex flex-col gap-[3px] lg:gap-[5px]">
        <p className="break-words font-sans text-[10px] font-bold leading-[13px] text-emerald-600 dark:text-emerald-400 lg:text-[14px] lg:leading-[18px]">
          {person.unverified ? "Not yet verified" : person.name}
        </p>
        <Show when={Boolean(person.office)}>
          <p className="break-words font-sans text-[9px] uppercase leading-[11px] text-muted-foreground lg:text-[12px] lg:leading-[13px]">
            {person.office}
          </p>
        </Show>
        <Show when={Boolean(person.tier)}>
          <p className="font-sans text-[9px] uppercase leading-[11px] text-muted-foreground/60 lg:text-[12px] lg:leading-[13px]">
            {person.tier}
          </p>
        </Show>
      </div>
    </>
  );

  if (!person.slug || person.unverified) {
    return <div className={cn("flex min-w-0 flex-col", className)}>{body}</div>;
  }

  return (
    <Link
      href={`/officials/${person.slug}`}
      className={cn(
        "flex min-w-0 flex-col transition-opacity hover:opacity-80",
        className,
      )}
    >
      {body}
    </Link>
  );
}
