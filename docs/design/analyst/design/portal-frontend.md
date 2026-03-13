# Portal Frontend — apps/institution/ + packages/ui/

## apps/institution/ Structure

```
apps/institution/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── public/
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with auth provider
│   │   ├── page.tsx                # Landing → redirect to /dashboard or /login
│   │   ├── login/
│   │   │   └── page.tsx            # Email + password login
│   │   ├── forgot-password/
│   │   │   └── page.tsx            # Password reset request
│   │   ├── reset-password/
│   │   │   └── page.tsx            # Password reset form
│   │   ├── (authenticated)/        # Route group — requires session
│   │   │   ├── layout.tsx          # Sidebar + header
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Overview: recent assessments, usage stats
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx        # New conversation
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # Existing conversation
│   │   │   ├── assess/
│   │   │   │   └── [state]/
│   │   │   │       └── page.tsx    # Shortcut: triggers assessment via chat
│   │   │   ├── compare/
│   │   │   │   └── page.tsx        # Multi-state comparison view
│   │   │   ├── rank/
│   │   │   │   └── page.tsx        # State ranking view
│   │   │   ├── settings/
│   │   │   │   └── page.tsx        # Profile, API key management
│   │   │   └── history/
│   │   │       └── page.tsx        # Past assessments + conversations
│   │   └── api/                    # Next.js API routes (proxy if needed)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   ├── Header.tsx          # Top bar with user info
│   │   │   └── AuthProvider.tsx    # Session context
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── PasswordResetForm.tsx
│   │   ├── chat/
│   │   │   ├── ChatView.tsx        # Main chat interface
│   │   │   ├── MessageList.tsx     # Message rendering
│   │   │   ├── ChatInput.tsx       # Message input with suggestions
│   │   │   └── CreditMessage.tsx   # Renders credit assessment in chat
│   │   ├── credit/
│   │   │   ├── AssessmentView.tsx  # Full credit assessment layout
│   │   │   ├── SectionCard.tsx     # Generic section card wrapper
│   │   │   ├── FiscalProfile.tsx   # Fiscal profile section
│   │   │   ├── DebtSection.tsx     # Debt sustainability section
│   │   │   ├── RevenueSection.tsx  # Revenue analysis section
│   │   │   ├── GovernanceSection.tsx
│   │   │   ├── SpendingSection.tsx
│   │   │   ├── PeerComparison.tsx
│   │   │   ├── DataGaps.tsx
│   │   │   ├── ExecutiveSummary.tsx
│   │   │   ├── SignalBadge.tsx     # GREEN/YELLOW/RED indicator
│   │   │   ├── MetricRow.tsx       # Single metric with value + signal + benchmark
│   │   │   └── ComparisonTable.tsx # Side-by-side state comparison
│   │   ├── ranking/
│   │   │   ├── RankingTable.tsx    # Sortable state ranking table
│   │   │   └── ZoneFilter.tsx      # Geopolitical zone filter
│   │   ├── dashboard/
│   │   │   ├── RecentAssessments.tsx
│   │   │   ├── UsageStats.tsx
│   │   │   └── QuickAssess.tsx     # State dropdown → quick assessment
│   │   └── settings/
│   │       ├── ProfileForm.tsx
│   │       └── ApiKeyManager.tsx   # Generate, view prefix, revoke
│   ├── hooks/
│   │   ├── useAuth.ts             # Authentication state
│   │   ├── useChat.ts             # Chat SSE connection
│   │   ├── useCreditSSE.ts        # Credit section event handler
│   │   └── useApi.ts              # REST API client (fetch wrapper)
│   ├── lib/
│   │   ├── api-client.ts          # Typed API client for /api/pro/*
│   │   ├── sse-client.ts          # SSE connection manager
│   │   └── format.ts              # Currency formatting (Naira, USD)
│   └── types/
│       └── index.ts               # Frontend type definitions
```

## packages/ui/ Structure

```
packages/ui/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Re-exports all components
│   ├── charts/
│   │   ├── DonutChart.tsx          # Revenue composition, debt composition
│   │   ├── BarChart.tsx            # Vendor payments, budget breakdown
│   │   ├── TrendLine.tsx           # FAAC trend, IGR growth
│   │   ├── SignalGauge.tsx         # Overall signal indicator (GREEN/YELLOW/RED)
│   │   └── ComparisonBars.tsx      # Side-by-side metric comparison
│   ├── credit/
│   │   ├── MetricDisplay.tsx       # Single metric: value, signal badge, benchmark text
│   │   ├── DataGapIndicator.tsx    # "Data not available" with reason
│   │   ├── DisclaimerBanner.tsx    # Mandatory disclaimer
│   │   └── SourceCitation.tsx      # Clickable source reference
│   └── hooks/
│       └── useSSEStream.ts         # Generic SSE stream hook
```

## Key Component Details

### useCreditSSE Hook

