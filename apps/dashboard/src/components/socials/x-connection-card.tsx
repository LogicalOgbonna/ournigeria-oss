"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Twitter, CheckCircle2, AlertTriangle, Link2 } from "lucide-react";
import { socialsFetch } from "@/lib/api";

interface XStatus {
  connected: boolean;
  username: string | null;
  rotatedAt: string | null;
}

const ERROR_COPY: Record<string, string> = {
  invalid_or_expired_state:
    "The connection link expired. Click Connect to start again.",
  exchange_failed:
    "X rejected the authorization (the code may have expired). Try again.",
  no_refresh_token:
    "X did not return a refresh token. Ensure the app requests offline.access, then retry.",
  missing_params: "X redirected back without an authorization code. Try again.",
  access_denied: "Authorization was cancelled on X.",
};

export function XConnectionCard() {
  const [status, setStatus] = useState<XStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [autoPublish, setAutoPublish] = useState<boolean | null>(null);
  const [savingAuto, setSavingAuto] = useState(false);
  const [autoPublishInbound, setAutoPublishInbound] = useState<boolean | null>(
    null,
  );
  const [savingAutoInbound, setSavingAutoInbound] = useState(false);
  const [banner, setBanner] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);

  const fetchStatus = useCallback(() => {
    setLoading(true);
    socialsFetch("/v1/x-oauth/status")
      .then((s: XStatus) => setStatus(s))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
    socialsFetch("/v1/x-oauth/auto-publish")
      .then((r: { enabled: boolean }) => setAutoPublish(r.enabled))
      .catch(() => setAutoPublish(null));
    socialsFetch("/v1/x-oauth/auto-publish-inbound")
      .then((r: { enabled: boolean }) => setAutoPublishInbound(r.enabled))
      .catch(() => setAutoPublishInbound(null));
  }, []);

  const toggleAutoPublish = useCallback(async (next: boolean) => {
    setSavingAuto(true);
    setAutoPublish(next); // optimistic
    try {
      const r: { enabled: boolean } = await socialsFetch(
        "/v1/x-oauth/auto-publish",
        { method: "POST", body: JSON.stringify({ enabled: next }) },
      );
      setAutoPublish(r.enabled);
      setBanner({
        kind: "success",
        text: r.enabled
          ? "Auto-publish ON — recommended drafts post without approval."
          : "Auto-publish OFF — every draft waits for your approval.",
      });
    } catch (e) {
      setAutoPublish(!next); // revert
      setBanner({
        kind: "error",
        text: e instanceof Error ? e.message : "Could not update auto-publish.",
      });
    } finally {
      setSavingAuto(false);
    }
  }, []);

  const toggleAutoPublishInbound = useCallback(async (next: boolean) => {
    setSavingAutoInbound(true);
    setAutoPublishInbound(next); // optimistic
    try {
      const r: { enabled: boolean } = await socialsFetch(
        "/v1/x-oauth/auto-publish-inbound",
        { method: "POST", body: JSON.stringify({ enabled: next }) },
      );
      setAutoPublishInbound(r.enabled);
      setBanner({
        kind: "success",
        text: r.enabled
          ? "Inbound auto-publish ON — replies to us & mentions post without approval."
          : "Inbound auto-publish OFF — every reply/mention draft waits for your approval.",
      });
    } catch (e) {
      setAutoPublishInbound(!next); // revert
      setBanner({
        kind: "error",
        text:
          e instanceof Error
            ? e.message
            : "Could not update inbound auto-publish.",
      });
    } finally {
      setSavingAutoInbound(false);
    }
  }, []);

  // Read ?x_connected / ?x_error left by the callback redirect, surface it,
  // then strip the params so a refresh doesn't re-show the banner. Reading
  // window.location directly (vs useSearchParams) avoids a Suspense boundary.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("x_connected");
    const error = params.get("x_error");
    if (connected) {
      setBanner({ kind: "success", text: `Connected as @${connected}.` });
    } else if (error) {
      setBanner({
        kind: "error",
        text: ERROR_COPY[error] ?? `Connection failed: ${error}`,
      });
    }
    if (connected || error) {
      params.delete("x_connected");
      params.delete("x_error");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : ""),
      );
    }
    fetchStatus();
  }, [fetchStatus]);

  const connect = useCallback(async () => {
    setBusy(true);
    try {
      const { url } = await socialsFetch("/v1/x-oauth/start", {
        method: "POST",
      });
      window.location.href = url;
    } catch (e) {
      setBanner({
        kind: "error",
        text: e instanceof Error ? e.message : "Could not start X connection.",
      });
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!window.confirm("Disconnect the X account? Posting will stop until reconnected."))
      return;
    setBusy(true);
    try {
      await socialsFetch("/v1/x-oauth", { method: "DELETE" });
      setBanner({ kind: "success", text: "X account disconnected." });
      fetchStatus();
    } catch (e) {
      setBanner({
        kind: "error",
        text: e instanceof Error ? e.message : "Could not disconnect.",
      });
    } finally {
      setBusy(false);
    }
  }, [fetchStatus]);

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-muted p-2">
              <Twitter className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold">X account</h2>
              {loading ? (
                <Skeleton className="h-4 w-40 mt-2" />
              ) : status?.connected ? (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Connected as{" "}
                  <span className="text-foreground font-medium">
                    @{status.username ?? "unknown"}
                  </span>
                  {status.rotatedAt && (
                    <span className="text-xs">
                      · token refreshed{" "}
                      {new Date(status.rotatedAt).toLocaleString()}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  No account connected. Posting is disabled until you connect.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status?.connected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connect}
                  disabled={busy}
                >
                  <Link2 className="h-4 w-4 mr-1.5" />
                  Reconnect
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={disconnect}
                  disabled={busy}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={connect} disabled={busy || loading}>
                <Link2 className="h-4 w-4 mr-1.5" />
                {busy ? "Connecting…" : "Connect X account"}
              </Button>
            )}
          </div>
        </div>

        {status?.connected && (
          <div className="mt-4 flex items-start justify-between gap-4 rounded-md border p-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Auto-publish recommended drafts</p>
              <p className="text-xs text-muted-foreground">
                When on, high-confidence drafts (no safety warnings) post to X
                automatically — no approval needed. Off keeps every draft in the
                review queue. Replies X blocks are posted as quote-tweets.
              </p>
            </div>
            {autoPublish === null ? (
              <Skeleton className="h-5 w-9 shrink-0" />
            ) : (
              <Switch
                checked={autoPublish}
                onCheckedChange={toggleAutoPublish}
                disabled={savingAuto}
                aria-label="Toggle auto-publish"
              />
            )}
          </div>
        )}

        {status?.connected && (
          <div className="mt-3 flex items-start justify-between gap-4 rounded-md border p-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                Auto-publish inbound replies &amp; mentions
              </p>
              <p className="text-xs text-muted-foreground">
                Separate from the toggle above. Inbound engagement (replies under
                our posts and @mentions) is lower-trust, so it stays human-reviewed
                even when general auto-publish is on. Turn this on only if you want
                high-confidence inbound replies to post without approval.
              </p>
            </div>
            {autoPublishInbound === null ? (
              <Skeleton className="h-5 w-9 shrink-0" />
            ) : (
              <Switch
                checked={autoPublishInbound}
                onCheckedChange={toggleAutoPublishInbound}
                disabled={savingAutoInbound}
                aria-label="Toggle inbound auto-publish"
              />
            )}
          </div>
        )}

        {banner && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-md border p-3 text-sm ${
              banner.kind === "success"
                ? "border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {banner.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
