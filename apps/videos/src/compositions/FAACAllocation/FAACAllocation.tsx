import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Hook } from "./scenes/Hook";
import { DataReveal } from "./scenes/DataReveal";
import { Trends } from "./scenes/Trends";
import { OutroScene } from "@/components/OutroScene";

// 30s at 30fps = 900 frames
// Scene 1: Hook         — 0-5s    (frames 0-149)
// Scene 2: Data Reveal  — 5-17s   (frames 150-509)
// Scene 3: Trends       — 17-25s  (frames 510-749)
// Scene 4: Outro        — 25-30s  (frames 750-899)

export type FAACAllocationProps = {
  stateName: string;
  fiscalYear: number;
  totalAllocation: number;
  monthlyData: { month: string; amount: number }[];
  pidginCaption: string;
};

export const FAACAllocation: React.FC<FAACAllocationProps> = (props) => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.25} />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <Hook
          stateName={props.stateName}
          fiscalYear={props.fiscalYear}
          totalAllocation={props.totalAllocation}
        />
      </Sequence>

      <Sequence from={150} durationInFrames={360} name="Data Reveal">
        <DataReveal
          stateName={props.stateName}
          monthlyData={props.monthlyData}
        />
      </Sequence>

      <Sequence from={510} durationInFrames={240} name="Trends">
        <Trends
          stateName={props.stateName}
          monthlyData={props.monthlyData}
          pidginCaption={props.pidginCaption}
        />
      </Sequence>

      <Sequence from={750} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
