import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  staticFile,
} from "remotion";
import { ci, countUp } from "@/lib/animation-utils";
import { dmSans, ibmPlexMono } from "@/lib/fonts";
import { EmeraldOrbs } from "@/components/EmeraldOrbs";
import { RepCard, UnknownRepCard } from "@/components/CivicUI";
import type { RepData } from "@/components/CivicUI";

const LAGOS_REPS: (
  | { type: "known"; data: RepData }
  | { type: "unknown"; roleLabel: string; location?: string }
)[] = [
  {
    type: "known",
    data: {
      name: "Babajide Sanwo-Olu",
      role: "governor",
      roleLabel: "Governor",
      party: "APC",
      constituency: "Lagos State",
      imageUrl: staticFile("officials/sanwo-olu.png"),
      completeness: 0.6,
    },
  },
  {
    type: "known",
    data: {
      name: "Idiat Oluranti Adebule",
      role: "senator",
      roleLabel: "Senator",
      party: "APC",
      constituency: "Lagos West",
      completeness: 0.4,
    },
  },
  {
    type: "known",
    data: {
      name: "Adedayo Samuel Olumuyiwa",
      role: "representative",
      roleLabel: "Federal Representative",
      party: "APC",
      constituency: "Apapa",
      completeness: 0.3,
    },
  },
  {
    type: "unknown",
    roleLabel: "State House Member",
    location: "Ikeja I Constituency",
  },
  {
    type: "unknown",
    roleLabel: "LGA Chairman",
    location: "Ikeja",
  },
  {
    type: "unknown",
    roleLabel: "Ward Councillor",
    location: "Alausa",
  },
];

export const ChainRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headerOpacity = ci(frame, [0, 12], [0, 1]);
  const headerY = ci(frame, [0, 12], [20, 0]);

  const knownCount = LAGOS_REPS.filter((r) => r.type === "known").length;
  const totalCount = LAGOS_REPS.length;
  const unknownCount = totalCount - knownCount;
  const animatedKnown = countUp(frame, 15, 35, knownCount);

  const captionOpacity = ci(frame, [80, 95], [0, 1]);
  const captionY = ci(frame, [80, 95], [15, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "#080c0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 60px",
      }}
    >
      <EmeraldOrbs opacity={0.3} />

      <div
        style={{
          width: 520,
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
        }}
      >
        {/* Header — matches representatives page */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontFamily: dmSans,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Your Representatives
          </div>
          <div
            style={{
              fontSize: 13,
              fontFamily: dmSans,
              color: "rgba(255,255,255,0.45)",
              marginTop: 4,
            }}
          >
            Lagos {">"} Ikeja {">"} Alausa
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontFamily: ibmPlexMono,
                color: "#34d399",
                fontWeight: 600,
              }}
            >
              {animatedKnown}/{totalCount} identified
            </span>
            <div
              style={{
                flex: 1,
                height: 4,
                borderRadius: 100,
                background: "rgba(255,255,255,0.06)",
                maxWidth: 180,
              }}
            >
              <div
                style={{
                  width: `${ci(frame, [20, 50], [0, (knownCount / totalCount) * 100])}%`,
                  height: "100%",
                  borderRadius: 100,
                  background: "linear-gradient(90deg, #059669, #34d399)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Chain cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {LAGOS_REPS.map((entry, i) =>
            entry.type === "known" ? (
              <RepCard
                key={i}
                rep={entry.data}
                animationStart={15}
                index={i}
              />
            ) : (
              <UnknownRepCard
                key={i}
                roleLabel={entry.roleLabel}
                location={entry.location}
                animationStart={15}
                index={i}
              />
            ),
          )}
        </div>

        {/* Bottom caption */}
        <div
          style={{
            opacity: captionOpacity,
            transform: `translateY(${captionY}px)`,
            textAlign: "center",
            marginTop: 20,
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(10px)",
              borderRadius: 14,
              padding: "12px 22px",
              border: "1px solid rgba(52, 211, 153, 0.2)",
            }}
          >
            <span
              style={{
                fontSize: 20,
                color: "#fff",
                fontFamily: dmSans,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {unknownCount} positions unknown.{" "}
              <span style={{ color: "#34d399" }}>You</span> can help fill the
              gaps.
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
