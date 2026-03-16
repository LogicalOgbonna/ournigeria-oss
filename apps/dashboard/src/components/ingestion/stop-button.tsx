"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Square, Loader2 } from "lucide-react";
import { ingestFetch } from "@/lib/api";
import { toast } from "sonner";

export function StopButton({
  pipeline,
  isRunning,
  onStop,
}: {
  pipeline: string;
  isRunning: boolean;
  onStop?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await ingestFetch("/stop", {
        method: "POST",
        body: JSON.stringify({ pipeline }),
      });
      toast.success(`Stop requested for ${pipeline} pipeline`);
      setOpen(false);
      onStop?.();
    } catch {
      toast.error(`Failed to stop ${pipeline} pipeline`);
    } finally {
      setLoading(false);
    }
  }

  if (!isRunning) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Square className="h-3.5 w-3.5 mr-1.5" />
          Stop {pipeline}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stop {pipeline} pipeline?</DialogTitle>
          <DialogDescription>
            The current file will finish processing, then the pipeline will
            stop. Already-processed files are preserved.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Stop Pipeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
