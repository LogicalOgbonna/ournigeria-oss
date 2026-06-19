"use client";

import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import nigeriaGeoRaw from "@/data/nigeria-states.geo.json";

type StateProps = { stateCode: string; name: string };
const NIGERIA = nigeriaGeoRaw as unknown as FeatureCollection<Geometry, StateProps>;

const WIDTH = 800;
const HEIGHT = 640;

type Props = {
  /** stateCode (lowercase, e.g. "lagos") -> seat count. Absent/0 = no presence. */
  readonly valuesByState: Record<string, number>;
  /** Fill color for states where the party holds seats. */
  readonly color: string;
  readonly className?: string;
};

/**
 * SVG choropleth of Nigeria's 36 states + FCT. States where the party holds seats
 * are filled in the party color with opacity scaled by seat count; the rest stay
 * neutral slate. Hover a state for its seat count. SSR-safe, dark-mode aware.
 */
export function NigeriaChoropleth({ valuesByState, color, className }: Props) {
  const [hover, setHover] = useState<{ name: string; value: number; x: number; y: number } | null>(null);

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

  return (
    <div className={`relative ${className ?? ""}`}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Map of Nigeria showing states where the party holds seats"
      >
        {shapes.map((s) => {
          const active = s.value > 0;
          return (
            <path
              key={s.code}
              d={s.d}
              fill={active ? color : undefined}
              fillOpacity={active ? 0.3 + 0.6 * (s.value / max) : 1}
              className={active ? "" : "fill-slate-200 dark:fill-slate-800"}
              stroke="#ffffff"
              strokeWidth={0.5}
              style={{ cursor: "pointer", transition: "fill-opacity 150ms" }}
              onMouseEnter={() => setHover({ name: s.name, value: s.value, x: 0, y: 0 })}
              onMouseMove={(e) => {
                const wrap = e.currentTarget.ownerSVGElement?.parentElement;
                if (!wrap) return;
                const r = wrap.getBoundingClientRect();
                setHover({ name: s.name, value: s.value, x: e.clientX - r.left, y: e.clientY - r.top });
              }}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-popover px-3 py-1.5 text-xs shadow-lg"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div className="font-medium text-foreground">{hover.name}</div>
          <div className="font-mono text-muted-foreground">
            {hover.value} {hover.value === 1 ? "seat" : "seats"}
          </div>
        </div>
      )}
    </div>
  );
}
