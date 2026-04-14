import React from "react";
import { Audio, AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { GovernorReportHookScene } from "./scenes/Hook";
import { GovernorScorecardScene } from "./scenes/Scorecard";
import { YourStateScene } from "./scenes/YourState";
import { GovernorReportOutroScene } from "./scenes/Outro";

/**
 * Video: "Your Governor's Report Card"
 *
 * 23s at 30fps = 690 frames
 * Hook:      0-5s   (0-149)   — "5 Promises. How Many Did They Keep?"
 * Scorecard: 5-13s  (150-389) — Governor grades A-F by state
 * YourState: 13-18s (390-539) — Your specific metrics & gaps
 * Outro:     18-23s (540-689) — CTA to check your state
 */
export const GovernorReport: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <AudioLayers />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <GovernorReportHookScene />
      </Sequence>

      <Sequence from={150} durationInFrames={240} name="Scorecard">
        <GovernorScorecardScene />
      </Sequence>

      <Sequence from={390} durationInFrames={150} name="YourState">
        <YourStateScene />
      </Sequence>

      <Sequence from={540} durationInFrames={150} name="Outro">
        <GovernorReportOutroScene />
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
