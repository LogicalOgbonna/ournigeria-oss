import {
  Injectable,
  Optional,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

export const PRISMA_POOL_OPTIONS = Symbol('PRISMA_POOL_OPTIONS');

export type PrismaPoolOptions = Omit<pg.PoolConfig, 'connectionString'>;

const DEFAULT_POOL_OPTIONS: PrismaPoolOptions = {
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: pg.Pool;

  constructor(
    @Optional()
    @Inject(PRISMA_POOL_OPTIONS)
    poolOptions?: PrismaPoolOptions,
  ) {
    const merged = { ...DEFAULT_POOL_OPTIONS, ...poolOptions };
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL!,
      ...merged,
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
