import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const PANELS = [
  { label: "Average wage growth 2015–2024", value: "+42%", color: "#34d399" },
  { label: "Inflation (cumulative)", value: "+371%", color: "#ef4444" },
  { label: "Real purchasing power loss", value: "-71%", color: "#ef4444" },
];

// Heights proportional to real values, capped for visual contrast
const BAR_HEIGHTS = {
  wages: 80,
  inflation: 320,
};

export const WhoGainedWhoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = ci(frame, [0, 15], [0, 1]);
  const headerY = ci(frame, [0, 15], [30, 0]);

  const panelSpring = (i: number) =>
    spring({
      frame: Math.max(0, frame - 20 - i * 10),
      fps,
      config: { damping: 18, stiffness: 90 },
    });

  const wagesBarH = ci(frame, [40, 80], [0, BAR_HEIGHTS.wages]);
  const inflationBarH = ci(frame, [45, 90], [0, BAR_HEIGHTS.inflation]);

  const bottomOpacity = ci(frame, [100, 118], [0, 1]);
  const bottomY = ci(frame, [100, 118], [20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 80px",
      }}
    >
      <EmeraldOrbs opacity={0.3} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 36,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 38,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.25,
            }}
          >
            While Your Salary Stayed the Same...
          </div>
        </div>

        {/* 3 stat panels */}
        <div style={{ display: "flex", flexDirection: "row", gap: 20 }}>
          {PANELS.map((panel, i) => {
            const prog = panelSpring(i);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  opacity: prog,
                  transform: `translateY(${(1 - prog) * 30}px)`,
                  padding: "24px 20px",
                  borderRadius: 14,
                  background:
                    panel.color === "#34d399"
                      ? "rgba(52, 211, 153, 0.06)"
                      : "rgba(239, 68, 68, 0.06)",
                  border: `1px solid ${panel.color === "#34d399" ? "rgba(52, 211, 153, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 44,
                    fontFamily: ibmPlexMono,
                    fontWeight: 700,
                    color: panel.color,
                    lineHeight: 1,
                  }}
                >
                  {panel.value}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontFamily: dmSans,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.45,
                  }}
                >
                  {panel.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bar chart visual */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 40,
            height: 360,
          }}
        >
          {/* Wages bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontFamily: ibmPlexMono,
                fontWeight: 700,
                color: "#34d399",
              }}
            >
              +42%
            </div>
            <div
              style={{
                width: 90,
                height: wagesBarH,
                borderRadius: "8px 8px 0 0",
                background: "linear-gradient(180deg, #34d399, #059669)",
                opacity: 0.9,
              }}
            />
            <div
              style={{
                fontSize: 13,
                fontFamily: dmSans,
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
                maxWidth: 100,
              }}
            >
              Wage growth
            </div>
          </div>

          {/* Inflation bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontFamily: ibmPlexMono,
                fontWeight: 700,
                color: "#ef4444",
              }}
            >
              +371%
            </div>
            <div
              style={{
                width: 90,
                height: inflationBarH,
                borderRadius: "8px 8px 0 0",
                background: "linear-gradient(180deg, #ef4444, #dc2626)",
                opacity: 0.9,
              }}
            />
            <div
              style={{
                fontSize: 13,
                fontFamily: dmSans,
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
                maxWidth: 100,
              }}
            >
              Cumulative inflation
            </div>
          </div>
        </div>

        {/* Bottom callout */}
        <div
          style={{
            opacity: bottomOpacity,
            transform: `translateY(${bottomY}px)`,
            padding: "14px 24px",
            borderRadius: 12,
            background: "rgba(251, 191, 36, 0.06)",
            border: "1px solid rgba(251, 191, 36, 0.2)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 16,
              fontFamily: dmSans,
              fontWeight: 600,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            Minimum wage: <span style={{ color: "#34d399" }}>₦18k in 2015</span>{" "}
            →{" "}
            <span style={{ color: "#fbbf24" }}>₦70k today</span>. But ₦70k in
            2024 ={" "}
            <span style={{ color: "#ef4444" }}>₦19k worth in 2015</span>.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
