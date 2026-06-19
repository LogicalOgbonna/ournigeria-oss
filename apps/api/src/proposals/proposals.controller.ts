import { Controller, Get, Post, Patch, Param, Query, Body, Req, Res, HttpStatus, UseGuards } from "@nestjs/common";
import { Request, Response } from "express";
import { Public } from "../auth/decorators/public";
import { AdminGuard } from "../admin/admin.guard";
import { ProposalsService } from "./proposals.service";

@Controller("proposals")
export class ProposalsController {
  constructor(private service: ProposalsService) {}

  @Public()
  @Post()
  async create(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const { userId, phone } = await this.resolveProposer(req);
      const { officialId, positionId, targetField, proposedValue, sourceUrl } = body;
      if (!officialId || !targetField || proposedValue === undefined) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: "officialId, targetField, and proposedValue are required",
        });
      }
      const result = await this.service.create({
        officialId,
        positionId,
        proposerPhone: userId ? phone : null,
        proposerIp: userId ? null : this.clientIp(req),
        trust: userId ? "verified" : "anonymous",
        targetField,
        proposedValue,
        sourceUrl,
      });
      return res.status(HttpStatus.CREATED).json(result);
    } catch (err: any) {
      if (err.status === 403) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({ error: err.message });
      }
      if (err.status === 400 || err.status === 404) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("proposal create error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Post("identify")
  async identify(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    try {
      const { userId, phone } = await this.resolveProposer(req);
      const {
        name,
        role,
        imageUrl,
        partyAcronym,
        email,
        phoneNumber,
        officeAddress,
        twitterHandle,
        facebookUrl,
        gender,
        education,
        biography,
        dateOfBirth,
        sourceUrl,
        stateCode,
        lgaCode,
        wardCode,
        constituencyCode,
      } = body;

      if (!name || !role) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: "name and role are required",
        });
      }

      const result = await this.service.identify({
        proposerPhone: userId ? phone : null,
        proposerIp: userId ? null : this.clientIp(req),
        trust: userId ? "verified" : "anonymous",
        name,
        role,
        imageUrl,
        partyAcronym,
        email,
        phoneNumber,
        officeAddress,
        twitterHandle,
        facebookUrl,
        gender,
        education,
        biography,
        dateOfBirth,
        sourceUrl,
        stateCode,
        lgaCode,
        wardCode,
        constituencyCode,
      });

      return res.status(HttpStatus.CREATED).json(result);
    } catch (err: any) {
      if (err.status === 403) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({ error: err.message });
      }
      if (err.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("identify error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Post(":id/claim")
  async claim(@Param("id") id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req as any).userId;
      const result = await this.service.claim(id, userId);
      return res.status(HttpStatus.OK).json(result);
    } catch (err: any) {
      if (err.status === 400 || err.status === 404) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("proposal claim error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Post(":id/vote")
  async vote(
    @Param("id") id: string,
    @Body() body: { direction: number },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const identifier = await this.getVoterIdentifier(req);

      const result = await this.service.vote(id, identifier, body.direction);
      return res.json(result);
    } catch (err: any) {
      if (err.status === 403) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({ error: err.message });
      }
      if (err.status === 400 || err.status === 404) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("vote error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get()
  async list(
    @Query("officialId") officialId: string | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Res() res: Response,
  ) {
    try {
      if (!officialId) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "officialId is required" });
      }
      const result = await this.service.listByOfficial(
        officialId,
        page ? parseInt(page, 10) : 1,
        limit ? Math.min(parseInt(limit, 10), 50) : 20,
      );
      return res.json(result);
    } catch (err) {
      console.error("proposals list error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @Get(":id")
  async getById(@Param("id") id: string, @Res() res: Response) {
    try {
      const result = await this.service.getById(id);
      return res.json(result);
    } catch (err: any) {
      if (err.status === 404) {
        return res.status(HttpStatus.NOT_FOUND).json({ error: "Proposal not found" });
      }
      console.error("proposal get error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  // Admin endpoints — @Public() bypasses global user AuthGuard; AdminGuard handles admin auth
  @Public()
  @UseGuards(AdminGuard)
  @Get("admin/queue")
  async adminQueue(
    @Query("status") status: string | undefined,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const result = await this.service.listPending({
        status: status || "submitted",
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? Math.min(parseInt(limit, 10), 50) : 20,
      });
      return res.json(result);
    } catch (err) {
      console.error("admin queue error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @UseGuards(AdminGuard)
  @Patch("admin/:id")
  async adminAction(
    @Param("id") id: string,
    @Body() body: { action: "approve" | "reject" | "needs_evidence" },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const adminId = (req as any).adminId;
      let result;
      if (body.action === "approve") {
        result = await this.service.approve(id, adminId);
      } else if (body.action === "reject") {
        result = await this.service.reject(id, adminId);
      } else if (body.action === "needs_evidence") {
        await this.prismaUpdateStatus(id, "needs_evidence", adminId);
        result = { status: "needs_evidence" };
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "Invalid action" });
      }
      return res.json(result);
    } catch (err: any) {
      if (err.status === 400 || err.status === 404) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("admin action error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  @Public()
  @UseGuards(AdminGuard)
  @Post("admin/bulk")
  async adminBulk(
    @Body() body: { ids: string[]; action: "approve" | "reject" },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const adminId = (req as any).adminId;
      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "ids array is required" });
      }
      if (body.ids.length > 50) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: "Maximum 50 proposals per bulk action" });
      }
      const result = await this.service.bulkAction(body.ids, body.action, adminId);
      return res.json(result);
    } catch (err: any) {
      if (err.status === 400) {
        return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
      }
      console.error("admin bulk error:", err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    }
  }

  private readonly UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /** Resolve { userId, phone } from the nb_uid cookie, or nulls if not logged in. */
  private async resolveProposer(req: Request): Promise<{ userId: string | null; phone: string | null }> {
    const cookieId = (req as any).cookies?.["nb_uid"];
    if (!cookieId || !this.UUID_RE.test(cookieId)) return { userId: null, phone: null };
    const prisma = (this.service as any).prisma;
    const user = await prisma.user.findUnique({
      where: { id: cookieId },
      select: { phoneNumber: true, banned: true },
    });
    if (!user || user.banned) return { userId: null, phone: null };
    return { userId: cookieId, phone: user.phoneNumber || `user:${cookieId}` };
  }

  /** Client IP from the trusted proxy chain (Express `trust proxy` is configured in main.ts). */
  private clientIp(req: Request): string | null {
    return req.ip || null;
  }

  private async getUserIdentifier(req: Request): Promise<string> {
    const userId = (req as any).userId;
    if (!userId) throw new Error("Not authenticated");
    const prisma = (this.service as any).prisma;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true },
    });
    // Use phone if available, otherwise fall back to userId for rate limiting
    return user?.phoneNumber || `user:${userId}`;
  }

  private async getVoterIdentifier(req: Request): Promise<string> {
    const userId = (req as any).userId;
    if (userId) {
      const prisma = (this.service as any).prisma;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phoneNumber: true },
      });
      if (user?.phoneNumber) return user.phoneNumber;
      return `user:${userId}`;
    }
    // Anonymous: use IP address
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || "unknown";
    return `ip:${ip}`;
  }

  private async prismaUpdateStatus(proposalId: string, status: string, adminId: string) {
    const prisma = (this.service as any).prisma;
    await prisma.dataProposal.update({
      where: { id: proposalId },
      data: { status, reviewedAt: new Date(), reviewedBy: adminId },
    });
  }
}
