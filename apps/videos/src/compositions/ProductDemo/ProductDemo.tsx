import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { BrandIntro } from "./scenes/BrandIntro";
import { ChatAppears } from "./scenes/ChatAppears";
import { UserTypes } from "./scenes/UserTypes";
import { AIResponds } from "./scenes/AIResponds";
import { ClosingCTA } from "./scenes/ClosingCTA";
import { USER_QUESTION } from "@/lib/demo-data";

// 25s at 30fps = 750 frames
// Scene 1: Brand Intro     — 0-4s    (frames 0-119)
// Scene 2: Chat Appears    — 4-8s    (frames 120-239)
// Scene 3: User Types      — 8-14s   (frames 240-419)
// Scene 4: AI Responds     — 14-21s  (frames 420-629)
// Scene 5: Closing CTA     — 21-25s  (frames 630-749)

// Typing SFX: each character gets a key click
// Typing runs from frame 9 to 75 within UserTypes (absolute 249–315)
const TYPING_START = 249;
const TYPING_END = 315;
const CHAR_COUNT = USER_QUESTION.length;
const FRAMES_PER_CHAR = (TYPING_END - TYPING_START) / CHAR_COUNT;

const typingFrames = Array.from({ length: CHAR_COUNT }, (_, i) =>
  Math.round(TYPING_START + i * FRAMES_PER_CHAR),
);

// Send sound at relative frame 90 of UserTypes = absolute 330
const SEND_FRAME = 330;

// Whoosh transitions at scene boundaries
const WHOOSH_FRAMES = [118, 238, 418, 628];

export const ProductDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#080c0a" }}>
      {/* Ambient background audio */}
      <Audio src={staticFile("audio/ambient.mp3")} volume={0.35} />

      {/* Whoosh transitions */}
      {WHOOSH_FRAMES.map((f) => (
        <Sequence key={`whoosh-${f}`} from={f} durationInFrames={15}>
          <Audio src={staticFile("audio/whoosh.mp3")} volume={0.25} />
        </Sequence>
      ))}

      {/* Typing key sounds */}
      {typingFrames.map((f, i) => (
        <Sequence key={`key-${i}`} from={f} durationInFrames={4}>
          <Audio src={staticFile("audio/type-key.mp3")} volume={0.15} />
        </Sequence>
      ))}

      {/* Send sound */}
      <Sequence from={SEND_FRAME} durationInFrames={10}>
        <Audio src={staticFile("audio/send.mp3")} volume={0.3} />
      </Sequence>

      {/* Scenes */}
      <Sequence from={0} durationInFrames={120} name="Brand Intro">
        <BrandIntro />
      </Sequence>

      <Sequence from={120} durationInFrames={120} name="Chat Appears">
        <ChatAppears />
      </Sequence>

      <Sequence from={240} durationInFrames={180} name="User Types">
        <UserTypes />
      </Sequence>

      <Sequence from={420} durationInFrames={210} name="AI Responds">
        <AIResponds />
      </Sequence>

      <Sequence from={630} durationInFrames={120} name="Closing CTA">
        <ClosingCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
