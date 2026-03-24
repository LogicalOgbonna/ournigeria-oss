import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import neo4j, { Driver, Session, Result } from "neo4j-driver";
import CircuitBreaker from "opossum";
import type { EnvConfig } from "../config/env.validation";

export interface Neo4jHealthStatus {
  status: "ok" | "down" | "disabled";
  latency: number;
}

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private driver: Driver | null = null;
  private readBreaker!: CircuitBreaker<[string, Record<string, unknown>?], Result>;
  private writeBreaker!: CircuitBreaker<[string, Record<string, unknown>?], Result>;

  constructor(private readonly config: ConfigService<EnvConfig>) {}

  get enabled(): boolean {
    return !!this.driver && !!this.readBreaker && !!this.writeBreaker;
  }

  async onModuleInit() {
    const uri = this.config.get("NEO4J_URI");
    const user = this.config.get("NEO4J_USER");
    const password = this.config.get("NEO4J_PASSWORD");

    if (!uri || !user || !password) {
      this.logger.warn(
        "Neo4j env vars not set (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD) — graph features disabled",
      );
      return;
    }

    try {
      this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        maxConnectionPoolSize: 100,
        connectionAcquisitionTimeout: 5_000,
        connectionTimeout: 5_000,
      });

      await this.driver.verifyConnectivity();
      this.logger.log(`Connected to Neo4j at ${uri}`);
    } catch (error) {
      this.logger.error(
        `Failed to connect to Neo4j at ${uri}: ${error instanceof Error ? error.message : error}`,
      );
      this.driver = null;
      return;
    }

    const breakerOptions = {
      timeout: 10_000,
      errorThresholdPercentage: 50,
      resetTimeout: 30_000,
      rollingCountTimeout: 60_000,
      volumeThreshold: 5,
    };

    this.readBreaker = new CircuitBreaker(
      (cypher: string, params?: Record<string, unknown>) =>
        this.rawRead(cypher, params),
      breakerOptions,
    );

    this.writeBreaker = new CircuitBreaker(
      (cypher: string, params?: Record<string, unknown>) =>
        this.rawWrite(cypher, params),
      breakerOptions,
    );

    this.readBreaker.on("open", () =>
      this.logger.warn("Neo4j read circuit breaker OPEN — queries will short-circuit"),
    );
    this.readBreaker.on("halfOpen", () =>
      this.logger.log("Neo4j read circuit breaker HALF-OPEN — probing"),
    );
    this.readBreaker.on("close", () =>
      this.logger.log("Neo4j read circuit breaker CLOSED — recovered"),
    );

    this.writeBreaker.on("open", () =>
      this.logger.warn("Neo4j write circuit breaker OPEN — writes will short-circuit"),
    );
    this.writeBreaker.on("halfOpen", () =>
      this.logger.log("Neo4j write circuit breaker HALF-OPEN — probing"),
    );
    this.writeBreaker.on("close", () =>
      this.logger.log("Neo4j write circuit breaker CLOSED — recovered"),
    );
  }

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
      this.logger.log("Neo4j driver closed");
    }
  }

  async executeRead(
    cypher: string,
    params?: Record<string, unknown>,
  ): Promise<Result> {
    if (!this.driver || !this.readBreaker) {
      throw new Error("Neo4j is not connected");
    }
    return this.readBreaker.fire(cypher, params);
  }

  async executeWrite(
    cypher: string,
    params?: Record<string, unknown>,
  ): Promise<Result> {
    if (!this.driver || !this.writeBreaker) {
      throw new Error("Neo4j is not connected");
    }
    return this.writeBreaker.fire(cypher, params);
  }

  async healthCheck(): Promise<Neo4jHealthStatus> {
    if (!this.driver) {
      return { status: "disabled", latency: -1 };
    }

    const t0 = Date.now();
    let session: Session | null = null;
    try {
      session = this.driver.session({ defaultAccessMode: neo4j.session.READ });
      await session.run("RETURN 1");
      return { status: "ok", latency: Date.now() - t0 };
    } catch {
      return { status: "down", latency: Date.now() - t0 };
    } finally {
      if (session) {
        await session.close();
      }
    }
  }

  private async rawRead(
    cypher: string,
    params?: Record<string, unknown>,
  ): Promise<Result> {
    const session = this.driver!.session({
      defaultAccessMode: neo4j.session.READ,
    });
    try {
      return await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }

  private async rawWrite(
    cypher: string,
    params?: Record<string, unknown>,
  ): Promise<Result> {
    const session = this.driver!.session({
      defaultAccessMode: neo4j.session.WRITE,
    });
    try {
      return await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }
}
