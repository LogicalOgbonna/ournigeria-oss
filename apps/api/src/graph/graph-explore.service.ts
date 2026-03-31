import { Injectable, Logger } from "@nestjs/common";
import { cache as cacheManager } from "@ournigeria/cache";
import neo4j from "neo4j-driver";
import { Neo4jService } from "./neo4j.service";

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  state?: string;
  position?: string;
  party?: string;
  source_domain?: string;
  amount?: number;
  connectionCount: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  amount?: number;
  source_chunk_id?: string;
}

export interface SubGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: { total: number; showing: number };
}

export interface NodeDetail extends GraphNode {
  properties: Record<string, unknown>;
  connections: Array<{
    node: GraphNode;
    relationship: string;
    direction: "in" | "out";
  }>;
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  edgesByType: Record<string, number>;
  communities: number;
}

const exploreCache = cacheManager.namespace("graph:explore");
const CACHE_TTL = 10 * 60 * 1000;

const VALID_NODE_TYPES = new Set([
  "Official",
  "State",
  "MDA",
  "Contractor",
  "BudgetItem",
  "Payment",
  "FAACAllocation",
  "CorruptionCase",
]);

function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null && "toNumber" in (val as any)) {
    return (val as any).toNumber();
  }
  return Number(val ?? 0);
}

@Injectable()
export class GraphExploreService {
  private readonly logger = new Logger(GraphExploreService.name);

  constructor(private neo4j: Neo4jService) {}

  async clearCache(): Promise<void> {
    await exploreCache.clear();
  }

