import { SlateCard, type SlatePerson } from "@/components/civic/SlateCard";
import { cn } from "@/lib/utils";

/** One tier's worth of the slate. `columns` sets the card size for the row. */
export interface SlateRow {
  readonly id: string;
  readonly columns: number;
  readonly people: readonly SlatePerson[];
}

/**
 * The party's other candidates for this location — Figma 132:7193 (desktop) /
 * 132:9700 (mobile). Rows arrive pre-grouped by tier; this draws the rule
 * between them and nothing else.
 *
 * A row's `columns` is what sizes its cards, so a row with fewer people than
 * columns stays left-aligned at that size instead of stretching to fill —
 * which is what the third row (chairman + councillor) does in the design.
 */
export function PartySlatePanel({
  rows,
  className,
}: {
  readonly rows: readonly SlateRow[];
  readonly className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {rows.map((row, i) => (
        <div
          key={row.id}
          className={cn(
            "grid gap-x-[10px] gap-y-4 lg:gap-x-[25px]",
            i > 0 && "mt-5 border-t border-border pt-5 lg:mt-8 lg:pt-8",
          )}
          style={{ gridTemplateColumns: `repeat(${row.columns}, minmax(0, 1fr))` }}
        >
          {row.people.map((person) => (
            <SlateCard key={person.id} person={person} />
          ))}
        </div>
      ))}
    </div>
  );
}
