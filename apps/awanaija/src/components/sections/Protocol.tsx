"use client";

import { PROTOCOL_STEPS } from "@/lib/constants";

// ═══ SVG Animations for each card ═══
function BudgetChart() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-32 w-32 text-emerald-500/30 dark:text-emerald-400/20"
    >
      <g className="animate-pulse">
        <rect x="20" y="80" width="15" height="30" fill="currentColor" rx="2" />
        <rect x="45" y="50" width="15" height="60" fill="currentColor" rx="2" />
        <rect x="70" y="20" width="15" height="90" fill="currentColor" rx="2" />
        <path
          d="M 27 75 L 52 45 L 77 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <circle cx="27" cy="75" r="4" fill="currentColor" />
        <circle cx="52" cy="45" r="4" fill="currentColor" />
        <circle cx="77" cy="15" r="4" fill="currentColor" />
      </g>
    </svg>
  );
}

function ShieldMotif() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-32 w-32 text-red-500/30 dark:text-red-400/20"
    >
      <g className="animate-float">
        <path
          d="M60 20 L25 35 L25 65 C25 85 40 105 60 115 C80 105 95 85 95 65 L95 35 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M60 20 L60 115"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M25 65 L95 65"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <circle
          cx="60"
          cy="65"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <circle cx="60" cy="65" r="6" fill="currentColor" />
      </g>
    </svg>
  );
}

function InstitutionBuilding() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-32 w-32 text-blue-500/30 dark:text-blue-400/20"
    >
      <g className="animate-pulse">
        <path d="M20 100 L100 100 L100 110 L20 110 Z" fill="currentColor" />
        <path d="M30 90 L90 90 L90 100 L30 100 Z" fill="currentColor" />
        <path d="M40 70 L45 70 L45 90 L40 90 Z" fill="currentColor" />
        <path d="M55 70 L60 70 L60 90 L55 90 Z" fill="currentColor" />
        <path d="M70 70 L75 70 L75 90 L70 90 Z" fill="currentColor" />
        <path d="M35 60 L85 60 L85 70 L35 70 Z" fill="currentColor" />
        <path
          d="M60 20 L20 50 L100 50 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </g>
    </svg>
  );
}

const svgAnimations = [BudgetChart, ShieldMotif, InstitutionBuilding];

const cardBgs = [
  "bg-emerald-50 dark:bg-[#061810] border-emerald-200/50 dark:border-emerald-800/50",
  "bg-red-50 dark:bg-[#1f0909] border-red-200/50 dark:border-red-800/50",
  "bg-blue-50 dark:bg-[#0a1120] border-blue-200/50 dark:border-blue-800/50",
];

export function Protocol() {
  return (
    <section id="process" className="relative">
      {/* Section header */}
      <div className="mx-auto max-w-7xl px-4 pt-20 sm:pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-8">
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Our Focus
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            The Data We Track
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A comprehensive view of our country's resources, institutions, and
            leaders.
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
              className="sticky min-h-[70vh] flex items-center px-4 sm:px-6 lg:px-8 py-8"
              style={{
                zIndex: i + 1,
                top: `calc(5vh + ${i * 2.5}rem)`,
              }}
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

                    {/* Add extra context info based on index */}
                    {i === 0 && (
                      <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                          <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            ₦58.47T
                          </p>
                          <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70">
                            2026 Fed Budget
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-4 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                          <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            36
                          </p>
                          <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70">
                            State Budgets
                          </p>
                        </div>
                      </div>
                    )}

                    {i === 1 && (
                      <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-red-200/50 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                          <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-red-600 dark:text-red-400">
                            EFCC
                          </p>
                          <p className="text-xs text-red-800/70 dark:text-red-300/70">
                            Active Cases
                          </p>
                        </div>
                        <div className="rounded-xl border border-red-200/50 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                          <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-red-600 dark:text-red-400">
                            ICPC
                          </p>
                          <p className="text-xs text-red-800/70 dark:text-red-300/70">
                            Investigations
                          </p>
                        </div>
                      </div>
                    )}

                    {i === 2 && (
                      <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-800/50 dark:bg-blue-950/20">
                          <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-blue-600 dark:text-blue-400">
                            109
                          </p>
                          <p className="text-xs text-blue-800/70 dark:text-blue-300/70">
                            Senators
                          </p>
                        </div>
                        <div className="rounded-xl border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-800/50 dark:bg-blue-950/20">
                          <p className="font-[family-name:var(--font-mono)] text-xl font-bold text-blue-600 dark:text-blue-400">
                            360
                          </p>
                          <p className="text-xs text-blue-800/70 dark:text-blue-300/70">
                            HOR Members
                          </p>
                        </div>
                      </div>
                    )}
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
