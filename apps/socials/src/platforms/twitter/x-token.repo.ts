import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

const SINGLETON_ID = 1;

export interface XTokenPair {
  accessToken: string;
  refreshToken: string;
  username: string | null;
  rotatedAt: Date;
}

@Injectable()
export class XTokenRepo {
  constructor(private readonly prisma: PrismaService) {}

  async load(): Promise<XTokenPair | null> {
    const row = await this.prisma.socialsXOauthTokens.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (!row) return null;
    return {
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      username: row.username,
      rotatedAt: row.rotatedAt,
    };
  }

  async save(input: {
    accessToken: string;
    refreshToken: string;
    /** X handle of the connected account; omit to leave the existing value untouched. */
    username?: string;
  }): Promise<XTokenPair> {
    const now = new Date();
    const row = await this.prisma.socialsXOauthTokens.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        username: input.username ?? null,
        rotatedAt: now,
      },
      update: {
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        // Only overwrite username when explicitly provided (token refreshes
        // don't know the handle and must not wipe it).
        ...(input.username !== undefined ? { username: input.username } : {}),
        rotatedAt: now,
      },
    });
    return {
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      username: row.username,
      rotatedAt: row.rotatedAt,
    };
  }

  async clear(): Promise<void> {
    await this.prisma.socialsXOauthTokens.deleteMany({
      where: { id: SINGLETON_ID },
    });
  }
}
