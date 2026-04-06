import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { ci, countUp, formatNumber } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const RIPPLE_ITEMS = [
  "You identify your councillor",
  "Your neighbour sees and confirms",
  "Your ward becomes 100% complete",
  "Your LGA follows",
  "Your state climbs the leaderboard",
  "Nigeria becomes transparent",
];

export const MovementScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);
  const titleY = ci(frame, [0, 15], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 50px",
      }}
    >
      <EmeraldOrbs opacity={0.5} />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 10,
          textAlign: "center",
          marginBottom: 36,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontFamily: instrumentSerif,
            fontWeight: 400,
            color: "#fff",
            lineHeight: 1.2,
          }}
        >
          One Action.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Ripple Effect.
          </span>
        </div>
      </div>

      {/* Ripple chain */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          zIndex: 10,
          width: "100%",
        }}
      >
        {RIPPLE_ITEMS.map((item, i) => {
          const start = 20 + i * 20;
          const prog = spring({
            frame: Math.max(0, frame - start),
            fps,
            config: { damping: 20, stiffness: 80 },
          });

          const dotScale = spring({
            frame: Math.max(0, frame - start - 5),
            fps,
            config: { damping: 12, stiffness: 150 },
          });

          const isLast = i === RIPPLE_ITEMS.length - 1;

          return (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: prog,
                  transform: `translateX(${(1 - prog) * 30}px)`,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: isLast ? 20 : 12,
                    height: isLast ? 20 : 12,
                    borderRadius: "50%",
                    background: isLast
                      ? "linear-gradient(135deg, #059669, #34d399)"
                      : `rgba(52, 211, 153, ${0.3 + i * 0.12})`,
                    boxShadow: isLast
                      ? "0 0 20px rgba(52, 211, 153, 0.4)"
                      : "none",
                    transform: `scale(${dotScale})`,
                    flexShrink: 0,
                  }}
                />
                {/* Text */}
                <div
                  style={{
                    fontSize: isLast ? 22 : 17,
                    fontFamily: dmSans,
                    fontWeight: isLast ? 700 : 500,
                    color: isLast ? "#34d399" : `rgba(255,255,255,${0.4 + i * 0.1})`,
                    lineHeight: 1.4,
                  }}
                >
                  {item}
                </div>
              </div>
              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    height: 16,
                    marginLeft: 5,
                    background: `rgba(52, 211, 153, ${prog * 0.2})`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Final CTA */}
      <div
        style={{
          opacity: ci(frame, [170, 190], [0, 1]),
          transform: `translateY(${ci(frame, [170, 190], [20, 0])}px)`,
          zIndex: 10,
          marginTop: 40,
          textAlign: "center",
        }}
      >
        <div
          style={{
            padding: "20px 32px",
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(5, 150, 105, 0.15), rgba(52, 211, 153, 0.08))",
            border: "2px solid rgba(52, 211, 153, 0.3)",
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            Together,{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #34d399, #059669)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              We Know
            </span>
          </div>
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.5)",
              fontFamily: dmSans,
              marginTop: 8,
            }}
          >
            Join the movement at ournigeria.ng
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
