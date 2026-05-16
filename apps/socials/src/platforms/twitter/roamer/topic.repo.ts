import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import type { Prisma, SocialsTopic } from "@prisma/client";

@Injectable()
export class TopicRepo {
  constructor(private readonly prisma: PrismaService) {}

  list(filter?: { enabled?: boolean }) {
    return this.prisma.socialsTopic.findMany({
      where: filter,
      orderBy: { name: "asc" },
    });
  }

  get(id: string) {
    return this.prisma.socialsTopic.findUnique({ where: { id } });
  }

  getByName(name: string) {
    return this.prisma.socialsTopic.findUnique({ where: { name } });
  }

  create(data: Prisma.SocialsTopicCreateInput) {
    return this.prisma.socialsTopic.create({ data });
  }

  update(id: string, data: Prisma.SocialsTopicUpdateInput) {
    return this.prisma.socialsTopic.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.socialsTopic.delete({ where: { id } });
  }

  /** Pick the next topic to roam: enabled, longest time since last_run_at. */
  pickStale(): Promise<SocialsTopic | null> {
    return this.prisma.socialsTopic.findFirst({
      where: { enabled: true },
      orderBy: [{ lastRunAt: { sort: "asc", nulls: "first" } }],
    });
  }

  markRan(id: string, cursor: string | null) {
    return this.prisma.socialsTopic.update({
      where: { id },
      data: { lastRunAt: new Date(), cursor },
    });
  }

  enabledCount(): Promise<number> {
    return this.prisma.socialsTopic.count({ where: { enabled: true } });
  }
}