  async getSubGraph(opts: {
    state?: string;
    depth?: number;
    nodeType?: string;
    search?: string;
    limit?: number;
  }): Promise<SubGraphResult> {
    if (!this.neo4j.enabled) {
      return { nodes: [], edges: [], meta: { total: 0, showing: 0 } };
    }

    const depth = Math.min(opts.depth ?? 3, 5);
    const limit = Math.min(opts.limit ?? 500, 2000);

    const cacheKey = JSON.stringify(opts);
    const cached = await exploreCache.get<SubGraphResult>(cacheKey);
    if (cached) return cached;

    // Build starting match clause
    let matchClause = "MATCH (start)";
    const params: Record<string, unknown> = { depth, limit: neo4j.int(limit) };
    const conditions: string[] = [];

    if (opts.state) {
      conditions.push("start.state = $state OR start.name = $state");
      params.state = opts.state;
    }
    if (opts.nodeType && VALID_NODE_TYPES.has(opts.nodeType)) {
      matchClause = `MATCH (start:${opts.nodeType})`;
    }
    if (opts.search) {
      conditions.push(
        "start.canonical_name CONTAINS $search OR start.name CONTAINS $search",
      );
      params.search = opts.search;
    }

    // If no filters, match high-connectivity nodes
    if (!opts.state && !opts.nodeType && !opts.search) {
      conditions.push("NOT start:Alias AND NOT start:Community");
    } else if (conditions.length === 0) {
      conditions.push("NOT start:Alias AND NOT start:Community");
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    try {
      // Get subgraph nodes
      const result = await this.neo4j.executeRead(
        `${matchClause} ${whereClause}
         WITH start LIMIT $limit
         OPTIONAL MATCH path = (start)-[*1..${depth}]-(connected)
         WHERE NOT connected:Alias AND NOT connected:Community
         WITH collect(DISTINCT start) + collect(DISTINCT connected) AS allNodes
         UNWIND allNodes AS n
         WITH DISTINCT n
         OPTIONAL MATCH (n)-[r]-()
         WITH n, count(r) AS conns
         RETURN
           elementId(n) AS id,
           labels(n) AS labels,
           properties(n) AS props,
           conns
         LIMIT $limit`,
        params,
      );

      const nodes: GraphNode[] = [];
      const nodeIds = new Set<string>();

      for (const record of result.records) {
        const id = record.get("id") as string;
        if (nodeIds.has(id)) continue;
        nodeIds.add(id);

        const labels = record.get("labels") as string[];
        const props = record.get("props") as Record<string, unknown>;
        const type =
          labels.find((l) => VALID_NODE_TYPES.has(l)) ?? labels[0] ?? "Unknown";

        nodes.push({
          id,
          name: (props.canonical_name ?? props.name ?? "Unknown") as string,
          type,
          state: props.state as string | undefined,
          position: props.position as string | undefined,
          party: props.party as string | undefined,
          source_domain: props.source_domain as string | undefined,
          amount: props.amount ? toNumber(props.amount) : undefined,
          connectionCount: toNumber(record.get("conns")),
        });
      }

      // Get edges between the collected nodes
      const edgeResult = await this.neo4j.executeRead(
        `UNWIND $nodeIds AS nid
         MATCH (a)-[r]-(b)
         WHERE elementId(a) = nid AND elementId(b) IN $nodeIds
         RETURN DISTINCT
           elementId(r) AS id,
           elementId(startNode(r)) AS source,
           elementId(endNode(r)) AS target,
           type(r) AS relType,
           properties(r) AS relProps`,
        { nodeIds: [...nodeIds] },
      );

      const edges: GraphEdge[] = [];
      const edgeIds = new Set<string>();

      for (const record of edgeResult.records) {
        const id = record.get("id") as string;
        if (edgeIds.has(id)) continue;
        edgeIds.add(id);

        const relProps = record.get("relProps") as Record<string, unknown>;
        edges.push({
          id,
          source: record.get("source") as string,
          target: record.get("target") as string,
          type: record.get("relType") as string,
          amount: relProps.amount ? toNumber(relProps.amount) : undefined,
          source_chunk_id: relProps.source_chunk_id as string | undefined,
        });
      }

      // Get total count for "showing N of M"
      const totalResult = await this.neo4j.executeRead(
        `MATCH (n) WHERE NOT n:Alias AND NOT n:Community RETURN count(n) AS total`,
      );
      const total = toNumber(totalResult.records[0]?.get("total") ?? 0);

      const subGraph: SubGraphResult = {
        nodes,
        edges,
        meta: { total, showing: nodes.length },
      };

      // Only cache non-empty results to avoid caching during backfill ramp-up
      if (nodes.length > 0) {
        await exploreCache.set(cacheKey, subGraph, CACHE_TTL);
      }
      return subGraph;
    } catch (error) {
      this.logger.error(
        `getSubGraph failed: ${error instanceof Error ? error.message : error}`,
      );
      return { nodes: [], edges: [], meta: { total: 0, showing: 0 } };
    }
  }

  async getNodeDetail(nodeId: string): Promise<NodeDetail | null> {
    if (!this.neo4j.enabled) return null;

    try {
      const result = await this.neo4j.executeRead(
        `MATCH (n) WHERE elementId(n) = $nodeId
         OPTIONAL MATCH (n)-[r]-()
         WITH n, count(r) AS conns
         RETURN labels(n) AS labels, properties(n) AS props, conns, elementId(n) AS id`,
        { nodeId },
      );

      if (result.records.length === 0) return null;

      const record = result.records[0];
      const labels = record.get("labels") as string[];
      const props = record.get("props") as Record<string, unknown>;
      const type =
        labels.find((l) => VALID_NODE_TYPES.has(l)) ?? labels[0] ?? "Unknown";

      // Get 1-hop connections
      const connResult = await this.neo4j.executeRead(
        `MATCH (n)-[r]-(connected)
         WHERE elementId(n) = $nodeId AND NOT connected:Alias AND NOT connected:Community
         OPTIONAL MATCH (connected)-[cr]-()
         WITH n, r, connected, count(cr) AS cConns
         RETURN
           elementId(connected) AS cId,
           labels(connected) AS cLabels,
           properties(connected) AS cProps,
           cConns,
           type(r) AS relType,
           CASE WHEN startNode(r) = n THEN 'out' ELSE 'in' END AS direction
         LIMIT 50`,
        { nodeId },
      );

      const connections: NodeDetail["connections"] = [];
      for (const cr of connResult.records) {
        const cLabels = cr.get("cLabels") as string[];
        const cProps = cr.get("cProps") as Record<string, unknown>;
        const cType =
          cLabels.find((l) => VALID_NODE_TYPES.has(l)) ?? cLabels[0] ?? "Unknown";

        connections.push({
          node: {
            id: cr.get("cId") as string,
            name: (cProps.canonical_name ?? cProps.name ?? "Unknown") as string,
            type: cType,
            state: cProps.state as string | undefined,
            position: cProps.position as string | undefined,
            connectionCount: toNumber(cr.get("cConns")),
          },
          relationship: cr.get("relType") as string,
          direction: cr.get("direction") as "in" | "out",
        });
      }

      // Clean props for response
      const cleanProps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (k === "created_at" || k === "updated_at" || k === "communityId")
          continue;
        cleanProps[k] =
          typeof v === "object" && v !== null && "toNumber" in (v as any)
            ? (v as any).toNumber()
            : v;
      }

      return {
        id: nodeId,
        name: (props.canonical_name ?? props.name ?? "Unknown") as string,
        type,
        state: props.state as string | undefined,
        position: props.position as string | undefined,
        party: props.party as string | undefined,
        source_domain: props.source_domain as string | undefined,
        amount: props.amount ? toNumber(props.amount) : undefined,
        connectionCount: toNumber(record.get("conns")),
        properties: cleanProps,
        connections,
      };
    } catch (error) {
      this.logger.error(
        `getNodeDetail failed: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  async getStats(): Promise<GraphStats> {
    if (!this.neo4j.enabled) {
      return {
        totalNodes: 0,
        totalEdges: 0,
        nodesByType: {},
        edgesByType: {},
        communities: 0,
      };
    }

    const cacheKey = "stats";
    const cached = await exploreCache.get<GraphStats>(cacheKey);
    if (cached) return cached;

    try {
      const nodeResult = await this.neo4j.executeRead(
        `MATCH (n) WHERE NOT n:Alias AND NOT n:Community
         WITH labels(n)[0] AS label, count(n) AS cnt
         RETURN label, cnt`,
      );
      const nodesByType: Record<string, number> = {};
      let totalNodes = 0;
      for (const r of nodeResult.records) {
        const label = r.get("label") as string;
        const cnt = toNumber(r.get("cnt"));
        nodesByType[label] = cnt;
        totalNodes += cnt;
      }

      const edgeResult = await this.neo4j.executeRead(
        `MATCH ()-[r]->()
         WITH type(r) AS t, count(r) AS cnt
         RETURN t, cnt`,
      );
      const edgesByType: Record<string, number> = {};
      let totalEdges = 0;
      for (const r of edgeResult.records) {
        const t = r.get("t") as string;
        const cnt = toNumber(r.get("cnt"));
        edgesByType[t] = cnt;
        totalEdges += cnt;
      }

      const commResult = await this.neo4j.executeRead(
        `MATCH (c:Community) RETURN count(c) AS cnt`,
      );
      const communities = toNumber(commResult.records[0]?.get("cnt") ?? 0);

      const stats: GraphStats = {
        totalNodes,
        totalEdges,
        nodesByType,
        edgesByType,
        communities,
      };

      if (totalNodes > 0) {
        await exploreCache.set(cacheKey, stats, CACHE_TTL);
      }
      return stats;
    } catch (error) {
      this.logger.error(
        `getStats failed: ${error instanceof Error ? error.message : error}`,
      );
      return {
        totalNodes: 0,
        totalEdges: 0,
        nodesByType: {},
        edgesByType: {},
        communities: 0,
      };
    }
  }
}
