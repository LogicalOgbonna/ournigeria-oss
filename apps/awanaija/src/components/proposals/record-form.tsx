"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RECORD_SCHEMAS,
  type RecordFieldDef,
  type RecordSchemaDef,
} from "@ournigeria/official-records";
import {
  getParties,
  getStates,
  createRecordProposals,
  createRecordEditProposal,
} from "@/lib/api";

/**
 * Schema-driven contribution form (Plan 55). Renders inputs straight from the
 * shared @ournigeria/official-records registry so the form can never drift
 * from what the server validates. Two modes:
 *  - add (default): list-builder — queue several records, one batch submit
 *  - correction (editRecord set): pick one editable field, propose a fix
 * Styling follows the dark magazine aesthetic + DESIGN.md's emerald
 * contribute register (invitations are never red).
 */

type Draft = Record<string, unknown>;

const inputCls =
  "w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white " +
  "placeholder-white/30 focus:border-emerald-400/60 focus:outline-none";

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: RecordFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        if (field.input === "party") {
          const parties = await getParties();
          if (alive) {
            setOptions(
              (parties as any[]).map((p) => ({ value: p.acronym, label: `${p.acronym} — ${p.name}` })),
            );
          }
        } else if (field.input === "geo:state") {
          const states = await getStates();
          if (alive) setOptions((states as any[]).map((s) => ({ value: s.code, label: s.name })));
        }
      } catch {
        /* dropdown degrades to empty; field is optional-skippable */
      }
    }
    if (field.input === "party" || field.input === "geo:state") void load();
    return () => {
      alive = false;
    };
  }, [field.input]);

  switch (field.input) {
    case "boolean":
      return (
        <select
          className={inputCls}
          value={value === true ? "yes" : value === false ? "no" : ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value === "yes")}
        >
          <option value="">—</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      );
    case "select":
      return (
        <select
          className={inputCls}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      );
    case "party":
    case "geo:state":
      return (
        <select
          className={inputCls}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "textarea":
      return (
        <textarea
          rows={3}
          className={inputCls}
          value={(value as string) ?? ""}
          placeholder={field.help}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );
    case "date":
      return (
        <input
          type="date"
          className={inputCls}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );
    case "year":
    case "number":
    case "money":
      return (
        <input
          type="number"
          className={inputCls}
          value={value === undefined || value === null ? "" : String(value)}
          placeholder={field.help}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      );
    default:
      // text, and geo:lga|ward|constituency as free-entry codes for now
      return (
        <input
          type="text"
          className={inputCls}
          value={(value as string) ?? ""}
          placeholder={field.help}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );
  }
}

function clientValidate(schema: RecordSchemaDef, draft: Draft): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of schema.fields) {
    const v = draft[f.key];
    if (f.required && (v === undefined || v === null || v === "")) {
      errors[f.key] = `${f.label} is required`;
    }
  }
  return errors;
}

function summarizeDraft(schema: RecordSchemaDef, draft: Draft): string {
  return schema.fields
    .filter((f) => draft[f.key] !== undefined && draft[f.key] !== "")
    .map((f) => `${f.label}: ${String(draft[f.key])}`)
    .join(" · ");
}

