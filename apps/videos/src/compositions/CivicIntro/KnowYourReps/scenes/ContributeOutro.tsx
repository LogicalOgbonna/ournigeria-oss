import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { ci, countUp, formatNumber } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const TOTAL_POSITIONS = 10000;
const IDENTIFIED_SO_FAR = 1066;
const MISSING = TOTAL_POSITIONS - IDENTIFIED_SO_FAR;

export const ContributeOutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = ci(frame, [0, 15], [0, 1]);
  const headingY = ci(frame, [0, 15], [40, 0]);

  const statProg = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const animatedMissing = countUp(frame, 15, 55, MISSING);
  const animatedIdentified = countUp(frame, 15, 55, IDENTIFIED_SO_FAR);

  const barWidth = ci(
    frame,
    [25, 55],
    [0, (IDENTIFIED_SO_FAR / TOTAL_POSITIONS) * 100],
  );

  const ctaOpacity = ci(frame, [60, 75], [0, 1]);
  const ctaY = ci(frame, [60, 75], [20, 0]);

  const urlOpacity = ci(frame, [80, 95], [0, 1]);

  const bulletsProg = (index: number) =>
    spring({
      frame: Math.max(0, frame - 90 - index * 8),
      fps,
      config: { damping: 18, stiffness: 90 },
    });

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.7} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "50px 80px",
          gap: 28,
          zIndex: 10,
        }}
      >
        {/* Heading */}
        <div
          style={{
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            We&apos;re Still Missing
          </div>
          <div
            style={{
              fontSize: 72,
              fontFamily: ibmPlexMono,
              fontWeight: 700,
              lineHeight: 1.1,
              marginTop: 4,
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
            }}
          >
            {formatNumber(animatedMissing)}+
          </div>
          <div
            style={{
              fontSize: 24,
              fontFamily: dmSans,
              fontWeight: 500,
              color: "rgba(255,255,255,0.6)",
              marginTop: 4,
            }}
          >
            public officials across Nigeria
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: 520,
            opacity: statProg,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              fontSize: 14,
              fontFamily: dmSans,
            }}
          >
            <span style={{ color: "#34d399", fontWeight: 600 }}>
              {formatNumber(animatedIdentified)} identified
            </span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>
              ~{formatNumber(TOTAL_POSITIONS)} total positions
            </span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 100,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${barWidth}%`,
                height: "100%",
                borderRadius: 100,
                background: "linear-gradient(90deg, #059669, #34d399)",
                transition: "width 0.1s",
              }}
            />
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 6,
              fontSize: 13,
              fontFamily: ibmPlexMono,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            {Math.round(barWidth)}% complete
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontFamily: dmSans,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.4,
            }}
          >
            Help Us Complete the Picture
          </div>
        </div>

        {/* How you can help bullets */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { icon: "🔍", text: "Identify your representatives" },
            { icon: "✅", text: "Verify existing information" },
            { icon: "📣", text: "Spread the word" },
          ].map((item, i) => {
            const prog = bulletsProg(i);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px",
                  borderRadius: 12,
                  background: "rgba(52, 211, 153, 0.06)",
                  border: "1px solid rgba(52, 211, 153, 0.15)",
                  opacity: prog,
                  transform: `translateY(${(1 - prog) * 12}px)`,
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span
                  style={{
                    fontSize: 15,
                    fontFamily: dmSans,
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* URL pill */}
        <div
          style={{
            opacity: urlOpacity,
            padding: "10px 28px",
            borderRadius: 100,
            border: "2px solid rgba(52, 211, 153, 0.4)",
            background: "rgba(52, 211, 153, 0.08)",
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontFamily: ibmPlexMono,
              color: "#34d399",
              fontWeight: 600,
            }}
          >
            ournigeria.ng
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
