"use client";

import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import nigeriaGeoRaw from "@/data/nigeria-states.geo.json";

type StateProps = { stateCode: string; name: string };
const NIGERIA = nigeriaGeoRaw as unknown as FeatureCollection<Geometry, StateProps>;

const WIDTH = 800;
const HEIGHT = 640;

// Tooltip role order + labels (singular/plural).
const ROLE_TOOLTIP: { role: string; one: string; many: string }[] = [
  { role: "governor", one: "Governor", many: "Governors" },
  { role: "senator", one: "Senator", many: "Senators" },
  { role: "rep", one: "Rep", many: "Reps" },
  { role: "mha", one: "Assembly seat", many: "Assembly seats" },
  { role: "lga_chairman", one: "LGA Chairman", many: "LGA Chairmen" },
];

type Props = {
  /** stateCode (lowercase, e.g. "lagos") -> seat count. Absent/0 = no presence (fill). */
  readonly valuesByState: Record<string, number>;
  /** Per-state, per-role seat counts — drives the hover tooltip breakdown. */
  readonly breakdownByState?: Record<string, Record<string, number>>;
  /** Fill color for states where the party holds seats. */
  readonly color: string;
  readonly className?: string;
};

/**
 * SVG choropleth of Nigeria's 36 states + FCT. States in `valuesByState` are filled
 * in the party color; the rest stay neutral slate. Hovering a state shows its seat
 * breakdown by position (Governor / Senators / Reps / …). SSR-safe, dark-mode aware.
 */
export function NigeriaChoropleth({ valuesByState, breakdownByState, color, className }: Props) {
  const [hover, setHover] = useState<{ name: string; code: string; x: number; y: number } | null>(null);

  const { shapes, max } = useMemo(() => {
    const projection = geoMercator().fitSize([WIDTH, HEIGHT], NIGERIA);
    const path = geoPath(projection);
    const max = Math.max(1, ...Object.values(valuesByState));
    const shapes = NIGERIA.features.map((f) => ({
      code: f.properties.stateCode,
      name: f.properties.name,
      d: path(f) ?? "",
      value: valuesByState[f.properties.stateCode] ?? 0,
    }));
    return { shapes, max };
  }, [valuesByState]);

  const breakdownLines = (code: string): string[] => {
    const b = breakdownByState?.[code];
    if (!b) return [];
    return ROLE_TOOLTIP.filter((r) => (b[r.role] ?? 0) > 0).map((r) => {
      const n = b[r.role];
      return `${n} ${n === 1 ? r.one : r.many}`;
    });
  };

  const lines = hover ? breakdownLines(hover.code) : [];

  return (
    <div className={`relative ${className ?? ""}`}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Map of Nigeria showing the party's seats by state"
      >
        {shapes.map((s) => {
          const active = s.value > 0;
          return (
            <path
              key={s.code}
              data-state={s.code}
              d={s.d}
              fill={active ? color : undefined}
              fillOpacity={active ? 0.3 + 0.6 * (s.value / max) : 1}
              className={active ? "" : "fill-slate-200 dark:fill-slate-800"}
              stroke="#ffffff"
              strokeWidth={0.5}
              style={{ cursor: "pointer", transition: "fill-opacity 150ms" }}
              onMouseEnter={() => setHover({ name: s.name, code: s.code, x: 0, y: 0 })}
              onMouseMove={(e) => {
                const wrap = e.currentTarget.ownerSVGElement?.parentElement;
                if (!wrap) return;
                const r = wrap.getBoundingClientRect();
                setHover({ name: s.name, code: s.code, x: e.clientX - r.left, y: e.clientY - r.top });
              }}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div className="font-medium text-foreground">{hover.name}</div>
          {lines.length > 0 ? (
            <div className="mt-1 space-y-0.5 font-mono text-muted-foreground">
              {lines.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          ) : (
            <div className="mt-1 font-mono text-muted-foreground">No seats held</div>
          )}
        </div>
      )}
    </div>
  );
}