export function RecordForm({
  officialId,
  recordType,
  editRecord,
}: {
  officialId: string;
  recordType: string;
  /** when set → single-field correction mode */
  editRecord?: { targetPk: string; current: Record<string, unknown> } | null;
}) {
  const schema = RECORD_SCHEMAS[recordType];
  const [draft, setDraft] = useState<Draft>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [queued, setQueued] = useState<Draft[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [editField, setEditField] = useState<string>("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ count: number } | null>(null);

  const editableFields = useMemo(() => schema?.fields.filter((f) => f.editable) ?? [], [schema]);

  if (!schema) return <p className="text-sm text-white/60">Unknown record type.</p>;

  const set = (k: string, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  async function submitAdd() {
    const draftHasInput = Object.keys(draft).length > 0;
    if (draftHasInput) {
      const errs = clientValidate(schema, draft);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
    }
    const pending = draftHasInput ? [...queued, draft] : queued;
    if (pending.length === 0) {
      setErrors({ _: "Add at least one record" });
      return;
    }
    if (schema.sensitive && !sourceUrl) {
      setErrors({ _: "A source URL is required for this record type" });
      return;
    }
    setErrors({});
    setState("submitting");
    setServerError(null);
    try {
      const res = await createRecordProposals({
        officialId,
        records: pending.map((d) => ({
          recordType,
          data: d as Record<string, unknown>,
          sourceUrl: sourceUrl || undefined,
        })),
      });
      setResult({ count: res.count });
      setState("done");
    } catch (e: any) {
      setServerError(e?.message ?? "Submission failed");
      setState("error");
    }
  }

  async function submitEdit() {
    if (!editRecord || !editField) {
      setErrors({ _: "Pick the field to correct" });
      return;
    }
    const value = draft[editField];
    if (value === undefined || value === "") {
      setErrors({ _: "Enter the corrected value" });
      return;
    }
    if (schema.sensitive && !sourceUrl) {
      setErrors({ _: "A source URL is required for this record type" });
      return;
    }
    setErrors({});
    setState("submitting");
    setServerError(null);
    try {
      await createRecordEditProposal({
        officialId,
        recordType,
        targetPk: editRecord.targetPk,
        field: editField,
        value,
        sourceUrl: sourceUrl || undefined,
      });
      setResult({ count: 1 });
      setState("done");
    } catch (e: any) {
      setServerError(e?.message ?? "Submission failed");
      setState("error");
    }
  }

  if (state === "done" && result) {
    return (
      <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-6 text-center">
        <p className="font-medium text-emerald-300">
          {editRecord
            ? "Correction submitted"
            : `${result.count} record${result.count > 1 ? "s" : ""} submitted`}{" "}
          — thank you.
        </p>
        <p className="mt-1 text-sm text-white/60">
          A moderator will review it before it appears on the profile.
        </p>
      </div>
    );
  }

  // ——— correction mode ———
  if (editRecord) {
    const fieldDef = editableFields.find((f) => f.key === editField);
    return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-white/70">Which detail is wrong?</label>
          <select
            className={inputCls}
            value={editField}
            onChange={(e) => {
              setEditField(e.target.value);
              setDraft({});
            }}
          >
            <option value="">Choose a field…</option>
            {editableFields.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label} (currently: {String(editRecord.current[f.key] ?? "—")})
              </option>
            ))}
          </select>
        </div>
        {fieldDef && (
          <div>
            <label className="mb-1 block text-sm text-white/70">Corrected {fieldDef.label}</label>
            <FieldInput field={fieldDef} value={draft[editField]} onChange={(v) => set(editField, v)} />
          </div>
        )}
        <SourceInput schema={schema} value={sourceUrl} onChange={setSourceUrl} />
        {errors._ && <p className="text-sm text-amber-300">{errors._}</p>}
        {serverError && <p className="text-sm text-amber-300">{serverError}</p>}
        <button
          onClick={submitEdit}
          disabled={state === "submitting"}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {state === "submitting" ? "Submitting…" : "Submit correction"}
        </button>
      </div>
    );
  }

  // ——— add mode with list builder ———
  const pendingCount = queued.length + (Object.keys(draft).length ? 1 : 0);
  return (
    <div className="space-y-4">
      {queued.length > 0 && (
        <ul className="space-y-2">
          {queued.map((q, i) => (
            <li
              key={i}
              className="flex items-start justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <span className="text-white/80">{summarizeDraft(schema, q)}</span>
              <button
                onClick={() => setQueued((qs) => qs.filter((_, j) => j !== i))}
                className="text-white/40 hover:text-white/80"
                aria-label="Remove queued record"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {schema.fields.map((f) => (
          <div key={f.key} className={f.input === "textarea" ? "sm:col-span-2" : ""}>
            <label className="mb-1 block text-sm text-white/70">
              {f.label}
              {f.required && <span className="text-emerald-400"> *</span>}
            </label>
            <FieldInput field={f} value={draft[f.key]} onChange={(v) => set(f.key, v)} />
            {errors[f.key] && <p className="mt-1 text-xs text-amber-300">{errors[f.key]}</p>}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          if (Object.keys(draft).length === 0) return;
          const errs = clientValidate(schema, draft);
          if (Object.keys(errs).length) {
            setErrors(errs);
            return;
          }
          setQueued((qs) => [...qs, draft]);
          setDraft({});
          setErrors({});
        }}
        className="rounded-md border border-emerald-400/40 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-400/10"
      >
        ＋ Add another {schema.label.toLowerCase()}
      </button>
      <SourceInput schema={schema} value={sourceUrl} onChange={setSourceUrl} />
      {errors._ && <p className="text-sm text-amber-300">{errors._}</p>}
      {serverError && <p className="text-sm text-amber-300">{serverError}</p>}
      <button
        onClick={submitAdd}
        disabled={state === "submitting"}
        className="w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {state === "submitting"
          ? "Submitting…"
          : `Submit${pendingCount > 0 ? ` ${pendingCount}` : ""} ${schema.labelPlural.toLowerCase()}`}
      </button>
      <p className="text-xs text-white/40">
        Up to 15 records per submission. A moderator reviews everything before it goes live.
      </p>
    </div>
  );
}

function SourceInput({
  schema,
  value,
  onChange,
}: {
  schema: RecordSchemaDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-white/70">
        Source URL
        {schema.sensitive ? (
          <span className="text-emerald-400"> * (required)</span>
        ) : (
          <span className="text-white/40"> (optional, encouraged)</span>
        )}
      </label>
      <input
        type="url"
        placeholder="https://…"
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
