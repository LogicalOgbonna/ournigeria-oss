"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
} from "lucide-react";
import { socialsFetch } from "@/lib/api";

interface CampaignSettings {
  identify_auto_post: boolean;
  verify_auto_post: boolean;
}

type IdentifyCategory = "councilor" | "lga_chairman" | "mha";
type VerifyCategory = "identify" | "change";

interface CampaignTemplates {
  identify: Record<IdentifyCategory, string[]>;
  verify: Record<VerifyCategory, string[]>;
}

type TemplateKind = "identify" | "verify";

const IDENTIFY_CATEGORIES: { key: IdentifyCategory; label: string }[] = [
  { key: "councilor", label: "Councilor" },
  { key: "lga_chairman", label: "LGA Chairman" },
  { key: "mha", label: "MHA (State Assembly)" },
];

const VERIFY_CATEGORIES: { key: VerifyCategory; label: string }[] = [
  { key: "identify", label: "Identify" },
  { key: "change", label: "Change" },
];

const PLACEHOLDER_LEGEND: Record<TemplateKind, string[]> = {
  identify: ["{ward}", "{lga}", "{constituency}", "{state}", "{url}"],
  verify: ["{claim}", "{name}", "{fieldLabel}", "{value}", "{url}"],
};

// ---- Auto-post toggle row (mirrors x-connection-card Switch usage) ----

function ToggleRow({
  title,
  subtitle,
  checked,
  saving,
  onToggle,
}: {
  title: string;
  subtitle: string;
  checked: boolean | null;
  saving: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border p-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {checked === null ? (
        <Skeleton className="h-5 w-9 shrink-0" />
      ) : (
        <Switch
          checked={checked}
          onCheckedChange={onToggle}
          disabled={saving}
          aria-label={`Toggle ${title}`}
        />
      )}
    </div>
  );
}

// ---- Per-category template editor card ----

