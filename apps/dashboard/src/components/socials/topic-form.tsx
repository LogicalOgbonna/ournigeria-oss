"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { socialsFetch } from "@/lib/api";
import { TweetCard } from "./tweet-card";
import type { SocialsTopicRow } from "./types";

const DOMAINS = ["budget", "corruption", "faac", "govspend", "general"];

interface TopicFormProps {
  initial?: Partial<SocialsTopicRow>;
  topicId?: string;
}

export function TopicForm({ initial, topicId }: TopicFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    query: initial?.query ?? "",
    description: initial?.description ?? "",
    domain: initial?.domain ?? "budget",
    positiveExamplesText: (initial?.positiveExamples ?? []).join("\n"),
    negativeExamplesText: (initial?.negativeExamples ?? []).join("\n"),
    threshold: initial?.threshold ?? 0.7,
    minFollowers: initial?.minFollowers ?? 1000,
    maxFollowers: initial?.maxFollowers ?? 500_000,
    lang: initial?.lang ?? "en",
    minTextLength: initial?.minTextLength ?? 20,
    maxAgeHours: initial?.maxAgeHours ?? 48,
    enabled: initial?.enabled ?? false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test query state
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<unknown[] | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        query: form.query,
        description: form.description,
        domain: form.domain,
        positiveExamples: form.positiveExamplesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        negativeExamples: form.negativeExamplesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        threshold: Number(form.threshold),
        minFollowers: Number(form.minFollowers),
        maxFollowers: Number(form.maxFollowers),
        lang: form.lang,
        minTextLength: Number(form.minTextLength),
        maxAgeHours: Number(form.maxAgeHours),
        enabled: form.enabled,
      };

      if (topicId) {
        await socialsFetch(`/v1/topics/${topicId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await socialsFetch("/v1/topics", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/dashboard/social/topics");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTopic() {
    if (!topicId) return;
    if (!confirm("Delete this topic? Drafts already produced are kept.")) return;
    await socialsFetch(`/v1/topics/${topicId}`, { method: "DELETE" });
    router.push("/dashboard/social/topics");
  }

  async function runTestQuery() {
    setTesting(true);
    setTestError(null);
    setTestResults(null);
    try {
      const result = await socialsFetch("/v1/topics/test-query", {
        method: "POST",
        body: JSON.stringify({ query: form.query }),
      });
      setTestResults(result.tweets ?? []);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : String(err));
    } finally {
      setTesting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nigerian Budget Discourse"
              required
            />
          </div>
          <div>
            <Label htmlFor="query">X search query</Label>
            <Textarea
              id="query"
              value={form.query}
              onChange={(e) => update("query", e.target.value)}
              placeholder='("Nigeria budget" OR "FG budget") -is:retweet lang:en'
              rows={2}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Standard X search syntax. Use{" "}
              <a
                href="https://github.com/igorbrigadir/twitter-advanced-search"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                advanced operators
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={runTestQuery}
              disabled={!form.query || testing}
            >
              {testing ? "Testing…" : "Test query"}
            </Button>
            {testError && (
              <span className="text-sm text-red-600">{testError}</span>
            )}
            {testResults && (
              <span className="text-sm text-muted-foreground">
                {testResults.length} tweets returned
              </span>
            )}
          </div>
          {testResults && testResults.length > 0 && (
            <div className="space-y-2">
              {testResults.slice(0, 5).map((t) => {
                const tweet = t as Record<string, unknown>;
                return (
                  <TweetCard
                    key={tweet.id as string}
                    tweet={{
                      authorName: tweet.authorName as string,
                      authorScreenName: tweet.authorScreenName as string,
                      authorProfileImageUrl: (tweet.authorProfileImageUrl as string | null) ?? null,
                      text: tweet.text as string,
                      tweetCreatedAt: tweet.tweetCreatedAt as string,
                      replyCount: tweet.replyCount as number,
                      retweetCount: tweet.retweetCount as number,
                      likeCount: tweet.likeCount as number,
                      quoteCount: tweet.quoteCount as number,
                    }}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label htmlFor="description">Description (used by classifier)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="One paragraph describing what counts as on-topic for this lane."
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="positives">
                Positive examples (one per line)
              </Label>
              <Textarea
                id="positives"
                value={form.positiveExamplesText}
                onChange={(e) =>
                  update("positiveExamplesText", e.target.value)
                }
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="negatives">
                Negative examples (one per line)
              </Label>
              <Textarea
                id="negatives"
                value={form.negativeExamplesText}
                onChange={(e) =>
                  update("negativeExamplesText", e.target.value)
                }
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="domain">Domain</Label>
            <Select
              value={form.domain}
              onValueChange={(v) => update("domain", v)}
            >
              <SelectTrigger id="domain">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="threshold">Threshold (0–1)</Label>
            <Input
              id="threshold"
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={form.threshold}
              onChange={(e) => update("threshold", parseFloat(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="minFollowers">Min followers</Label>
            <Input
              id="minFollowers"
              type="number"
              value={form.minFollowers}
              onChange={(e) =>
                update("minFollowers", parseInt(e.target.value, 10) || 0)
              }
            />
          </div>
          <div>
            <Label htmlFor="maxFollowers">Max followers</Label>
            <Input
              id="maxFollowers"
              type="number"
              value={form.maxFollowers}
              onChange={(e) =>
                update("maxFollowers", parseInt(e.target.value, 10) || 0)
              }
            />
          </div>
          <div>
            <Label htmlFor="lang">Language</Label>
            <Input
              id="lang"
              value={form.lang}
              onChange={(e) => update("lang", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="maxAgeHours">Max tweet age (hours)</Label>
            <Input
              id="maxAgeHours"
              type="number"
              value={form.maxAgeHours}
              onChange={(e) =>
                update("maxAgeHours", parseInt(e.target.value, 10) || 1)
              }
            />
          </div>
          <div>
            <Label htmlFor="minTextLength">Min text length (chars)</Label>
            <Input
              id="minTextLength"
              type="number"
              value={form.minTextLength}
              onChange={(e) =>
                update("minTextLength", parseInt(e.target.value, 10) || 0)
              }
            />
          </div>
          <div className="flex items-end gap-2">
            <input
              id="enabled"
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="enabled" className="cursor-pointer">
              Enabled
            </Label>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : topicId ? "Save changes" : "Create topic"}
        </Button>
        {topicId && (
          <Button
            type="button"
            variant="outline"
            onClick={deleteTopic}
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
