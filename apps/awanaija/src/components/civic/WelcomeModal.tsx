"use client";

import React, { useState, useEffect, useMemo } from "react";
import posthog from "posthog-js";

// ─── tokens ───────────────────────────────────────────────────
const PALETTE = {
  emerald700: "#065f46",
  emerald600: "#059669",
  emerald500: "#10b981",
  emerald50:  "#ecfdf5",
  gold:       "#d4a017",
  goldSoft:   "#f5d88a",
  slate900:   "#0b1513",
  slate700:   "#334155",
  slate500:   "#64748b",
  slate400:   "#94a3b8",
  slate300:   "#cbd5e1",
  slate100:   "#f1f5f9",
  border:     "#e2e8f0",
};

// ─── icon primitives ──────────────────────────────────────────
const PinIcon = ({ color = "#fff", size = 20 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 22s8-7.5 8-13a8 8 0 10-16 0c0 5.5 8 13 8 13z" fill={color}/>
    <circle cx="12" cy="9" r="3" fill="#fff"/>
  </svg>
);

const Arrow = ({ dir = "right", size = 14 }: { dir?: "left" | "right"; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ transform: dir === "left" ? "rotate(180deg)" : "none" }}>
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Backdrop = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(11, 21, 19, 0.55)",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, fontFamily: "'Instrument Sans', ui-sans-serif, system-ui",
    zIndex: 9999,
  }}>{children}</div>
);

const Overline = ({ children, color = PALETTE.gold }: { children: React.ReactNode; color?: string }) => (
  <div style={{
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase",
    color, fontWeight: 500,
  }}>{children}</div>
);

const Btn = ({ children, variant = "primary", icon, ...rest }: { children: React.ReactNode; variant?: "primary" | "ghost" | "dark"; icon?: React.ReactNode; [key: string]: unknown }) => {
  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: PALETTE.emerald600, color: "#fff", border: "1px solid " + PALETTE.emerald600 },
    ghost:   { backgroundColor: "transparent", color: PALETTE.slate700, border: "1px solid " + PALETTE.border },
    dark:    { backgroundColor: PALETTE.slate900, color: "#fff", border: "1px solid " + PALETTE.slate900 },
  };
  const currentStyle = styles[variant];
  return (
    <button {...rest} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "12px 18px", borderRadius: 14, fontSize: 14, fontWeight: 600,
      fontFamily: "inherit", cursor: "pointer",
      transition: "transform 0.1s ease, box-shadow 0.2s, background 0.2s",
      ...currentStyle, ...(rest.style as React.CSSProperties || {}),
    }}>
      {icon}{children}
    </button>
  );
};

// ─── Slide content ────────────────────────────────────────────
const SLIDES = [
  {
    kind: "tip",
    kicker: "Step 1 · Welcome",
    headline: ["Your ward.", "Your money.", { em: "Your right" }, " to know."],
    body: "8,809 wards. 774 LGAs. Every naira wey enter — we dey track am for you. Make we show you how e dey work.",
    visual: "hero",
  },
  {
    kind: "tip",
    kicker: "Tip 01 · Personalize",
    headline: ["Turn on location to see ", { em: "your own area" }, " first."],
    body: "Your state budget, your LGA spending, your ward projects — all auto-tuned. Use am once, change am any time.",
    visual: "location",
  },
  {
    kind: "tip",
    kicker: "Tip 02 · Track",
    headline: ["Follow one project from ", { em: "budget to ground." }],
    body: "Tap any line-item to see when e enter budget, who dey handle am, and photos from people for di area.",
    visual: "track",
  },
  {
    kind: "term",
    kicker: "Term · FAAC",
    headline: [{ em: "FAAC" }, " — the money share meeting."],
    body: "Federation Account Allocation Committee. Every month, federal + state + LGA reps share oil money, VAT, and other revenue. Your state budget starts here.",
    visual: "faac",
  },
  {
    kind: "term",
    kicker: "Term · IGR",
    headline: [{ em: "IGR" }, " — wetin your state make by itself."],
    body: "Internally Generated Revenue. Tax, levies, fines — the money your state earn without waiting for FAAC. High IGR = less oil dependence.",
    visual: "igr",
  },
  {
    kind: "term",
    kicker: "Term · Budget split",
    headline: ["Capital vs ", { em: "Recurrent" }, " — where e go."],
    body: "Capital = roads, schools, hospitals (new things). Recurrent = salaries, light bills, fuel (keep the lights on). Healthy states build, no just pay.",
    visual: "split",
  },
];

