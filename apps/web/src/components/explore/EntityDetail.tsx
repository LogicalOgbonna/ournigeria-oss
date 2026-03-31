"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, MessageSquare, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { NODE_COLORS } from "./Legend";

interface NodeDetail {
  id: string;
  name: string;
  type: string;
  state?: string;
  position?: string;
  party?: string;
  amount?: number;
  connectionCount: number;
  properties: Record<string, unknown>;
  connections: Array<{
    node: { id: string; name: string; type: string; connectionCount: number };
    relationship: string;
    direction: "in" | "out";
  }>;
}

interface EntityDetailProps {
  nodeId: string;
  onClose: () => void;
}

export function EntityDetail({ nodeId, onClose }: EntityDetailProps) {
  const [node, setNode] = useState<NodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl(`/api/graph/node/${encodeURIComponent(nodeId)}`), {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(setNode)
      .catch(() => setNode(null))
      .finally(() => setLoading(false));
  }, [nodeId]);

  const color = NODE_COLORS[node?.type ?? ""]?.color ?? "#94a3b8";

  // Group connections by relationship type
  const grouped: Record<string, NodeDetail["connections"]> = {};
  if (node) {
    for (const conn of node.connections) {
      const key = conn.relationship;
      (grouped[key] ??= []).push(conn);
    }
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar (desktop) / Bottom sheet (mobile) */}
      <div className="fixed z-40 lg:right-0 lg:top-0 lg:h-full lg:w-[30%] lg:min-w-[360px] lg:max-w-[480px] bottom-0 left-0 right-0 lg:bottom-auto lg:left-auto max-h-[70vh] lg:max-h-full overflow-y-auto rounded-t-2xl lg:rounded-none border-t lg:border-l border-white/20 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center py-2 lg:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-2 pb-3 lg:pt-4">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-400">Loading...</span>
              </div>
            ) : node ? (
              <>
                <h2 className="font-heading font-semibold text-lg text-slate-900 dark:text-slate-100 truncate">
                  {node.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {node.type}
                  </span>
                  {node.state && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {node.state}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Node not found</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {node && (
          <div className="px-4 pb-4 space-y-4">
            {/* Properties */}
            <div className="space-y-1.5">
              {node.position && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Position</span>
                  <span className="font-sans text-slate-700 dark:text-slate-300">
                    {node.position}
                  </span>
                </div>
              )}
              {node.party && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Party</span>
                  <span className="font-sans text-slate-700 dark:text-slate-300">
                    {node.party}
                  </span>
                </div>
              )}
              {node.amount != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Amount</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    ₦{node.amount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Connections</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {node.connectionCount}
                </span>
              </div>
            </div>

            {/* Connections */}
            {Object.keys(grouped).length > 0 && (
              <div>
                <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">
                  Connections
                </h3>
                <div className="space-y-3">
                  {Object.entries(grouped).map(([relType, conns]) => (
                    <div key={relType}>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                        {relType.replace(/_/g, " ")}
                      </p>
                      <div className="space-y-1">
                        {conns.map((conn, i) => {
                          const connColor =
                            NODE_COLORS[conn.node.type]?.color ?? "#94a3b8";
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: connColor }}
                              />
                              <span className="font-sans text-slate-700 dark:text-slate-300 truncate">
                                {conn.node.name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                {conn.node.connectionCount}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View in chat button */}
            <button
              onClick={() =>
                router.push(`/?q=${encodeURIComponent(`Tell me about ${node.name}`)}`)
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors min-h-[44px]"
            >
              <MessageSquare className="h-4 w-4" />
              View in chat
            </button>
          </div>
        )}
      </div>
    </>
  );
}
