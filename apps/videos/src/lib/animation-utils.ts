import { interpolate, spring } from "remotion";

/** Convert seconds to frame number */
export const sec = (s: number, fps: number) => Math.round(s * fps);

/** Clamped interpolation shorthand */
export const ci = (
  frame: number,
  inputRange: [number, number],
  outputRange: [number, number]
) =>
  interpolate(frame, inputRange, outputRange, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Spring with delay */
export const delayedSpring = (
  frame: number,
  fps: number,
  delay: number,
  config?: { damping?: number; stiffness?: number; mass?: number }
) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {
      damping: config?.damping ?? 20,
      stiffness: config?.stiffness ?? 100,
      mass: config?.mass ?? 1,
    },
  });

/** Typewriter: returns number of visible characters */
export const typewriterCount = (
  frame: number,
  startFrame: number,
  totalChars: number,
  msPerChar: number,
  fps: number
) => {
  const framesPerChar = (msPerChar / 1000) * fps;
  const elapsed = Math.max(0, frame - startFrame);
  return Math.min(totalChars, Math.floor(elapsed / framesPerChar));
};

/** Cursor blink: returns boolean for visibility */
export const cursorBlink = (frame: number, fps: number, blinkRate = 0.5) =>
  Math.floor((frame / fps) / blinkRate) % 2 === 0;

/** Count-up animation for numbers */
export const countUp = (
  frame: number,
  startFrame: number,
  endFrame: number,
  target: number
) => {
  const progress = ci(frame, [startFrame, endFrame], [0, 1]);
  return Math.round(progress * target);
};

/** Format number with commas */
export const formatNumber = (n: number) => n.toLocaleString();

/** Format as Naira */
export const formatNaira = (n: number) => {
  if (n >= 1_000_000_000_000) return `₦${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  return `₦${formatNumber(n)}`;
};

/** Bezier easing between waypoints for cursor movement */
export interface CursorWaypoint {
  x: number;
  y: number;
  frame: number;
}

export const interpolateCursorPath = (
  frame: number,
  waypoints: CursorWaypoint[]
): { x: number; y: number; visible: boolean } => {
  if (waypoints.length === 0) return { x: 0, y: 0, visible: false };
  if (frame < waypoints[0].frame)
    return { x: waypoints[0].x, y: waypoints[0].y, visible: false };

  for (let i = 0; i < waypoints.length - 1; i++) {
    const curr = waypoints[i];
    const next = waypoints[i + 1];
    if (frame >= curr.frame && frame <= next.frame) {
      const t = ci(frame, [curr.frame, next.frame], [0, 1]);
      // Ease in-out cubic
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      return {
        x: curr.x + (next.x - curr.x) * eased,
        y: curr.y + (next.y - curr.y) * eased,
        visible: true,
      };
    }
  }

  const last = waypoints[waypoints.length - 1];
  return { x: last.x, y: last.y, visible: true };
};
