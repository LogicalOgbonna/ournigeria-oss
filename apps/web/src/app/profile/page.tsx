"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsStringEnum } from "nuqs";
import {
  ArrowLeft,
  Loader2,
  Check,
  User,
  MessageSquare,
  Bug,
  Lightbulb,
  Database,
  HelpCircle,
  Paperclip,
  Clock,
  Reply,
  CreditCard,
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import { PricingPlans } from "@/components/pricing/PricingPlans";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
}

interface FeedbackItem {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  adminNotes: string | null;
  attachmentCount: number;
  createdAt: string;
}

type Tab = "profile" | "feedback" | "billing";

const categoryIcons: Record<string, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  data_issue: Database,
  general: HelpCircle,
};

const statusStyles: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  reviewing: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  resolved: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  archived: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const [tab, setTab] = useQueryState<Tab>(
    "tab",
    parseAsStringEnum<Tab>(["profile", "feedback", "billing"]).withDefault(
      "profile",
    ),
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Feedback state
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackFetched, setFeedbackFetched] = useState(false);

  useEffect(() => {
    fetch(apiUrl("/api/auth/profile"), { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");
      })
      .catch(() => {
        setToast({ type: "error", message: "Failed to load profile" });
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchFeedback = useCallback(() => {
    if (feedbackFetched) return;
    setFeedbackLoading(true);
    fetch(apiUrl("/api/feedback/mine"), { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load feedback");
        return res.json();
      })
      .then((data: FeedbackItem[]) => {
        setFeedbackList(data);
        setFeedbackFetched(true);
      })
      .catch(() => {
        setFeedbackList([]);
      })
      .finally(() => setFeedbackLoading(false));
  }, [feedbackFetched]);

  useEffect(() => {
    if (tab === "feedback") {
      fetchFeedback();
    }
  }, [tab, fetchFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const body: Record<string, string> = {};
      if (name.trim()) body.name = name.trim();
      if (email.trim()) body.email = email.trim();

      const res = await fetch(apiUrl("/api/auth/profile"), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const updated: Profile = await res.json();
      setProfile(updated);
      setName(updated.name || "");
      setEmail(updated.email || "");
      setToast({ type: "success", message: "Profile updated" });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div
          className={`mx-auto flex h-14 items-center gap-3 px-4 ${tab === "billing" ? "max-w-5xl" : "max-w-lg"}`}
        >
          <button
            onClick={() => router.push("/")}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Profile
          </h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div
          className={`mx-auto flex px-4 ${tab === "billing" ? "max-w-5xl" : "max-w-lg"}`}
        >
          {(
            [
              { key: "profile", label: "Profile", icon: User },
              { key: "billing", label: "Billing", icon: CreditCard },
              { key: "feedback", label: "Feedback", icon: MessageSquare },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main
        className={`mx-auto w-full flex-1 px-4 py-6 ${tab === "billing" ? "max-w-5xl" : "max-w-lg"}`}
      >
        {tab === "profile" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Phone (read-only) */}
                {profile?.phoneNumber && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                      Phone number
                    </label>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400">
                      {profile.phoneNumber}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Toast */}
                {toast && (
                  <div
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                      toast.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {toast.type === "success" && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                    {toast.message}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save changes"
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {tab === "feedback" && (
          <>
            {feedbackLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No feedback submitted yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Use the Feedback button to share your thoughts
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackList.map((item) => {
                  const Icon = categoryIcons[item.category] || HelpCircle;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Icon className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                              {item.subject}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                statusStyles[item.status] || statusStyles.new
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {item.message}
                          </p>
                          {item.adminNotes && (
                            <div className="mt-2 flex gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-2">
                              <Reply className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400 rotate-180" />
                              <div>
                                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                  Admin Response
                                </span>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 whitespace-pre-line">
                                  {item.adminNotes}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                            <span className="capitalize">
                              {item.category.replace("_", " ")}
                            </span>
                            {item.attachmentCount > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Paperclip className="h-3 w-3" />
                                {item.attachmentCount}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "billing" && (
          <div className="py-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                Billing & Plans
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage your subscription and upgrade your plan to unlock more
                features.
              </p>
            </div>
            <PricingPlans
              onUpgrade={(plan) => {
                console.log(`User initiated upgrade from profile to ${plan}`);
                // TODO: Handle billing portal/checkout redirect
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
