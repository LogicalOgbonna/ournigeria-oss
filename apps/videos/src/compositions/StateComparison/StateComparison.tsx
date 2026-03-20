import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Hook } from "./scenes/Hook";
import { SideBySide } from "./scenes/SideBySide";
import { Winner } from "./scenes/Winner";
import { OutroScene } from "@/components/OutroScene";

// 35s at 30fps = 1050 frames
// Scene 1: Hook         — 0-6s    (frames 0-179)
// Scene 2: SideBySide   — 6-20s   (frames 180-599)
// Scene 3: Winner       — 20-30s  (frames 600-899)
// Scene 4: Outro        — 30-35s  (frames 900-1049)

export type StateComparisonProps = {
  state1Name: string;
  state2Name: string;
  fiscalYear: number;
  state1TotalBudget: number;
  state2TotalBudget: number;
  state1Sectors: { label: string; value: number; color: string }[];
  state2Sectors: { label: string; value: number; color: string }[];
  state1TopSector: string;
  state2TopSector: string;
  pidginCaption: string;
};

export const StateComparison: React.FC<StateComparisonProps> = (props) => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.25} />

      <Sequence from={0} durationInFrames={180} name="Hook">
        <Hook
          state1Name={props.state1Name}
          state2Name={props.state2Name}
          fiscalYear={props.fiscalYear}
        />
      </Sequence>

      <Sequence from={180} durationInFrames={420} name="Side by Side">
        <SideBySide
          state1Name={props.state1Name}
          state2Name={props.state2Name}
          fiscalYear={props.fiscalYear}
          state1Sectors={props.state1Sectors}
          state2Sectors={props.state2Sectors}
        />
      </Sequence>

      <Sequence from={600} durationInFrames={300} name="Winner">
        <Winner
          state1Name={props.state1Name}
          state2Name={props.state2Name}
          state1TotalBudget={props.state1TotalBudget}
          state2TotalBudget={props.state2TotalBudget}
          pidginCaption={props.pidginCaption}
        />
      </Sequence>

      <Sequence from={900} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
