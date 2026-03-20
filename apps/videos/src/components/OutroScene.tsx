import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { ci } from "@/lib/animation-utils";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "./EmeraldOrbs";

/**
 * Shared outro scene for all social media compositions.
 * Shows CTA text, QR code, and brand bar.
 * Designed for 9:16 (1080x1920) vertical format.
 */
export const OutroScene: React.FC<{
  /** Duration of this scene in frames */
  durationInFrames?: number;
}> = ({ durationInFrames = 150 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = ci(frame, [0, 15], [0, 1]);
  const headingY = ci(frame, [0, 15], [40, 0]);

  const qrScale = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 18, stiffness: 80 },
  });

  const urlOpacity = ci(frame, [30, 45], [0, 1]);

  const statsOpacity = ci(frame, [40, 55], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <EmeraldOrbs opacity={0.8} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 60px",
          gap: 48,
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
              fontSize: 64,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            Ask Your Own
          </div>
          <div
            style={{
              fontSize: 64,
              fontFamily: instrumentSerif,
              fontWeight: 400,
              lineHeight: 1.2,
              background: "linear-gradient(135deg, #34d399, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Questions
          </div>
        </div>

        {/* QR Code */}
        <div
          style={{
            transform: `scale(${qrScale})`,
            opacity: qrScale,
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              background: "#fff",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(52, 211, 153, 0.3)",
            }}
          >
            {/* QR code placeholder — will use static PNG when available */}
            <div
              style={{
                width: 160,
                height: 160,
                background: "linear-gradient(135deg, #059669, #34d399)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                color: "#fff",
                fontFamily: instrumentSerif,
              }}
            >
              ON
            </div>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            opacity: urlOpacity,
            padding: "12px 32px",
            borderRadius: 100,
            border: "2px solid rgba(52, 211, 153, 0.4)",
            background: "rgba(52, 211, 153, 0.08)",
          }}
        >
          <span
            style={{
              fontSize: 32,
              fontFamily: ibmPlexMono,
              color: "#34d399",
              fontWeight: 600,
            }}
          >
            ournigeria.ng
          </span>
        </div>

        {/* Stats row */}
        <div
          style={{
            opacity: statsOpacity,
            display: "flex",
            gap: 24,
          }}
        >
          {[
            { label: "States", value: "36 + FCT" },
            { label: "Years", value: "2019–2025" },
            { label: "Documents", value: "700+" },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#34d399",
                  fontFamily: ibmPlexMono,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: dmSans,
                  marginTop: 4,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
