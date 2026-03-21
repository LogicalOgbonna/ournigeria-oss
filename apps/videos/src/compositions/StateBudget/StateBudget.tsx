import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Hook } from "./scenes/Hook";
import { DataReveal } from "./scenes/DataReveal";
import { Impact } from "./scenes/Impact";
import { OutroScene } from "@/components/OutroScene";

// 30s at 30fps = 900 frames
// Scene 1: Hook         — 0-5s    (frames 0-149)
// Scene 2: Data Reveal  — 5-17s   (frames 150-509)
// Scene 3: Impact       — 17-25s  (frames 510-749)
// Scene 4: Outro        — 25-30s  (frames 750-899)

export type StateBudgetProps = {
  stateName: string;
  stateCode: string;
  fiscalYear: number;
  totalBudget: number;
  sectors: { label: string; value: number; color: string }[];
  topSector: string;
  topSectorPercent: number;
  pidginCaption: string;
};

export const StateBudget: React.FC<StateBudgetProps> = (props) => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      {/* Ambient audio - optional, only if file exists */}
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.25} />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <Hook
          stateName={props.stateName}
          fiscalYear={props.fiscalYear}
          totalBudget={props.totalBudget}
        />
      </Sequence>

      <Sequence from={150} durationInFrames={360} name="Data Reveal">
        <DataReveal
          stateName={props.stateName}
          fiscalYear={props.fiscalYear}
          totalBudget={props.totalBudget}
          sectors={props.sectors}
        />
      </Sequence>

      <Sequence from={510} durationInFrames={240} name="Impact">
        <Impact
          stateName={props.stateName}
          totalBudget={props.totalBudget}
          topSector={props.topSector}
          topSectorPercent={props.topSectorPercent}
          pidginCaption={props.pidginCaption}
        />
      </Sequence>

      <Sequence from={750} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