```typescript
// apps/institution/src/hooks/useCreditSSE.ts

interface CreditSSEState {
  status: 'idle' | 'connecting' | 'streaming' | 'done' | 'error';
  sections: Map<string, CreditSection>;  // Keyed by section type
  error?: string;
}

function useCreditSSE() {
  const [state, dispatch] = useReducer(creditSSEReducer, initialState);

  // Called when SSE events arrive
  const handleEvent = useCallback((event: MessageEvent) => {
    const data = JSON.parse(event.data);

    switch (data.event) {
      case 'credit_assessment_start':
        dispatch({ type: 'START', payload: data.data });
        break;

      case 'credit_assessment_done':
        dispatch({ type: 'DONE', payload: data.data });
        break;

      // All credit_section:* events
      default:
        if (data.event.startsWith('credit_section:')) {
          dispatch({ type: 'SECTION', payload: { type: data.event, data: data.data } });
        }
        break;
    }
  }, []);

  return { ...state, handleEvent };
}
```

### AssessmentView Component

```typescript
// apps/institution/src/components/credit/AssessmentView.tsx

function AssessmentView({ sections, status }: { sections: Map<string, CreditSection>; status: string }) {
  return (
    <div className="space-y-6">
      {/* Executive Summary — rendered last but displayed first */}
      {sections.has('credit_section:executive_summary') ? (
        <ExecutiveSummary data={sections.get('credit_section:executive_summary')!.data} />
      ) : (
        status === 'streaming' && <SectionSkeleton title="Executive Summary" />
      )}

      {/* Fiscal Profile — first to arrive */}
      {sections.has('credit_section:fiscal_profile') ? (
        <FiscalProfile data={sections.get('credit_section:fiscal_profile')!.data} />
      ) : (
        status === 'streaming' && <SectionSkeleton title="Fiscal Profile" />
      )}

      {/* ... remaining sections with skeleton fallback ... */}

      {/* Data Gaps — always last content section */}
      {sections.has('credit_section:data_gaps') && (
        <DataGaps data={sections.get('credit_section:data_gaps')!.data} />
      )}

      {/* Disclaimer */}
      {status === 'done' && <DisclaimerBanner />}
    </div>
  );
}
```

### SignalBadge Component

```typescript
// packages/ui/src/credit/MetricDisplay.tsx

function SignalBadge({ signal }: { signal: 'GREEN' | 'YELLOW' | 'RED' | null }) {
  const colors = {
    GREEN: 'bg-green-100 text-green-800 border-green-300',
    YELLOW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    RED: 'bg-red-100 text-red-800 border-red-300',
  };

  if (!signal) return <span className="text-gray-400">—</span>;

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[signal]}`}>
      {signal}
    </span>
  );
}

function MetricDisplay({ metric }: { metric: MetricResult }) {
  if (metric.status === 'NOT_AVAILABLE') {
    return <DataGapIndicator reason={metric.caveat} />;
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{metric.label}</p>
        {metric.benchmark && (
          <p className="text-xs text-gray-500">{metric.benchmark}</p>
        )}
      </div>
      <SignalBadge signal={metric.signal} />
      {metric.caveat && (
        <p className="text-xs text-amber-600 mt-1">{metric.caveat}</p>
      )}
    </div>
  );
}
```

## Page Flows

### Dashboard Page

```
  ┌────────────────────────────────────────────────────────┐
  │  Header: "Credit Intelligence Platform"    [User ▼]   │
  ├────────┬───────────────────────────────────────────────┤
  │        │                                               │
  │  Side  │  ┌─────────────────┐  ┌─────────────────┐    │
  │  bar   │  │  Quick Assess   │  │  Usage Stats    │    │
  │        │  │  [State ▼] [Go] │  │  23/100 queries │    │
  │  Chat  │  └─────────────────┘  │  this hour      │    │
  │  Assess│                       └─────────────────┘    │
  │  Compare│                                              │
  │  Rank   │  Recent Assessments                          │
  │  History│  ┌───────┬──────┬────────┬──────────────┐    │
  │  Settings│ │ State │ Year │ Signal │ Date         │    │
  │        │  ├───────┼──────┼────────┼──────────────┤    │
  │        │  │ Lagos │ 2025 │ GREEN  │ Mar 12, 2026 │    │
  │        │  │ Ogun  │ 2025 │ YELLOW │ Mar 11, 2026 │    │
  │        │  │ Kano  │ 2024 │ RED    │ Mar 10, 2026 │    │
  │        │  └───────┴──────┴────────┴──────────────┘    │
  └────────┴───────────────────────────────────────────────┘