const TOTAL_SLIDES = SLIDES.length;

// ─── Visuals ──────────────────────────────────────────────────
const NigeriaGlyph = ({ color = PALETTE.emerald500, opacity = 1, style }: { color?: string; opacity?: number; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 200 180" style={style}>
    <path d="M20,70 C30,45 55,35 80,30 L110,22 C130,20 148,30 158,45 L175,72 C182,90 178,115 165,130 L145,148 C130,158 110,160 95,155 L70,148 C55,145 40,138 30,125 L20,105 C15,92 18,80 20,70 Z"
      fill={color} opacity={opacity}/>
  </svg>
);

function VisualHero() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <NigeriaGlyph color={PALETTE.emerald500} opacity={0.22}
        style={{ position: "absolute", right: -30, top: 10, width: 220, height: 190 }}/>
      <NigeriaGlyph color={PALETTE.gold} opacity={0.35}
        style={{ position: "absolute", right: 10, top: 30, width: 160, height: 140 }}/>
      {[
        { x: 60, y: 60, d: 0 },
        { x: 120, y: 50, d: 0.2 },
        { x: 95, y: 100, d: 0.4 },
        { x: 155, y: 90, d: 0.6 },
      ].map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.x, top: p.y,
          animation: `floatY 3s ease-in-out ${p.d}s infinite`,
        }}>
          <PinIcon color={i === 0 ? PALETTE.gold : "#fff"} size={i === 0 ? 20 : 14}/>
        </div>
      ))}
    </div>
  );
}

function VisualLocation() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[160, 120, 80, 40].map((r, i) => (
        <div key={i} style={{
          position: "absolute", width: r, height: r, borderRadius: "50%",
          border: "1.5px dashed " + PALETTE.emerald500,
          opacity: 0.18 + i * 0.15,
          animation: `pulseRing 3.2s ease-out ${i * 0.3}s infinite`,
        }}/>
      ))}
      <div style={{
        width: 38, height: 38, borderRadius: "50%", background: PALETTE.gold,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 24px -6px " + PALETTE.gold, zIndex: 2,
      }}>
        <PinIcon color={PALETTE.slate900} size={18}/>
      </div>
      <div style={{
        position: "absolute", bottom: 4, right: 4, fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em",
      }}>
        04.8472°N · 6.9965°E
      </div>
    </div>
  );
}

function VisualTrack() {
  const nodes = [
    { label: "Budget",    sub: "Jan '26" },
    { label: "Contract",  sub: "Mar '26" },
    { label: "On ground", sub: "Aug '26" },
  ];
  return (
    <div style={{ position: "relative", width: "100%", height: "100%",
      display: "flex", alignItems: "center", padding: "0 6px" }}>
      <div style={{
        position: "absolute", left: 24, right: 24, top: "50%", height: 2,
        background: "linear-gradient(90deg, " + PALETTE.emerald500 + " 0%, " + PALETTE.gold + " 100%)",
        transform: "translateY(-50%)",
      }}/>
      <div style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
        {nodes.map((n, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: i === 0 ? PALETTE.emerald600 : i === 1 ? PALETTE.emerald500 : PALETTE.gold,
              color: i === 2 ? PALETTE.slate900 : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700,
              boxShadow: "0 0 0 4px " + PALETTE.slate900,
            }}>{i + 1}</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{n.label}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)",
                fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>{n.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualFAAC() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg width="100%" height="100%" viewBox="0 0 260 170" preserveAspectRatio="none">
        <defs>
          <linearGradient id="flow1" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.4)"/>
            <stop offset="1" stopColor={PALETTE.emerald500}/>
          </linearGradient>
          <linearGradient id="flow2" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.4)"/>
            <stop offset="1" stopColor={PALETTE.emerald500}/>
          </linearGradient>
          <linearGradient id="flow3" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.4)"/>
            <stop offset="1" stopColor={PALETTE.emerald500}/>
          </linearGradient>
        </defs>
        <text x="6"  y="24"  fontSize="9" fill="rgba(255,255,255,0.6)" fontFamily="IBM Plex Mono">Oil</text>
        <text x="6"  y="84"  fontSize="9" fill="rgba(255,255,255,0.6)" fontFamily="IBM Plex Mono">VAT</text>
        <text x="6"  y="144" fontSize="9" fill="rgba(255,255,255,0.6)" fontFamily="IBM Plex Mono">Customs</text>
        <path d="M 40,22 C 110,22 120,80 180,80"  stroke="url(#flow1)" strokeWidth="3" fill="none"/>
        <path d="M 40,82 C 110,82 120,80 180,80"  stroke="url(#flow2)" strokeWidth="3" fill="none"/>
        <path d="M 40,142 C 110,142 120,80 180,80" stroke="url(#flow3)" strokeWidth="3" fill="none"/>
        <circle cx="180" cy="80" r="22" fill={PALETTE.gold} opacity="0.95"/>
        <text x="180" y="84" fontSize="11" fontWeight="700" textAnchor="middle" fill={PALETTE.slate900} fontFamily="DM Sans">FAAC</text>
        <path d="M 200,72 L 248,36" stroke={PALETTE.emerald500} strokeWidth="2" fill="none"/>
        <path d="M 202,80 L 250,80" stroke={PALETTE.emerald500} strokeWidth="2" fill="none"/>
        <path d="M 200,88 L 248,124" stroke={PALETTE.emerald500} strokeWidth="2" fill="none"/>
        <text x="254" y="38"  fontSize="9" fill="#fff" fontFamily="IBM Plex Mono">Fed</text>
        <text x="254" y="82"  fontSize="9" fill="#fff" fontFamily="IBM Plex Mono">State</text>
        <text x="254" y="126" fontSize="9" fill="#fff" fontFamily="IBM Plex Mono">LGA</text>
      </svg>
    </div>
  );
}

