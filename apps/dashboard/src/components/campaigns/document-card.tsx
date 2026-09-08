"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, FileText, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AssetDropZone } from "@/components/campaigns/asset-drop-zone";
import { ConfirmDialog } from "@/components/enrichment/confirm-dialog";
import {
  DOC_BLURB_MAX,
  DOC_TITLE_MAX,
  IMAGE_TYPES_PROSE,
  PDF_MAX_BYTES,
  SOURCE_URL_MAX,
  asMb,
  documentBody,
  documentProblems,
  type DocumentFormValues,
} from "@/lib/campaign-assets";
import {
  DOCUMENT_SUBJECTS,
  campaignsApi,
  ticketHasMate,
  uploadAsset,
  type CampaignDetail,
  type CampaignDocument,
  type DocumentKind,
  type DocumentSubject,
} from "@/lib/campaigns";
import { useAssetUpload, type UploadRun } from "@/lib/hooks/use-asset-upload";
import { toastActionError, type SessionReason } from "@/lib/hooks/use-session-reason";

export const KIND_LABEL: Record<DocumentKind, string> = {
  manifesto: "Manifesto",
  cv: "CV",
  achievements: "Achievements",
};
const KIND_BLURB: Record<DocumentKind, string> = {
  manifesto: "The programme the ticket is running on.",
  cv: "Career history — usually one per person.",
  achievements: "What the person or ticket claims to have delivered.",
};
const SUBJECT_LABEL: Record<DocumentSubject, string> = {
  ticket: "The ticket",
  candidate: "Candidate",
  running_mate: "Running mate",
};

/** A manifesto belongs to the ticket; a CV and a record belong to a person. */
function defaultSubject(kind: DocumentKind): DocumentSubject {
  return kind === "manifesto" ? "ticket" : "candidate";
}

function seedOf(doc: CampaignDocument | null): DocumentFormValues {
  return {
    title: doc?.title ?? "",
    blurb: doc?.blurb ?? "",
    pageCount: doc?.pageCount != null ? String(doc.pageCount) : "",
    sourceUrl: doc?.sourceUrl ?? "",
  };
}

