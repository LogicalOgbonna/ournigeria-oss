"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, Plus, Trash2, CheckCircle, AlertTriangle, Loader2, Mail, Globe } from "lucide-react";
import { adminFetch } from "@/lib/api";

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  channel: "email" | "webhook";
  target: string;
  enabled: boolean;
  lastTriggered: string | null;
}

const placeholderRules: AlertRule[] = [
  { id: "alert-1", name: "High Error Rate", condition: "error_rate_percent", threshold: 5, channel: "email", target: "admin@ournigeria.ng", enabled: true, lastTriggered: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "alert-2", name: "Ingestion Failure", condition: "ingestion_error", threshold: 1, channel: "webhook", target: "https://hooks.slack.com/services/xxx", enabled: true, lastTriggered: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "alert-3", name: "Slow Queries", condition: "p99_latency_ms", threshold: 2000, channel: "email", target: "admin@ournigeria.ng", enabled: false, lastTriggered: null },
  { id: "alert-4", name: "Low Retrieval Scores", condition: "avg_retrieval_score", threshold: 0.5, channel: "email", target: "admin@ournigeria.ng", enabled: true, lastTriggered: null },
];

const conditions = [
  { value: "error_rate_percent", label: "Error Rate (%)" },
  { value: "p99_latency_ms", label: "P99 Latency (ms)" },
  { value: "ingestion_error", label: "Ingestion Error Count" },
  { value: "avg_retrieval_score", label: "Avg Retrieval Score (below)" },
  { value: "disk_usage_percent", label: "Disk Usage (%)" },
  { value: "memory_usage_percent", label: "Memory Usage (%)" },
];

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRule, setNewRule] = useState<{ name: string; condition: string; threshold: string; channel: "email" | "webhook"; target: string }>({ name: "", condition: "error_rate_percent", threshold: "", channel: "email", target: "" });

  useEffect(() => {
    adminFetch("/alerts")
      .then((res) => setRules(res.data ?? res))
      .catch(() => setRules(placeholderRules))
      .finally(() => setLoading(false));
  }, []);

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
    adminFetch(`/alerts/${id}/toggle`, { method: "POST" }).catch(() => {});
  }

  function deleteRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    adminFetch(`/alerts/${id}`, { method: "DELETE" }).catch(() => {});
  }

  function createRule() {
    const rule: AlertRule = {
      id: `alert-${Date.now()}`,
      name: newRule.name,
      condition: newRule.condition,
      threshold: parseFloat(newRule.threshold),
      channel: newRule.channel,
      target: newRule.target,
      enabled: true,
      lastTriggered: null,
    };
    setRules((prev) => [...prev, rule]);
    adminFetch("/alerts", { method: "POST", body: JSON.stringify(rule) }).catch(() => {});
    setCreateOpen(false);
    setNewRule({ name: "", condition: "error_rate_percent", threshold: "", channel: "email", target: "" });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Alert Rules</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure alerts for system events and thresholds</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New Rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alert Rule</DialogTitle>
              <DialogDescription>Set up a new alert that triggers when a condition is met.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="e.g. High Error Rate" value={newRule.name} onChange={(e) => setNewRule((r) => ({ ...r, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={newRule.condition} onValueChange={(v) => setNewRule((r) => ({ ...r, condition: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {conditions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Threshold</Label>
                  <Input type="number" placeholder="5" value={newRule.threshold} onChange={(e) => setNewRule((r) => ({ ...r, threshold: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={newRule.channel} onValueChange={(v: "email" | "webhook") => setNewRule((r) => ({ ...r, channel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{newRule.channel === "email" ? "Email" : "Webhook URL"}</Label>
                  <Input placeholder={newRule.channel === "email" ? "admin@example.com" : "https://..."} value={newRule.target} onChange={(e) => setNewRule((r) => ({ ...r, target: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={createRule} disabled={!newRule.name || !newRule.threshold || !newRule.target}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id} className={!rule.enabled ? "opacity-60" : ""}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{rule.name}</span>
                    <Badge variant={rule.enabled ? "default" : "outline"} className="text-xs">
                      {rule.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{conditions.find((c) => c.value === rule.condition)?.label} &gt; {rule.threshold}</span>
                    <span className="flex items-center gap-1">
                      {rule.channel === "email" ? <Mail className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                      {rule.target}
                    </span>
                    {rule.lastTriggered && <span>Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => toggleRule(rule.id)}>
                    {rule.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRule(rule.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
