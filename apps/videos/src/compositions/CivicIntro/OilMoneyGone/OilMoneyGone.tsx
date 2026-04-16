import React from "react";
import { Audio, AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { OilMoneyHookScene } from "./scenes/Hook";
import { MoneyFlowScene } from "./scenes/MoneyFlow";
import { YourShareScene } from "./scenes/YourShare";
import { OilMoneyOutroScene } from "./scenes/Outro";

/**
 * Video: "Nigeria Made ₦14.7T in Oil. Here's What's Left for You."
 *
 * 23s at 30fps = 690 frames
 * Hook:      0-5s   (0-149)   — "We earned ₦14.7T. Why does nothing work?"
 * MoneyFlow: 5-13s  (150-389) — Where each naira goes (debt / recurrent / capital)
 * YourShare: 13-18s (390-539) — Per-capita earned vs per-capita received
 * Outro:     18-23s (540-689) — Track it on ournigeria.ng
 */
export const OilMoneyGone: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <AudioLayers />
      <Sequence from={0} durationInFrames={150} name="Hook"><OilMoneyHookScene /></Sequence>
      <Sequence from={150} durationInFrames={240} name="MoneyFlow"><MoneyFlowScene /></Sequence>
      <Sequence from={390} durationInFrames={150} name="YourShare"><YourShareScene /></Sequence>
      <Sequence from={540} durationInFrames={150} name="Outro"><OilMoneyOutroScene /></Sequence>
    </AbsoluteFill>
  );
};

const AudioLayers: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <Audio src={staticFile("audio/bg-music.mp3")} volume={(f) => interpolate(f, [0, 1.5 * fps, 5 * fps, 18 * fps, 22 * fps, 23 * fps], [0, 0.05, 0.075, 0.1, 0.075, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} loop />
  );
};
