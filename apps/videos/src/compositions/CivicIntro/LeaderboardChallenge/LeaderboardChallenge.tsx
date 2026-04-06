import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { HookScene } from "./scenes/Hook";
import { RankingsScene } from "./scenes/Rankings";
import { ChallengeScene } from "./scenes/Challenge";
import { OutroScene } from "@/components/OutroScene";

/**
 * Video 4: "Your State, Your Responsibility"
 *
 * Shows the state completeness leaderboard — which states have the most
 * identified officials? Challenges viewers to improve their state's ranking.
 *
 * 30s at 30fps = 900 frames
 * Hook:      0-5s   (0-149)
 * Rankings:  5-17s  (150-509)
 * Challenge: 17-25s (510-749)
 * Outro:     25-30s (750-899)
 */
export const LeaderboardChallenge: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.25} loop />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <HookScene />
      </Sequence>

      <Sequence from={150} durationInFrames={360} name="Rankings">
        <RankingsScene />
      </Sequence>

      <Sequence from={510} durationInFrames={240} name="Challenge">
        <ChallengeScene />
      </Sequence>

      <Sequence from={750} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
