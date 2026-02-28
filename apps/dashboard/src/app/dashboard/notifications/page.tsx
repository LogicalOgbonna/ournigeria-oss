"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  Plus,
  Trash2,
  AlertCircle,
  Megaphone,
  Info,
  AlertTriangle,
  Send,
  Users,
  User,
} from "lucide-react";
import { adminFetch } from "@/lib/api";

interface NotificationItem {
  id: string;
  userId: string;
  user: {
    id: string;
    phoneNumber: string | null;
    telegramId: string | null;
    name: string | null;
  };
  type: "incident" | "announcement" | "info" | "warning";
  title: string;
  message: string;
  read: boolean;
  linkText: string | null;
  linkUrl: string | null;
  createdAt: string;
}

const typeIcons: Record<string, typeof Info> = {
  incident: AlertCircle,
  announcement: Megaphone,
  info: Info,
  warning: AlertTriangle,
};

const typeColors: Record<string, string> = {
  incident: "text-red-500",
  announcement: "text-emerald-500",
  info: "text-blue-500",
  warning: "text-amber-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function userLabel(user: NotificationItem["user"]) {
  if (user.name) return user.name;
  if (user.phoneNumber) return user.phoneNumber;
  if (user.telegramId) return `TG:${user.telegramId}`;
  return user.id.slice(0, 8);
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    type: "info" as "incident" | "announcement" | "info" | "warning",
    title: "",
    message: "",
    linkText: "",
    linkUrl: "",
    broadcast: true,
    userId: "",
  });

  const fetchNotifications = useCallback(
    (p: number) => {
      setLoading(true);
      adminFetch(`/notifications?page=${p}&limit=30`)
        .then((res) => {
          setNotifications(res.data ?? []);
          setTotal(res.total ?? 0);
        })
        .catch(() => setNotifications([]))
        .finally(() => setLoading(false));
    },
    [],
  );

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  async function handleCreate() {
    setSending(true);
    try {
      await adminFetch("/notifications", {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          message: form.message,
          linkText: form.linkText || undefined,
          linkUrl: form.linkUrl || undefined,
          broadcast: form.broadcast,
          userId: form.broadcast ? undefined : form.userId || undefined,
        }),
      });
      setCreateOpen(false);
      setForm({
        type: "info",
        title: "",
        message: "",
        linkText: "",
        linkUrl: "",
        broadcast: true,
        userId: "",
      });
      fetchNotifications(page);
    } catch {
      // keep dialog open on error
    } finally {
      setSending(false);
    }
  }

  function handleDelete(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    adminFetch(`/notifications/${id}`, { method: "DELETE" }).catch(() =>
      fetchNotifications(page),
    );
  }

  const canCreate =
    form.title.trim() && form.message.trim() && (form.broadcast || form.userId.trim());

  if (loading && notifications.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Send notifications to users ({total} total)
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
              <DialogDescription>
                Send a notification to a specific user or broadcast to all users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: typeof form.type) =>
                    setForm((f) => ({ ...f, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Budget data updated"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Notification message..."
                  rows={3}
                  value={form.message}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, message: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Link Text (optional)</Label>
                  <Input
                    placeholder="Learn more"
                    value={form.linkText}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, linkText: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link URL (optional)</Label>
                  <Input
                    placeholder="https://..."
                    value={form.linkUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, linkUrl: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="broadcast"
                    checked={form.broadcast}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, broadcast: !!v }))
                    }
                  />
                  <Label htmlFor="broadcast" className="text-sm font-normal">
                    Broadcast to all users
                  </Label>
                </div>

                {!form.broadcast && (
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input
                      placeholder="UUID of the target user"
                      value={form.userId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, userId: e.target.value }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!canCreate || sending}>
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    {form.broadcast ? "Broadcast" : "Send"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>No notifications sent yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Info;
            return (
              <Card key={notif.id}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Icon
                        className={`h-4 w-4 ${typeColors[notif.type] || "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {notif.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {notif.type}
                        </Badge>
                        {notif.read ? (
                          <Badge
                            variant="secondary"
                            className="text-xs opacity-60"
                          >
                            Read
                          </Badge>
                        ) : (
                          <Badge className="text-xs">Unread</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {userLabel(notif.user)}
                        </span>
                        <span>{formatDate(notif.createdAt)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive shrink-0"
                      onClick={() => handleDelete(notif.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {total > 30 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / 30)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / 30)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
