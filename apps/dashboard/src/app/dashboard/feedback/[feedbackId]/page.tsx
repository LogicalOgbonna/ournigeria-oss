"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  User,
  Bug,
  Lightbulb,
  Database,
  HelpCircle,
  Paperclip,
  Save,
  Trash2,
  Download,
} from "lucide-react";
import { adminFetch } from "@/lib/api";

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  url: string;
  createdAt: string;
}

interface FeedbackDetail {
  id: string;
  userId: string;
  user: {
    id: string;
    phoneNumber: string | null;
    telegramId: string | null;
    name: string | null;
    email: string | null;
  };
  category: string;
  subject: string;
  message: string;
  status: string;
  adminNotes: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

const categoryIcons: Record<string, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  data_issue: Database,
  general: HelpCircle,
};

const statusColors: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  reviewing:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  resolved:
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  archived:
    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function userLabel(user: FeedbackDetail["user"]) {
  if (user.name) return user.name;
  if (user.phoneNumber) return user.phoneNumber;
  if (user.telegramId) return `TG:${user.telegramId}`;
  return user.id.slice(0, 8);
}

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const feedbackId = params.feedbackId as string;

  const [feedback, setFeedback] = useState<FeedbackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFeedback = useCallback(() => {
    setLoading(true);
    adminFetch(`/feedback/${feedbackId}`)
      .then((data) => {
        setFeedback(data);
        setStatus(data.status);
        setAdminNotes(data.adminNotes || "");
      })
      .catch(() => setFeedback(null))
      .finally(() => setLoading(false));
  }, [feedbackId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  async function handleSave() {
    setSaving(true);
    try {
      await adminFetch(`/feedback/${feedbackId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNotes }),
      });
      fetchFeedback();
    } catch {
      // error handling silent
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this feedback permanently? This cannot be undone."))
      return;
    setDeleting(true);
    try {
      await adminFetch(`/feedback/${feedbackId}`, { method: "DELETE" });
      router.push("/dashboard/feedback");
    } catch {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Feedback not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = categoryIcons[feedback.category] || HelpCircle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-heading font-bold flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {feedback.subject}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className={`text-xs ${statusColors[feedback.status] || ""}`}
              >
                {feedback.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {feedback.category.replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(feedback.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={deleting}
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message */}
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-medium mb-2">Message</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {feedback.message}
              </p>
            </CardContent>
          </Card>

          {/* Attachments */}
          {feedback.attachments.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({feedback.attachments.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {feedback.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="rounded-xl border overflow-hidden"
                    >
                      {att.fileType.startsWith("image/") ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={att.url}
                            alt={att.fileName}
                            className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : att.fileType.startsWith("video/") ? (
                        <video
                          src={att.url}
                          controls
                          className="w-full h-48 bg-black"
                        />
                      ) : null}
                      <div className="p-2 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {att.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatSize(att.fileSizeBytes)}
                          </p>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User info */}
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                <User className="h-4 w-4" />
                User
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span>{feedback.user.name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span>{feedback.user.phoneNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span>{feedback.user.email || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ID: </span>
                  <span className="font-mono text-xs">
                    {feedback.user.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin actions */}
          <Card>
            <CardContent className="py-4 space-y-4">
              <h3 className="text-sm font-medium">Admin Actions</h3>

              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Admin Notes</Label>
                <Textarea
                  placeholder="Internal notes about this feedback..."
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <Button
                size="sm"
                className="w-full"
                disabled={saving}
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-1.5" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
