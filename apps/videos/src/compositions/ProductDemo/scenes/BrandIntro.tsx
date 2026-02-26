import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EmeraldOrbs } from "../components/EmeraldOrbs";
import { instrumentSerif, dmSans } from "@/lib/fonts";

export const BrandIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0.3 * fps, 1.2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [0.3 * fps, 1.2 * fps], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(
    frame,
    [1.0 * fps, 1.8 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const taglineY = interpolate(frame, [1.0 * fps, 1.8 * fps], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at end of scene
  const fadeOut = interpolate(frame, [3.0 * fps, 3.8 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      className="flex items-center justify-center"
      style={{ background: "#080c0a", opacity: fadeOut }}
    >
      <EmeraldOrbs />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <h1
            style={{
              fontFamily: instrumentSerif,
              fontSize: 96,
              fontWeight: 400,
              background: "linear-gradient(135deg, #34d399, #059669, #34d399)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            Our Nigeria
          </h1>
        </div>

        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          <p
            style={{
              fontFamily: dmSans,
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.5)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Tracking every naira
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
