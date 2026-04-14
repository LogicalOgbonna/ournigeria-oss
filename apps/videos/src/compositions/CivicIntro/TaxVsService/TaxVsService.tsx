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
import { WhatYouPaidScene } from "./scenes/WhatYouPaid";
import { ServiceGapScene } from "./scenes/ServiceGap";
import { OutroScene } from "./scenes/Outro";

/**
 * Video 10: "You Paid VAT. What Did You Get Back?"
 *
 * 23s at 30fps = 690 frames
 * Hook:        0-5s   (0-149)
 * WhatYouPaid: 5-13s  (150-389)
 * ServiceGap:  13-18s (390-539)
 * Outro:       18-23s (540-689)
 */
export const TaxVsService: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <AudioLayers />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <HookScene />
      </Sequence>

      <Sequence from={150} durationInFrames={240} name="WhatYouPaid">
        <WhatYouPaidScene />
      </Sequence>

      <Sequence from={390} durationInFrames={150} name="ServiceGap">
        <ServiceGapScene />
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