function VisualIGR() {
  return null;
}

function VisualSplit() {
  return null;
}

const VISUALS: Record<string, React.FC> = {
  hero: VisualHero,
  location: VisualLocation,
  track: VisualTrack,
  faac: VisualFAAC,
  igr: VisualIGR,
  split: VisualSplit,
};

// ─── Slide renderer ───────────────────────────────────────────
function renderHeadline(parts: (string | { em: string })[]) {
  return parts.map((p, i) => {
    if (typeof p === "string") return <React.Fragment key={i}>{p}</React.Fragment>;
    if (p.em) return (
      <em key={i} style={{
        fontStyle: "italic", fontFamily: "'Instrument Serif', serif",
        fontWeight: 400, color: PALETTE.gold,
      }}>{p.em}</em>
    );
    return null;
  });
}

function Slide({ data, direction, isActive }: { data: typeof SLIDES[number]; direction: number; isActive: boolean }) {
  const Visual = VISUALS[data.visual] || VisualHero;
  const enterX = direction > 0 ? 28 : -28;
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 pb-20 md:p-8 md:pb-20" style={{
      opacity: isActive ? 1 : 0,
      transform: isActive ? "translateX(0)" : `translateX(${enterX}px)`,
      transition: "opacity 420ms cubic-bezier(.2,.8,.2,1), transform 420ms cubic-bezier(.2,.8,.2,1)",
      pointerEvents: isActive ? "auto" : "none",
    }}>
      <div>
        <Overline color={data.kind === "term" ? PALETTE.goldSoft : PALETTE.gold}>{data.kicker}</Overline>
        <h2 className="font-heading font-semibold text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.02em] mt-3 mb-2 md:mt-4 md:mb-3 text-white">
          {renderHeadline(data.headline)}
        </h2>
        <p className="text-[13px] md:text-[13.5px] leading-[1.55] text-white/70 m-0 max-w-[320px]">
          {data.body}
        </p>
      </div>
      <div className="relative h-[100px] md:h-[110px] mt-4 md:mt-5">
        <Visual/>
      </div>
    </div>
  );
}

