import { z } from "zod";
import { cache as cacheManager } from "@ournigeria/cache";
import { getSettingBool } from "./settings-store";
import { extractStateName } from "./rag/query-analysis";

let _neo4jService: any = null;

export function setNeo4jServiceForTools(service: any) {
  _neo4jService = service;
}

function getNeo4j() {
  return _neo4jService;
}

const graphCache = cacheManager.namespace("graph:search");
const GRAPH_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const graphSearchInputSchema = z.object({
  query: z
    .string()
    .describe("The search query about relationships or connections"),
  entityName: z
    .string()
    .nullable()
    .optional()
    .describe("Specific entity name to start traversal from"),
  entityType: z
    .enum(["Official", "State", "MDA", "Contractor"])
    .nullable()
    .optional()
    .describe("Type of the starting entity"),
  maxDepth: z
    .number()
    .min(1)
    .max(4)
    .optional()
    .default(2)
    .describe("Maximum traversal depth (1-4)"),
});

export const graphSearchOutputSchema = z.object({
  entities: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      properties: z.record(z.unknown()).optional(),
    }),
  ),
  relationships: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      type: z.string(),
      properties: z.record(z.unknown()).optional(),
    }),
  ),
  summary: z.string(),
});

export async function executeGraphSearch(input: z.infer<typeof graphSearchInputSchema>) {
  const { query, entityName, entityType, maxDepth } = input;
  const empty = { entities: [], relationships: [], summary: "No graph results found." };

  // Guard: check if graph is enabled
  if (!getSettingBool("graph.enabled", "GRAPH_ENABLED", true)) {
    return empty;
  }

  const neo4j = getNeo4j();
  if (!neo4j || !neo4j.enabled) {
    return empty;
  }

  // Cache check
  const cacheKey = `${query}:${entityName ?? ""}:${entityType ?? ""}:${maxDepth}`;
  const cached = await graphCache.get<typeof empty>(cacheKey);
  if (cached) return cached;

  try {
    let result;
    const depth = maxDepth ?? 2;

    if (entityName && entityType) {
      result = await traverseFromEntity(neo4j, entityName, entityType, depth);
    } else {
      result = await searchByQuery(neo4j, query, depth);
    }

    await graphCache.set(cacheKey, result, GRAPH_CACHE_TTL);
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ...empty, summary: `Graph search error: ${msg}` };
  }
}

async function traverseFromEntity(
  neo4j: any,
  entityName: string,
  entityType: string,
  maxDepth: number,
) {
  // Validate entityType to prevent Cypher injection via label
  const validTypes = ["Official", "State", "MDA", "Contractor", "BudgetItem", "Payment", "FAACAllocation", "CorruptionCase"];
  if (!validTypes.includes(entityType)) {
    return { entities: [], relationships: [], summary: `Invalid entity type: ${entityType}` };
  }

  const nodeResult = await neo4j.executeRead(
    `MATCH path = (start:${entityType} {canonical_name: $name})-[*1..${Math.min(maxDepth, 4)}]-(connected)
     WITH DISTINCT connected
     RETURN labels(connected) AS labels, properties(connected) AS props
     LIMIT 50`,
    { name: entityName },
  );

  return formatGraphResult(neo4j, nodeResult, entityName, entityType);
}

async function searchByQuery(neo4j: any, query: string, maxDepth: number) {
  // Try state extraction first
  const state = extractStateName(query);

  // Try fulltext search for entity names
  const ftResult = await neo4j.executeRead(
    `CALL db.index.fulltext.queryNodes('entity_names', $query)
     YIELD node, score
     WHERE score > 0.5
     RETURN elementId(node) AS id, labels(node) AS labels, node.canonical_name AS name, score
     ORDER BY score DESC LIMIT 5`,
    { query },
  );

  if (ftResult.records.length > 0) {
    const topEntity = ftResult.records[0];
    const entityName = topEntity.get("name") as string;
    const labels = topEntity.get("labels") as string[];
    const entityType = labels.find((l: string) =>
      ["Official", "State", "MDA", "Contractor"].includes(l),
    ) ?? labels[0];

    return traverseFromEntity(neo4j, entityName, entityType, maxDepth);
  }

  if (state) {
    return traverseFromEntity(neo4j, state, "State", maxDepth);
  }

  return { entities: [], relationships: [], summary: "No matching entities found in graph." };
}

async function formatGraphResult(
  neo4j: any,
  nodeResult: any,
  startName: string,
  startType: string,
) {
  const validTypes = ["Official", "State", "MDA", "Contractor", "BudgetItem", "Payment", "FAACAllocation", "CorruptionCase"];
  if (!validTypes.includes(startType)) {
    return { entities: [], relationships: [], summary: `Invalid entity type: ${startType}` };
  }

  // Get connected relationships
  const relResult = await neo4j.executeRead(
    `MATCH (start:${startType} {canonical_name: $name})-[r]-(connected)
     RETURN type(r) AS relType,
            properties(r) AS relProps,
            CASE WHEN startNode(r) = start THEN start.canonical_name ELSE coalesce(connected.canonical_name, connected.name, 'unknown') END AS fromName,
            CASE WHEN startNode(r) = start THEN coalesce(connected.canonical_name, connected.name, 'unknown') ELSE start.canonical_name END AS toName
     LIMIT 100`,
    { name: startName },
  );

  const entities: Array<{ name: string; type: string; properties?: Record<string, unknown> }> = [];
  const seen = new Set<string>();

  for (const record of nodeResult.records) {
    const labels = record.get("labels") as string[];
    const props = record.get("props") as Record<string, unknown>;
    const name = (props.canonical_name ?? props.name ?? "unknown") as string;
    const type = labels.find((l: string) => validTypes.includes(l)) ?? labels[0];

    if (!seen.has(name)) {
      seen.add(name);
      entities.push({ name, type, properties: cleanProps(props) });
    }
  }

  const relationships: Array<{
    from: string;
    to: string;
    type: string;
    properties?: Record<string, unknown>;
  }> = [];

  for (const record of relResult.records) {
    relationships.push({
      from: record.get("fromName") as string,
      to: record.get("toName") as string,
      type: record.get("relType") as string,
      properties: cleanProps(record.get("relProps") as Record<string, unknown>),
    });
  }

  const summary = `Found ${entities.length} connected entities and ${relationships.length} relationships for ${startType} "${startName}".`;

  return { entities, relationships, summary };
}

function cleanProps(props: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (k === "created_at" || k === "updated_at") continue;
    if (v !== null && v !== undefined) {
      clean[k] = typeof v === "object" && v !== null && "toNumber" in (v as any)
        ? (v as any).toNumber()
        : v;
    }
  }
  return clean;
}
