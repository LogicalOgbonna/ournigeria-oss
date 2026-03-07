"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Target,
  FileQuestion,
  ChevronDown,
  ChevronRight,
  Terminal,
  Layers,
  Copy,
} from "lucide-react";
import { adminFetch } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────

interface FileStats {
  name: string;
  label: string;
  totalQuestions: number;
  hasResults: boolean;
  passed: number;
  failed: number;
  errors: number;
  passRate: number;
  avgResponseTimeMs: number;
  byDifficulty: Record<string, { total: number; passed: number }>;
}

interface Overview {
  hasResults: boolean;
  summary: {
    run_date: string;
    overall_pass_rate: string;
  } | null;
  files: FileStats[];
}

interface EvalQuestion {
  id: string;
  category: string;
  question: string;
  intent?: string;
  expected_intent?: string;
  difficulty: string;
  why_it_breaks: string;
  expected_answer?: string;
  answer?: string;
  pass?: boolean;
  resolved_intent?: string;
  response_time_ms?: number;
  evaluation_notes?: string;
}

interface EvalFile {
  name: string;
  description: string;
  questions: EvalQuestion[];
}

// ─── Helpers ────────────────────────────────────────────────────

const DIFF_COLORS: Record<string, string> = {
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  hard: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  very_hard:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const SOURCE_COLORS: Record<string, string> = {
  "corruption.json": "oklch(0.645 0.246 16.439)",
  "budget.json": "oklch(0.56 0.155 160)",
  "govspend.json": "oklch(0.6 0.118 184.704)",
  "faac.json": "oklch(0.75 0.15 85)",
  "routing.json": "oklch(0.627 0.265 303.9)",
};

function sourceLabel(name: string) {
  return name.replace(".json", "").replace(/^\w/, (c) => c.toUpperCase());
}

function passRateColor(rate: number) {
  if (rate >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function passRateBg(rate: number) {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 60) return "bg-amber-500";
  return "bg-red-500";
}

// ─── Page ───────────────────────────────────────────────────────

export default function EvaluationPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      }
    >
      <EvaluationContent />
    </Suspense>
  );
}

