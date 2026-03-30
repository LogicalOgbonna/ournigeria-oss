import { Pool } from "pg";

let _sharedPool: Pool | null = null;

export function getSharedPool(): Pool {
  _sharedPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });
  return _sharedPool;
}

export async function closeSharedPool(): Promise<void> {
  if (_sharedPool) {
    await _sharedPool.end();
    _sharedPool = null;
  }
}
