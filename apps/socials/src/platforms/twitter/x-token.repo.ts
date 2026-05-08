import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

const SINGLETON_ID = 1;

export interface XTokenPair {
  accessToken: string;
  refreshToken: string;
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
      rotatedAt: row.rotatedAt,
    };
  }

  async save(input: {
    accessToken: string;
    refreshToken: string;
  }): Promise<XTokenPair> {
    const now = new Date();
    const row = await this.prisma.socialsXOauthTokens.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        rotatedAt: now,
      },
      update: {
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        rotatedAt: now,
      },
    });
    return {
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      rotatedAt: row.rotatedAt,
    };
  }
}
