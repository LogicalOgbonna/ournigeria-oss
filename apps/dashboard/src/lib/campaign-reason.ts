/**
 * The audit-reason cancellation contract, kept free of React and sonner so the
 * wording an operator reads is unit-testable. The hook that drives the dialog
 * lives in lib/hooks/use-session-reason.ts.
 */

/** Why a pending reason prompt settled without a reason. */
export type CancelCause = "cancelled" | "superseded";

/**
 * Thrown when the operator backed out of the reason dialog. It carries the
 * sentence the user should read, so every call site can hand it straight to
 * `toastActionError` instead of inventing its own wording.
 */
export class ReasonCancelledError extends Error {
  constructor(
    message: string,
    readonly cause: CancelCause,
  ) {
    super(message);
    this.name = "ReasonCancelledError";
  }
}

export function isReasonCancelled(err: unknown): err is ReasonCancelledError {
  return err instanceof ReasonCancelledError;
}

/**
 * What to tell the operator when nothing happened.
 *
 * `superseded` is its own sentence on purpose: the first action's toast would
 * otherwise blame the dialog they never saw close, when in fact they started a
 * second change while the first was still waiting on a reason.
 */
export function cancelMessage(action: string, cause: CancelCause): string {
  return cause === "superseded"
    ? `${action} cancelled — you started another change before giving a reason`
    : `${action} cancelled — a reason is needed on a live ticket`;
}
