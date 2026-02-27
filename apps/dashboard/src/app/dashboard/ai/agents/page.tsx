"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, RotateCcw, Bot, Route } from "lucide-react";
import { adminFetch } from "@/lib/api";

interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface RouterConfig {
  rules: { pattern: string; agent: string; priority: number }[];
  defaultAgent: string;
}

const placeholderAgents: AgentConfig[] = [
  {
    id: "budget-agent",
    name: "Budget Agent",
    description: "Handles queries about state and federal budget allocations",
    systemPrompt: "You are a Nigerian budget analysis assistant. You help users understand government budget allocations across all 36 states and the FCT. Always cite specific figures and document sources. When comparing states, present data in a structured format.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.3,
    maxTokens: 2048,
  },
  {
    id: "corruption-agent",
    name: "Corruption Agent",
    description: "Handles queries about corruption cases and investigations",
    systemPrompt: "You are a corruption case analysis assistant for Nigeria. You provide factual information about documented corruption cases, investigations, and outcomes. Always note the status of cases (ongoing, concluded, etc.) and cite official sources.",
    model: "claude-sonnet-4-20250514",
    temperature: 0.2,
    maxTokens: 2048,
  },
  {
    id: "router-agent",
    name: "Router Agent",
    description: "Routes incoming queries to the appropriate specialist agent",
    systemPrompt: "You are a query router for the OurNigeria platform. Analyze the user's query and determine which specialist agent should handle it. Consider the topic, intent, and any state-specific references.",
    model: "claude-haiku-4-5-20251001",
    temperature: 0.1,
    maxTokens: 256,
  },
];

const placeholderRouter: RouterConfig = {
  rules: [
    { pattern: "budget|allocation|spending|expenditure", agent: "budget-agent", priority: 1 },
    { pattern: "corruption|fraud|embezzlement|misappropriation", agent: "corruption-agent", priority: 1 },
    { pattern: "infrastructure|road|bridge|building", agent: "budget-agent", priority: 2 },
  ],
  defaultAgent: "budget-agent",
};

export default function AgentConfigPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [router, setRouter] = useState<RouterConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedAgents, setEditedAgents] = useState<Record<string, AgentConfig>>({});

  useEffect(() => {
    Promise.allSettled([
      adminFetch("/ai/agents"),
      adminFetch("/ai/router"),
    ])
      .then(([agentsRes, routerRes]) => {
        setAgents(agentsRes.status === "fulfilled" ? agentsRes.value : placeholderAgents);
        setRouter(routerRes.status === "fulfilled" ? routerRes.value : placeholderRouter);
      })
      .finally(() => setLoading(false));
  }, []);

  function getAgent(id: string) {
    return editedAgents[id] || agents.find((a) => a.id === id)!;
  }

  function updateAgent(id: string, field: keyof AgentConfig, value: string | number) {
    const current = getAgent(id);
    setEditedAgents((prev) => ({ ...prev, [id]: { ...current, [field]: value } }));
  }

  async function saveAgent(id: string) {
    setSaving(id);
    try {
      await adminFetch(`/ai/agents/${id}`, {
        method: "PUT",
        body: JSON.stringify(getAgent(id)),
      });
      setAgents((prev) => prev.map((a) => (a.id === id ? getAgent(id) : a)));
      const { [id]: _, ...rest } = editedAgents;
      setEditedAgents(rest);
    } catch {
      // keep edits
    } finally {
      setSaving(null);
    }
  }

  function resetAgent(id: string) {
    const { [id]: _, ...rest } = editedAgents;
    setEditedAgents(rest);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Agent Configuration</h1>
        <p className="text-muted-foreground text-sm mt-1">Edit system prompts and model settings for AI agents</p>
      </div>

      {agents.map((agent) => {
        const current = getAgent(agent.id);
        const isEdited = !!editedAgents[agent.id];
        return (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{current.name}</CardTitle>
                  {isEdited && <Badge variant="secondary" className="text-xs">Modified</Badge>}
                </div>
                <div className="flex gap-2">
                  {isEdited && (
                    <Button variant="ghost" size="sm" onClick={() => resetAgent(agent.id)}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset
                    </Button>
                  )}
                  <Button size="sm" onClick={() => saveAgent(agent.id)} disabled={!isEdited || saving === agent.id}>
                    {saving === agent.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                    Save
                  </Button>
                </div>
              </div>
              <CardDescription>{current.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>System Prompt</Label>
                <Textarea
                  value={current.systemPrompt}
                  onChange={(e) => updateAgent(agent.id, "systemPrompt", e.target.value)}
                  className="font-mono text-sm min-h-[120px]"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input value={current.model} onChange={(e) => updateAgent(agent.id, "model", e.target.value)} className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Temperature</Label>
                  <Input type="number" min="0" max="2" step="0.1" value={current.temperature} onChange={(e) => updateAgent(agent.id, "temperature", parseFloat(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input type="number" min="256" max="8192" step="256" value={current.maxTokens} onChange={(e) => updateAgent(agent.id, "maxTokens", parseInt(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Separator />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-chart-2" />
            <CardTitle className="text-base">Router Rules</CardTitle>
          </div>
          <CardDescription>Pattern-based routing rules that determine which agent handles a query</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {router?.rules.map((rule, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Badge variant="outline" className="font-mono text-xs shrink-0">P{rule.priority}</Badge>
                <code className="text-sm flex-1 bg-muted px-2 py-0.5 rounded">{rule.pattern}</code>
                <Badge variant="secondary" className="text-xs shrink-0">{rule.agent}</Badge>
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3 text-muted-foreground">
              <Badge variant="outline" className="text-xs shrink-0">Default</Badge>
              <span className="text-sm flex-1">All other queries</span>
              <Badge variant="secondary" className="text-xs shrink-0">{router?.defaultAgent}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
