"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getInitials, partyColor } from "./utils";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ournigeria.ng";

/** Official's photo, party-colored ring + initials fallback on missing/broken image. */
export function OfficialAvatar({
  name, image, party, size = "sm",
}: {
  name: string | null | undefined;
  image?: string | null;
  party?: string | null;
  size?: "sm" | "lg";
}) {
  const [broken, setBroken] = useState(false);
  const color = partyColor(party);
  const src = image ? `${SITE_URL}${image}` : null;
  const dim = size === "lg" ? "size-14 text-lg" : "size-8 text-[11px]";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] font-heading font-bold",
        dim,
      )}
      style={{ borderColor: `${color}55`, background: `${color}14`, color }}
    >
      {src && !broken ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </span>
  );
}
