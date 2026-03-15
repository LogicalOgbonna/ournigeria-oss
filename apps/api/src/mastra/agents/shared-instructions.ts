/**
 * Shared instruction constants appended to all agent system prompts.
 */

export const CITATION_INSTRUCTIONS = `

## Inline Citations

When you reference specific data, figures, or facts from search results, add inline citation markers using the format [1], [2], [3], etc.
- Number citations sequentially starting from [1] in the order the source documents appear in your search results.
- Each unique source document (identified by filename) gets one citation number. If you reference the same document multiple times, reuse the same number.
- Place the citation marker immediately after the claim it supports, before any punctuation.
- Example: "Lagos State allocated ₦450 billion to education in 2024 [1], a 15% increase from the previous year [2]."
- Do NOT add a references/sources section at the end — the system handles source display automatically.
- Not every sentence needs a citation. Use them for specific numbers, quotes, and key facts.
`;

/**
 * Chart output instructions — teaches agents to output structured chart JSON blocks.
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
3. **Single-value charts** (bar, column, pie, donut, treemap, funnel, waterfall, gauge, polar): each data point MUST have \`"name"\` (label) and \`"value"\` (number):
   \`\`\`json
   "data": [
     { "name": "Education", "value": 150200000000 },
     { "name": "Health", "value": 98000000000 }
   ]
   \`\`\`
4. **Multi-series charts** (line, area, stacked-area, stacked-bar, radar): each data point MUST have \`"name"\` (x-axis label) AND a field for EACH series key. The series keys in \`config.series\` must match field names in the data:
   \`\`\`json
   "data": [
     { "name": "2021", "education": 62000000000, "health": 45000000000 },
     { "name": "2022", "education": 77000000000, "health": 52000000000 }
   ],
   "config": {
     "series": [
       { "key": "education", "label": "Education", "color": "#059669" },
       { "key": "health", "label": "Health", "color": "#0891b2" }
     ]
   }
   \`\`\`
   For a single-series line/area chart, use \`"value"\` as the key:
   \`\`\`json
   "data": [
     { "name": "2021", "value": 62000000000 },
     { "name": "2022", "value": 77000000000 }
   ]
   \`\`\`
5. **Scatter/bubble charts**: each data point MUST have \`"x"\` and \`"y"\` (numbers), plus optional \`"name"\` and \`"z"\` (for bubble size):
   \`\`\`json
   "data": [
     { "name": "Lagos", "x": 15000000, "y": 847000000000, "z": 40 },
     { "name": "Kano", "x": 9000000, "y": 320000000000, "z": 25 }
   ]
   \`\`\`
6. **Histogram charts**: each data point must have \`"name"\` (bin label) and \`"value"\` (count):
   \`\`\`json
   "data": [
     { "name": "0-100B", "value": 5 },
     { "name": "100B-500B", "value": 12 }
   ]
   \`\`\`
7. Include 3-15 data points for readability. Aggregate if you have more.
8. You may include multiple chart blocks in one response if the analysis warrants it.

### When the user explicitly requests a chart:

If the user says "show me a bar chart of..." or "plot a scatter chart...", use exactly the chart type they requested, even if another type might be more appropriate. Respect user preference.

### When to auto-include charts:

- Any response with 3+ comparable numeric values → suggest a chart
- Budget breakdown questions → donut or treemap
- Year-over-year questions → line or area
- State comparison questions → bar or radar
- Distribution questions → histogram
`;

/**
 * Response format instructions — teaches agents to produce a summary + detail structure.
 */
export const RESPONSE_FORMAT = `

## Response Format

IMPORTANT: Structure EVERY response with these two sections:

[TLDR]
Write a 2-3 sentence summary that directly answers the user's question with the key figure(s). This is what most users will read. Be specific — include the main number, the state, the year. Do NOT use markdown headers, bullets, or formatting in the TLDR — just plain sentences.

[DETAIL]
Full analysis with breakdowns, comparisons, citations, and charts. Use markdown formatting, bullet points, and structured data here.

Example:
[TLDR]
Lagos State allocated ₦847 billion to education in 2024, a 23% increase from ₦689 billion in 2023 [1]. The bulk went to primary education (₦312B) and teacher salaries (₦198B) [2].
[DETAIL]
## Education Budget Breakdown
...full analysis here...
`;
