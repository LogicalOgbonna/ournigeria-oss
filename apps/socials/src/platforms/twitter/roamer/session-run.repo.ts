import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

@Injectable()
export class SessionRunRepo {
  constructor(private readonly prisma: PrismaService) {}

  start(sessionId: string, topicId: string) {
    return this.prisma.socialsSessionRun.create({
      data: { sessionId, topicId },
    });
  }

  finish(
    runId: string,
    data: {
      stopReason: string;
      tweetsScanned: number;
      tweetsFiltered: number;
      tweetsClassified: number;
      matchesStored: number;
      errorMessage: string | null;
    },
  ) {
    return this.prisma.socialsSessionRun.update({
      where: { id: runId },
      data: { ...data, finishedAt: new Date() },
    });
  }

  aggregateSince(since: Date) {
    return this.prisma.socialsSessionRun.aggregate({
      where: { startedAt: { gte: since } },
      _sum: {
        tweetsScanned: true,
        tweetsClassified: true,
        matchesStored: true,
      },
      _count: { _all: true },
    });
  }
}
