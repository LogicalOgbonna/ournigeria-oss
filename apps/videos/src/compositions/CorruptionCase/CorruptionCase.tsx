import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Hook } from "./scenes/Hook";
import { CaseDetails } from "./scenes/CaseDetails";
import { Impact } from "./scenes/Impact";
import { OutroScene } from "@/components/OutroScene";

// 30s at 30fps = 900 frames
// Scene 1: Hook          — 0-5s    (frames 0-149)
// Scene 2: Case Details  — 5-17s   (frames 150-509)
// Scene 3: Impact        — 17-25s  (frames 510-749)
// Scene 4: Outro         — 25-30s  (frames 750-899)

export type CorruptionCaseProps = {
  officialName: string;
  agency: string;
  amountAlleged: number;
  status: string;
  state: string;
  details: string;
  pidginCaption: string;
};

export const CorruptionCase: React.FC<CorruptionCaseProps> = (props) => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.25} />

      <Sequence from={0} durationInFrames={150} name="Hook">
        <Hook
          officialName={props.officialName}
          amountAlleged={props.amountAlleged}
          status={props.status}
        />
      </Sequence>

      <Sequence from={150} durationInFrames={360} name="Case Details">
        <CaseDetails
          officialName={props.officialName}
          agency={props.agency}
          amountAlleged={props.amountAlleged}
          status={props.status}
          state={props.state}
          details={props.details}
        />
      </Sequence>

      <Sequence from={510} durationInFrames={240} name="Impact">
        <Impact
          amountAlleged={props.amountAlleged}
          pidginCaption={props.pidginCaption}
        />
      </Sequence>

      <Sequence from={750} durationInFrames={150} name="Outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