```

### Chat Page (with Credit Assessment)

```
  ┌────────────────────────────────────────────────────────┐
  │  ← Back to Dashboard              [Export PDF]         │
  ├────────────────────────────────────────────────────────┤
  │                                                        │
  │  You: Assess Lagos State for 2025                      │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  CREDIT ASSESSMENT: Lagos State (2025)           │  │
  │  │                                                  │  │
  │  │  ┌─ Executive Summary ──────────────────────┐   │  │
  │  │  │  Overall: [GREEN]                         │   │  │
  │  │  │  Lagos demonstrates strong fiscal...      │   │  │
  │  │  └──────────────────────────────────────────┘   │  │
  │  │                                                  │  │
  │  │  ┌─ Fiscal Profile ─────────────────────────┐   │  │
  │  │  │  IGR: ₦450.2B           [GREEN]          │   │  │
  │  │  │  FAAC Dependency: 32%   [GREEN]          │   │  │
  │  │  │  Recurrent:Capital: 55:45 [GREEN]        │   │  │
  │  │  │  [══ Revenue Composition ══]  (donut)    │   │  │
  │  │  └──────────────────────────────────────────┘   │  │
  │  │                                                  │  │
  │  │  ┌─ Debt Sustainability ────────────────────┐   │  │
  │  │  │  ... (skeleton while loading)             │   │  │
  │  │  └──────────────────────────────────────────┘   │  │
  │  │                                                  │  │
  │  │  DISCLAIMER: This is not financial advice...    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  You: What corruption cases involve the Lagos governor?│
  │                                                        │
  │  Assistant: Based on EFCC records...                   │
  │  (normal text response from CorruptionAnalyst)         │
  │                                                        │
  ├────────────────────────────────────────────────────────┤
  │  [Type a message...]                    [Send]         │
  └────────────────────────────────────────────────────────┘
```

### Compare Page

```
  ┌────────────────────────────────────────────────────────┐
  │  Compare States                                        │
  │  [Lagos ▼] [Ogun ▼] [Rivers ▼] [+ Add State]         │
  │  [Compare]                                             │
  ├────────────────────────────────────────────────────────┤
  │                                                        │
  │  ┌─────────────┬─────────────┬─────────────┐          │
  │  │   Lagos     │    Ogun     │   Rivers    │          │
  │  │   [GREEN]   │   [YELLOW]  │   [GREEN]   │          │
  │  ├─────────────┼─────────────┼─────────────┤          │
  │  │ FAAC Dep.   │ FAAC Dep.   │ FAAC Dep.   │          │
  │  │ 32% GREEN   │ 71% YELLOW  │ 28% GREEN   │          │
  │  ├─────────────┼─────────────┼─────────────┤          │
  │  │ Debt/Rev    │ Debt/Rev    │ Debt/Rev    │          │
  │  │ 45% GREEN   │ 82% RED     │ 38% GREEN   │          │
  │  ├─────────────┼─────────────┼─────────────┤          │
  │  │ IGR Growth  │ IGR Growth  │ IGR Growth  │          │
  │  │ 12% GREEN   │ 5% YELLOW   │ 18% GREEN   │          │
  │  └─────────────┴─────────────┴─────────────┘          │
  │                                                        │
  │  [Export Comparison as PDF]                            │
  └────────────────────────────────────────────────────────┘
```

### Rank Page

```
  ┌────────────────────────────────────────────────────────┐
  │  State Rankings                                        │
  │  Zone: [All States ▼]  Sort: [Overall Signal ▼]       │
  ├────────────────────────────────────────────────────────┤
  │                                                        │
  │  # │ State        │ Signal │ FAAC Dep │ Debt/Rev │ IGR│
  │  ──┼──────────────┼────────┼──────────┼──────────┼────│
  │  1 │ Lagos        │ GREEN  │ 32%      │ 45%      │ 12%│
  │  2 │ Rivers       │ GREEN  │ 28%      │ 38%      │ 18%│
  │  3 │ Ogun         │ YELLOW │ 71%      │ 82%      │ 5% │
  │  4 │ Kano         │ RED    │ 85%      │ 120%     │ -2%│
  │  ──┼──────────────┼────────┼──────────┼──────────┼────│
  │                                                        │
  │  Click any state to view full assessment               │
  └────────────────────────────────────────────────────────┘
```

## Next.js Configuration

```typescript
// apps/institution/next.config.ts

const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@ournigeria/ui'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};
```

## Auth Provider

```typescript
// apps/institution/src/components/layout/AuthProvider.tsx

const AuthContext = createContext<AuthState | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<InstitutionalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check session on mount
    fetch('/api/pro/me')
      .then(res => res.ok ? res.json() : null)
      .then(user => {
        setUser(user);
        setLoading(false);
        if (!user) router.push('/login');
      })
      .catch(() => {
        setLoading(false);
        router.push('/login');
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Responsive Design

- Desktop: sidebar + main content (min-width: 1024px)
- Tablet: collapsible sidebar (768px-1023px)
- Mobile: bottom nav, stacked section cards (< 768px)

Credit assessment sections stack vertically on all screen sizes. Comparison table scrolls horizontally on mobile.

## Branding

- Separate from citizen app (ournigeria.com)
- Professional color palette: navy, white, green/yellow/red for signals
- Domain: pro.ournigeria.com or institution.ournigeria.com
- No playful/casual elements — financial professional audience
