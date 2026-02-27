"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, Loader2 } from "lucide-react";
import { ingestFetch } from "@/lib/api";

export function PauseResumeButton({
  pipeline,
  isPaused,
  isRunning,
  onToggle,
}: {
  pipeline: string;
  isPaused: boolean;
  isRunning: boolean;
  onToggle?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const endpoint = isPaused ? "/resume" : "/pause";
      await ingestFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ pipeline }),
      });
      onToggle?.();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (!isRunning) return null;

  return (
    <Button
      variant={isPaused ? "default" : "secondary"}
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : isPaused ? (
        <Play className="h-3.5 w-3.5 mr-1.5" />
      ) : (
        <Pause className="h-3.5 w-3.5 mr-1.5" />
      )}
      {isPaused ? "Resume" : "Pause"}
    </Button>
  );
}
