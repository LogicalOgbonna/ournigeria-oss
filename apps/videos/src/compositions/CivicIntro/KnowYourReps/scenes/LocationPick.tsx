import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { ci } from "@/lib/animation-utils";
import { dmSans } from "@/lib/fonts";
import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const LocationPickScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 15], [0, 1]);
  const titleY = ci(frame, [0, 15], [30, 0]);

  const phoneScale = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const stateAppear = ci(frame, [40, 55], [0, 1]);
  const lgaAppear = ci(frame, [80, 95], [0, 1]);
  const wardAppear = ci(frame, [120, 135], [0, 1]);

  const stateHighlight = ci(frame, [55, 65], [0, 1]);
  const lgaHighlight = ci(frame, [95, 105], [0, 1]);
  const wardHighlight = ci(frame, [135, 145], [0, 1]);

  const checkScale = (start: number) =>
    spring({
      frame: Math.max(0, frame - start),
      fps,
      config: { damping: 12, stiffness: 150 },
    });

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
      }}
    >
      <EmeraldOrbs opacity={0.4} />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 40,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontFamily: dmSans,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
          }}
        >
          Step 1: Pick Your Location
        </div>
      </div>

      {/* Mock phone / dropdown UI */}
      <div
        style={{
          width: 520,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "32px 28px",
          transform: `scale(${phoneScale})`,
          opacity: phoneScale,
          zIndex: 10,
        }}
      >
        {/* State selector */}
        <DropdownRow
          label="State"
          value="Lagos"
          opacity={stateAppear}
          highlight={stateHighlight}
          checkProg={checkScale(65)}
        />

        {/* LGA selector */}
        <DropdownRow
          label="Local Government"
          value="Ikeja"
          opacity={lgaAppear}
          highlight={lgaHighlight}
          checkProg={checkScale(105)}
        />

        {/* Ward selector */}
        <DropdownRow
          label="Ward"
          value="Alausa"
          opacity={wardAppear}
          highlight={wardHighlight}
          checkProg={checkScale(145)}
        />

        {/* Find button */}
        <div
          style={{
            opacity: ci(frame, [160, 175], [0, 1]),
            transform: `translateY(${ci(frame, [160, 175], [10, 0])}px)`,
            marginTop: 24,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #059669, #047857)",
              borderRadius: 14,
              padding: "14px 0",
              textAlign: "center",
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              fontFamily: dmSans,
            }}
          >
            Find My Representatives →
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const DropdownRow: React.FC<{
  label: string;
  value: string;
  opacity: number;
  highlight: number;
  checkProg: number;
}> = ({ label, value, opacity, highlight, checkProg }) => {
  return (
    <div
      style={{
        opacity,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          fontFamily: dmSans,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid rgba(52, 211, 153, ${0.08 + highlight * 0.25})`,
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 16,
            fontFamily: dmSans,
            color: highlight > 0.5 ? "#fff" : "rgba(255,255,255,0.3)",
            fontWeight: highlight > 0.5 ? 600 : 400,
          }}
        >
          {highlight > 0.5 ? value : `Select ${label.toLowerCase()}...`}
        </span>
        <span
          style={{
            fontSize: 16,
            color: "#34d399",
            transform: `scale(${checkProg})`,
            opacity: checkProg,
          }}
        >
          ✓
        </span>
      </div>
    </div>
  );
};
