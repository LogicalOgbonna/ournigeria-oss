/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { NODE_COLORS } from "./Legend";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default) as any,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    ),
  },
) as any;

interface GraphNode {
  id: string;
  name: string;
  type: string;
  connectionCount: number;
  state?: string;
  amount?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  amount?: number;
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (id: string) => void;
  selectedNodeId: string | null;
}

type FGNode = GraphNode & { x?: number; y?: number };
type FGLink = {
  source: string | FGNode;
  target: string | FGNode;
  type: string;
  amount?: number;
};

function getNodeColor(type: string): string {
  return NODE_COLORS[type]?.color ?? "#94a3b8";
}

function getNodeSize(connectionCount: number): number {
  return Math.min(4 + Math.sqrt(connectionCount) * 2, 16);
}

export function GraphCanvas({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const graphData = {
    nodes: nodes.map((n) => ({ ...n })),
    links: edges.map((e) => ({
      source: e.source,
      target: e.target,
      type: e.type,
      amount: e.amount,
    })),
  };

  const handleNodeClick = useCallback(
    (node: FGNode) => {
      if (node?.id) onNodeClick(node.id);
    },
    [onNodeClick],
  );

  const nodeCanvasObject = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const size = getNodeSize(node.connectionCount ?? 0);
      const color = getNodeColor(node.type ?? "");
      const isSelected = node.id === selectedNodeId;

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.globalAlpha = isSelected ? 1 : 0.85;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = isDark ? "#fff" : "#000";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Label (only for larger nodes)
      if (size > 5) {
        const label = node.name ?? "";
        const fontSize = Math.max(3, size * 0.7);
        ctx.font = `500 ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isDark ? "#e2e8f0" : "#1e293b";
        ctx.fillText(
          label.length > 20 ? label.slice(0, 18) + "…" : label,
          x,
          y + size + 2,
        );
      }
    },
    [selectedNodeId, isDark],
  );

  return (
    <div ref={containerRef} className="h-full w-full">
      <ForceGraph2D
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(
          node: FGNode,
          color: string,
          ctx: CanvasRenderingContext2D,
        ) => {
          const size = getNodeSize(node.connectionCount ?? 0);
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, size + 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={() =>
          isDark ? "rgba(148,163,184,0.3)" : "rgba(100,116,139,0.2)"
        }
        linkWidth={(link: FGLink) => {
          const amount = link.amount ?? 0;
          return amount > 0 ? Math.min(1 + Math.log10(amount + 1) * 0.5, 4) : 1;
        }}
        onNodeClick={handleNodeClick}
        backgroundColor={isDark ? "#020617" : "#f8fafc"}
        cooldownTicks={100}
        nodeLabel={(node: FGNode) =>
          `${node.name} (${node.type}) — ${node.connectionCount ?? 0} connections`
        }
      />
    </div>
  );
}
