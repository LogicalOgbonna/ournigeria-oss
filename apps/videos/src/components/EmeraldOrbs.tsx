import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

const orbs = [
  { x: 200, y: 250, size: 300, delay: 0 },
  { x: 700, y: 700, size: 280, delay: 8 },
  { x: 450, y: 150, size: 220, delay: 15 },
  { x: 750, y: 200, size: 180, delay: 5 },
  { x: 150, y: 700, size: 250, delay: 12 },
];

export const EmeraldOrbs: React.FC<{ opacity?: number }> = ({
  opacity = 1,
}) => {
  const frame = useCurrentFrame();

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ opacity }}>
      {orbs.map((orb, i) => {
        const drift = Math.sin((frame + orb.delay * 10) * 0.015) * 30;
        const driftY = Math.cos((frame + orb.delay * 10) * 0.012) * 20;
        const pulse = interpolate(
          Math.sin((frame + orb.delay * 5) * 0.03),
          [-1, 1],
          [0.8, 1.2],
        );

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: orb.x + drift,
              top: orb.y + driftY,
              width: orb.size * pulse,
              height: orb.size * pulse,
              background: `radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, rgba(5, 150, 105, 0.04) 60%, transparent 80%)`,
              filter: "blur(60px)",
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
};
