"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquarePlus,
  X,
  Check,
  Upload,
  Trash2,
  Loader2,
} from "lucide-react";

type Category = "bug" | "feature" | "data_issue" | "general";

interface FileItem {
  file: File;
  preview: string;
  uploading: boolean;
  done: boolean;
  error?: string;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "data_issue", label: "Data Issue" },
  { value: "general", label: "General" },
];

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_FILES = 5;
const MAX_SIZE = 50 * 1024 * 1024;

export function FeedbackFab() {
  const [open, setOpen] = useState(false);

  const [category, setCategory] = useState<Category>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setCategory("general");
    setSubject("");
    setMessage("");
    setFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
    setError(null);
    setSuccess(false);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(reset, 200);
  }, [reset]);

  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      setOpen(true);
      if ('detail' in e && (e as CustomEvent).detail?.category) {
        setCategory((e as CustomEvent).detail.category);
      }
    };
    window.addEventListener("open-feedback", handleOpenEvent);
    return () => window.removeEventListener("open-feedback", handleOpenEvent);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  function addFiles(newFiles: File[]) {
    setError(null);
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      setError(`Max ${MAX_FILES} files allowed`);
      return;
    }

    const valid = newFiles.slice(0, remaining).filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError("Only images and videos are allowed");
        return false;
      }
      if (f.size > MAX_SIZE) {
        setError("Files must be under 50MB");
        return false;
      }
      return true;
    });

    setFiles((prev) => [
      ...prev,
      ...valid.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        done: false,
      })),
    ]);
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const feedbackRes = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!feedbackRes.ok) {
        const err = await feedbackRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to submit feedback");
      }

      const { id: feedbackId } = await feedbackRes.json();

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, uploading: true } : f)),
        );

        const formData = new FormData();
        formData.append("file", item.file);

        const uploadRes = await fetch(`/api/feedback/${feedbackId}/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to upload file");
        }

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, uploading: false, done: true } : f,
          ),
        );
      }

      setSuccess(true);
      setTimeout(handleClose, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = subject.trim() && message.trim() && !submitting;

  return (
    <>
      {/* Floating button — bottom left */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95 sm:left-6 sm:px-5"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
        <span className="hidden sm:inline text-sm font-medium">Feedback</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) handleClose();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
            {success ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-4">
                  <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Thank you!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Your feedback has been submitted successfully.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Send Feedback
                  </h2>
                  <button
                    onClick={handleClose}
                    disabled={submitting}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-6 pb-6 space-y-4">
                  {/* Category pills */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                            category === cat.value
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="Brief summary of your feedback"
                      maxLength={200}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      placeholder="Describe your feedback in detail..."
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50 resize-none"
                    />
                  </div>

                  {/* File drop zone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Attachments{" "}
                      <span className="font-normal text-slate-400">
                        (optional, max {MAX_FILES} files, 50MB each)
                      </span>
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 py-6 px-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
                    >
                      <Upload className="h-6 w-6 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Drop files here or{" "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          browse
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Images & videos only
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ALLOWED_TYPES.join(",")}
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* File previews */}
                    {files.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {files.map((item, i) => (
                          <div
                            key={i}
                            className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600"
                          >
                            {item.file.type.startsWith("video/") ? (
                              <div className="h-20 w-20 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                <span className="text-xs text-slate-500">
                                  Video
                                </span>
                              </div>
                            ) : (
                              <img
                                src={item.preview}
                                alt=""
                                className="h-20 w-20 object-cover"
                              />
                            )}
                            {item.uploading && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                              </div>
                            )}
                            {item.done && (
                              <div className="absolute inset-0 bg-emerald-600/40 flex items-center justify-center">
                                <Check className="h-5 w-5 text-white" />
                              </div>
                            )}
                            {!item.uploading && !item.done && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(i);
                                }}
                                className="absolute top-1 right-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-500 dark:text-red-400">
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Feedback"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