export function DocumentCard({
  campaign,
  kind,
  canWrite,
  reason,
  onSaved,
}: {
  campaign: CampaignDetail;
  kind: DocumentKind;
  canWrite: boolean;
  reason: SessionReason;
  onSaved: () => void;
}) {
  const fieldId = useId();
  const rows = campaign.documents.filter((d) => d.kind === kind);
  const subjects = DOCUMENT_SUBJECTS.filter(
    (s) =>
      s !== "running_mate" ||
      ticketHasMate(campaign) ||
      rows.some((r) => r.subject === "running_mate"),
  );

  // Open on the row that already exists, so the common case (edit what is
  // there) needs no clicks; a kind with nothing yet opens on its default.
  const [subject, setSubject] = useState<DocumentSubject>(
    () => rows[0]?.subject ?? defaultSubject(kind),
  );
  const existing = rows.find((r) => r.subject === subject) ?? null;
  const [form, setForm] = useState<DocumentFormValues>(() => seedOf(existing));
  // Staged, not yet committed: the API takes the PDF and the cover in ONE PUT,
  // so both are uploaded to staging first and the keys are held here until Save.
  const [staged, setStaged] = useState<{ key: string; name: string } | null>(null);
  const [cover, setCover] = useState<{ key: string; name: string } | null>(null);
  const pdfUpload = useAssetUpload();
  const coverUpload = useAssetUpload();
  const [saving, setSaving] = useState(false);
  // Holds the reason granted for THIS removal until the confirmation settles —
  // re-reading the session reason later could pick up a different one if the
  // operator changed it in between.
  const [removing, setRemoving] = useState<{ why?: string } | null>(null);
  const [touched, setTouched] = useState(false);

  // Re-seed when the target row changes — a different subject, our own save, or
  // someone else's edit arriving through a refetch.
  const seedKey = [
    subject,
    existing?.id ?? "",
    existing?.title ?? "",
    existing?.blurb ?? "",
    existing?.pageCount ?? "",
    existing?.sourceUrl ?? "",
  ].join("|");
  useEffect(() => {
    setForm(seedOf(existing));
    setTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  // Staged bytes belong to the subject they were chosen for. Switching the
  // subject targets a DIFFERENT (kind, subject) row, so a PDF staged for the
  // candidate must not ride along onto the running mate's document. Keyed on
  // `subject` alone: a refetch that changes the stored row must NOT throw away
  // a file the operator just staged.
  useEffect(() => {
    setStaged(null);
    setCover(null);
  }, [subject]);
  // The subject as it stands NOW, readable from an upload that started before
  // the operator switched rows — a stale closure would only compare the old
  // value with itself.
  const subjectRef = useRef(subject);
  subjectRef.current = subject;

  const problems = documentProblems(form);
  const blocked = Object.keys(problems).length > 0;
  // "A title is required" is true of an untouched new document too, and telling
  // an operator they got it wrong before they have typed anything is rude —
  // Save is disabled either way, so the message waits for a first edit.
  const titleProblem = touched ? problems.title : undefined;

  /**
   * Upload straight to staging; the "commit" step is just keeping the key.
   * The subject is captured at the START of the upload: the controls that
   * change it are disabled while one is in flight, but a switch that slipped
   * through (or a subject that moved for any other reason) means these bytes
   * belong to a different row, so the key is dropped rather than staged.
   */
  const stagePdf: UploadRun = (file, onProgress, signal) => {
    const forSubject = subject;
    return uploadAsset({
      file,
      kind: "pdf",
      signal,
      onProgress,
      presign: (body) => campaignsApi.presign(campaign.id, body),
      commit: async (stagingKey) => {
        if (subjectRef.current === forSubject)
          setStaged({ key: stagingKey, name: file.name });
        return stagingKey;
      },
    });
  };
  const stageCover: UploadRun = (file, onProgress, signal) => {
    const forSubject = subject;
    return uploadAsset({
      file,
      kind: "image",
      signal,
      onProgress,
      presign: (body) => campaignsApi.presign(campaign.id, body),
      commit: async (stagingKey) => {
        if (subjectRef.current === forSubject)
          setCover({ key: stagingKey, name: file.name });
        return stagingKey;
      },
    });
  };

  function set<K extends keyof DocumentFormValues>(key: K, value: string) {
    setTouched(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (blocked || saving) return;
    setSaving(true);
    try {
      const why = await reason.askOrThrow("Save");
      const saved = await campaignsApi.putDocument(
        campaign.id,
        kind,
        subject,
        documentBody(form, {
          stagingKey: staged?.key,
          coverStagingKey: cover?.key,
          existingPageCount: existing?.pageCount ?? null,
          reason: why,
        }),
      );
      setStaged(null);
      setCover(null);
      // The API counts the PDF's pages when the box was left empty — show what
      // it actually stored rather than an empty field.
      setForm((prev) => ({
        ...prev,
        pageCount: saved.pageCount != null ? String(saved.pageCount) : "",
      }));
      toast.success(`${KIND_LABEL[kind]} saved`);
      onSaved();
    } catch (err) {
      toastActionError(err);
    } finally {
      setSaving(false);
    }
  }

  /** Reason first, then the confirmation — never two dialogs at once. */
  async function requestRemove() {
    try {
      setRemoving({ why: await reason.askOrThrow("Remove") });
    } catch (err) {
      toastActionError(err);
    }
  }

  async function remove(why?: string) {
    try {
      await campaignsApi.deleteDocument(campaign.id, kind, subject, why);
      toast.success(`${KIND_LABEL[kind]} removed`);
      onSaved();
    } catch (err) {
      toastActionError(err);
    }
  }

  const titleErrorId = `${fieldId}-title-error`;
  const pagesErrorId = `${fieldId}-pages-error`;
  const sourceErrorId = `${fieldId}-source-error`;
  const disabled = !canWrite || saving;
  // Staged bytes are held against the subject on screen, so nothing that could
  // retarget them may move while an upload is still running.
  const uploading = pdfUpload.busy || coverUpload.busy;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{KIND_LABEL[kind]}</CardTitle>
        <CardDescription>
          {KIND_BLURB[kind]} One document per subject — switching the subject
          below edits a different row.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>On this ticket</Label>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No {KIND_LABEL[kind].toLowerCase()} yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className={`flex flex-wrap items-center gap-3 p-3 text-sm ${
                    row.subject === subject ? "bg-muted/50" : ""
                  }`}
                >
                  <Badge variant="outline">{SUBJECT_LABEL[row.subject]}</Badge>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {row.title}
                  </span>
                  {row.pageCount != null ? (
                    <span className="text-xs text-muted-foreground">
                      {row.pageCount} page{row.pageCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  {row.fileUrl ? (
                    <a
                      href={row.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      PDF
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">No file</span>
                  )}
                  {row.coverUrl ? (
                    <a
                      href={row.coverUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Cover
                    </a>
                  ) : null}
                  {row.subject === subject ? (
                    <span className="text-xs text-muted-foreground">Editing</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => setSubject(row.subject)}
                    >
                      Edit
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${fieldId}-subject`}>Subject</Label>
            <Select
              value={subject}
              disabled={disabled || uploading}
              onValueChange={(v) => setSubject(v as DocumentSubject)}
            >
              <SelectTrigger id={`${fieldId}-subject`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SUBJECT_LABEL[s]}
                    {rows.some((r) => r.subject === s) ? "" : " — new"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {existing
                ? "Editing the stored document for this subject."
                : "Saving creates a new document for this subject."}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={`${fieldId}-title`}>Title</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {form.title.length}/{DOC_TITLE_MAX}
              </span>
            </div>
            <Input
              id={`${fieldId}-title`}
              value={form.title}
              maxLength={DOC_TITLE_MAX}
              disabled={disabled}
              placeholder="e.g. Renewed Hope 2027"
              aria-invalid={titleProblem ? true : undefined}
              aria-describedby={titleProblem ? titleErrorId : undefined}
              onChange={(e) => set("title", e.target.value)}
            />
            {titleProblem ? (
              <p id={titleErrorId} className="text-xs text-destructive">
                {titleProblem}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={`${fieldId}-blurb`}>Blurb</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {form.blurb.length}/{DOC_BLURB_MAX}
            </span>
          </div>
          <Textarea
            id={`${fieldId}-blurb`}
            rows={2}
            value={form.blurb}
            maxLength={DOC_BLURB_MAX}
            disabled={disabled}
            placeholder="One line describing the document."
            onChange={(e) => set("blurb", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${fieldId}-pages`}>Page count</Label>
            <Input
              id={`${fieldId}-pages`}
              inputMode="numeric"
              value={form.pageCount}
              disabled={disabled}
              placeholder="Left empty, the server counts the PDF's pages"
              aria-invalid={problems.pageCount ? true : undefined}
              aria-describedby={problems.pageCount ? pagesErrorId : undefined}
              onChange={(e) => set("pageCount", e.target.value)}
            />
            {problems.pageCount ? (
              <p id={pagesErrorId} className="text-xs text-destructive">
                {problems.pageCount}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${fieldId}-source`}>Source URL</Label>
            <Input
              id={`${fieldId}-source`}
              value={form.sourceUrl}
              maxLength={SOURCE_URL_MAX}
              disabled={disabled}
              placeholder="https://…"
              aria-invalid={problems.sourceUrl ? true : undefined}
              aria-describedby={problems.sourceUrl ? sourceErrorId : undefined}
              onChange={(e) => set("sourceUrl", e.target.value)}
            />
            {problems.sourceUrl ? (
              <p id={sourceErrorId} className="text-xs text-destructive">
                {problems.sourceUrl}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>PDF</Label>
            <AssetDropZone
              kind="pdf"
              compact
              disabled={!canWrite || pdfUpload.busy || saving}
              progress={pdfUpload.progress}
              error={pdfUpload.error}
              onRetry={pdfUpload.retry}
              label={existing?.fileUrl ? "Replace PDF" : "Choose PDF"}
              hint={`Up to ${asMb(PDF_MAX_BYTES)} MB.`}
              onFile={(file) => void pdfUpload.start(file, stagePdf)}
            />
            <StagedLine
              staged={staged?.name ?? null}
              stored={existing?.fileUrl ?? null}
              storedLabel="Stored PDF"
              onClear={() => setStaged(null)}
            />
          </div>

          <div className="space-y-2">
            <Label>Cover image</Label>
            <AssetDropZone
              kind="image"
              compact
              disabled={!canWrite || coverUpload.busy || saving}
              progress={coverUpload.progress}
              error={coverUpload.error}
              onRetry={coverUpload.retry}
              label={existing?.coverUrl ? "Replace cover" : "Choose cover"}
              hint={`${IMAGE_TYPES_PROSE}.`}
              onFile={(file) => void coverUpload.start(file, stageCover)}
            />
            <StagedLine
              staged={cover?.name ?? null}
              stored={existing?.coverUrl ?? null}
              storedLabel="Stored cover"
              onClear={() => setCover(null)}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          The PDF and the cover are committed together when you save — nothing is
          attached to the ticket until then.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={disabled || blocked || uploading} onClick={() => void save()}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            {existing ? "Save document" : "Create document"}
          </Button>
          {existing ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={disabled}
              onClick={() => void requestRemove()}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remove
            </Button>
          ) : null}
          {existing?.fileUrl ? (
            <a
              href={existing.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
            >
              Open stored PDF <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </CardContent>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(v) => {
          if (!v) setRemoving(null);
        }}
        title={`Remove this ${KIND_LABEL[kind].toLowerCase()}?`}
        description={`The ${SUBJECT_LABEL[subject].toLowerCase()} row is deleted from the ticket. The stored files themselves are kept until a reviewer purges them.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => remove(removing?.why)}
      />
    </Card>
  );
}

/** "Staged: file.pdf (clear)" / a link to what is already stored. */
function StagedLine({
  staged,
  stored,
  storedLabel,
  onClear,
}: {
  staged: string | null;
  stored: string | null;
  storedLabel: string;
  onClear: () => void;
}) {
  if (staged) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate">
          Staged: <span className="font-medium text-foreground">{staged}</span> — saved
          with the form.
        </span>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </p>
    );
  }
  if (stored) {
    return (
      <p className="text-xs">
        <a
          href={stored}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
        >
          {storedLabel} <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    );
  }
  return <p className="text-xs text-muted-foreground">Nothing attached yet.</p>;
}
