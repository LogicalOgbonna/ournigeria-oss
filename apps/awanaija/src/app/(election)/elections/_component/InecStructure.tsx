import Image from "next/image";
import Link from "next/link";
import { Show } from "@/components/ui/Show";
import { INEC_STOPS } from "./inec-structure";

/**
 * The "From the Chairman to Your Polling Unit" chain — Figma `1:1430`,
 * y=1532 to y=5071.
 *
 * Figma draws each stop absolutely and puts a separate 121.5px connector vector
 * between them (`1:1582`-`1:1590`, all at x=958). Here the stops are a flow
 * column and the connector is a border on the wrapper, so nothing has to be
 * repositioned when copy wraps differently or the viewport narrows.
 */
export function InecStructure() {
  return (
    <ol className="mx-auto mt-16 flex w-full max-w-[860px] flex-col items-center px-6 lg:px-8">
      {INEC_STOPS.map((stop, i) => (
        <li key={stop.id} className="flex w-full flex-col items-center text-center">
          {/* Connector into this stop — every one but the first. */}
          <Show when={i > 0}>
            <span
              className="my-8 h-[80px] w-px bg-border dark:bg-[#3c4a3f] lg:h-[121px]"
              aria-hidden
            />
          </Show>

          <h3 className="font-heading text-[20px] font-semibold text-foreground lg:text-[24px] lg:leading-[27px]">
            {stop.heading}
          </h3>

          <p className="mt-3 max-w-[420px] text-sm leading-relaxed text-muted-foreground lg:text-[14px]">
            {stop.description}
          </p>

          <Show when={Boolean(stop.link)}>
            <Link
              href={stop.link?.href ?? "#"}
              className="mt-3 font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              {stop.link?.label}
            </Link>
          </Show>

          {/* Single portrait / address card (Figma 1:1551, 1:1552). */}
          <Show when={Boolean(stop.card)}>
            <div className="mt-6 w-[263px] rounded-[12px] border border-border bg-card p-6 dark:border-[#3c4a3f] dark:bg-[#04130f]">
              <Show when={Boolean(stop.card?.photo)}>
                <Image
                  src={stop.card?.photo ?? ""}
                  alt={stop.card?.caption ?? ""}
                  width={155}
                  height={155}
                  className="mx-auto size-[155px] rounded-[8px] object-cover"
                />
              </Show>
              <p className="mt-4 text-[14px] leading-[20px] text-foreground">
                {stop.card?.caption}
              </p>
            </div>
          </Show>

          {/* National Commissioners grid (Figma 1:1550). Five across on desktop,
              two on a phone — the frame's 901px card does not fit 402px. */}
          <Show when={Boolean(stop.grid)}>
            <div className="mt-6 w-full rounded-[12px] border border-border bg-card p-6 dark:border-[#3c4a3f] dark:bg-[#04130f] lg:p-9">
              <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
                {(stop.grid ?? []).map((c) => (
                  <li key={c.name} className="flex flex-col items-center">
                    <Image
                      src={c.photo}
                      alt={c.name}
                      width={144}
                      height={144}
                      className="size-[110px] rounded-[8px] object-cover lg:size-[144px]"
                    />
                    <p className="mt-3 text-[12px] leading-[16px] text-foreground">{c.name}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Show>

          {/* Appointment note (Figma 1:1525, 1:1527, 1:1529). */}
          <Show when={Boolean(stop.note)}>
            <p className="mt-6 max-w-[359px] rounded-[8px] border border-border bg-muted/40 px-4 py-3 text-[12px] leading-[18px] text-muted-foreground dark:border-[#3c4a3f] dark:bg-[#0b0f0d]">
              {stop.note}
            </p>
          </Show>
        </li>
      ))}
    </ol>
  );
}
