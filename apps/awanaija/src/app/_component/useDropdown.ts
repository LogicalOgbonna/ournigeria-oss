"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Open/close plumbing for the hero's three little select controls (year, office,
 * party). There is no shadcn select primitive in this app, so each one is a
 * hand-rolled listbox — but they all close the same way, and that lives here
 * rather than in three copies.
 */
export function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return { open, setOpen, ref };
}
