"use client";

import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { GraphCanvas } from "@/components/explore/GraphCanvas";
import { FilterBar } from "@/components/explore/FilterBar";
import { StatsOverlay } from "@/components/explore/StatsOverlay";
import { Legend } from "@/components/explore/Legend";
import { EntityDetail } from "@/components/explore/EntityDetail";
import { EntityList } from "@/components/explore/EntityList";

interface GraphNode {
  id: string;
  name: string;
  type: string;
  state?: string;
  position?: string;
  connectionCount: number;
  amount?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  amount?: number;
}

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  communities: number;
}

export default function ExplorePage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [meta, setMeta] = useState({ total: 0, showing: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [listView, setListView] = useState(false);

  // Filters
  const [state, setState] = useState<string>("");
  const [nodeType, setNodeType] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Check reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setListView(true);
  }, []);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (state) params.set("state", state);
      if (nodeType) params.set("nodeType", nodeType);
      if (search) params.set("search", search);
      params.set("limit", "500");

      const res = await fetch(apiUrl(`/api/graph/explore?${params}`), {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes ?? []);
        setEdges(data.edges ?? []);
        setMeta(data.meta ?? { total: 0, showing: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch graph:", err);
    } finally {
      setLoading(false);
    }
  }, [state, nodeType, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/graph/stats"), {
        credentials: "include",
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      // Stats are optional
    }
  }, []);

  useEffect(() => {
    fetchGraph();
    fetchStats();
  }, [fetchGraph, fetchStats]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Filter Bar — top left */}
      <FilterBar
        state={state}
        nodeType={nodeType}
        search={search}
        onStateChange={setState}
        onNodeTypeChange={setNodeType}
        onSearchChange={setSearch}
        listView={listView}
        onToggleView={() => setListView((v) => !v)}
      />

      {/* Stats Overlay — top right */}
      {stats && (
        <StatsOverlay
          stats={stats}
          showing={meta.showing}
          total={meta.total}
        />
      )}

      {/* Legend — bottom left */}
      <Legend />

      {/* Main content */}
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      ) : listView ? (
        <EntityList
          nodes={nodes}
          onSelect={(id) => setSelectedNode(id)}
          selectedId={selectedNode}
        />
      ) : (
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          onNodeClick={(id) => setSelectedNode(id)}
          selectedNodeId={selectedNode}
        />
      )}

      {/* Entity Detail Sidebar / Bottom Sheet */}
      {selectedNode && (
        <EntityDetail
          nodeId={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
