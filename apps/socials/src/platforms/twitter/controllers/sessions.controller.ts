import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AdminAuthGuard } from "../guards/admin-auth.guard.js";
import { RoamerIngestGuard } from "../guards/roamer-ingest.guard.js";
import {
  BotSessionRepo,
  TWITTER_PATH_SEARCH_TIMELINE,
} from "../roamer/bot-session.repo.js";

interface CapturedSessionPayload {
  userName: string;
  cookie: string;
  csrfToken: string;
  authorization: string;
  xClientTransactionId: string;
  xClientUuid: string;
  // Each capture carries only the op-hash it saw; the other is preserved
  // server-side. Both optional so a TweetDetail-only (or old-extension
  // SearchTimeline-only) capture is accepted.
  searchTimelineOpHash?: string;
  tweetDetailOpHash?: string;
  path?: string;
}

@ApiTags("Roamer / Sessions")
@Controller("v1/sessions")
export class SessionsController {
  constructor(private readonly sessions: BotSessionRepo) {}

  @Post()
  @HttpCode(201)
  @UseGuards(RoamerIngestGuard)
  @ApiOperation({
    summary: "Ingest captured Twitter session (used by Chrome extension)",
  })
  async ingest(@Body() body: CapturedSessionPayload) {
    const path = body.path ?? TWITTER_PATH_SEARCH_TIMELINE;
    const session = await this.sessions.upsertByUserNamePath({
      userName: body.userName,
      path,
      cookie: body.cookie,
      csrfToken: body.csrfToken,
      authorization: body.authorization,
      xClientTransactionId: body.xClientTransactionId,
      xClientUuid: body.xClientUuid,
      searchTimelineOpHash: body.searchTimelineOpHash,
      tweetDetailOpHash: body.tweetDetailOpHash,
    });
    return { id: session.id, userName: session.userName, path: session.path };
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "List bot sessions and their health" })
  async list() {
    const [items, counts, claimable] = await Promise.all([
      this.sessions.list(),
      this.sessions.healthCounts(),
      this.sessions.claimableCount(),
    ]);
    // Strip secrets from the list response. Only health-relevant fields go to
    // the dashboard; full row never leaves the server.
    return {
      counts: { ...counts, claimable },
      items: items.map((s) => ({
        id: s.id,
        userName: s.userName,
        path: s.path,
        status: s.status,
        cooldownUntil: s.cooldownUntil,
        lastUsedAt: s.lastUsedAt,
        consecutiveErrors: s.consecutiveErrors,
        lastError: s.lastError,
        hasOpHash: !!s.searchTimelineOpHash,
        hasTweetDetailHash: !!s.tweetDetailOpHash,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    };
  }

  @Delete(":id")
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Delete a bot session" })
  async delete(@Param("id") id: string) {
    await this.sessions.delete(id);
    return { ok: true };
  }
}
