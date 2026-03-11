"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  RefreshCw,
  Lock,
  Zap,
  Plus,
  Pencil,
  Trash2,
  Power,
} from "lucide-react";
import { adminFetch } from "@/lib/api";
import { useQueryState, parseAsString } from "nuqs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Setting {
  key: string;
  value: string;
  encrypted: boolean;
  description: string;
  category: string;
  valueType: "string" | "number" | "boolean" | "secret";
  updatedAt: string;
  updatedBy: string;
}

interface EnvVar {
  key: string;
  value: string;
  description: string;
  category: string;
  secret: boolean;
}

interface Connection {
  id: string;
  name: string;
  type: "llm" | "embedding";
  provider: string;
  baseUrl: string;
  apiKeyMasked: string;
  modelId: string;
  modelSmall: string | null;
  dimension: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

type SettingsMap = Record<string, Setting[]>;
type FormValues = Record<string, string>;

// ---------------------------------------------------------------------------
// Provider presets
// ---------------------------------------------------------------------------

const LLM_PROVIDERS = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "o1",
      "o1-mini",
      "o3-mini",
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      "anthropic/claude-sonnet-4",
      "anthropic/claude-opus-4",
      "google/gemini-2.5-pro-preview",
      "google/gemini-2.5-flash-preview",
      "openai/gpt-4o",
      "openai/o3-mini",
      "deepseek/deepseek-chat-v3-0324",
      "meta-llama/llama-4-maverick",
    ],
  },
  {
    id: "together",
    label: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    models: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
      "mistralai/Mixtral-8x22B-Instruct-v0.1",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
    ],
  },
  {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    models: [
      "groq/compound",
      "groq/compound-mini",
      "llama-3.3-70b-versatile",
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "qwen/qwen3-32b",
      "llama-3.1-8b-instant",
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "fireworks",
    label: "Fireworks AI",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    models: [
      "accounts/fireworks/models/llama-v3p3-70b-instruct",
      "accounts/fireworks/models/mixtral-8x22b-instruct",
      "accounts/fireworks/models/qwen2p5-72b-instruct",
    ],
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    baseUrl: "",
    models: [],
  },
] as const;

