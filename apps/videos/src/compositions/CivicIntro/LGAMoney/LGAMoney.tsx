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
import { LGABreakdownScene } from "./scenes/LGABreakdown";
import { WhereItGoesScene } from "./scenes/WhereItGoes";
import { OutroScene } from "./scenes/Outro";

/**
 * Video 6: "Your LGA Got ₦XB. Who Decided How It's Spent?"
 *
 * 23s at 30fps = 690 frames
 * Hook:         0-5s   (0-149)
 * LGABreakdown: 5-13s  (150-389)
 * WhereItGoes:  13-18s (390-539)
 * Outro:        18-23s (540-689)
 */
export const LGAMoney: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <AudioLayers />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <HookScene />
      </Sequence>

      <Sequence from={150} durationInFrames={240} name="LGABreakdown">
        <LGABreakdownScene />
      </Sequence>

      <Sequence from={390} durationInFrames={150} name="WhereItGoes">
        <WhereItGoesScene />
      </Sequence>

      <Sequence from={540} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

const AudioLayers: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <>
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
    </>
  );
};
