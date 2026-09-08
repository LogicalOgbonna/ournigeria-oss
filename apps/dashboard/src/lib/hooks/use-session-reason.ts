"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api";
import {
  ReasonCancelledError,
  cancelMessage,
  isReasonCancelled,
  type CancelCause,
} from "@/lib/campaign-reason";

export { ReasonCancelledError, isReasonCancelled } from "@/lib/campaign-reason";

/** What `ask()` settles to: `ok: false` means no commit may be made. */
export type ReasonAnswer =
  | { ok: true; reason?: string }
  | { ok: false; cause: CancelCause };

/**
 * Report a failed action. A cancelled reason is not an error — it is a
 * consequence of what the operator just did — so it gets a warning toast with
 * its own explanation, while anything else is a real failure.
 */
export function toastActionError(err: unknown): void {
  if (isReasonCancelled(err)) toast.warning(err.message);
  else toast.error(errorMessage(err));
}

export interface SessionReason {
  /** True when the API will refuse a commit without a reason (ticket off draft). */
  required: boolean;
  /** The reason captured for this tab session, reused by every later commit. */
  reason: string | null;
  /**
   * The reason for the next commit — instantly on a draft (`undefined`) or once
   * one is held, otherwise by opening the dialog and waiting for it. Throws
   * `ReasonCancelledError` if the operator backs out, so a caller inside a
   * try/catch cannot forget to stop.
   *
   * @param action verb for the message, e.g. "Upload" → "Upload cancelled — …"
   */
  askOrThrow: (action?: string) => Promise<string | undefined>;
  /** Drop the held reason so the next commit asks for a fresh one. */
  clear: () => void;
  /** Spread onto `<ReasonDialog>` alongside its copy props. */
  dialogProps: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onConfirm: (reason: string) => Promise<void>;
  };
}

/**
 * "Ask for the audit reason ONCE per tab session, then reuse it."
 *
 * Every asset commit on a non-draft ticket needs a reason (`requireReason` in
 * admin-campaign-assets.service.ts). Uploading seven poster slots is one piece
 * of work, not seven, so a modal per slot would be noise — the first commit
 * asks, the rest inherit, and the tab shows the active reason with a way to
 * change it. Drafts never ask.
 */
export function useSessionReason(required: boolean): SessionReason {
  const [reason, setReason] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // The live value AND the waiter live in refs: `askOrThrow()` is called from
  // async upload callbacks that closed over an older render's state.
  const held = useRef<string | null>(null);
  const waiter = useRef<((answer: ReasonAnswer) => void) | null>(null);

  // Leaving the tab with the dialog open must not leave an upload awaiting a
  // promise nobody can settle any more.
  useEffect(
    () => () => {
      const resolve = waiter.current;
      waiter.current = null;
      resolve?.({ ok: false, cause: "cancelled" });
    },
    [],
  );

  const ask = useCallback(async (): Promise<ReasonAnswer> => {
    if (!required) return { ok: true };
    if (held.current) return { ok: true, reason: held.current };
    // A second action while the dialog is already up joins the same wait
    // instead of stacking dialogs; the first waiter is released as superseded
    // so its caller can tell the operator why nothing happened.
    waiter.current?.({ ok: false, cause: "superseded" });
    setOpen(true);
    return new Promise<ReasonAnswer>((resolve) => {
      waiter.current = resolve;
    });
  }, [required]);

  const askOrThrow = useCallback(
    async (action = "Change") => {
      const answer = await ask();
      if (answer.ok) return answer.reason;
      throw new ReasonCancelledError(cancelMessage(action, answer.cause), answer.cause);
    },
    [ask],
  );

  const clear = useCallback(() => {
    held.current = null;
    setReason(null);
  }, []);

  const onConfirm = useCallback(async (value: string) => {
    held.current = value;
    setReason(value);
    const resolve = waiter.current;
    waiter.current = null;
    resolve?.({ ok: true, reason: value });
  }, []);

  const onOpenChange = useCallback((v: boolean) => {
    setOpen(v);
    if (v) return;
    // Closed without confirming (Cancel, Esc, backdrop) — the caller must not
    // fire a commit the API would reject.
    const resolve = waiter.current;
    waiter.current = null;
    resolve?.({ ok: false, cause: "cancelled" });
  }, []);

  return {
    required,
    reason,
    askOrThrow,
    clear,
    dialogProps: { open, onOpenChange, onConfirm },
  };
}
