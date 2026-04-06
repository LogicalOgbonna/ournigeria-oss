import { OutroScene } from "@/components/OutroScene";
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { HookScene } from "./scenes/Hook";
import { ProposeFlowScene } from "./scenes/ProposeFlow";
import { VoteScene } from "./scenes/Vote";

/**
 * Video 3: "See Something, Say Something"
 *
 * Walks through the actual propose → upvote/downvote → verify flow.
 * Shows the app UI mockup with a citizen submitting a proposal and
 * others voting on it.
 *
 * 30s at 30fps = 900 frames
 * Hook:        0-5s   (0-149)
 * ProposeFlow: 5-15s  (150-449)
 * Vote:        15-25s (450-749)
 * Outro:       25-30s (750-899)
 */
export const ProposeAndVerify: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.25} loop />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <HookScene />
      </Sequence>

      <Sequence from={150} durationInFrames={300} name="ProposeFlow">
        <ProposeFlowScene />
      </Sequence>

      <Sequence from={450} durationInFrames={300} name="Vote">
        <VoteScene />
      </Sequence>

      <Sequence from={750} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
