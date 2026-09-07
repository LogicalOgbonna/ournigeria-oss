"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, UserRound, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicFetch } from "@/lib/api";
import { errorMessage } from "@/lib/campaigns";
import { useDebounce } from "@/lib/hooks/use-debounce";

/** What the campaign API's `personSchema` accepts: a linked official, or a bare name. */
export interface PersonValue {
  officialId?: string | null;
  name?: string | null;
}

interface OfficialPosition {
  role: string;
  isCurrent?: boolean;
  party?: string | null;
  state?: string | null;
  lga?: string | null;
  constituency?: string | null;
  ward?: string | null;
}
interface OfficialHit {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string | null;
  positions?: OfficialPosition[];
}

const ROLE_LABEL: Record<string, string> = {
  president: "President",
  vice_president: "Vice President",
  governor: "Governor",
  deputy_governor: "Deputy Governor",
  senator: "Senator",
  rep: "House of Reps",
  mha: "State Assembly",
  lga_chairman: "LGA Chairman",
  councilor: "Councillor",
  minister: "Minister",
};

const roleLabel = (role: string) => ROLE_LABEL[role] ?? role.replace(/_/g, " ");

/** "Senator · Abia North · PDP" — the office line under a result's name. */
function officeLine(o: OfficialHit): string | null {
  const positions = o.positions ?? [];
  const p = positions.find((x) => x.isCurrent) ?? positions[0];
  if (!p) return null;
  const scope = p.constituency ?? p.ward ?? p.lga ?? p.state ?? null;
  return [roleLabel(p.role), scope, p.party].filter(Boolean).join(" · ") || null;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Portrait({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  return imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt=""
      className="h-8 w-8 shrink-0 rounded-full object-cover"
      loading="lazy"
    />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
      {initials(name) || <UserRound className="h-4 w-4" />}
    </span>
  );
}

/**
 * Search-and-link a person. Picking a result emits `{ officialId, name }` (the
 * API's resolvePerson lets the official's own name win); the footer row emits
 * `{ name }` only, for candidates who have no official record yet.
 *
 * The public list endpoint only surfaces office HOLDERS on a bare name search
 * (officials.service.ts §list "office-holder guard"), so pure challengers will
 * not appear — that is exactly what the free-text row is for.
 */
export function OfficialPicker({
  value,
  onChange,
  label,
  placeholder = "Search officials by name…",
  disabled,
}: {
  value: PersonValue | null;
  onChange: (v: PersonValue | null) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const listboxId = `${inputId}-results`;
  const optionId = (i: number) => `${listboxId}-opt-${i}`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<OfficialHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const debounced = useDebounce(query.trim(), 300);
  const typed = query.trim();
  // Last row of the list: use the typed text verbatim as the person's name.
  const freeTextIndex = results.length;
  const rowCount = results.length + (typed.length >= 2 ? 1 : 0);
  /**
   * The single source of truth for "is the listbox on screen" — the render
   * guard, aria-expanded, aria-activedescendant and the Escape/Enter branches
   * must never disagree, or Escape swallows a keypress that draws nothing.
   */
  const listOpen = open && (typed.length >= 2 || !!error);
  /** In flight OR still waiting out the debounce — "no match" must not flash mid-type. */
  const pending = loading || typed !== debounced;

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setActive(0);
      setLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    (
      publicFetch(`/api/officials?search=${encodeURIComponent(debounced)}&limit=10`, {
        signal: controller.signal,
      }) as Promise<{ data: OfficialHit[] }>
    )
      .then((body) => {
        // A superseded query must not write over the newer one's state.
        if (controller.signal.aborted) return;
        setResults(body.data ?? []);
        setActive(0);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResults([]);
        setActive(0);
        setError(errorMessage(err));
        setLoading(false);
      });
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    if (!open) return;
    // Pointer outside, or focus moved on (Tab / a click elsewhere in the form):
    // either way the list stops being relevant.
    const onLeave = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onLeave);
    document.addEventListener("focusin", onLeave);
    return () => {
      document.removeEventListener("mousedown", onLeave);
      document.removeEventListener("focusin", onLeave);
    };
  }, [open]);

  function pick(index: number) {
    if (index === freeTextIndex) {
      if (typed.length < 2) return;
      onChange({ name: typed });
    } else {
      const hit = results[index];
      if (!hit) return;
      onChange({ officialId: hit.id, name: hit.name });
    }
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      // Escape closes the result list ONLY. Without stopping the event here an
      // enclosing Radix Dialog would close on the same keypress, throwing away
      // the whole form. With the list already closed, Escape belongs to the
      // dialog again, so it is left to propagate.
      if (!listOpen) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (rowCount === 0) return;
      e.preventDefault();
      setOpen(true);
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % rowCount : (i - 1 + rowCount) % rowCount));
      return;
    }
    if (e.key === "Enter") {
      if (!listOpen || rowCount === 0) return;
      e.preventDefault();
      pick(active);
    }
  }

  const statusText = error
    ? error
    : pending
      ? "Searching…"
      : results.length === 0
        ? "No matching official"
        : null;

  if (value?.officialId || value?.name) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
          <span className="truncate text-sm font-medium">{value.name ?? "Linked official"}</span>
          {value.officialId ? (
            <Badge variant="outline" className="shrink-0">
              linked official
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 shrink-0"
            aria-label={`Clear ${label}`}
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5" ref={rootRef}>
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          className="pl-8"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listboxId}
          aria-activedescendant={listOpen && rowCount > 0 ? optionId(active) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {loading ? (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {listOpen ? (
        <div className="rounded-md border border-border bg-popover p-1 shadow-sm">
          {/* A listbox may only own options, so the status line lives beside it
              — and as a live region it announces "Searching…"/"No matching
              official" without stealing focus from the input. */}
          {statusText ? (
            <p
              role="status"
              aria-live="polite"
              className={`px-2 py-2 text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}
            >
              {statusText}
            </p>
          ) : null}
          <ul id={listboxId} role="listbox" className="max-h-72 overflow-y-auto">
            {results.map((o, i) => {
              const office = officeLine(o);
              return (
                // The rows ARE the options, and they stay out of the tab order:
                // the input keeps focus and drives them through
                // aria-activedescendant. mousedown is prevented so the click
                // lands before the input's blur can close the list.
                <li
                  key={o.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 ${
                    i === active ? "bg-accent" : ""
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(i)}
                >
                  <Portrait name={o.name} imageUrl={o.imageUrl} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{o.name}</span>
                    {office ? (
                      <span className="block truncate text-xs text-muted-foreground">{office}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
            {typed.length >= 2 ? (
              <li
                id={optionId(freeTextIndex)}
                role="option"
                aria-selected={active === freeTextIndex}
                className={`cursor-pointer rounded-sm px-2 py-1.5 text-xs text-muted-foreground ${
                  active === freeTextIndex ? "bg-accent" : ""
                }`}
                onMouseEnter={() => setActive(freeTextIndex)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(freeTextIndex)}
              >
                Not an official yet — use &ldquo;{typed}&rdquo; as the name
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
