import { OfficialCard } from "@/components/CivicUI";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { ci, typewriterCount } from "@/lib/animation-utils";
import { dmSans } from "@/lib/fonts";
import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const ProposeFlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 12], [0, 1]);
  const titleY = ci(frame, [0, 12], [30, 0]);

  const officialAppear = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const proposalAppear = ci(frame, [90, 110], [0, 1]);

  const formAppear = spring({
    frame: Math.max(0, frame - 130),
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const PROPOSED_NAME = "Alhaji Bello Mahmud";
  const nameChars = typewriterCount(frame, 150, PROPOSED_NAME.length, 60, fps);
  const displayName = PROPOSED_NAME.slice(0, nameChars);

  const submitProg = spring({
    frame: Math.max(0, frame - 220),
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const successOpacity = ci(frame, [240, 255], [0, 1]);
  const successScale = spring({
    frame: Math.max(0, frame - 240),
    fps,
    config: { damping: 12, stiffness: 100 },
  });

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
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontFamily: dmSans,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          How to Propose
        </div>
        <div
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.4)",
            fontFamily: dmSans,
            marginTop: 4,
          }}
        >
          Found a missing official? Submit a proposal.
        </div>
      </div>

      {/* Unknown official card */}
      <div style={{ opacity: officialAppear, zIndex: 10, marginBottom: 16 }}>
        <OfficialCard
          role="Ward Councillor, Alausa"
          known={false}
          animationStart={0}
          highlight
        />
      </div>

      {/* Arrow + "Tap Propose" indicator */}
      <div
        style={{
          opacity: proposalAppear,
          zIndex: 10,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 18,
            color: "#34d399",
            fontFamily: dmSans,
            fontWeight: 600,
          }}
        >
          ↓ Tap "Propose" to fill in details
        </span>
      </div>

      {/* Proposal form mock */}
      <div
        style={{
          opacity: formAppear,
          transform: `scale(${0.95 + formAppear * 0.05})`,
          zIndex: 10,
          padding: "20px 24px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          flex: 1,
        }}
      >
        {/* Name field */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              fontFamily: dmSans,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            Official Name
          </div>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              fontSize: 16,
              fontFamily: dmSans,
              color: nameChars > 0 ? "#fff" : "rgba(255,255,255,0.3)",
              fontWeight: nameChars > 0 ? 600 : 400,
              minHeight: 44,
            }}
          >
            {nameChars > 0 ? displayName : "Enter name..."}
            {nameChars > 0 && nameChars < PROPOSED_NAME.length && (
              <span
                style={{
                  opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                  color: "#34d399",
                }}
              >
                |
              </span>
            )}
          </div>
        </div>

        {/* Source field */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              fontFamily: dmSans,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            Source / Evidence
          </div>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 14,
              fontFamily: dmSans,
              color: ci(frame, [190, 200], [0, 1]) > 0.5 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
            }}
          >
            {ci(frame, [190, 200], [0, 1]) > 0.5
              ? "INEC ward results page, 2023"
              : "Link or description..."}
          </div>
        </div>

        {/* Submit button */}
        <div
          style={{
            background:
              submitProg > 0.5
                ? "linear-gradient(135deg, #047857, #059669)"
                : "linear-gradient(135deg, #059669, #34d399)",
            borderRadius: 14,
            padding: "14px 0",
            textAlign: "center",
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            fontFamily: dmSans,
            transform: `scale(${submitProg > 0 ? 0.95 + submitProg * 0.05 : 1})`,
          }}
        >
          {submitProg > 0.5 ? "✓ Proposal Submitted!" : "Submit Proposal"}
        </div>
      </div>

      {/* Success banner */}
      <div
        style={{
          opacity: successOpacity,
          transform: `scale(${successScale})`,
          zIndex: 100,
          position: "absolute",
          bottom: 80,
          left: 50,
          right: 50,
        }}
      >
        <div
          style={{
            background: "rgba(5, 150, 105, 0.15)",
            borderRadius: 16,
            padding: "14px 24px",
            border: "1px solid rgba(52, 211, 153, 0.3)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: "#34d399",
              fontFamily: dmSans,
              fontWeight: 600,
            }}
          >
            🎉 Now the community will review your proposal
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
