"use client";

import { UserRound } from "lucide-react";
import { initials } from "@/lib/campaign-council";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-[11px]",
} as const;

/**
 * One person's round portrait, with their initials (then a generic glyph) as
 * the fallback. Shared by the official picker's result rows and the council
 * table so a member looks the same wherever they are drawn.
 */
export function Portrait({
  name,
  imageUrl,
  size = "sm",
  className,
}: {
  name: string;
  imageUrl: string | null;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const box = cn("shrink-0 rounded-full", SIZE[size], className);
  if (imageUrl) {
    return (
      // The name is always rendered right beside this, so alt="" keeps a
      // screen reader from announcing the person twice.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className={cn(box, "border border-border object-cover")}
      />
    );
  }
  const text = initials(name);
  return (
    <span
      aria-hidden="true"
      className={cn(
        box,
        "flex items-center justify-center bg-muted font-medium text-muted-foreground",
      )}
    >
      {text || <UserRound className="h-4 w-4" />}
    </span>
  );
}