function EvaluationContent() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileData, setFileData] = useState<EvalFile | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    adminFetch("/eval/overview")
      .then(setOverview)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadFile = useCallback((filename: string) => {
    setSelectedFile(filename);
    setFileLoading(true);
    adminFetch(`/eval/file?name=${encodeURIComponent(filename)}`)
      .then(setFileData)
      .catch(() => setFileData(null))
      .finally(() => setFileLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="space-y-6">
        <Header />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-500" />
            <p className="text-muted-foreground">
              {error || "Failed to load evaluation data."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Make sure the evaluation files exist in{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                packages/evaluation/
              </code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = overview.files.reduce(
    (s, f) => s + f.totalQuestions,
    0,
  );
  const totalPassed = overview.files.reduce((s, f) => s + f.passed, 0);
  const totalFailed = overview.files.reduce((s, f) => s + f.failed, 0);
  const totalErrors = overview.files.reduce((s, f) => s + f.errors, 0);
  const overallPassRate =
    totalQuestions > 0
      ? Math.round((totalPassed / totalQuestions) * 1000) / 10
      : 0;
  const avgTime =
    overview.files.length > 0
      ? Math.round(
          overview.files.reduce(
            (s, f) => s + f.avgResponseTimeMs * f.totalQuestions,
            0,
          ) / totalQuestions,
        )
      : 0;

  return (
    <div className="space-y-6">
      <Header
        runDate={overview.summary?.run_date}
        hasResults={overview.hasResults}
      />

      {!overview.hasResults && <RunInstructions />}

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Questions"
          value={totalQuestions.toString()}
          icon={<FileQuestion className="h-4 w-4" />}
          sub={`${overview.files.length} sources`}
        />
        <StatCard
          label="Pass Rate"
          value={overview.hasResults ? `${overallPassRate}%` : "--"}
          icon={<Target className="h-4 w-4" />}
          valueClass={
            overview.hasResults ? passRateColor(overallPassRate) : undefined
          }
          sub={
            overview.hasResults ? `${totalPassed} of ${totalQuestions}` : "Not run yet"
          }
        />
        <StatCard
          label="Failed"
          value={overview.hasResults ? totalFailed.toString() : "--"}
          icon={<XCircle className="h-4 w-4" />}
          valueClass={
            overview.hasResults && totalFailed > 0
              ? "text-red-600 dark:text-red-400"
              : undefined
          }
          sub={
            overview.hasResults && totalErrors > 0
              ? `+ ${totalErrors} errors`
              : overview.hasResults
                ? "No errors"
                : "Not run yet"
          }
        />
        <StatCard
          label="Avg Response Time"
          value={overview.hasResults ? `${(avgTime / 1000).toFixed(1)}s` : "--"}
          icon={<Clock className="h-4 w-4" />}
          sub={overview.hasResults ? "Per question" : "Not run yet"}
        />
      </div>

      {/* Source Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {overview.files.map((f) => (
          <SourceCard
            key={f.name}
            file={f}
            isSelected={selectedFile === f.name}
            onClick={() => loadFile(f.name)}
          />
        ))}
      </div>

      {/* Difficulty Breakdown Chart */}
      <DifficultyChart files={overview.files} hasResults={overview.hasResults} />

      {/* Questions Explorer */}
      {selectedFile && (
        <QuestionsExplorer
          filename={selectedFile}
          data={fileData}
          loading={fileLoading}
          hasResults={overview.hasResults}
        />
      )}
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────

function Header({
  runDate,
  hasResults,
}: {
  runDate?: string;
  hasResults?: boolean;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          RAG Evaluation
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Stress-test the RAG pipeline with complex questions across all data
          sources
        </p>
      </div>
      {hasResults && runDate && (
        <Badge variant="outline" className="text-xs font-mono shrink-0">
          Last run: {new Date(runDate).toLocaleDateString()}{" "}
          {new Date(runDate).toLocaleTimeString()}
        </Badge>
      )}
    </div>
  );
}

// ─── Run Instructions ───────────────────────────────────────────

function RunInstructions() {
  const [copied, setCopied] = useState(false);
  const command = `npx tsx packages/evaluation/run-eval.ts \\
  --api-url http://localhost:3001 \\
  --user-id <UUID>`;

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">
              No evaluation results yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Run the evaluation script to test the RAG pipeline against{" "}
              <span className="font-medium text-foreground">
                115 stress-test questions
              </span>{" "}
              and see results here.
            </p>
            <div className="mt-3 relative">
              <pre className="text-xs bg-muted/80 border rounded-lg p-3 pr-10 font-mono overflow-x-auto">
                {command}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 w-7 p-0"
                onClick={() => {
                  navigator.clipboard.writeText(
                    command.replace(/\\\n\s*/g, " "),
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold font-heading ${valueClass ?? ""}`}
        >
          {value}
        </div>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Source Card ─────────────────────────────────────────────────

function SourceCard({
  file,
  isSelected,
  onClick,
}: {
  file: FileStats;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = SOURCE_COLORS[file.name] || "oklch(0.56 0.155 160)";

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "ring-2 ring-primary shadow-md"
          : "hover:ring-1 hover:ring-border"
      }`}
      onClick={onClick}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">
            {sourceLabel(file.name)}
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {file.totalQuestions}
          </Badge>
        </div>

        {file.hasResults ? (
          <>
            <div className="flex items-baseline gap-1 mb-2">
              <span
                className={`text-xl font-bold font-heading ${passRateColor(file.passRate)}`}
              >
                {file.passRate}%
              </span>
              <span className="text-xs text-muted-foreground">pass rate</span>
            </div>
            <Progress
              value={file.passRate}
              className={`h-1.5 mb-2 ${file.passRate >= 80 ? "[&>[data-slot=progress-indicator]]:bg-emerald-500" : file.passRate >= 60 ? "[&>[data-slot=progress-indicator]]:bg-amber-500" : "[&>[data-slot=progress-indicator]]:bg-red-500"}`}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {file.passed}
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                {file.failed}
              </span>
              {file.errors > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  {file.errors}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {(file.avgResponseTimeMs / 1000).toFixed(1)}s
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 mb-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground">
                {file.totalQuestions} questions ready
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(file.byDifficulty).map(([diff, stats]) => (
                <Badge
                  key={diff}
                  variant="outline"
                  className={`text-[9px] ${DIFF_COLORS[diff] || ""}`}
                >
                  {diff}: {stats.total}
                </Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Difficulty Chart ───────────────────────────────────────────

function DifficultyChart({
  files,
  hasResults,
}: {
  files: FileStats[];
  hasResults: boolean;
}) {
  const merged: Record<string, { total: number; passed: number }> = {};
  for (const f of files) {
    for (const [diff, stats] of Object.entries(f.byDifficulty)) {
      if (!merged[diff]) merged[diff] = { total: 0, passed: 0 };
      merged[diff].total += stats.total;
      merged[diff].passed += stats.passed;
    }
  }

  const order = ["medium", "hard", "very_hard"];
  const data = order
    .filter((d) => merged[d])
    .map((d) => ({
      difficulty: d.replace("_", " "),
      total: merged[d].total,
      passed: merged[d].passed,
      failed: merged[d].total - merged[d].passed,
      passRate:
        merged[d].total > 0
          ? Math.round((merged[d].passed / merged[d].total) * 100)
          : 0,
    }));

  if (data.length === 0) return null;

  const barColors = {
    passed: "oklch(0.56 0.155 160)",
    failed: "oklch(0.577 0.245 27.325)",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Layers className="h-4 w-4" />
          {hasResults
            ? "Pass Rate by Difficulty"
            : "Question Distribution by Difficulty"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                className="stroke-border"
              />
              <XAxis
                type="number"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="difficulty"
                type="category"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  value,
                  String(name).charAt(0).toUpperCase() + String(name).slice(1),
                ]}
              />
              {hasResults ? (
                <>
                  <Bar
                    dataKey="passed"
                    stackId="a"
                    fill={barColors.passed}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="failed"
                    stackId="a"
                    fill={barColors.failed}
                    radius={[0, 4, 4, 0]}
                  />
                </>
              ) : (
                <Bar dataKey="total" fill="oklch(0.56 0.155 160)" radius={[0, 4, 4, 0]}>
                  {data.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.difficulty === "very hard"
                          ? "oklch(0.577 0.245 27.325)"
                          : entry.difficulty === "hard"
                            ? "oklch(0.75 0.15 85)"
                            : "oklch(0.6 0.118 184.704)"
                      }
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Questions Explorer ─────────────────────────────────────────

function QuestionsExplorer({
  filename,
  data,
  loading,
  hasResults,
}: {
  filename: string;
  data: EvalFile | null;
  loading: boolean;
  hasResults: boolean;
}) {
  const [diffFilter, setDiffFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 space-y-3">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Failed to load questions for this file.
        </CardContent>
      </Card>
    );
  }

  let questions = data.questions;
  if (diffFilter !== "all") {
    questions = questions.filter((q) => q.difficulty === diffFilter);
  }
  if (statusFilter !== "all") {
    if (statusFilter === "pass") questions = questions.filter((q) => q.pass === true);
    else if (statusFilter === "fail")
      questions = questions.filter(
        (q) => q.pass === false && !q.answer?.startsWith("ERROR:"),
      );
    else if (statusFilter === "error")
      questions = questions.filter((q) => q.answer?.startsWith("ERROR:"));
  }

  const difficulties = [
    ...new Set(data.questions.map((q) => q.difficulty)),
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {sourceLabel(filename)} &mdash; {data.questions.length} Questions
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={diffFilter} onValueChange={setDiffFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulty</SelectItem>
                {difficulties.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasResults && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border max-h-[600px] overflow-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="w-[90px]">Difficulty</TableHead>
                {hasResults && (
                  <>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[70px] text-right">Time</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <QuestionRow
                  key={q.id}
                  q={q}
                  isExpanded={expandedId === q.id}
                  onToggle={() =>
                    setExpandedId(expandedId === q.id ? null : q.id)
                  }
                  hasResults={hasResults}
                />
              ))}
              {questions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={hasResults ? 6 : 4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No questions match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Question Row ───────────────────────────────────────────────

function QuestionRow({
  q,
  isExpanded,
  onToggle,
  hasResults,
}: {
  q: EvalQuestion;
  isExpanded: boolean;
  onToggle: () => void;
  hasResults: boolean;
}) {
  const isError = q.answer?.startsWith("ERROR:");
  const statusBadge = hasResults ? (
    isError ? (
      <Badge
        variant="outline"
        className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700"
      >
        Error
      </Badge>
    ) : q.pass ? (
      <Badge
        variant="outline"
        className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700"
      >
        Pass
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700"
      >
        Fail
      </Badge>
    )
  ) : null;

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <TableCell className="px-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {q.id}
        </TableCell>
        <TableCell className="text-sm max-w-[400px]">
          <span className="line-clamp-1">{q.question}</span>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={`text-[10px] ${DIFF_COLORS[q.difficulty] || ""}`}
          >
            {q.difficulty.replace("_", " ")}
          </Badge>
        </TableCell>
        {hasResults && (
          <>
            <TableCell>{statusBadge}</TableCell>
            <TableCell className="text-right text-xs font-mono text-muted-foreground">
              {q.response_time_ms
                ? `${(q.response_time_ms / 1000).toFixed(1)}s`
                : "--"}
            </TableCell>
          </>
        )}
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={hasResults ? 6 : 4} className="p-0">
            <QuestionDetail q={q} hasResults={hasResults} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Question Detail ────────────────────────────────────────────

function QuestionDetail({
  q,
  hasResults,
}: {
  q: EvalQuestion;
  hasResults: boolean;
}) {
  return (
    <div className="px-6 py-4 space-y-4 animate-fade-in">
      {/* Full question */}
      <div>
        <Label>Question</Label>
        <p className="text-sm mt-1">{q.question}</p>
      </div>

      {/* Category & Intent */}
      <div className="flex flex-wrap gap-4">
        <div>
          <Label>Category</Label>
          <p className="text-sm mt-1 font-mono text-muted-foreground">
            {q.category}
          </p>
        </div>
        {(q.intent || q.expected_intent) && (
          <div>
            <Label>Expected Intent</Label>
            <p className="text-sm mt-1 font-mono text-muted-foreground">
              {q.expected_intent || q.intent}
            </p>
          </div>
        )}
        {hasResults && q.resolved_intent && (
          <div>
            <Label>Resolved Intent</Label>
            <p
              className={`text-sm mt-1 font-mono ${
                q.resolved_intent ===
                (q.expected_intent || q.intent)
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {q.resolved_intent}
              {q.resolved_intent ===
              (q.expected_intent || q.intent) ? (
                <CheckCircle2 className="inline h-3.5 w-3.5 ml-1" />
              ) : (
                <XCircle className="inline h-3.5 w-3.5 ml-1" />
              )}
            </p>
          </div>
        )}
      </div>

      {/* Why it breaks */}
      <div>
        <Label>Why It Breaks</Label>
        <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
          {q.why_it_breaks}
        </p>
      </div>

      {/* Expected Answer */}
      {q.expected_answer && (
        <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 p-3">
          <Label className="text-emerald-700 dark:text-emerald-400">
            Expected Answer
          </Label>
          <p className="text-sm mt-1 leading-relaxed text-emerald-900 dark:text-emerald-200">
            {q.expected_answer}
          </p>
        </div>
      )}

      {/* Actual Answer */}
      {hasResults && q.answer && (
        <div
          className={`rounded-lg border p-3 ${
            q.pass
              ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-800/30"
              : "bg-red-50/30 dark:bg-red-950/10 border-red-200/60 dark:border-red-800/30"
          }`}
        >
          <Label
            className={
              q.pass
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400"
            }
          >
            Actual Answer
          </Label>
          <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-auto custom-scrollbar">
            {q.answer}
          </p>
        </div>
      )}

      {/* Evaluation Notes */}
      {hasResults && q.evaluation_notes && (
        <div className="rounded-lg bg-muted/50 border p-3">
          <Label className="text-muted-foreground">Evaluation Notes</Label>
          <p className="text-sm mt-1 text-muted-foreground">
            {q.evaluation_notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tiny Label ─────────────────────────────────────────────────

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`text-[11px] font-semibold uppercase tracking-wider ${className || "text-muted-foreground"}`}
    >
      {children}
    </span>
  );
}