// ─── Left carousel pane ───────────────────────────────────────
function CarouselPane({ idx, setIdx, direction, setDirection }: { idx: number; setIdx: React.Dispatch<React.SetStateAction<number>>; direction: number; setDirection: React.Dispatch<React.SetStateAction<number>> }) {
  const go = (delta: number) => {
    setDirection(delta);
    setIdx((i: number) => (i + delta + TOTAL_SLIDES) % TOTAL_SLIDES);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="relative overflow-hidden bg-[#0b1513] text-white min-h-[400px] md:min-h-[520px]">
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(circle at 30% 20%, rgba(16,185,129,0.18), transparent 60%)",
      }}/>
      <NigeriaGlyph color={PALETTE.emerald500} opacity={0.08}
        style={{ position: "absolute", right: -80, bottom: -60, width: 320, height: 300 }}/>

      <div className="relative h-full min-h-[400px] md:min-h-[520px]">
        {SLIDES.map((s, i) => (
          <Slide key={i} data={s} isActive={i === idx} direction={direction}/>
        ))}
      </div>

      <div className="absolute left-6 right-6 md:left-8 md:right-8 bottom-5 md:bottom-6 flex items-center justify-between gap-3">
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {SLIDES.map((_, i) => (
            <button key={i}
              onClick={() => { setDirection(i > idx ? 1 : -1); setIdx(i); }}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
                background: i === idx ? PALETTE.gold : "rgba(255,255,255,0.22)",
                border: "none", padding: 0, cursor: "pointer",
                transition: "width 280ms cubic-bezier(.2,.8,.2,1), background 220ms",
              }}/>
          ))}
          <span style={{
            marginLeft: 10, fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em",
          }}>
            {String(idx + 1).padStart(2, "0")} / {String(TOTAL_SLIDES).padStart(2, "0")}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => go(-1)} aria-label="Previous"
            style={arrowBtnStyle}>
            <Arrow dir="left"/>
          </button>
          <button onClick={() => go(1)} aria-label="Next"
            style={{
              ...arrowBtnStyle,
              background: PALETTE.gold, color: PALETTE.slate900,
              borderColor: PALETTE.gold,
            }}>
            <Arrow dir="right"/>
          </button>
        </div>
      </div>
    </div>
  );
}

const arrowBtnStyle = {
  width: 40, height: 40, borderRadius: 12,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(255,255,255,0.08)", color: "#fff",
  border: "1px solid rgba(255,255,255,0.14)",
  cursor: "pointer", transition: "all 180ms",
  fontFamily: "inherit",
};

// ─── Right action pane (persistent) ───────────────────────────
function ActionPane({ idx, onClose }: { idx: number; onClose: () => void }) {
  const helper = useMemo(() => {
    if (idx <= 2) return "Turn on location and we go tune this page to your ward. Or pick dem one by one.";
    return "Now you sabi the terms — make we plug you into your own area so e go make sense.";
  }, [idx]);

  return (
    <div className="relative flex flex-col justify-center bg-white p-6 md:p-8 min-h-[auto] md:min-h-[520px]">
      <button onClick={onClose} className="absolute top-3 right-3 md:top-4 md:right-4 bg-transparent border-none cursor-pointer text-xl text-slate-400 hover:text-slate-600 p-2">×</button>
      <Overline color={PALETTE.emerald700}>Personalize</Overline>
      <h3 className="font-heading font-semibold text-[22px] tracking-[-0.015em] mt-2 mb-2 text-slate-900">
        Make we personalize am?
      </h3>
      <p className="text-[13px] leading-[1.6] text-slate-500 mb-5 min-h-[auto] md:min-h-[62px]">
        {helper}
      </p>
      <Btn variant="dark" icon={<PinIcon color="#fff" size={16}/>} className="h-12 mb-2.5 w-full" onClick={() => {
        posthog.capture("welcome_modal_location_action", { action: "enable_location" });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("request-location"));
        }
      }}>
        Turn on location
      </Btn>
      <Btn variant="ghost" className="h-11 w-full" onClick={() => {
        posthog.capture("welcome_modal_location_action", { action: "pick_manually" });
        onClose();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("open-location-selector"));
        }
      }}>
        Pick state manually
      </Btn>
      <div className="mt-5 pt-4 border-t border-slate-200">
        <Overline color={PALETTE.slate500}>What you go see</Overline>
        <ul className="m-0 mt-2.5 p-0 list-none text-[12px] text-slate-700 leading-[1.85]">
          <li>✓ Budget for your state</li>
          <li>✓ Projects for your ward</li>
          <li>✓ Names of your reps</li>
        </ul>
      </div>
      <div className="mt-4 font-mono text-[10px] text-slate-400 tracking-[0.1em] uppercase">
        We never store your exact location
      </div>
    </div>
  );
}

// ─── Whole modal ──────────────────────────────────────────────
export function WelcomeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (isOpen) {
      posthog.capture("welcome_modal_opened");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Backdrop>
      <div className="flex flex-col md:grid md:grid-cols-[1.15fr_1fr] w-[92%] max-w-[760px] max-h-[90vh] md:max-h-[85vh] bg-white rounded-2xl md:rounded-[24px] overflow-y-auto md:overflow-hidden shadow-2xl">
        <CarouselPane idx={idx} setIdx={setIdx} direction={direction} setDirection={setDirection}/>
        <ActionPane idx={idx} onClose={onClose}/>
      </div>
    </Backdrop>
  );
}
