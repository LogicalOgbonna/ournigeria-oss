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

export const ChallengeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);
  const titleY = ci(frame, [0, 15], [30, 0]);

  const citizens = countUp(frame, 30, 60, 4217);
  const officials = countUp(frame, 30, 60, 3842);
  const states = countUp(frame, 30, 60, 37);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
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
          marginBottom: 48,
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontFamily: instrumentSerif,
            fontWeight: 400,
            color: "#fff",
            lineHeight: 1.15,
          }}
        >
          Join the{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Challenge
          </span>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          width: "100%",
          maxWidth: 480,
          zIndex: 10,
        }}
      >
        {[
          {
            value: formatNumber(citizens),
            label: "Citizens Contributing",
            color: "#34d399",
            start: 30,
          },
          {
            value: formatNumber(officials),
            label: "Officials Identified",
            color: "#34d399",
            start: 40,
          },
          {
            value: `${states} States`,
            label: "Active Communities",
            color: "#34d399",
            start: 50,
          },
        ].map((stat, i) => {
          const prog = spring({
            frame: Math.max(0, frame - stat.start),
            fps,
            config: { damping: 18, stiffness: 80 },
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "20px 24px",
                borderRadius: 20,
                background: "rgba(52, 211, 153, 0.04)",
                border: "1px solid rgba(52, 211, 153, 0.12)",
                opacity: prog,
                transform: `translateX(${(1 - prog) * 30}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontFamily: ibmPlexMono,
                  fontWeight: 700,
                  color: stat.color,
                  lineHeight: 1,
                  minWidth: 140,
                  textShadow: `0 0 30px ${stat.color}33`,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: dmSans,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div
        style={{
          opacity: ci(frame, [120, 140], [0, 1]),
          transform: `translateY(${ci(frame, [120, 140], [20, 0])}px)`,
          zIndex: 10,
          marginTop: 48,
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(10px)",
            borderRadius: 16,
            padding: "16px 28px",
            border: "1px solid rgba(52, 211, 153, 0.2)",
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: "#fff",
              fontFamily: dmSans,
              fontWeight: 600,
            }}
          >
            Rep your state. Fill the{" "}
            <span style={{ color: "#34d399" }}>gaps</span>.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
