import { Bot, FileText, TrendingUp } from "lucide-react";

/**
 * The looping mock conversation beside the CTA — Figma 132:1534, with the two
 * floating stat chips (132:1559 / 132:1566).
 *
 * No JS: the vertical scroll and the header dots are the `carousel-chat` /
 * `carousel-dot-*` keyframes already defined in `globals.css`, so this stays a
 * server component. `prefers-reduced-motion` disables them globally.
 */

interface Exchange {
  readonly ask: string;
  readonly answer: readonly [string, string, string];
  readonly source: string;
}

const EXCHANGES: readonly Exchange[] = [
  {
    ask: "Which former governors EFCC dey investigate?",
    answer: [
      "The EFCC is actively investigating several former governors for alleged ",
      "misappropriation of public funds",
      " and money laundering. Recent cases include…",
    ],
    source: "EFCC Anti-Corruption Records",
  },
  {
    ask: "How much did Lagos State budget for education in 2026?",
    answer: [
      "In 2026, Lagos State allocated ",
      "₦153.4 billion",
      " to the Education sector — about 6.8% of the total state budget.",
    ],
    source: "Lagos 2026 Approved Budget",
  },
  {
    ask: "Show me recent payments by the Ministry of Works",
    answer: [
      "Recent major disbursements from the Federal Ministry of Works include ",
      "₦2.4 billion",
      " paid to Julius Berger for highway rehabilitation projects.",
    ],
    source: "Daily GovSpend portal",
  },
  {
    ask: "How much FAAC allocation enter Ikeja LG last month?",
    answer: [
      "Last month, Ikeja Local Government received ",
      "₦450.2 million",
      " from the Federal Account Allocation Committee (FAAC).",
    ],
    source: "FAAC Allocations",
  },
];

export function ChatDemo() {
  // The first exchange repeats at the end so the loop has no visible seam.
  const reel = [...EXCHANGES, EXCHANGES[0]];

  return (
    <div className="relative">
      <div className="rounded-[2rem] border border-border/50 bg-card/80 p-6 shadow-2xl shadow-black/5 backdrop-blur-sm dark:bg-card/60 dark:shadow-black/20">
        <div className="mb-5 flex items-center gap-3 border-b border-border/50 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/50">
            <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Our Nigeria</p>
            <p className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              system.ready
            </p>
          </div>
          <div className="ml-auto flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                style={{ animation: `carousel-dot-${n} 20s linear infinite` }}
              />
            ))}
          </div>
        </div>

        <div className="relative h-[280px] w-full overflow-hidden">
          <div
            className="absolute left-0 top-0 flex w-full animate-[carousel-chat_20s_linear_infinite] flex-col gap-4"
            style={{ animationTimingFunction: "cubic-bezier(0.8, 0, 0.2, 1)" }}
          >
            {reel.map((x, i) => (
              <div key={i} className="flex h-[280px] w-full shrink-0 flex-col justify-center">
                <p className="mb-3 ml-auto max-w-[80%] rounded-[1.25rem] rounded-br-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-sm dark:bg-emerald-500">
                  {x.ask}
                </p>
                <div className="max-w-[85%] rounded-[1.25rem] rounded-bl-lg bg-muted/60 px-4 py-3 text-sm shadow-sm backdrop-blur-sm">
                  <p>
                    {x.answer[0]}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {x.answer[1]}
                    </strong>
                    {x.answer[2]}
                  </p>
                  <p className="mt-2 font-mono text-[10px] text-muted-foreground/60">
                    src: {x.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StatChip
        className="-right-3 -top-3"
        icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
        title="Nigeria"
        status="coverage.full"
      />
      <StatChip
        className="-bottom-2 -left-3"
        icon={<FileText className="h-4 w-4 text-emerald-500" />}
        title="5000+ Records"
        status="status.indexed"
      />
    </div>
  );
}

function StatChip({
  icon,
  title,
  status,
  className,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly status: string;
  readonly className?: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <div className="animate-float flex items-center gap-2 rounded-2xl border bg-card px-3.5 py-2.5 shadow-lg">
        {icon}
        <div>
          <p className="text-xs font-bold">{title}</p>
          <p className="font-mono text-[9px] text-muted-foreground">{status}</p>
        </div>
      </div>
    </div>
  );
}
