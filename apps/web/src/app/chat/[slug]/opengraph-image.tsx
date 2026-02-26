import { ImageResponse } from "next/og";

export const alt = "OurNigeria Conversation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface MoneyItem {
  icon: string;
  label: string;
  count: number;
  unitCost: number;
  unitLabel: string;
}

interface StatItem {
  label: string;
  value: string;
  subtitle?: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
}

interface RichContent {
  text?: string;
  moneyEquivalents?: {
    title: string;
    amount: number;
    items: MoneyItem[];
  };
  stats?: StatItem[];
  barChart?: { title: string; data: ChartDataPoint[] };
  donutChart?: { title: string; data: ChartDataPoint[] };
  stateComparison?: {
    state1: { name: string; budget: number; perCapita: number };
    state2: { name: string; budget: number; perCapita: number };
  };
}

interface Meta {
  title: string;
  states: string[];
  years: number[];
  messageCount: number;
  richContent: RichContent | null;
}

function formatNaira(n: number): string {
  if (n >= 1e12) return `N${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `N${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `N${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `N${(n / 1e3).toFixed(0)}K`;
  return `N${n.toLocaleString()}`;
}

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let meta: Meta | null = null;
  try {
    const res = await fetch(
      `${API_URL}/api/conversations/public/${slug}/meta`,
      { cache: "no-store" },
    );
    if (res.ok) {
      meta = await res.json();
    }
  } catch {
    // fall through to default
  }

  const title = meta?.title ?? "Shared Conversation";
  const rich = meta?.richContent;
  const messageCount = meta?.messageCount ?? 0;

  // Decide what to render as the hero section
  const hasMoneyEquivalents =
    rich?.moneyEquivalents && rich.moneyEquivalents.items.length > 0;
  const hasStats = rich?.stats && rich.stats.length > 0;
  const hasBarChart = rich?.barChart && rich.barChart.data.length > 0;
  const hasStateComparison = rich?.stateComparison;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          padding: "48px 56px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Header: Logo + Title */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              flex: 1,
              paddingRight: "24px",
            }}
          >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #10b981, #047857)",
                }}
              >
                <span style={{ fontSize: "18px", color: "white" }}>
                  &#10024;
                </span>
              </div>
              <span
                style={{ fontSize: "22px", fontWeight: 700, color: "#94a3b8" }}
              >
                Our
                <span style={{ color: "#34d399" }}>Nigeria</span>
              </span>
            </div>
            {/* Title */}
            <h1
              style={{
                fontSize: title.length > 50 ? "28px" : "34px",
                fontWeight: 700,
                color: "white",
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              {title.length > 80 ? title.slice(0, 80) + "..." : title}
            </h1>
          </div>
        </div>

        {/* Hero: Rich Content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: "20px",
          }}
        >
          {hasMoneyEquivalents ? (
            <MoneyEquivalentsCard
              title={rich!.moneyEquivalents!.title}
              amount={rich!.moneyEquivalents!.amount}
              items={rich!.moneyEquivalents!.items}
            />
          ) : hasStats ? (
            <StatsCard stats={rich!.stats!} />
          ) : hasBarChart ? (
            <BarChartCard
              title={rich!.barChart!.title}
              data={rich!.barChart!.data}
            />
          ) : hasStateComparison ? (
            <ComparisonCard
              state1={rich!.stateComparison!.state1}
              state2={rich!.stateComparison!.state2}
            />
          ) : (
            <DefaultCard messageCount={messageCount} />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          <span style={{ fontSize: "15px", color: "#64748b" }}>
            {messageCount} message{messageCount !== 1 ? "s" : ""} in
            conversation
          </span>
          <span style={{ fontSize: "14px", color: "#475569" }}>
            spending.arinze.online
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}

/* ── Rich content sub-components ── */

function MoneyEquivalentsCard({
  title,
  amount,
  items,
}: {
  title: string;
  amount: number;
  items: MoneyItem[];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        borderRadius: "20px",
        background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)",
        border: "1px solid rgba(16,185,129,0.2)",
        padding: "28px 32px",
        gap: "20px",
      }}
    >
      {/* Card header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#6ee7b7",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          What this money could buy
        </span>
        <span style={{ fontSize: "16px", color: "#94a3b8" }}>
          {title}
        </span>
        <span
          style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "#34d399",
            letterSpacing: "-1px",
          }}
        >
          {formatNaira(amount)}
        </span>
      </div>

      {/* Items grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {items.slice(0, 4).map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              padding: "12px 16px",
              minWidth: "220px",
              flex: "1 1 45%",
            }}
          >
            <span style={{ fontSize: "28px" }}>{item.icon}</span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {formatCount(item.count)}
              </span>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsCard({ stats }: { stats: StatItem[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        flex: 1,
      }}
    >
      {stats.slice(0, 4).map((stat, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            flex: "1 1 45%",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "24px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 500 }}>
            {stat.label}
          </span>
          <span
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#34d399",
              letterSpacing: "-0.5px",
            }}
          >
            {stat.value}
          </span>
          {stat.subtitle && (
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {stat.subtitle}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function BarChartCard({
  title,
  data,
}: {
  title: string;
  data: ChartDataPoint[];
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const items = data.slice(0, 6);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        borderRadius: "20px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "28px 32px",
        gap: "20px",
      }}
    >
      <span style={{ fontSize: "18px", fontWeight: 600, color: "white" }}>
        {title}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {items.map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                width: "120px",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {d.name.length > 15 ? d.name.slice(0, 15) + "..." : d.name}
            </span>
            <div
              style={{
                display: "flex",
                flex: 1,
                height: "24px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: `${Math.max((d.value / maxVal) * 100, 3)}%`,
                  height: "100%",
                  borderRadius: "6px",
                  background: `linear-gradient(90deg, #10b981, ${i % 2 === 0 ? "#34d399" : "#6ee7b7"})`,
                }}
              />
            </div>
            <span
              style={{ fontSize: "13px", color: "#6ee7b7", width: "80px" }}
            >
              {formatNaira(d.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonCard({
  state1,
  state2,
}: {
  state1: { name: string; budget: number; perCapita: number };
  state2: { name: string; budget: number; perCapita: number };
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        flex: 1,
      }}
    >
      {[state1, state2].map((state, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            borderRadius: "20px",
            background:
              i === 0
                ? "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))"
                : "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.03))",
            border: `1px solid ${i === 0 ? "rgba(16,185,129,0.25)" : "rgba(99,102,241,0.25)"}`,
            padding: "28px",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "white",
            }}
          >
            {state.name}
          </span>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "4px" }}
          >
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>
              Total Budget
            </span>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: i === 0 ? "#34d399" : "#a5b4fc",
              }}
            >
              {formatNaira(state.budget)}
            </span>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "4px" }}
          >
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>
              Per Capita
            </span>
            <span
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: i === 0 ? "#6ee7b7" : "#c4b5fd",
              }}
            >
              {formatNaira(state.perCapita)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DefaultCard({ messageCount }: { messageCount: number }) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "32px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #10b981, #047857)",
          }}
        >
          <span style={{ fontSize: "32px", color: "white" }}>&#10024;</span>
        </div>
        <span style={{ fontSize: "20px", color: "#94a3b8" }}>
          AI-powered budget conversation with {messageCount} message
          {messageCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
