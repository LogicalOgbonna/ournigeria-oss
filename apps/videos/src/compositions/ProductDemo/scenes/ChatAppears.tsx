import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EmeraldOrbs } from "../components/EmeraldOrbs";
import { ChatWindow } from "../components/ChatWindow";
import { instrumentSerif } from "@/lib/fonts";

export const ChatAppears: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 25, stiffness: 80 },
  });

  const windowX = interpolate(slideIn, [0, 1], [900, 0]);
  const windowOpacity = interpolate(slideIn, [0, 1], [0, 1]);

  // Side label
  const labelOpacity = interpolate(frame, [1.5 * fps, 2.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [1.5 * fps, 2.5 * fps], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      className="flex items-center justify-center"
      style={{ background: "#080c0a" }}
    >
      <EmeraldOrbs opacity={0.5} />

      <div className="relative z-10 flex items-center gap-16">
        {/* Left label */}
        <div
          className="flex flex-col gap-3"
          style={{
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            maxWidth: 380,
          }}
        >
          <h2
            style={{
              fontFamily: instrumentSerif,
              fontSize: 48,
              color: "#34d399",
              lineHeight: 1.15,
            }}
          >
            Ask anything about Nigeria's budgets
          </h2>
          <p
            style={{
              fontSize: 20,
              color: "rgba(255, 255, 255, 0.4)",
              lineHeight: 1.6,
            }}
          >
            Powered by AI. Backed by data.
          </p>
        </div>

        {/* Chat window */}
        <div
          style={{
            transform: `translateX(${windowX}px)`,
            opacity: windowOpacity,
          }}
        >
          <ChatWindow>
            <div className="flex-1 flex items-center justify-center">
              <p
                style={{
                  fontSize: 18,
                  color: "rgba(255, 255, 255, 0.2)",
                }}
              >
                Start a conversation...
              </p>
            </div>
          </ChatWindow>
        </div>
      </div>
    </AbsoluteFill>
  );
};
