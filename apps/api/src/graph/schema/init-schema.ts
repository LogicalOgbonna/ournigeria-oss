import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Neo4jService } from "../neo4j.service";

const CONSTRAINTS = [
  'CREATE CONSTRAINT state_name IF NOT EXISTS FOR (s:State) REQUIRE s.name IS UNIQUE',
  'CREATE CONSTRAINT official_canonical IF NOT EXISTS FOR (o:Official) REQUIRE o.canonical_name IS UNIQUE',
  'CREATE CONSTRAINT mda_canonical IF NOT EXISTS FOR (m:MDA) REQUIRE m.canonical_name IS UNIQUE',
  'CREATE CONSTRAINT contractor_canonical IF NOT EXISTS FOR (c:Contractor) REQUIRE c.canonical_name IS UNIQUE',
  'CREATE CONSTRAINT corruption_case_key IF NOT EXISTS FOR (c:CorruptionCase) REQUIRE c.case_key IS UNIQUE',
];

const INDEXES = [
  'CREATE INDEX official_state IF NOT EXISTS FOR (o:Official) ON (o.state)',
  'CREATE INDEX budget_state_year IF NOT EXISTS FOR (b:BudgetItem) ON (b.state, b.year)',
  'CREATE INDEX payment_year IF NOT EXISTS FOR (p:Payment) ON (p.year)',
  'CREATE INDEX faac_state_year IF NOT EXISTS FOR (f:FAACAllocation) ON (f.state, f.year)',
  'CREATE INDEX corruption_status IF NOT EXISTS FOR (c:CorruptionCase) ON (c.status)',
];

const FULLTEXT_INDEX = `
  CREATE FULLTEXT INDEX entity_names IF NOT EXISTS
  FOR (n:Official|MDA|Contractor|State) ON EACH [n.name, n.canonical_name]
`.trim();

@Injectable()
export class GraphSchemaService implements OnModuleInit {
  private readonly logger = new Logger(GraphSchemaService.name);

  constructor(private neo4j: Neo4jService) {}

  async onModuleInit() {
    if (!this.neo4j.enabled) {
      this.logger.log("Neo4j disabled — skipping graph schema initialization");
      return;
    }

    await this.initSchema();
  }

  async initSchema(): Promise<void> {
    this.logger.log("Initializing Neo4j graph schema...");

    for (const cypher of CONSTRAINTS) {
      try {
        await this.neo4j.executeWrite(cypher);
      } catch (error) {
        this.logger.error(
          `Failed to create constraint: ${error instanceof Error ? error.message : error}`,
        );
        throw error;
      }
    }
    this.logger.log(`Created ${CONSTRAINTS.length} uniqueness constraints`);

    for (const cypher of INDEXES) {
      try {
        await this.neo4j.executeWrite(cypher);
      } catch (error) {
        this.logger.error(
          `Failed to create index: ${error instanceof Error ? error.message : error}`,
        );
        throw error;
      }
    }
    this.logger.log(`Created ${INDEXES.length} performance indexes`);

    try {
      await this.neo4j.executeWrite(FULLTEXT_INDEX);
      this.logger.log("Created fulltext index entity_names");
    } catch (error) {
      this.logger.error(
        `Failed to create fulltext index: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }

    this.logger.log("Neo4j graph schema initialization complete");
  }

  async isFulltextIndexOnline(): Promise<boolean> {
    if (!this.neo4j.enabled) return false;

    try {
      const result = await this.neo4j.executeRead(
        `SHOW INDEXES WHERE name = 'entity_names' AND state = 'ONLINE'`,
      );
      return result.records.length > 0;
    } catch {
      return false;
    }
  }
}
