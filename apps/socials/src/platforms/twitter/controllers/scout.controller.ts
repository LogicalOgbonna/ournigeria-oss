import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "@ournigeria/database";
import { AdminAuthGuard } from "../guards/admin-auth.guard.js";
import { SocialsSettingsService } from "../../../config/socials-settings.service.js";
import { ScoutService } from "../scout/scout.service.js";
import { ScoutedHandleRepo } from "../scout/scouted-handle.repo.js";

const VALID_STATUSES = ["active", "rejected", "opted_out"] as const;
type HandleStatus = (typeof VALID_STATUSES)[number];

/** X screen_name rules: 1-15 chars, alphanumeric + underscore. */
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

/** Prisma "record not found" (P2025) — the only failure that maps to a 404. */
function isRecordNotFound(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "P2025"
  );
}

interface UpdateHandleBody {
  status?: string;
}

interface CreateHandleBody {
  handle?: string;
  stateCode?: string;
  lgaCode?: string;
  wardCode?: string;
  name?: string;
  bio?: string;
}

interface UpdateScoutSettingsBody {
  scout_enabled?: boolean;
  tag_handles?: boolean;
}

@ApiTags("Location Scout")
@Controller("v1/scout")
@UseGuards(AdminAuthGuard)
export class ScoutController {
  constructor(
    private readonly scout: ScoutService,
    private readonly handles: ScoutedHandleRepo,
    private readonly settings: SocialsSettingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("status")
  @ApiOperation({ summary: "Scout status: toggles, recent runs, handle counts" })
  status() {
    return this.scout.status();
  }

  @Post("run")
  @ApiOperation({
    summary:
      "Start one scout window in the background (claims the hour's window; a second call in the same UTC hour is a no-op). Poll GET /v1/scout/status for progress.",
  })
  run() {
    return this.scout.startNow();
  }

  @Get("handles")
  @ApiOperation({
    summary: "List scouted handles (filter by state/status, paginated)",
  })
  list(
    @Query("stateCode") stateCode?: string,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    // Malformed paging must be a 400, not a Prisma 500 (take: NaN).
    const parsePositive = (name: string, raw?: string): number | undefined => {
      if (raw === undefined || raw === "") return undefined;
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n) || n < 0) {
        throw new BadRequestException(`${name} must be a non-negative integer`);
      }
      return n;
    };
    return this.handles.list({
      stateCode,
      status,
      limit: parsePositive("limit", limit),
      offset: parsePositive("offset", offset),
    });
  }

  @Post("handles")
  @ApiOperation({
    summary:
      "Manually add an X account for a location (no X lookup — operator-supplied)",
  })
  async createHandle(@Body() body: CreateHandleBody) {
    const handle = (body?.handle ?? "").trim().replace(/^@/, "");
    if (!HANDLE_RE.test(handle)) {
      throw new BadRequestException(
        "handle must be 1-15 chars of letters, digits, or underscore (with or without a leading @)",
      );
    }
    const stateCode = (body?.stateCode ?? "").trim();
    const state = stateCode
      ? await this.prisma.nigerianState.findUnique({ where: { code: stateCode } })
      : null;
    if (!state) {
      throw new BadRequestException(
        `stateCode must be a valid state slug (got ${JSON.stringify(body?.stateCode)})`,
      );
    }
    let lgaCode: string | null = null;
    if (body?.lgaCode) {
      const lga = await this.prisma.nigerianLga.findUnique({
        where: { code: body.lgaCode },
      });
      if (!lga || lga.stateCode !== stateCode) {
        throw new BadRequestException(
          `lgaCode ${JSON.stringify(body.lgaCode)} is not an LGA of ${stateCode}`,
        );
      }
      lgaCode = lga.code;
    }
    let wardCode: string | null = null;
    if (body?.wardCode) {
      const ward = await this.prisma.nigerianWard.findUnique({
        where: { code: body.wardCode },
      });
      if (!ward || (lgaCode && ward.lgaCode !== lgaCode)) {
        throw new BadRequestException(
          `wardCode ${JSON.stringify(body.wardCode)} is not a ward of ${lgaCode ?? "the given LGA"}`,
        );
      }
      // No LGA supplied: derive it from the ward and verify the chain reaches
      // the given state — otherwise any ward from any state would be accepted
      // and pickForLocation's ward tier would tag a mislabelled account.
      if (!lgaCode) {
        const wardLga = await this.prisma.nigerianLga.findUnique({
          where: { code: ward.lgaCode },
        });
        if (!wardLga || wardLga.stateCode !== stateCode) {
          throw new BadRequestException(
            `wardCode ${JSON.stringify(body.wardCode)} does not belong to ${stateCode}`,
          );
        }
        lgaCode = wardLga.code;
      }
      wardCode = ward.code;
    }
    const existing = await this.handles.findByHandle(handle);
    if (existing) {
      throw new ConflictException(
        `@${existing.handle} already tracked (status: ${existing.status})`,
      );
    }
    return this.handles.createManual({
      handle,
      stateCode,
      lgaCode,
      wardCode,
      name: body?.name?.trim() || undefined,
      bio: body?.bio?.trim() || undefined,
    });
  }

  @Delete("handles/:id")
  @ApiOperation({ summary: "Remove a scouted/manual handle entirely" })
  async deleteHandle(@Param("id") id: string) {
    try {
      await this.handles.delete(id);
    } catch (e) {
      // Only "record not found" (Prisma P2025) is a 404; a DB outage must not
      // be misreported to the operator as a missing row.
      if (isRecordNotFound(e)) throw new NotFoundException();
      throw e;
    }
    return { ok: true };
  }

  @Get("geo/states")
  @ApiOperation({ summary: "States (code + name) for the dashboard add-form" })
  async listStates() {
    return this.prisma.nigerianState.findMany({
      select: { code: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  @Get("geo/lgas")
  @ApiOperation({ summary: "LGAs of one state for the dashboard add-form" })
  async listLgas(@Query("stateCode") stateCode?: string) {
    if (!stateCode) throw new BadRequestException("stateCode required");
    return this.prisma.nigerianLga.findMany({
      where: { stateCode },
      select: { code: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  @Patch("handles/:id")
  @ApiOperation({
    summary:
      "Curate a handle: active | rejected | opted_out (opted_out = never tag again)",
  })
  async updateHandle(@Param("id") id: string, @Body() body: UpdateHandleBody) {
    const status = body?.status;
    if (!VALID_STATUSES.includes(status as HandleStatus)) {
      throw new BadRequestException(
        `status must be one of ${VALID_STATUSES.join(", ")}`,
      );
    }
    try {
      return await this.handles.updateStatus(id, status as HandleStatus);
    } catch (e) {
      if (isRecordNotFound(e)) throw new NotFoundException();
      throw e;
    }
  }

  @Get("settings")
  @ApiOperation({ summary: "Read the scout/tagging toggles" })
  async getSettings() {
    return {
      scout_enabled: await this.settings.getScoutEnabled(),
      tag_handles: await this.settings.getTagHandles(),
    };
  }

  @Patch("settings")
  @ApiOperation({ summary: "Flip the scout/tagging toggles" })
  async updateSettings(@Body() body: UpdateScoutSettingsBody) {
    if (typeof body?.scout_enabled === "boolean") {
      await this.settings.setScoutEnabled(body.scout_enabled);
    }
    if (typeof body?.tag_handles === "boolean") {
      await this.settings.setTagHandles(body.tag_handles);
    }
    return {
      scout_enabled: await this.settings.getScoutEnabled(),
      tag_handles: await this.settings.getTagHandles(),
    };
  }
}