function TemplateCategoryCard({
  kind,
  categoryKey,
  categoryLabel,
  templates,
  onSaved,
}: {
  kind: TemplateKind;
  categoryKey: string;
  categoryLabel: string;
  templates: string[];
  onSaved: (next: CampaignTemplates) => void;
}) {
  const [drafts, setDrafts] = useState<string[]>(templates);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);

  // Keep local drafts in sync when the parent reloads templates (e.g. first fetch).
  useEffect(() => {
    setDrafts(templates);
  }, [templates]);

  const updateAt = (i: number, value: string) => {
    setDrafts((d) => d.map((t, idx) => (idx === i ? value : t)));
  };
  const removeAt = (i: number) => {
    setDrafts((d) => d.filter((_, idx) => idx !== i));
  };
  const add = () => setDrafts((d) => [...d, ""]);

  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      const next: CampaignTemplates = await socialsFetch(
        "/v1/campaign/templates",
        {
          method: "PUT",
          body: JSON.stringify({
            kind,
            category: categoryKey,
            templates: drafts,
          }),
        },
      );
      onSaved(next);
      setNote({ kind: "success", text: "Saved" });
    } catch (e) {
      setNote({
        kind: "error",
        text: e instanceof Error ? e.message : "Could not save templates.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{categoryLabel}</CardTitle>
        <CardDescription>
          {drafts.length} template{drafts.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No templates. Add one below.
          </p>
        ) : (
          drafts.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <Textarea
                value={t}
                onChange={(e) => updateAt(i, e.target.value)}
                rows={3}
                className="flex-1"
                placeholder="Tweet template…"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAt(i)}
                aria-label="Remove template"
                className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="h-4 w-4 mr-1" /> Add template
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>

        {note && (
          <div
            className={`flex items-start gap-2 rounded-md border p-2.5 text-sm ${
              note.kind === "success"
                ? "border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {note.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <span>{note.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlaceholderLegend({ kind }: { kind: TemplateKind }) {
  return (
    <p className="text-xs text-muted-foreground">
      Placeholders:{" "}
      {PLACEHOLDER_LEGEND[kind].map((p, i) => (
        <span key={p}>
          {i > 0 && " "}
          <code className="bg-muted px-1 py-0.5 rounded">{p}</code>
        </span>
      ))}
      . <span className="text-foreground font-medium">{"{url}"}</span> is
      required in every template.
    </p>
  );
}

export default function CampaignPage() {
  const [settings, setSettings] = useState<CampaignSettings | null>(null);
  const [templates, setTemplates] = useState<CampaignTemplates | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [savingIdentify, setSavingIdentify] = useState(false);
  const [savingVerify, setSavingVerify] = useState(false);
  const [settingsNote, setSettingsNote] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      socialsFetch("/v1/campaign/settings"),
      socialsFetch("/v1/campaign/templates"),
    ])
      .then(([s, t]: [CampaignSettings, CampaignTemplates]) => {
        setSettings(s);
        setTemplates(t);
      })
      .catch((e) => {
        setLoadError(
          e instanceof Error ? e.message : "Could not load campaign settings.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const toggleSetting = useCallback(
    async (
      field: "identify_auto_post" | "verify_auto_post",
      next: boolean,
    ) => {
      const setSaving =
        field === "identify_auto_post" ? setSavingIdentify : setSavingVerify;
      setSaving(true);
      setSettingsNote(null);
      // optimistic
      setSettings((s) => (s ? { ...s, [field]: next } : s));
      try {
        const r: CampaignSettings = await socialsFetch(
          "/v1/campaign/settings",
          { method: "PUT", body: JSON.stringify({ [field]: next }) },
        );
        setSettings(r);
        setSettingsNote({ kind: "success", text: "Settings saved." });
      } catch (e) {
        // revert
        setSettings((s) => (s ? { ...s, [field]: !next } : s));
        setSettingsNote({
          kind: "error",
          text: e instanceof Error ? e.message : "Could not update settings.",
        });
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/social"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold">Civic Campaign</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Control auto-posting for identify &amp; verify tweets and edit the
            tweet templates the scheduler draws from.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* --- Auto-post toggles --- */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-post</CardTitle>
          <CardDescription>
            When a campaign is off, its drafts wait in the reply queue for
            manual review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-16 rounded-md" />
              <Skeleton className="h-16 rounded-md" />
            </>
          ) : (
            <>
              <ToggleRow
                title="Identify campaign auto-post"
                subtitle="When on, the scheduler posts identify tweets automatically. When off, drafts wait in the reply queue."
                checked={settings ? settings.identify_auto_post : null}
                saving={savingIdentify}
                onToggle={(next) => toggleSetting("identify_auto_post", next)}
              />
              <ToggleRow
                title="Verify tweets auto-post"
                subtitle="When on, verify tweets post automatically. When off, drafts wait for review."
                checked={settings ? settings.verify_auto_post : null}
                saving={savingVerify}
                onToggle={(next) => toggleSetting("verify_auto_post", next)}
              />
            </>
          )}

          {settingsNote && (
            <div
              className={`flex items-start gap-2 rounded-md border p-2.5 text-sm ${
                settingsNote.kind === "success"
                  ? "border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-400"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {settingsNote.kind === "success" ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span>{settingsNote.text}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Identify templates --- */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-heading font-semibold">
            Identify templates
          </h2>
          <PlaceholderLegend kind="identify" />
        </div>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : templates ? (
          <div className="grid gap-3 md:grid-cols-2">
            {IDENTIFY_CATEGORIES.map((c) => (
              <TemplateCategoryCard
                key={c.key}
                kind="identify"
                categoryKey={c.key}
                categoryLabel={c.label}
                templates={templates.identify[c.key] ?? []}
                onSaved={setTemplates}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* --- Verify templates --- */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-heading font-semibold">
            Verify templates
          </h2>
          <PlaceholderLegend kind="verify" />
        </div>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : templates ? (
          <div className="grid gap-3 md:grid-cols-2">
            {VERIFY_CATEGORIES.map((c) => (
              <TemplateCategoryCard
                key={c.key}
                kind="verify"
                categoryKey={c.key}
                categoryLabel={c.label}
                templates={templates.verify[c.key] ?? []}
                onSaved={setTemplates}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
