import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EmeraldOrbs } from "../components/EmeraldOrbs";
import { FLOATING_STATS } from "@/lib/demo-data";
import { instrumentSerif, dmSans, ibmPlexMono } from "@/lib/fonts";

export const ClosingCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingOpacity = interpolate(frame, [0, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headingY = interpolate(frame, [0, 0.8 * fps], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlOpacity = interpolate(frame, [0.6 * fps, 1.4 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      className="flex items-center justify-center"
      style={{ background: "#080c0a" }}
    >
      <EmeraldOrbs />

      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Heading */}
        <div
          style={{
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
          }}
          className="text-center"
        >
          <h2
            style={{
              fontFamily: instrumentSerif,
              fontSize: 72,
              color: "white",
              lineHeight: 1.1,
            }}
          >
            Ask Your Own
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #34d399, #059669, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Questions
            </span>
          </h2>
        </div>

        {/* URL */}
        <div style={{ opacity: urlOpacity }}>
          <div
            className="rounded-full px-8 py-3"
            style={{
              background: "rgba(52, 211, 153, 0.1)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
            }}
          >
            <span
              style={{
                fontFamily: ibmPlexMono,
                fontSize: 24,
                color: "#34d399",
                letterSpacing: "0.02em",
              }}
            >
                ournaigeria.ng
            </span>
          </div>
        </div>

        {/* Floating stat badges */}
        <div className="flex gap-6 mt-4">
          {FLOATING_STATS.map((stat, i) => {
            const badgeSpring = spring({
              frame: Math.max(0, frame - 1.2 * fps - i * 6),
              fps,
              config: { damping: 18, stiffness: 80 },
            });

            const badgeY = interpolate(badgeSpring, [0, 1], [40, 0]);
            const badgeOpacity = interpolate(badgeSpring, [0, 1], [0, 1]);

            return (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 rounded-2xl px-6 py-4"
                style={{
                  opacity: badgeOpacity,
                  transform: `translateY(${badgeY}px)`,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  minWidth: 160,
                }}
              >
                <span
                  style={{
                    fontFamily: dmSans,
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#34d399",
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: dmSans,
                    fontSize: 14,
                    color: "rgba(255, 255, 255, 0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
