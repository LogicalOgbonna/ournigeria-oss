import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { ci } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono, instrumentSerif } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";

const STEPS = [
  {
    emoji: "📝",
    title: "Propose",
    description: "See a missing official? Submit their name, photo, or contact details.",
  },
  {
    emoji: "👀",
    title: "Review",
    description: "Other citizens verify your submission. Upvote if correct, downvote if wrong.",
  },
  {
    emoji: "✅",
    title: "Verify",
    description: "When consensus is reached, the data becomes official on the platform.",
  },
  {
    emoji: "🔄",
    title: "Maintain",
    description: "Officials change. The community keeps the data fresh and accurate.",
  },
];

export const SolutionScene: React.FC = () => {
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
      <EmeraldOrbs opacity={0.3} />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          zIndex: 10,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontFamily: instrumentSerif,
            fontWeight: 400,
            color: "#fff",
          }}
        >
          The <span style={{ color: "#34d399" }}>Solution</span>
        </div>
        <div
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.4)",
            fontFamily: dmSans,
            marginTop: 8,
          }}
        >
          Community-powered verification
        </div>
      </div>

      {/* Steps */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
          zIndex: 10,
          flex: 1,
        }}
      >
        {STEPS.map((step, i) => {
          const start = 30 + i * 30;
          const prog = spring({
            frame: Math.max(0, frame - start),
            fps,
            config: { damping: 20, stiffness: 80 },
          });

          const lineProgress = ci(
            frame,
            [start + 15, start + 15 + 20],
            [0, 1],
          );

          return (
            <div key={i} style={{ display: "flex", gap: 16 }}>
              {/* Step number + connector */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0,
                  opacity: prog,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background:
                      lineProgress > 0.8
                        ? "linear-gradient(135deg, #059669, #34d399)"
                        : "rgba(255,255,255,0.06)",
                    border: `2px solid ${lineProgress > 0.8 ? "#34d399" : "rgba(255,255,255,0.1)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    transform: `scale(${prog})`,
                  }}
                >
                  {step.emoji}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      height: 24,
                      background: `linear-gradient(180deg, rgba(52, 211, 153, ${lineProgress * 0.4}), transparent)`,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  paddingTop: 4,
                  opacity: prog,
                  transform: `translateX(${(1 - prog) * 20}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: dmSans,
                    marginBottom: 4,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: dmSans,
                    lineHeight: 1.5,
                  }}
                >
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom caption */}
      <div
        style={{
          opacity: ci(frame, [200, 220], [0, 1]),
          transform: `translateY(${ci(frame, [200, 220], [20, 0])}px)`,
          zIndex: 100,
          textAlign: "center",
          marginTop: 20,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(10px)",
            borderRadius: 16,
            padding: "14px 24px",
            border: "1px solid rgba(52, 211, 153, 0.2)",
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: "#fff",
              fontFamily: dmSans,
              fontWeight: 600,
            }}
          >
            🗣 When citizens verify, <span style={{ color: "#34d399" }}>nobody</span>{" "}
            can hide.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
