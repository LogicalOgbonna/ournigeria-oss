import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getSettingBool } from "../../config/settings-store";

let _neo4jService: any = null;

export function setNeo4jServiceForTraversal(service: any) {
  _neo4jService = service;
}

function getNeo4j() {
  return _neo4jService;
}

const MUTATION_PATTERN =
  /\b(DELETE|CREATE|SET|REMOVE|MERGE|DROP|DETACH|CALL\s+\{)\b/i;

const QUERY_TIMEOUT = 5_000;

export const traverseGraphTool = createTool({
  id: "traverse-graph",
  description: `Execute a read-only Cypher query against the knowledge graph for complex relationship queries.
Use parameterized queries with $variables. Available node types: Official, State, MDA, Contractor, BudgetItem, Payment, FAACAllocation, CorruptionCase, Alias.
Relationship types: GOVERNED, CHARGED_IN, ALLOCATED, RECEIVED_PAYMENT, RECEIVED_FAAC, CONNECTED_TO, HEADED, CO_ACCUSED, PAID_TO, ALSO_KNOWN_AS.

Example queries:
- Find officials connected to a contractor: MATCH (o:Official)-[:CONNECTED_TO]->(c:Contractor {canonical_name: $name}) RETURN o
- Payment chains: MATCH path = (s:State {name: $state})<-[:GOVERNED]-(o:Official)-[:CONNECTED_TO]->(c:Contractor) RETURN path
- Entities within N hops: MATCH path = (o:Official {canonical_name: $name})-[*1..3]-(connected) RETURN path LIMIT 50
- Compare states: MATCH (o:Official)-[:GOVERNED]->(s:State) WHERE s.name IN [$state1, $state2] OPTIONAL MATCH (o)-[:CHARGED_IN]->(c:CorruptionCase) RETURN s.name, o.name, c.status`,
  inputSchema: z.object({
    cypher: z
      .string()
      .describe("Parameterized Cypher query (read-only). Use $variables for all user-derived values."),
    params: z
      .record(z.unknown())
      .optional()
      .describe("Query parameters (e.g., { name: 'Yahaya Bello', state: 'Kogi' })"),
  }),
  outputSchema: z.object({
    results: z.array(z.record(z.unknown())),
    nodeCount: z.number(),
    relationshipCount: z.number(),
    error: z.string().optional(),
  }),
  execute: async ({ cypher: rawCypher, params: queryParams }) => {
    const empty = { results: [], nodeCount: 0, relationshipCount: 0 };

    if (!getSettingBool("graph.enabled", "GRAPH_ENABLED", true)) {
      return { ...empty, error: "Graph features are disabled" };
    }

    const neo4j = getNeo4j();
    if (!neo4j || !neo4j.enabled) {
      return { ...empty, error: "Neo4j is not connected" };
    }

    // Reject mutation queries
    if (MUTATION_PATTERN.test(rawCypher)) {
      return {
        ...empty,
        error:
          "Mutation queries (DELETE, CREATE, SET, REMOVE, MERGE, DROP) are not allowed. Use read-only queries.",
      };
    }

    // Append LIMIT if not present
    let cypher = rawCypher.trim();
    if (!/\bLIMIT\b/i.test(cypher)) {
      cypher += " LIMIT 100";
    }

    console.log(
      `[traverseGraphTool] Executing Cypher: ${cypher} | Params: ${JSON.stringify(queryParams ?? {})}`,
    );

    try {
      const result = await Promise.race([
        neo4j.executeRead(cypher, queryParams ?? {}),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Query timed out (5s limit)")), QUERY_TIMEOUT),
        ),
      ]);

      const results: Record<string, unknown>[] = [];
      let nodeCount = 0;
      let relationshipCount = 0;

      for (const record of result.records) {
        const row: Record<string, unknown> = {};
        for (const key of record.keys) {
          const val = record.get(key);
          row[key] = serializeValue(val);
        }
        results.push(row);
      }

      // Count from summary if available
      const counters = result.summary?.counters?.updates?.();
      if (counters) {
        nodeCount = counters.nodesCreated + counters.nodesDeleted;
        relationshipCount =
          counters.relationshipsCreated + counters.relationshipsDeleted;
      }

      // Estimate from results
      if (nodeCount === 0) {
        nodeCount = results.length;
      }

      return { results, nodeCount, relationshipCount };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[traverseGraphTool] Error: ${msg}`);
      return { ...empty, error: msg };
    }
  },
});

function serializeValue(val: unknown): unknown {
  if (val === null || val === undefined) return null;

  // Neo4j Integer
  if (typeof val === "object" && val !== null && "toNumber" in (val as any)) {
    return (val as any).toNumber();
  }

  // Neo4j Node
  if (typeof val === "object" && val !== null && "labels" in (val as any) && "properties" in (val as any)) {
    const node = val as any;
    return {
      _type: "node",
      labels: node.labels,
      properties: serializeProperties(node.properties),
    };
  }

  // Neo4j Relationship
  if (typeof val === "object" && val !== null && "type" in (val as any) && "properties" in (val as any) && "start" in (val as any)) {
    const rel = val as any;
    return {
      _type: "relationship",
      type: rel.type,
      properties: serializeProperties(rel.properties),
    };
  }

  // Neo4j Path
  if (typeof val === "object" && val !== null && "segments" in (val as any)) {
    const path = val as any;
    return {
      _type: "path",
      segments: path.segments?.map((s: any) => ({
        start: serializeValue(s.start),
        relationship: serializeValue(s.relationship),
        end: serializeValue(s.end),
      })),
    };
  }

  // Arrays
  if (Array.isArray(val)) {
    return val.map(serializeValue);
  }

  // Plain objects
  if (typeof val === "object" && val !== null) {
    return serializeProperties(val as Record<string, unknown>);
  }

  return val;
}

function serializeProperties(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    result[k] = serializeValue(v);
  }
  return result;
}
