"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface S3Object {
  key: string;
  size: number;
  lastModified: string;
}

interface FolderNode {
  prefix: string;
  name: string;
  expanded: boolean;
  loading: boolean;
  folders: FolderNode[];
  files: S3Object[];
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileName({ name }: { name: string }) {
  const parts = name.split("/");
  return <span className="text-sm truncate">{parts[parts.length - 1] || name}</span>;
}

/** Collect all file keys from a loaded folder tree */
function collectFiles(node: FolderNode): string[] {
  const keys: string[] = node.files.map((f) => f.key);
  for (const sub of node.folders) {
    keys.push(...collectFiles(sub));
  }
  return keys;
}

/** Recursively load a folder and all its subfolders */
async function loadFolderRecursive(prefix: string): Promise<string[]> {
  try {
    const res = await adminFetch(`/s3/browse?prefix=${encodeURIComponent(prefix)}`);
    const fileKeys: string[] = (res.files || []).map((f: S3Object) => f.key);
    const subFolders: { name: string; prefix: string }[] = res.folders || [];
    const subResults = await Promise.all(
      subFolders.map((f) => loadFolderRecursive(f.prefix)),
    );
    return [...fileKeys, ...subResults.flat()];
  } catch {
    return [];
  }
}

export function S3Browser({
  selectedFiles,
  onSelectionChange,
}: {
  selectedFiles: string[];
  onSelectionChange: (files: string[]) => void;
}) {
  const [root, setRoot] = useState<FolderNode>({
    prefix: "",
    name: "Root",
    expanded: false,
    loading: false,
    folders: [],
    files: [],
  });
  const [loaded, setLoaded] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());

  const loadFolder = useCallback(
    async (node: FolderNode): Promise<FolderNode> => {
      try {
        const res = await adminFetch(`/s3/browse?prefix=${encodeURIComponent(node.prefix)}`);
        return {
          ...node,
          expanded: true,
          loading: false,
          folders: (res.folders || []).map((f: { name: string; prefix: string }) => ({
            prefix: f.prefix,
            name: f.name,
            expanded: false,
            loading: false,
            folders: [],
            files: [],
          })),
          files: res.files || [],
        };
      } catch {
        return { ...node, expanded: true, loading: false };
      }
    },
    [],
  );

  async function handleLoadRoot() {
    setRoot((r) => ({ ...r, loading: true }));
    const updated = await loadFolder(root);
    setRoot(updated);
    setLoaded(true);
  }

  async function toggleFolder(path: string[]) {
    async function updateNode(
      node: FolderNode,
      remaining: string[],
    ): Promise<FolderNode> {
      if (remaining.length === 0) {
        if (node.expanded) {
          return { ...node, expanded: false };
        }
        const loaded = await loadFolder({ ...node, loading: true });
        return loaded;
      }
      return {
        ...node,
        folders: await Promise.all(
          node.folders.map((f) =>
            f.name === remaining[0]
              ? updateNode(f, remaining.slice(1))
              : f,
          ),
        ),
      };
    }

    setRoot(await updateNode(root, path));
  }

  function toggleFile(key: string) {
    onSelectionChange(
      selectedFiles.includes(key)
        ? selectedFiles.filter((f) => f !== key)
        : [...selectedFiles, key],
    );
  }

  async function toggleFolderSelection(node: FolderNode) {
    // Collect already-known files from the loaded tree
    const knownFiles = collectFiles(node);
    const allKnownSelected = knownFiles.length > 0 && knownFiles.every((k) => selectedFiles.includes(k));

    if (allKnownSelected) {
      // Deselect all files under this folder
      const knownSet = new Set(knownFiles);
      onSelectionChange(selectedFiles.filter((f) => !knownSet.has(f)));
    } else {
      // Load all files recursively, then select them
      setLoadingFolders((prev) => new Set(prev).add(node.prefix));
      const allFiles = await loadFolderRecursive(node.prefix);
      setLoadingFolders((prev) => {
        const next = new Set(prev);
        next.delete(node.prefix);
        return next;
      });
      const merged = new Set([...selectedFiles, ...allFiles]);
      onSelectionChange(Array.from(merged));
    }
  }

  function getFolderCheckState(node: FolderNode): boolean | "indeterminate" {
    const knownFiles = collectFiles(node);
    if (knownFiles.length === 0) return false;
    const selectedCount = knownFiles.filter((k) => selectedFiles.includes(k)).length;
    if (selectedCount === 0) return false;
    if (selectedCount === knownFiles.length) return true;
    return "indeterminate";
  }

  function renderFolder(node: FolderNode, path: string[], depth = 0) {
    const isRoot = depth === 0;
    const folderCheckState = !isRoot ? getFolderCheckState(node) : false;
    const isFolderLoading = loadingFolders.has(node.prefix);

    return (
      <div key={node.prefix || "root"}>
        <div
          className="flex items-center gap-1 w-full"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {!isRoot && (
            <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
              {isFolderLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Checkbox
                  checked={folderCheckState}
                  onCheckedChange={() => toggleFolderSelection(node)}
                />
              )}
            </div>
          )}
          <button
            onClick={() => toggleFolder(path)}
            className={cn(
              "flex items-center gap-2 flex-1 py-1.5 px-1 rounded-md text-sm hover:bg-accent transition-colors",
            )}
          >
            {node.expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            {node.expanded ? (
              <FolderOpen className="h-4 w-4 text-chart-3 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-chart-3 shrink-0" />
            )}
            <span className="truncate font-medium">{node.name}</span>
            {node.loading && (
              <span className="text-xs text-muted-foreground ml-auto">Loading...</span>
            )}
          </button>
        </div>
        {node.expanded && (
          <div>
            {node.folders.map((f) =>
              renderFolder(f, [...path, f.name], depth + 1),
            )}
            {node.files.map((file) => (
              <label
                key={file.key}
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >
                <Checkbox
                  checked={selectedFiles.includes(file.key)}
                  onCheckedChange={() => toggleFile(file.key)}
                  className="shrink-0"
                />
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <FileName name={file.key} />
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  {formatSize(file.size)}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Folder className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Browse files in S3 bucket</p>
        <Button variant="outline" size="sm" onClick={handleLoadRoot}>
          Load Files
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] custom-scrollbar">
      <div className="p-2">
        {root.loading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded" />
            ))}
          </div>
        ) : (
          renderFolder(root, [])
        )}
      </div>
    </ScrollArea>
  );
}
