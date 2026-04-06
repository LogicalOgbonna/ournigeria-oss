import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { OpeningScene } from "./scenes/Opening";
import { StoriesScene } from "./scenes/Stories";
import { MovementScene } from "./scenes/Movement";
import { OutroScene } from "@/components/OutroScene";

/**
 * Video 5: "Together We Know — Join the Movement"
 *
 * Emotional, inspirational CTA video. Shows real citizen stories,
 * the ripple effect of one contribution, and ends with a powerful
 * call to action to join the OurNigeria community.
 *
 * 30s at 30fps = 900 frames
 * Opening:  0-6s   (0-179)
 * Stories:  6-16s  (180-479)
 * Movement: 16-25s (480-749)
 * Outro:    25-30s (750-899)
 */
export const JoinTheMovement: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.25} loop />

      <Sequence from={0} durationInFrames={180} name="Opening">
        <OpeningScene />
      </Sequence>

      <Sequence from={180} durationInFrames={300} name="Stories">
        <StoriesScene />
      </Sequence>

      <Sequence from={480} durationInFrames={270} name="Movement">
        <MovementScene />
      </Sequence>

      <Sequence from={750} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
