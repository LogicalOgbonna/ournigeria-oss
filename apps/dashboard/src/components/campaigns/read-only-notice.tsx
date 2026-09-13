/**
 * The banner a tab shows when the operator may look but not touch. The API's
 * PermissionsGuard is the real wall — this only stops someone spending five
 * minutes on a form that was always going to 403.
 */
export function ReadOnlyNotice({
  subject,
  action,
  permission = "campaigns.write",
  noun = "ticket",
}: {
  /** What they are reading — "artwork", "documents". */
  subject: string;
  /** What they cannot do — "Uploading", "Editing". */
  action: string;
  permission?: string;
  /** The row being read — "ticket" (default) or "event" on /dashboard/elections. */
  noun?: string;
}) {
  return (
    <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
      You are reading this {noun}&apos;s {subject}. {action} needs{" "}
      <code className="font-mono text-xs">{permission}</code>.
    </p>
  );
}
