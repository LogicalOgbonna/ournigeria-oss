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

const STORIES = [
  {
    emoji: "🏫",
    quote:
      "I didn't even know who my ward councillor was. Now I can hold them accountable for our blocked drainage.",
    name: "Chioma, Enugu",
  },
  {
    emoji: "📱",
    quote:
      "I proposed my local chairman's details and 15 people verified it in 2 hours. This is real people power.",
    name: "Yusuf, Kano",
  },
  {
    emoji: "🗳️",
    quote:
      "Before the elections, I used OurNigeria to research every candidate. Knowledge is power.",
    name: "Adaeze, Lagos",
  },
];

export const StoriesScene: React.FC = () => {
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
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontFamily: instrumentSerif,
            fontWeight: 400,
            color: "#fff",
          }}
        >
          Real Citizens.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Real Impact.
          </span>
        </div>
      </div>

      {/* Story cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          zIndex: 10,
          flex: 1,
        }}
      >
        {STORIES.map((story, i) => {
          const start = 20 + i * 50;
          const prog = spring({
            frame: Math.max(0, frame - start),
            fps,
            config: { damping: 20, stiffness: 70 },
          });

          return (
            <div
              key={i}
              style={{
                padding: "24px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                opacity: prog,
                transform: `translateY(${(1 - prog) * 30}px)`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  {story.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 17,
                      color: "rgba(255,255,255,0.75)",
                      fontFamily: dmSans,
                      lineHeight: 1.5,
                      fontStyle: "italic",
                      marginBottom: 10,
                    }}
                  >
                    "{story.quote}"
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#34d399",
                      fontFamily: dmSans,
                      fontWeight: 600,
                    }}
                  >
                    — {story.name}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div
        style={{
          opacity: ci(frame, [200, 220], [0, 1]),
          zIndex: 10,
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
            🗣 Every contribution matters. <span style={{ color: "#34d399" }}>Yours</span>{" "}
            could be next.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
