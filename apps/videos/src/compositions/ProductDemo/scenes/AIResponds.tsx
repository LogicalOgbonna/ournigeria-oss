import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EmeraldOrbs } from "../components/EmeraldOrbs";
import { ChatWindow } from "../components/ChatWindow";
import {
  MessageBubble,
  StatHighlight,
  SourceCitation,
} from "../components/MessageBubble";
import { USER_QUESTION, AI_RESPONSE } from "@/lib/demo-data";
import { ibmPlexMono } from "@/lib/fonts";

const MiniBarChart: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const maxBarWidth = 180;

  return (
    <div className="flex flex-col gap-2 mt-4">
      {AI_RESPONSE.chartData.map((item, i) => {
        const barProgress = spring({
          frame: Math.max(0, frame - 3 * fps - i * 4),
          fps,
          config: { damping: 25, stiffness: 80 },
        });

        return (
          <div key={item.label} className="flex items-center gap-3">
            <span
              style={{
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.5)",
                width: 110,
                textAlign: "right",
                fontFamily: ibmPlexMono,
              }}
            >
              {item.label}
            </span>
            <div
              className="h-5 rounded-sm"
              style={{
                width: barProgress * (item.value / 36) * maxBarWidth,
                background: item.color,
                opacity: 0.85,
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: "rgba(255, 255, 255, 0.4)",
                fontFamily: ibmPlexMono,
                opacity: barProgress,
              }}
            >
              {item.value}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const AIResponds: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // AI response appears gradually
  const responseSpring = spring({
    frame,
    fps,
    config: { damping: 25, stiffness: 60 },
  });

  const introChars = Math.floor(
    interpolate(frame, [0.3 * fps, 1.5 * fps], [0, AI_RESPONSE.intro.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  const statOpacity = interpolate(frame, [1.5 * fps, 2.2 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const statScale = spring({
    frame: Math.max(0, frame - 1.5 * fps),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const detailsOpacity = interpolate(frame, [2.5 * fps, 3.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sourceOpacity = interpolate(frame, [4.5 * fps, 5.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      className="flex items-center justify-center"
      style={{ background: "#080c0a" }}
    >
      <EmeraldOrbs opacity={0.4} />

      <div className="relative z-10">
        <ChatWindow>
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* User message (already sent) */}
            <MessageBubble type="user">{USER_QUESTION}</MessageBubble>

            {/* AI response */}
            <div style={{ opacity: responseSpring }}>
              <MessageBubble type="ai">
                <div className="flex flex-col gap-2">
                  {/* Intro text streaming */}
                  <span>{AI_RESPONSE.intro.slice(0, introChars)}</span>

                  {/* Big stat */}
                  <div
                    style={{
                      opacity: statOpacity,
                      transform: `scale(${interpolate(statScale, [0, 1], [0.9, 1])})`,
                      transformOrigin: "left",
                    }}
                  >
                    <StatHighlight>{AI_RESPONSE.stat}</StatHighlight>{" "}
                    <span style={{ fontSize: 18 }}>
                      {AI_RESPONSE.statLabel}
                    </span>
                  </div>

                  {/* Details */}
                  <p style={{ opacity: detailsOpacity, fontSize: 17 }}>
                    {AI_RESPONSE.details}
                  </p>

                  {/* Mini bar chart */}
                  <div style={{ opacity: detailsOpacity }}>
                    <MiniBarChart frame={frame} fps={fps} />
                  </div>

                  {/* Source */}
                  <SourceCitation>
                    <span style={{ opacity: sourceOpacity }}>
                      {AI_RESPONSE.source}
                    </span>
                  </SourceCitation>
                </div>
              </MessageBubble>
            </div>
          </div>
        </ChatWindow>
      </div>
    </AbsoluteFill>
  );
};
