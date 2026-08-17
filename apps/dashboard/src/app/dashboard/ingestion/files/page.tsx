"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  FolderPlus,
  File,
  Upload,
  ChevronRight,
  Home,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { adminFetch, adminUpload } from "@/lib/api";
import { formatBytes, formatDateTimeFull } from "@/lib/format";

interface S3Folder {
  name: string;
  prefix: string;
}

interface S3File {
  name: string;
  key: string;
  size: number;
  lastModified: string;
}

interface BrowseResult {
  prefix: string;
  folders: S3Folder[];
  files: S3File[];
  fileHints: string[];
}

const PIPELINE_DESCRIPTIONS: Record<string, string> = {
  budgets: "State and federal budget documents (PDF, XLSX, DOCX)",
  corruption: "Corruption case reports and analyses (Markdown)",
  govspend: "Government spending data and reports (Markdown)",
};

export default function S3FilesPage() {
  const [data, setData] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefix, setPrefix] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const browse = useCallback((p: string) => {
    setPrefix(p);
    setLoading(true);
    setUploadStatus(null);
    adminFetch(`/s3/browse?prefix=${encodeURIComponent(p)}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    browse("");
  }, [browse]);

  const breadcrumbs = prefix
    ? prefix
        .replace(/\/$/, "")
        .split("/")
        .map((part, i, arr) => ({
          label: part,
          prefix: arr.slice(0, i + 1).join("/") + "/",
        }))
    : [];

  const isRoot = prefix === "";
  const pipeline = prefix ? prefix.split("/")[0] : null;

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || isRoot) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("prefix", prefix);
        await adminUpload("/s3/upload", formData);
      }

      setUploadStatus({
        type: "success",
        message: `Uploaded ${files.length} file(s). Ingestion will trigger automatically via SQS.`,
      });
      browse(prefix);
    } catch (err: any) {
      setUploadStatus({
        type: "error",
        message: err.message || "Upload failed",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!isRoot) handleUpload(e.dataTransfer.files);
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    setUploadStatus(null);
    try {
      await adminFetch("/s3/folder", {
        method: "POST",
        body: JSON.stringify({ prefix, folderName: newFolderName.trim() }),
      });
      setShowNewFolder(false);
      setNewFolderName("");
      browse(prefix);
    } catch (err: any) {
      setUploadStatus({
        type: "error",
        message: err.message || "Failed to create folder",
      });
    } finally {
      setCreatingFolder(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">S3 File Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse and upload files to trigger the ingestion pipeline
        </p>
      </div>

      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button
          onClick={() => browse("")}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          Root
        </button>
        {breadcrumbs.map((bc) => (
          <span key={bc.prefix} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <button
              onClick={() => browse(bc.prefix)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {bc.label}
            </button>
          </span>
        ))}
      </div>

      {/* Folders */}
      {data && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Folders
            </h2>
            {!showNewFolder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolder(true)}
              >
                <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
                New Folder
              </Button>
            )}
          </div>

          {showNewFolder && (
            <div className="flex items-center gap-2 mb-3">
              <Input
                autoFocus
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }
                }}
                className="max-w-xs"
                disabled={creatingFolder}
              />
              <Button
                size="sm"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || creatingFolder}
              >
                {creatingFolder ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Create"
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName("");
                }}
                disabled={creatingFolder}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.folders.map((folder) => {
              const pipelineDesc = isRoot
                ? PIPELINE_DESCRIPTIONS[folder.name]
                : null;
              return (
                <Card
                  key={folder.prefix}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => browse(folder.prefix)}
                >
                  <CardContent className="py-4 flex items-start gap-3">
                    <FolderOpen className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {folder.name}
                      </p>
                      {pipelineDesc && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {pipelineDesc}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 ml-auto" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Files */}
      {data && data.files.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Files ({data.files.length})
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {data.files.map((file) => (
                  <div
                    key={file.key}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <File className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatBytes(file.size)}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDateTimeFull(file.lastModified)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {data &&
        data.folders.length === 0 &&
        data.files.length === 0 &&
        !isRoot && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FolderOpen className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>This folder is empty</p>
              <p className="text-xs mt-1">Upload files to start ingestion</p>
            </CardContent>
          </Card>
        )}

      {/* Upload panel */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Upload Files
        </h2>
        {isRoot ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Upload className="h-6 w-6 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                Navigate into a pipeline folder to upload files
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {data?.fileHints && data.fileHints.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">
                  Expected file types:
                </span>
                {data.fileHints.map((hint) => (
                  <Badge key={hint} variant="secondary" className="text-xs">
                    {hint}
                  </Badge>
                ))}
              </div>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm mb-1">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Uploading to: <span className="font-mono">{prefix}</span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </>
              )}
            </div>
          </>
        )}

        {/* Upload status */}
        {uploadStatus && (
          <div
            className={`mt-3 flex items-start gap-2 p-3 rounded-lg text-sm ${
              uploadStatus.type === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {uploadStatus.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <p>{uploadStatus.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