const EMBEDDING_PROVIDERS = [
  {
    id: "voyage",
    label: "Voyage AI",
    baseUrl: "https://api.voyageai.com/v1",
    models: ["voyage-3-large", "voyage-3", "voyage-3-lite", "voyage-code-3"],
  },
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: [
      "text-embedding-3-large",
      "text-embedding-3-small",
      "text-embedding-ada-002",
    ],
  },
  {
    id: "cohere",
    label: "Cohere",
    baseUrl: "https://api.cohere.ai/v1",
    models: [
      "embed-english-v3.0",
      "embed-multilingual-v3.0",
      "embed-english-light-v3.0",
    ],
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    baseUrl: "",
    models: [],
  },
] as const;

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: "llm", label: "LLM", categories: ["llm"], testable: true },
  {
    id: "embedding",
    label: "Embedding",
    categories: ["embedding"],
    testable: true,
  },
  {
    id: "rag-search",
    label: "RAG & Search",
    categories: ["rag", "rerank", "search"],
    testable: false,
  },
  {
    id: "integrations",
    label: "Integrations",
    categories: ["integrations"],
    testable: false,
  },
  {
    id: "observability",
    label: "Observability",
    categories: ["observability"],
    testable: false,
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    categories: [],
    testable: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function settingsForTab(
  settings: SettingsMap,
  categories: readonly string[],
): Setting[] {
  return categories.flatMap((cat) => settings[cat] ?? []);
}

function buildFormValues(settings: Setting[]): FormValues {
  const vals: FormValues = {};
  for (const s of settings) {
    vals[s.key] = s.valueType === "secret" ? "" : s.value;
  }
  return vals;
}

function getChangedValues(
  original: FormValues,
  current: FormValues,
  settings: Setting[],
): { key: string; value: string }[] {
  const changed: { key: string; value: string }[] = [];
  for (const s of settings) {
    const cur = current[s.key] ?? "";
    if (s.valueType === "secret") {
      if (cur !== "") {
        changed.push({ key: s.key, value: cur });
      }
    } else if (cur !== (original[s.key] ?? "")) {
      changed.push({ key: s.key, value: cur });
    }
  }
  return changed;
}

function isDirty(
  original: FormValues,
  current: FormValues,
  settings: Setting[],
): boolean {
  return getChangedValues(original, current, settings).length > 0;
}

function providerLabel(providerId: string, type: "llm" | "embedding"): string {
  const list = type === "llm" ? LLM_PROVIDERS : EMBEDDING_PROVIDERS;
  return list.find((p) => p.id === providerId)?.label || providerId;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SecretInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide value" : "Show value"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SettingField({
  setting,
  value,
  onChange,
}: {
  setting: Setting;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `setting-${setting.key}`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{setting.description}</Label>
      <p className="text-xs text-muted-foreground font-mono">{setting.key}</p>

      {setting.valueType === "boolean" ? (
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id={id}
            checked={value === "true"}
            onCheckedChange={(checked) =>
              onChange(checked === true ? "true" : "false")
            }
          />
          <label
            htmlFor={id}
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            {value === "true" ? "Enabled" : "Disabled"}
          </label>
        </div>
      ) : setting.valueType === "secret" ? (
        <SecretInput
          value={value}
          placeholder={setting.value || "Enter value"}
          onChange={onChange}
        />
      ) : setting.valueType === "number" ? (
        <Input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connection Card
// ---------------------------------------------------------------------------

function ConnectionCard({
  conn,
  type,
  onActivate,
  onEdit,
  onDelete,
  onTest,
}: {
  conn: Connection;
  type: "llm" | "embedding";
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleActivate = async () => {
    setActivating(true);
    try {
      await onActivate();
    } finally {
      setActivating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete connection "${conn.name}"?`)) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await adminFetch(`/connections/${conn.id}/test`, {
        method: "POST",
      });
      setTestResult(result);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : "Test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        conn.isActive
          ? "border-green-500/50 bg-green-500/5"
          : "border-border hover:border-muted-foreground/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm truncate">{conn.name}</h3>
            {conn.isActive && (
              <Badge
                variant="default"
                className="text-xs bg-green-600 hover:bg-green-600"
              >
                Active
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {providerLabel(conn.provider, type)}
            </Badge>
          </div>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-xs text-muted-foreground font-mono truncate">
              {conn.modelId}
            </p>
            {type === "llm" && conn.modelSmall && (
              <p className="text-xs text-muted-foreground">
                Small model:{" "}
                <span className="font-mono">{conn.modelSmall}</span>
              </p>
            )}
            {type === "embedding" && conn.dimension && (
              <p className="text-xs text-muted-foreground">
                Dimension: {conn.dimension}
              </p>
            )}
            <p className="text-xs text-muted-foreground truncate">
              {conn.baseUrl}
            </p>
            <p className="text-xs text-muted-foreground">
              API Key: {conn.apiKeyMasked}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
        {!conn.isActive && (
          <Button
            variant="default"
            size="sm"
            onClick={handleActivate}
            disabled={activating}
            className="h-7 text-xs"
          >
            {activating ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Power className="h-3 w-3 mr-1" />
            )}
            Activate
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={testing}
          className="h-7 text-xs"
        >
          {testing ? (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Zap className="h-3 w-3 mr-1" />
          )}
          Test
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-7 text-xs"
        >
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleting || conn.isActive}
          className="h-7 text-xs text-destructive hover:text-destructive"
        >
          {deleting ? (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3 mr-1" />
          )}
          Delete
        </Button>
        {testResult && (
          <span
            className={`text-xs flex items-center gap-1 ml-auto ${
              testResult.success
                ? "text-green-600 dark:text-green-400"
                : "text-destructive"
            }`}
          >
            {testResult.success ? (
              <>
                <Check className="h-3 w-3" />
                OK
                {testResult.latencyMs != null && ` (${testResult.latencyMs}ms)`}
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3" />
                {testResult.error || "Failed"}
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connection Form Dialog
// ---------------------------------------------------------------------------

interface ConnectionFormData {
  name: string;
  provider: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  modelSmall: string;
  dimension: string;
}

const EMPTY_FORM: ConnectionFormData = {
  name: "",
  provider: "",
  baseUrl: "",
  apiKey: "",
  modelId: "",
  modelSmall: "",
  dimension: "",
};

function ConnectionFormDialog({
  open,
  onOpenChange,
  type,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "llm" | "embedding";
  editing: Connection | null;
  onSave: () => void;
}) {
  const [form, setForm] = useState<ConnectionFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const providers = type === "llm" ? LLM_PROVIDERS : EMBEDDING_PROVIDERS;

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name,
          provider: editing.provider,
          baseUrl: editing.baseUrl,
          apiKey: "", // Don't pre-fill secret
          modelId: editing.modelId,
          modelSmall: editing.modelSmall || "",
          dimension: editing.dimension ? String(editing.dimension) : "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setTestResult(null);
      setError(null);
    }
  }, [open, editing]);

  const handleProviderChange = (providerId: string) => {
    const preset = providers.find((p) => p.id === providerId);
    setForm((prev) => ({
      ...prev,
      provider: providerId,
      baseUrl: preset?.baseUrl || prev.baseUrl,
    }));
  };

  const currentModels =
    providers.find((p) => p.id === form.provider)?.models ?? [];

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await adminFetch("/connections/test", {
        method: "POST",
        body: JSON.stringify({
          type,
          provider: form.provider,
          baseUrl: form.baseUrl,
          apiKey: form.apiKey,
          modelId: form.modelId,
        }),
      });
      setTestResult(result);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : "Test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.baseUrl.trim() || !form.modelId.trim()) {
      setError("Name, base URL, and model ID are required.");
      return;
    }
    if (!editing && !form.apiKey.trim()) {
      setError("API key is required for new connections.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const body: any = {
        name: form.name.trim(),
        type,
        provider: form.provider || "custom",
        baseUrl: form.baseUrl.trim(),
        modelId: form.modelId.trim(),
      };
      if (form.apiKey) body.apiKey = form.apiKey;
      if (type === "llm" && form.modelSmall)
        body.modelSmall = form.modelSmall.trim();
      if (type === "embedding" && form.dimension)
        body.dimension = parseInt(form.dimension, 10);

      if (editing) {
        await adminFetch(`/connections/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await adminFetch("/connections", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      onSave();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit" : "New"} {type === "llm" ? "LLM" : "Embedding"}{" "}
            Connection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Connection Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. OpenRouter Claude Sonnet"
            />
          </div>

          {/* Provider */}
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select
              value={form.provider || "custom"}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <Label>Base URL</Label>
            <Input
              value={form.baseUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, baseUrl: e.target.value }))
              }
              placeholder="https://api.openai.com/v1"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <Label>
              API Key
              {editing && (
                <span className="text-xs text-muted-foreground ml-2">
                  (leave blank to keep existing)
                </span>
              )}
            </Label>
            <SecretInput
              value={form.apiKey}
              placeholder={editing ? editing.apiKeyMasked : "Enter API key"}
              onChange={(v) => setForm((f) => ({ ...f, apiKey: v }))}
            />
          </div>

          {/* Model ID */}
          <div className="space-y-1.5">
            <Label>Model ID</Label>
            <div className="flex gap-2">
              <Input
                value={form.modelId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, modelId: e.target.value }))
                }
                placeholder="Enter model ID"
                className="flex-1"
              />
              {currentModels.length > 0 && (
                <Select
                  value={form.modelId}
                  onValueChange={(v) => setForm((f) => ({ ...f, modelId: v }))}
                >
                  <SelectTrigger className="w-[180px] shrink-0">
                    <SelectValue placeholder="Presets" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentModels.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m.split("/").pop()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* LLM-only: Small model */}
          {type === "llm" && (
            <div className="space-y-1.5">
              <Label>
                Small/Fast Model ID
                <span className="text-xs text-muted-foreground ml-2">
                  (optional, for router)
                </span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={form.modelSmall}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, modelSmall: e.target.value }))
                  }
                  placeholder="Same as primary if blank"
                  className="flex-1"
                />
                {currentModels.length > 0 && (
                  <Select
                    value={form.modelSmall}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, modelSmall: v }))
                    }
                  >
                    <SelectTrigger className="w-[180px] shrink-0">
                      <SelectValue placeholder="Presets" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m.split("/").pop()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Embedding-only: Dimension */}
          {type === "embedding" && (
            <div className="space-y-1.5">
              <Label>
                Vector Dimension
                <span className="text-xs text-muted-foreground ml-2">
                  (optional)
                </span>
              </Label>
              <Input
                type="number"
                value={form.dimension}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dimension: e.target.value }))
                }
                placeholder="e.g. 1024"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                )}
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={
                  testing ||
                  !form.baseUrl ||
                  !form.modelId ||
                  (!form.apiKey && !editing)
                }
              >
                {testing ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                )}
                Test
              </Button>
              {testResult && (
                <span
                  className={`text-xs flex items-center gap-1 ${
                    testResult.success
                      ? "text-green-600 dark:text-green-400"
                      : "text-destructive"
                  }`}
                >
                  {testResult.success ? (
                    <>
                      <Check className="h-3 w-3" />
                      OK
                      {testResult.latencyMs != null &&
                        ` (${testResult.latencyMs}ms)`}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      {testResult.error || "Failed"}
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Connections Tab (LLM or Embedding)
// ---------------------------------------------------------------------------

function ConnectionsTabContent({
  type,
  connections,
  onRefresh,
}: {
  type: "llm" | "embedding";
  connections: Connection[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);

  const filtered = connections.filter((c) => c.type === type);

  const handleActivate = async (id: string) => {
    await adminFetch(`/connections/${id}/activate`, { method: "POST" });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await adminFetch(`/connections/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const handleEdit = (conn: Connection) => {
    setEditing(conn);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {type === "llm" ? "LLM" : "Embedding"} Connections
            </CardTitle>
            <Button size="sm" onClick={handleNew} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              New Connection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No {type === "llm" ? "LLM" : "embedding"} connections
                configured.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNew}
                className="mt-3"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create your first connection
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  conn={conn}
                  type={type}
                  onActivate={() => handleActivate(conn.id)}
                  onEdit={() => handleEdit(conn)}
                  onDelete={() => handleDelete(conn.id)}
                  onTest={() => {}}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConnectionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={type}
        editing={editing}
        onSave={onRefresh}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Editable Settings Tab (RAG, Integrations, Observability)
// ---------------------------------------------------------------------------

function EditableTabContent({
  settings,
  showRerankerTest,
}: {
  settings: Setting[];
  showRerankerTest?: boolean;
}) {
  const [formValues, setFormValues] = useState<FormValues>(() =>
    buildFormValues(settings),
  );
  const [originalValues] = useState<FormValues>(() =>
    buildFormValues(settings),
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [rerankTesting, setRerankTesting] = useState(false);
  const [rerankResult, setRerankResult] = useState<{
    success: boolean;
    latencyMs?: number;
    model?: string;
    error?: string;
  } | null>(null);

  const handleChange = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setSaveMessage(null);
  }, []);

  const handleSave = async () => {
    const changed = getChangedValues(originalValues, formValues, settings);
    if (changed.length === 0) return;

    setSaving(true);
    setSaveMessage(null);
    try {
      await adminFetch("/settings/bulk", {
        method: "PUT",
        body: JSON.stringify({ settings: changed }),
      });
      setSaveMessage({
        type: "success",
        text: `${changed.length} setting${changed.length > 1 ? "s" : ""} saved successfully.`,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save settings";
      setSaveMessage({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestReranker = async () => {
    setRerankTesting(true);
    setRerankResult(null);
    try {
      const result = await adminFetch("/settings/test-reranker", {
        method: "POST",
      });
      setRerankResult(result);
    } catch (err: unknown) {
      setRerankResult({
        success: false,
        error: err instanceof Error ? err.message : "Test failed",
      });
    } finally {
      setRerankTesting(false);
    }
  };

  const dirty = isDirty(originalValues, formValues, settings);

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {settings.map((s) => (
            <SettingField
              key={s.key}
              setting={s}
              value={formValues[s.key] ?? ""}
              onChange={(v) => handleChange(s.key, v)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
              {saving ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1.5" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {saveMessage && (
              <span
                className={`text-sm flex items-center gap-1.5 ${saveMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
              >
                {saveMessage.type === "success" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {saveMessage.text}
              </span>
            )}
          </div>

          {showRerankerTest && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestReranker}
                disabled={rerankTesting}
              >
                {rerankTesting ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                )}
                Test Reranker
              </Button>
              {rerankResult && (
                <span
                  className={`text-xs flex items-center gap-1 ${
                    rerankResult.success
                      ? "text-green-600 dark:text-green-400"
                      : "text-destructive"
                  }`}
                >
                  {rerankResult.success ? (
                    <>
                      <Check className="h-3 w-3" />
                      OK
                      {rerankResult.model && ` (${rerankResult.model})`}
                      {rerankResult.latencyMs != null &&
                        ` ${rerankResult.latencyMs}ms`}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      {rerankResult.error || "Failed"}
                    </>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Infrastructure Tab
// ---------------------------------------------------------------------------

function InfrastructureTab({ envVars }: { envVars: EnvVar[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Environment Variables
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {envVars.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No environment variables available.
            </p>
          ) : (
            envVars.map((env) => (
              <div
                key={env.key}
                className="flex items-start justify-between gap-4 rounded-lg border border-border p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-medium truncate">
                      {env.key}
                    </p>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Requires Redeploy
                    </Badge>
                  </div>
                  {env.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {env.description}
                    </p>
                  )}
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono shrink-0 max-w-[200px] truncate">
                  {env.secret ? "********" : env.value}
                </code>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("llm").withOptions({ shallow: true }),
  );
  const [settings, setSettings] = useState<SettingsMap>({});
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      adminFetch("/settings").then((d) => d.settings as SettingsMap),
      adminFetch("/settings/env").then((d) => d.envVars as EnvVar[]),
      adminFetch("/connections").then((d) => d.connections as Connection[]),
    ])
      .then(([settingsData, envData, connsData]) => {
        setSettings(settingsData);
        setEnvVars(envData);
        setConnections(connsData);
      })
      .catch((err) => {
        setError(err.message || "Failed to load settings");
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshConnections = useCallback(() => {
    adminFetch("/connections")
      .then((d) => setConnections(d.connections as Connection[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage AI models, API keys, and system configuration
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage AI models, API keys, and system configuration
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            {t.id === "infrastructure" ? (
              <InfrastructureTab envVars={envVars} />
            ) : t.id === "llm" ? (
              <ConnectionsTabContent
                type="llm"
                connections={connections}
                onRefresh={refreshConnections}
              />
            ) : t.id === "embedding" ? (
              <ConnectionsTabContent
                type="embedding"
                connections={connections}
                onRefresh={refreshConnections}
              />
            ) : (
              <EditableTabContent
                key={`${t.id}-${JSON.stringify(settings)}`}
                settings={settingsForTab(settings, t.categories)}
                showRerankerTest={t.id === "rag-search"}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
