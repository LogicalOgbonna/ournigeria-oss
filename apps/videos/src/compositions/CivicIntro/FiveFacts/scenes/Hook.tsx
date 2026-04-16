import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const COUNTDOWN = [5, 4, 3, 2, 1];

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Each number appears at 0.5, 1.0, 1.5, 2.0, 2.5 * fps
  // Then title + sub appear after all numbers
  const titleOpacity = ci(frame, [3.0 * fps, 3.6 * fps], [0, 1]);
  const titleY = ci(frame, [3.0 * fps, 3.6 * fps], [30, 0]);

  const subOpacity = ci(frame, [3.4 * fps, 4.0 * fps], [0, 1]);

  const fadeOut = ci(frame, [4 * fps, 4.8 * fps], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut,
      }}
    >
      <EmeraldOrbs opacity={0.5} />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "0 60px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Countdown numbers */}
        <div
          style={{
            position: "relative",
            width: 200,
            height: 180,
            marginBottom: 16,
          }}
        >
          {COUNTDOWN.map((num, i) => {
            const appearFrame = (i + 0.5) * fps;
            const disappearFrame = (i + 1) * fps;
            const isLast = i === COUNTDOWN.length - 1;

            const bounceScale = spring({
              frame: Math.max(0, frame - appearFrame),
              fps,
              config: { damping: 12, stiffness: 160 },
            });

            // For all but last: fade out when next appears
            const opacity = isLast
              ? ci(frame, [appearFrame, appearFrame + 8], [0, 1]) *
                ci(frame, [3 * fps - 5, 3 * fps], [1, 0])
              : ci(frame, [appearFrame, appearFrame + 6], [0, 1]) *
                ci(frame, [disappearFrame, disappearFrame + 4], [1, 0]);

            return (
              <div
                key={num}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity,
                }}
              >
                <span
                  style={{
                    fontSize: 72,
                    fontFamily: ibmPlexMono,
                    fontWeight: 700,
                    color: "#34d399",
                    lineHeight: 1,
                    transform: `scale(${0.5 + bounceScale * 0.5})`,
                    display: "block",
                    textShadow: "0 0 40px rgba(52,211,153,0.4)",
                  }}
                >
                  {num}
                </span>
              </div>
            );
          })}
        </div>

        {/* "5 Budget Facts" label */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontFamily: ibmPlexMono,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            5 Budget Facts
          </div>
          <div
            style={{
              fontSize: 28,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.25,
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your Elected Officials Hope You Never Learn
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subOpacity,
            marginTop: 16,
          }}
        >
          <p
            style={{
              fontSize: 17,
              maxWidth: 420,
              margin: "0 auto",
              color: "rgba(255,255,255,0.4)",
              fontFamily: dmSans,
              fontWeight: 500,
            }}
          >
            Data from official government sources.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
