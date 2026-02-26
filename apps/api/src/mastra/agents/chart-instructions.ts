/**
 * Chart output instructions appended to all agent system prompts.
 * Teaches agents to output structured ```chart``` JSON blocks.
 */
export const CHART_INSTRUCTIONS = `

## Chart Output

When your response includes quantitative data that would benefit from visualization, include a chart block. The user may also explicitly request a specific chart type.

To render a chart, output a fenced code block with the language tag "chart" containing valid JSON:

\`\`\`chart
{
  "type": "<chart-type>",
  "title": "Chart Title",
  "data": [ ... ],
  "config": { ... }
}
\`\`\`

### Available chart types and when to use them:

**Comparison** (comparing values across categories):
- \`bar\` — Horizontal bars. Best for: sector allocations, state comparisons (≤15 items)
- \`column\` — Vertical bars. Best for: year-over-year single metric
- \`stacked-bar\` — Stacked horizontal. Best for: multi-sector across states
- \`radar\` — Spider chart. Best for: comparing a state across multiple dimensions

**Composition** (showing parts of a whole):
- \`pie\` — Simple pie. Best for: ≤6 categories showing budget composition
- \`donut\` — Pie with hole. Best for: same as pie but with a total in center
- \`treemap\` — Nested rectangles. Best for: hierarchical budget breakdown (ministry → department → line items)
- \`funnel\` — Narrowing stages. Best for: budget proposal → approval → disbursement → utilization
- \`waterfall\` — Running total. Best for: revenue sources minus expenditures

**Trend** (showing change over time):
- \`line\` — Lines. Best for: multi-year spending trends
- \`area\` — Filled lines. Best for: cumulative or volume emphasis
- \`stacked-area\` — Stacked filled. Best for: composition change over time

**Distribution** (showing data spread):
- \`histogram\` — Frequency bars. Best for: "how are state budgets distributed?"
- \`scatter\` — Dots on XY plane. Best for: budget vs population, spend vs outcomes
- \`bubble\` — Scatter + size. Best for: 3-variable comparisons

**Specialized**:
- \`heatmap\` — Color grid. Best for: state × sector spending matrix
- \`gauge\` — Single metric dial. Best for: budget utilization percentage
- \`polar\` — Radial bars. Best for: angular sector comparison

### Data format rules:

1. All monetary values must be in raw numbers (not formatted): \`150200000000\` not "₦150.2B"
2. Set \`config.formatValue: "naira"\` for the frontend to format as ₦
3. For multi-series charts (line, area, stacked), use \`config.series\` to define each line:
   \`\`\`json
   "config": {
     "series": [
       { "key": "education", "label": "Education", "color": "#059669" },
       { "key": "health", "label": "Health", "color": "#0891b2" }
     ]
   }
   \`\`\`
4. Include 3-15 data points for readability. Aggregate if you have more.
5. You may include multiple chart blocks in one response if the analysis warrants it.

### When the user explicitly requests a chart:

If the user says "show me a bar chart of..." or "plot a scatter chart...", use exactly the chart type they requested, even if another type might be more appropriate. Respect user preference.

### When to auto-include charts:

- Any response with 3+ comparable numeric values → suggest a chart
- Budget breakdown questions → donut or treemap
- Year-over-year questions → line or area
- State comparison questions → bar or radar
- Distribution questions → histogram
`;
