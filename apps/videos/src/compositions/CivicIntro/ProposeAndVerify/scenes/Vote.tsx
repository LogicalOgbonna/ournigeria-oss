import { ActivityItem, ProposalCard, VoteButtons } from "@/components/CivicUI";
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

export const VoteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = ci(frame, [0, 12], [0, 1]);
  const titleY = ci(frame, [0, 12], [30, 0]);

  const verifiedScale = spring({
    frame: Math.max(0, frame - 200),
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const verifiedOpacity = ci(frame, [200, 215], [0, 1]);

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
          Community Voting
        </div>
        <div
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.4)",
            fontFamily: dmSans,
            marginTop: 4,
          }}
        >
          Others review and vote on proposals
        </div>
      </div>

      {/* Proposal card */}
      <div style={{ zIndex: 10, marginBottom: 16 }}>
        <ProposalCard
          officialName="Alhaji Bello Mahmud"
          field="Ward Councillor, Alausa"
          proposedValue="Name + INEC evidence"
          proposedBy="Citizen_Lagos42"
          animationStart={15}
        />
      </div>

      {/* Vote buttons */}
      <div style={{ zIndex: 10, marginBottom: 24, padding: "0 20px" }}>
        <VoteButtons
          upvotes={12}
          downvotes={1}
          animationStart={50}
          showAction="up"
        />
      </div>

      {/* Activity feed */}
      <div
        style={{
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.3)",
            fontFamily: dmSans,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 4,
            opacity: ci(frame, [80, 90], [0, 1]),
          }}
        >
          Live Activity
        </div>
        <ActivityItem
          emoji="👍"
          text="Citizen verified Alhaji Bello as councillor"
          time="2m"
          animationStart={90}
          index={0}
        />
        <ActivityItem
          emoji="👍"
          text="Another citizen upvoted the proposal"
          time="5m"
          animationStart={90}
          index={1}
        />
        <ActivityItem
          emoji="📝"
          text="Photo added as evidence"
          time="8m"
          animationStart={90}
          index={2}
        />
        <ActivityItem
          emoji="👍"
          text="Citizen from Alausa ward confirmed"
          time="12m"
          animationStart={90}
          index={3}
        />
      </div>

      {/* Verified badge */}
      <div
        style={{
          opacity: verifiedOpacity,
          transform: `scale(${verifiedScale})`,
          zIndex: 100,
          position: "absolute",
          bottom: 80,
          left: 50,
          right: 50,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(5, 150, 105, 0.2), rgba(52, 211, 153, 0.1))",
            borderRadius: 20,
            padding: "20px 24px",
            border: "2px solid rgba(52, 211, 153, 0.4)",
            textAlign: "center",
            boxShadow: "0 0 40px rgba(52, 211, 153, 0.15)",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#34d399",
              fontFamily: dmSans,
            }}
          >
            ✅ Community Verified
          </div>
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.5)",
              fontFamily: dmSans,
              marginTop: 6,
            }}
          >
            13 citizens confirmed this official
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
