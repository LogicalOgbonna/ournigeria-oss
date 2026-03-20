import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Hook } from "./scenes/Hook";
import { Equivalents } from "./scenes/Equivalents";
import { Summary } from "./scenes/Summary";
import { OutroScene } from "@/components/OutroScene";

// 25s at 30fps = 750 frames
// Scene 1: Hook         — 0-4s    (frames 0-119)
// Scene 2: Equivalents  — 4-16s   (frames 120-479)
// Scene 3: Summary      — 16-20s  (frames 480-599)
// Scene 4: Outro        — 20-25s  (frames 600-749)

export type MoneyCouldBuyProps = {
  stateName: string;
  fiscalYear: number;
  amount: number;
  context: string;
  pidginCaption: string;
};

export const MoneyCouldBuy: React.FC<MoneyCouldBuyProps> = (props) => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.25} />

      <Sequence from={0} durationInFrames={120} name="Hook">
        <Hook
          stateName={props.stateName}
          fiscalYear={props.fiscalYear}
          amount={props.amount}
          context={props.context}
        />
      </Sequence>

      <Sequence from={120} durationInFrames={360} name="Equivalents">
        <Equivalents amount={props.amount} />
      </Sequence>

      <Sequence from={480} durationInFrames={120} name="Summary">
        <Summary pidginCaption={props.pidginCaption} />
      </Sequence>

      <Sequence from={600} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
