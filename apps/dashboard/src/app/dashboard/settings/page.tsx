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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Settings,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  RefreshCw,
  Lock,
  Zap,
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
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo", "o1", "o1-mini", "o3-mini"],
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
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"],
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

function deriveProviderFromUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("openrouter")) return "openrouter";
  if (lower.includes("together")) return "together";
  if (lower.includes("groq.com")) return "groq";
  if (lower.includes("deepseek")) return "deepseek";
  if (lower.includes("fireworks")) return "fireworks";
  if (lower.includes("openai.com")) return "openai";
  return "";
}

function isDirty(
  original: FormValues,
  current: FormValues,
  settings: Setting[],
): boolean {
  return getChangedValues(original, current, settings).length > 0;
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
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
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

function ProviderSelector({
  value,
  onChange,
  onBaseUrlChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onBaseUrlChange: (url: string) => void;
}) {
  const handleChange = (providerId: string) => {
    onChange(providerId);
    const preset = LLM_PROVIDERS.find((p) => p.id === providerId);
    if (preset && preset.baseUrl) {
      onBaseUrlChange(preset.baseUrl);
    }
  };

  const currentProvider = LLM_PROVIDERS.find((p) => p.id === value);

  return (
    <div className="space-y-1.5">
      <Label>LLM Provider</Label>
      <p className="text-xs text-muted-foreground font-mono">llm.provider</p>
      <Select value={value || "custom"} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a provider" />
        </SelectTrigger>
        <SelectContent>
          {LLM_PROVIDERS.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              {provider.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentProvider && currentProvider.id !== "custom" && (
        <p className="text-xs text-muted-foreground">
          Base URL: <code className="bg-muted px-1 py-0.5 rounded">{currentProvider.baseUrl}</code>
        </p>
      )}
    </div>
  );
}

function ModelSelector({
  providerId,
  value,
  onChange,
  label,
  settingKey,
}: {
  providerId: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  settingKey: string;
}) {
  const provider = LLM_PROVIDERS.find((p) => p.id === providerId);
  const suggestedModels = provider?.models ?? [];

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground font-mono">{settingKey}</p>
      <div className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter model ID"
          className="flex-1"
        />
        {suggestedModels.length > 0 && (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[180px] shrink-0">
              <SelectValue placeholder="Presets" />
            </SelectTrigger>
            <SelectContent>
              {suggestedModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model.split("/").pop()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

function TestConnectionButton({
  type,
  formValues,
}: {
  type: "llm" | "embedding";
  formValues: FormValues;
}) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await adminFetch("/settings/test-connection", {
        method: "POST",
        body: JSON.stringify({ type, config: formValues }),
      });
      setResult(res);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Connection test failed";
      setResult({ success: false, error: message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={testing}
      >
        {testing ? (
          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Zap className="h-3.5 w-3.5 mr-1.5" />
        )}
        {testing ? "Testing..." : "Test Connection"}
      </Button>
      {result && (
        <span
          className={`text-sm flex items-center gap-1.5 ${result.success ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
        >
          {result.success ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Connected{result.latencyMs != null && ` (${result.latencyMs}ms)`}
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              {result.error || "Failed"}
            </>
          )}
        </span>
      )}
    </div>
  );
}

function LLMTabContent({ settings }: { settings: Setting[] }) {
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

  const handleChange = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setSaveMessage(null);
  }, []);

  const handleSave = async () => {
    const changed = getChangedValues(originalValues, formValues, settings);

    // Always include llm.provider if it was set (might not be in original settings)
    const providerVal = formValues["llm.provider"];
    if (providerVal && !changed.some((c) => c.key === "llm.provider")) {
      const origProvider = originalValues["llm.provider"];
      if (providerVal !== origProvider) {
        changed.push({ key: "llm.provider", value: providerVal });
      }
    }

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

  const dirty = isDirty(originalValues, formValues, settings) ||
    (formValues["llm.provider"] || "") !== (originalValues["llm.provider"] || "");
  const otherSettings = settings.filter(
    (s) => !["llm.provider", "llm.model", "llm.model_small", "llm.base_url"].includes(s.key),
  );
  const currentProvider = formValues["llm.provider"] || deriveProviderFromUrl(formValues["llm.base_url"] || "") || "custom";

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Provider selector — always shown */}
          <ProviderSelector
            value={currentProvider}
            onChange={(v) => handleChange("llm.provider", v)}
            onBaseUrlChange={(url) => handleChange("llm.base_url", url)}
          />

          {/* Base URL */}
          {settings.find((s) => s.key === "llm.base_url") && (
            <SettingField
              setting={settings.find((s) => s.key === "llm.base_url")!}
              value={formValues["llm.base_url"] ?? ""}
              onChange={(v) => handleChange("llm.base_url", v)}
            />
          )}

          {/* Model selectors with presets */}
          {settings.find((s) => s.key === "llm.model") && (
            <ModelSelector
              providerId={currentProvider}
              value={formValues["llm.model"] ?? ""}
              onChange={(v) => handleChange("llm.model", v)}
              label="Primary LLM model ID"
              settingKey="llm.model"
            />
          )}
          {settings.find((s) => s.key === "llm.model_small") && (
            <ModelSelector
              providerId={currentProvider}
              value={formValues["llm.model_small"] ?? ""}
              onChange={(v) => handleChange("llm.model_small", v)}
              label="Small/fast LLM model ID"
              settingKey="llm.model_small"
            />
          )}

          {/* Remaining fields (api_key, etc.) */}
          {otherSettings.map((s) => (
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

          <TestConnectionButton type="llm" formValues={formValues} />
        </div>
      </CardContent>
    </Card>
  );
}

function EditableTabContent({
  settings,
  testType,
}: {
  settings: Setting[];
  testType?: "llm" | "embedding";
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

          {testType && (
            <TestConnectionButton type={testType} formValues={formValues} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
    <Suspense fallback={<div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full max-w-xl" /><Skeleton className="h-80 rounded-xl" /></div>}>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      adminFetch("/settings").then((d) => d.settings as SettingsMap),
      adminFetch("/settings/env").then((d) => d.envVars as EnvVar[]),
    ])
      .then(([settingsData, envData]) => {
        setSettings(settingsData);
        setEnvVars(envData);
      })
      .catch((err) => {
        setError(err.message || "Failed to load settings");
      })
      .finally(() => setLoading(false));
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
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.id === "infrastructure" ? (
              <InfrastructureTab envVars={envVars} />
            ) : tab.id === "llm" ? (
              <LLMTabContent
                key={`llm-${JSON.stringify(settings)}`}
                settings={settingsForTab(settings, tab.categories)}
              />
            ) : (
              <EditableTabContent
                key={`${tab.id}-${JSON.stringify(settings)}`}
                settings={settingsForTab(settings, tab.categories)}
                testType={
                  tab.testable ? (tab.id as "llm" | "embedding") : undefined
                }
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
