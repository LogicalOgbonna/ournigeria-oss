import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EmeraldOrbs } from "../components/EmeraldOrbs";
import { ChatWindow } from "../components/ChatWindow";
import { MessageBubble } from "../components/MessageBubble";
import { USER_QUESTION } from "@/lib/demo-data";
import { inter } from "@/lib/fonts";

export const UserTypes: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Typewriter effect in input: frames 0 to ~3s
  const typingDuration = 2.5 * fps; // 75 frames
  const charsToShow = Math.min(
    Math.floor(
      interpolate(frame, [0.3 * fps, typingDuration], [0, USER_QUESTION.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
    USER_QUESTION.length,
  );

  const typedText = USER_QUESTION.slice(0, charsToShow);
  const isTyping = charsToShow < USER_QUESTION.length;
  const cursorVisible = isTyping && Math.floor(frame / 8) % 2 === 0;

  // After typing, message "sends" — input clears and bubble appears
  const sendFrame = typingDuration + 0.5 * fps;
  const hasSent = frame > sendFrame;

  const bubbleSpring = spring({
    frame: Math.max(0, frame - sendFrame),
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  const bubbleOpacity = interpolate(bubbleSpring, [0, 1], [0, 1]);
  const bubbleY = interpolate(bubbleSpring, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      className="flex items-center justify-center"
      style={{ background: "#080c0a" }}
    >
      <EmeraldOrbs opacity={0.5} />

      <div className="relative z-10">
        <ChatWindow>
          <div className="flex-1 flex flex-col justify-end gap-4">
            {/* Sent message bubble */}
            {hasSent && (
              <div
                style={{
                  opacity: bubbleOpacity,
                  transform: `translateY(${bubbleY}px)`,
                }}
              >
                <MessageBubble type="user">{USER_QUESTION}</MessageBubble>
              </div>
            )}
          </div>

          {/* Override the input bar to show typing */}
          {!hasSent && (
            <div
              className="absolute bottom-0 left-0 right-0 px-6 py-4"
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div
                className="rounded-xl px-5 py-3 flex items-center"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  fontFamily: inter,
                  fontSize: 18,
                  color: "rgba(255, 255, 255, 0.9)",
                  minHeight: 48,
                }}
              >
                {typedText}
                {cursorVisible && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 22,
                      background: "#34d399",
                      marginLeft: 1,
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </ChatWindow>
      </div>
    </AbsoluteFill>
  );
};
