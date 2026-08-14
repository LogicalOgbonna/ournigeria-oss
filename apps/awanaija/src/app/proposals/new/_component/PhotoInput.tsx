"use client";

import { useState } from "react";
import { Link2, Upload, ImageIcon, X, Loader2 } from "lucide-react";
import { Show } from "@/components/ui/Show";

export function PhotoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function compressImage(file: File) {
    const imageUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read image"));
        img.src = imageUrl;
      });

      const maxDimension = 1200;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Image processing is not available");
      }

      context.drawImage(image, 0, 0, width, height);

      const targetBytes = 450 * 1024;
      let quality = 0.82;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);

      while (dataUrl.length > targetBytes && quality > 0.45) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      return dataUrl;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
      onChange(compressed);
    } catch {
      setUploadError("Could not process this image. Try another file.");
      setPreview(null);
      onChange("");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function clearUpload() {
    setPreview(null);
    setUploadError(null);
    onChange("");
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Photo
      </label>

      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-3">
        <button
          type="button"
          onClick={() => { setMode("url"); clearUpload(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
            mode === "url"
              ? "bg-emerald-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          Paste URL
        </button>
        <button
          type="button"
          onClick={() => { setMode("upload"); onChange(""); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
            mode === "upload"
              ? "bg-emerald-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>
      </div>

      <Show when={mode === "url"}>
        <>
          <input
            type="url"
            value={value}
            onChange={(e) => {
              setUploadError(null);
              onChange(e.target.value);
            }}
            placeholder="e.g. https://example.com/photo.jpg"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Show when={!!value && value.startsWith("http")}>
            <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          </Show>
        </>
      </Show>
      <Show when={mode !== "url"}>
        <>
          {preview ? (
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Upload preview"
                className="w-24 h-24 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={clearUpload}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <Show when={uploading}>
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              </Show>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
              <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Click to select an image
              </span>
              <span className="text-xs text-slate-400 mt-1">
                JPG, PNG, WebP. Max 5MB. Large images are resized automatically.
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </>
      </Show>

      {uploadError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>
      )}
    </div>
  );
}
