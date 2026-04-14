import React from "react";
import { Audio, AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { RepAbsenteeismHookScene } from "./scenes/Hook";
import { VoteRecordScene } from "./scenes/VoteRecord";
import { CostOfAbsenceScene } from "./scenes/CostOfAbsence";
import { RepAbsenteeismOutroScene } from "./scenes/Outro";

/**
 * Video: "Your Rep Skipped X% of Votes"
 *
 * 23s at 30fps = 690 frames
 * Hook:          0-5s   (0-149)   — "You pay their salary. Are they showing up?"
 * VoteRecord:    5-13s  (150-389) — Attendance table with colored bars
 * CostOfAbsence: 13-18s (390-539) — ₦2.94B wasted on absent reps
 * Outro:         18-23s (540-689) — Search your rep on ournigeria.ng
 */
export const RepAbsenteeism: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <AudioLayers />
      <Sequence from={0} durationInFrames={150} name="Hook">
        <RepAbsenteeismHookScene />
      </Sequence>
      <Sequence from={150} durationInFrames={240} name="VoteRecord">
        <VoteRecordScene />
      </Sequence>
      <Sequence from={390} durationInFrames={150} name="CostOfAbsence">
        <CostOfAbsenceScene />
      </Sequence>
      <Sequence from={540} durationInFrames={150} name="Outro">
        <RepAbsenteeismOutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const AudioLayers: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <Audio
      src={staticFile("audio/bg-music.mp3")}
      volume={(f) => interpolate(f, [0, 1.5 * fps, 5 * fps, 18 * fps, 22 * fps, 23 * fps], [0, 0.05, 0.075, 0.1, 0.075, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      loop
    />
  );
};
