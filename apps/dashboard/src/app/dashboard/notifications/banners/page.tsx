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
  Plus,
  Trash2,
  AlertCircle,
  Megaphone,
  AlertTriangle,
  Eye,
  EyeOff,
  Flag,
} from "lucide-react";
import { adminFetch } from "@/lib/api";

interface BannerItem {
  id: string;
  type: "incident" | "announcement" | "warning";
  title: string;
  message: string;
  linkText: string | null;
  linkUrl: string | null;
  dismissible: boolean;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  dismissCount: number;
}

const typeIcons: Record<string, typeof AlertCircle> = {
  incident: AlertCircle,
  announcement: Megaphone,
  warning: AlertTriangle,
};

const typeBg: Record<string, string> = {
  incident: "bg-red-500/10 text-red-600",
  announcement: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: "announcement" as "incident" | "announcement" | "warning",
    title: "",
    message: "",
    linkText: "",
    linkUrl: "",
    dismissible: true,
    expiresAt: "",
  });

  const fetchBanners = useCallback(() => {
    setLoading(true);
    adminFetch("/notifications/banners")
      .then((res) => setBanners(res.banners ?? []))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  async function handleCreate() {
    setSaving(true);
    try {
      await adminFetch("/notifications/banners", {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          message: form.message,
          linkText: form.linkText || undefined,
          linkUrl: form.linkUrl || undefined,
          dismissible: form.dismissible,
          expiresAt: form.expiresAt
            ? new Date(form.expiresAt).toISOString()
            : undefined,
        }),
      });
      setCreateOpen(false);
      setForm({
        type: "announcement",
        title: "",
        message: "",
        linkText: "",
        linkUrl: "",
        dismissible: true,
        expiresAt: "",
      });
      fetchBanners();
    } catch {
      // keep dialog open on error
    } finally {
      setSaving(false);
    }
  }

  function toggleActive(banner: BannerItem) {
    setBanners((prev) =>
      prev.map((b) =>
        b.id === banner.id ? { ...b, active: !b.active } : b,
      ),
    );
    adminFetch(`/notifications/banners/${banner.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !banner.active }),
    }).catch(() => fetchBanners());
  }

  function handleDelete(id: string) {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    adminFetch(`/notifications/banners/${id}`, { method: "DELETE" }).catch(() =>
      fetchBanners(),
    );
  }

  const canCreate = form.title.trim() && form.message.trim();

  if (loading && banners.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">System Banners</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage banners shown at the top of the app for all users
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create System Banner</DialogTitle>
              <DialogDescription>
                Banners appear at the top of the app for all users.
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
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Scheduled Maintenance"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Banner message..."
                  rows={2}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="dismissible"
                    checked={form.dismissible}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, dismissible: !!v }))
                    }
                  />
                  <Label htmlFor="dismissible" className="text-sm font-normal">
                    Users can dismiss
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label>Expires At (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, expiresAt: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!canCreate || saving}>
                {saving ? "Creating..." : "Create Banner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Flag className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>No system banners created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {banners.map((banner) => {
            const Icon = typeIcons[banner.type] || Megaphone;
            const isExpired =
              banner.expiresAt && new Date(banner.expiresAt) < new Date();
            return (
              <Card
                key={banner.id}
                className={!banner.active || isExpired ? "opacity-60" : ""}
              >
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${typeBg[banner.type]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {banner.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {banner.type}
                        </Badge>
                        {banner.active && !isExpired ? (
                          <Badge className="text-xs">Active</Badge>
                        ) : isExpired ? (
                          <Badge variant="secondary" className="text-xs">
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                        {!banner.dismissible && (
                          <Badge variant="destructive" className="text-xs">
                            Non-dismissible
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {banner.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Created {formatDate(banner.createdAt)}</span>
                        {banner.expiresAt && (
                          <span>
                            Expires {formatDate(banner.expiresAt)}
                          </span>
                        )}
                        <span>{banner.dismissCount} dismissed</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(banner)}
                      >
                        {banner.active ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
