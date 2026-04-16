import React from "react";
import { Audio, AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { DebtClockHookScene } from "./scenes/Hook";
import { DebtBreakdownScene } from "./scenes/Breakdown";
import { DebtImpactScene } from "./scenes/Impact";
import { DebtClockOutroScene } from "./scenes/Outro";

/**
 * Video: "Nigeria Borrows ₦1M Every 30 Seconds"
 *
 * 23s at 30fps = 690 frames
 * Hook:      0-5s   (0-149)   — Live debt counter, shocking per-second figure
 * Breakdown: 5-13s  (150-389) — Who we owe, per-capita share
 * Impact:    13-18s (390-539) — What ₦121T could have built instead
 * Outro:     18-23s (540-689) — CTA + ournigeria.ng
 */
export const DebtClock: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <AudioLayers />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <DebtClockHookScene />
      </Sequence>

      <Sequence from={150} durationInFrames={240} name="Breakdown">
        <DebtBreakdownScene />
      </Sequence>

      <Sequence from={390} durationInFrames={150} name="Impact">
        <DebtImpactScene />
      </Sequence>

      <Sequence from={540} durationInFrames={150} name="Outro">
        <DebtClockOutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const AudioLayers: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <Audio
      src={staticFile("audio/bg-music.mp3")}
      volume={(f) =>
        interpolate(
          f,
          [0, 1.5 * fps, 5 * fps, 18 * fps, 22 * fps, 23 * fps],
          [0, 0.05, 0.075, 0.1, 0.075, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      }
      loop
    />
  );
};
