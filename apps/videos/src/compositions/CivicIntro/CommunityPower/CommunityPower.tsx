import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { HookScene } from "./scenes/Hook";
import { ProblemScene } from "./scenes/Problem";
import { SolutionScene } from "./scenes/Solution";
import { OutroScene } from "@/components/OutroScene";

/**
 * Video 2: "People Power — Verified by Citizens"
 *
 * Shows the problem (incomplete official data) and the community solution
 * (citizens propose, verify, and maintain the database together).
 *
 * 30s at 30fps = 900 frames
 * Hook:     0-5s   (0-149)
 * Problem:  5-14s  (150-419)
 * Solution: 14-25s (420-749)
 * Outro:    25-30s (750-899)
 */
export const CommunityPower: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.25} loop />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <HookScene />
      </Sequence>

      <Sequence from={150} durationInFrames={270} name="Problem">
        <ProblemScene />
      </Sequence>

      <Sequence from={420} durationInFrames={330} name="Solution">
        <SolutionScene />
      </Sequence>

      <Sequence from={750} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
