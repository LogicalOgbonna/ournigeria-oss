import { Show } from "@/components/ui/Show";
import { cn } from "@/lib/utils";

/**
 * Party logo + acronym chip that sits in the bottom-left corner of an
 * official's photo — Figma 132:7092 (large) and 132:7111 (small).
 */
export function PartyBadge({
  acronym,
  logoUrl,
  size = "sm",
  className,
}: {
  readonly acronym: string;
  readonly logoUrl?: string | null;
  readonly size?: "sm" | "lg";
  readonly className?: string;
}) {
  const large = size === "lg";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] rounded-tl-none bg-black/90 backdrop-blur-sm",
        large ? "gap-2 px-3 py-2" : "gap-1.5 px-2 py-1",
        className,
      )}
    >
      <Show when={Boolean(logoUrl)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl ?? ""}
          alt=""
          aria-hidden
          className={cn("shrink-0 rounded-full object-cover", large ? "h-[30px] w-[30px]" : "h-[15px] w-[15px]")}
        />
      </Show>
      <span
        className={cn(
          "font-sans font-semibold text-white",
          large ? "text-[20px] leading-[26px]" : "text-[11px] leading-[15px]",
        )}
      >
        {acronym}
      </span>
    </span>
  );
}
