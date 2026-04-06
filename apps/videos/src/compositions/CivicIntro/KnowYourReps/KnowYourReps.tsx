import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HookScene } from "./scenes/Hook";
import { LocationPickScene } from "./scenes/LocationPick";
import { ChainRevealScene } from "./scenes/ChainReveal";
import { ContributeOutroScene } from "./scenes/ContributeOutro";

/**
 * Video 1: "Do You Know Who Governs You?"
 *
 * 23s at 30fps = 690 frames
 * Hook:         0-5s   (0-149)
 * LocationPick: 5-13s  (150-389)
 * ChainReveal:  13-18s (390-539)
 * Outro:        18-23s (540-689)
 */
export const KnowYourReps: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <AudioLayers />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <HookScene />
      </Sequence>

      <Sequence from={150} durationInFrames={240} name="LocationPick">
        <LocationPickScene />
      </Sequence>

      <Sequence from={390} durationInFrames={150} name="ChainReveal">
        <ChainRevealScene />
      </Sequence>

      <Sequence from={540} durationInFrames={150} name="ContributeOutro">
        <ContributeOutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Audio: one music bed + three punctuation SFX.
 *
 * The music does the heavy lifting. SFX only mark the moments
 * that matter emotionally:
 *   1. "Find My Representatives" button — the user takes action
 *   2. First unknown card — the emotional turn
 *   3. Big missing number in the outro — the gut punch
 */
const AudioLayers: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <>
      {/* Background music — sits underneath everything as a gentle bed.
          "Feelgood Groove" by MusicInMedia. Pixabay Content License.
          Peaks at 0.08 — audible but never competing with visuals. */}
      <Audio
        src={staticFile("audio/bg-music.mp3")}
        volume={(f) =>
          interpolate(
            f,
            [0, 1.5 * fps, 5 * fps, 18 * fps, 22 * fps, 23 * fps],
            [0, 0.02, 0.03, 0.04, 0.03, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
        loop
      />

    
    </>
  );
};
