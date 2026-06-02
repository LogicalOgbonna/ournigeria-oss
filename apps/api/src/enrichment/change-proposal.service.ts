import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

@Injectable()
export class ChangeProposalService {
  constructor(private readonly prisma: PrismaService) {}

  listByStatus(status: string) {
    return this.prisma.changeProposal.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      include: { sources: true },
    });
  }

  getWithSources(id: string) {
    return this.prisma.changeProposal.findUnique({
      where: { id },
      include: { sources: true },
    });
  }
}
