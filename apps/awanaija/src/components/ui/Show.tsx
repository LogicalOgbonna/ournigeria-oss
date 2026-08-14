import type { ReactNode } from "react";

/**
 * Conditional-render wrapper. Renders `children` only when `when` is true,
 * otherwise renders nothing (children never mount). Lets callers list mutually
 * exclusive branches flat instead of selecting one with a ternary, while the
 * branch components stay pure and unaware of their own visibility.
 *
 *   <Show when={isLoading}><Spinner /></Show>
 *   <Show when={hasData}><Table rows={rows} /></Show>
 */
export function Show({ when, children }: { when: boolean; children: ReactNode }) {
  if (!when) return null;
  return <>{children}</>;
}
