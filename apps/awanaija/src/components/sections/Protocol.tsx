"use client";

import { PROTOCOL_STEPS } from "@/lib/constants";

// ═══ SVG Animations for each card ═══
function RotatingMotif() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-28 w-28 text-emerald-500/15 dark:text-emerald-400/10"
    >
      <g
        className="animate-rotate-slow"
        style={{ transformOrigin: "60px 60px" }}
      >
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <circle
          cx="60"
          cy="60"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
        <circle
          cx="60"
          cy="60"
          r="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <circle
          cx="60"
          cy="60"
          r="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="60" cy="60" r="3" fill="currentColor" />
      </g>
    </svg>
  );
}

function ScanGrid() {
  const dots = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 8; col++) {
      dots.push(
        <circle
          key={`${row}-${col}`}
          cx={10 + col * 15}
          cy={10 + row * 15}
          r="1.5"
          fill="currentColor"
          opacity="0.3"
        />,
      );
    }
  }

  return (
    <svg
      viewBox="0 0 120 100"
      className="h-28 w-full text-emerald-500/20 dark:text-emerald-400/15"
    >
      {dots}
      {/* Scanning line */}
      <rect
        x="0"
        y="0"
        width="30"
        height="100"
        fill="url(#scan-grad)"
        className="animate-scan"
      />
      <defs>
        <linearGradient id="scan-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(16,185,129,0)" />
          <stop offset="50%" stopColor="rgba(16,185,129,0.15)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PulseWave() {
  return (
    <svg
      viewBox="0 0 200 60"
      className="h-16 w-full text-emerald-500/30 dark:text-emerald-400/20"
    >
      <path
        d="M0 30 Q10 30 20 30 T40 30 L50 10 L60 50 L70 20 L80 40 L90 30 Q100 30 110 30 T130 30 L140 15 L150 45 L160 25 L170 35 L180 30 Q190 30 200 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{
          strokeDasharray: 1000,
          animation: "waveform 4s linear infinite",
        }}
      />
      <path
        d="M0 30 Q10 30 20 30 T40 30 L50 10 L60 50 L70 20 L80 40 L90 30 Q100 30 110 30 T130 30 L140 15 L150 45 L160 25 L170 35 L180 30 Q190 30 200 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}

const svgAnimations = [RotatingMotif, ScanGrid, PulseWave];

const cardBgs = [
  "bg-emerald-50/50 dark:bg-emerald-950/20",
  "bg-background",
  "bg-emerald-50 dark:bg-emerald-950",
];

export function Protocol() {
  return (
    <section id="process" className="relative">
      {/* Section header */}
      <div className="mx-auto max-w-7xl px-4 pt-20 sm:pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-8">
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Process
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            How E Work
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three steps. Na im be that.
          </p>
        </div>
      </div>

      {/* Sticky stacking cards */}
      <div className="relative">
        {PROTOCOL_STEPS.map((step, i) => {
          const SvgAnim = svgAnimations[i];
          return (
            <div
              key={step.step}
              className="sticky top-0 min-h-[70vh] flex items-center px-4 sm:px-6 lg:px-8 py-8"
              style={{ zIndex: i + 1 }}
            >
              <div
                className={`mx-auto w-full max-w-5xl rounded-[2.5rem] border p-8 sm:p-12 lg:p-16 shadow-xl ${cardBgs[i]}`}
              >
                <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
                  {/* Content */}
                  <div>
                    <span className="font-[family-name:var(--font-mono)] text-sm text-emerald-600/60 dark:text-emerald-400/60">
                      {step.mono}
                    </span>
                    <h3 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* SVG Animation */}
                  <div className="flex items-center justify-center">
                    <SvgAnim />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
