import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "@ournigeria/access";
import {
  AdminAuthGuard,
  type AuthedRequest,
} from "../guards/admin-auth.guard.js";
import { PermissionsGuard } from "../guards/permissions.guard.js";
import { AuditWriterService } from "../../../audit/audit-writer.service.js";
import { TelegramService } from "../../../notifications/telegram.service.js";
import { BotSessionRepo } from "../roamer/bot-session.repo.js";
import { TopicRepo } from "../roamer/topic.repo.js";
import {
  FetchAuthError,
  TwitterSearchService,
} from "../roamer/twitter-search.service.js";

interface TopicWriteBody {
  name: string;
  query: string;
  description: string;
  domain: string;
  positiveExamples?: string[];
  negativeExamples?: string[];
  threshold?: number;
  minFollowers?: number;
  maxFollowers?: number;
  lang?: string;
  minTextLength?: number;
  maxAgeHours?: number;
  enabled?: boolean;
}

interface TestQueryBody {
  query: string;
  cursor?: string | null;
}

const VALID_DOMAINS = ["budget", "corruption", "faac", "govspend", "general"];

@ApiTags("Roamer / Topics")
@Controller("v1/topics")
@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermission("socials.topics")
export class TopicsController {
  constructor(
    private readonly topics: TopicRepo,
    private readonly sessions: BotSessionRepo,
    private readonly search: TwitterSearchService,
    private readonly telegram: TelegramService,
    private readonly audit: AuditWriterService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List all topics" })
  list() {
    return this.topics.list();
  }

  @Post()
  @ApiOperation({ summary: "Create a topic" })
  async create(@Body() body: TopicWriteBody, @Req() req: AuthedRequest) {
    this.assertValidDomain(body.domain);
    const topic = await this.topics.create({
      name: body.name,
      query: body.query,
      description: body.description,
      domain: body.domain,
      positiveExamples: body.positiveExamples ?? [],
      negativeExamples: body.negativeExamples ?? [],
      threshold: body.threshold ?? 0.7,
      minFollowers: body.minFollowers ?? 1000,
      maxFollowers: body.maxFollowers ?? 500_000,
      lang: body.lang ?? "en",
      minTextLength: body.minTextLength ?? 20,
      maxAgeHours: body.maxAgeHours ?? 48,
      enabled: body.enabled ?? false,
    });
    await this.audit.log(req.adminId, {
      action: "socials.topic.created",
      targetType: "socials_topic",
      targetId: topic.id,
    });
    return topic;
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a topic" })
  async get(@Param("id") id: string) {
    const topic = await this.topics.get(id);
    if (!topic) throw new NotFoundException();
    return topic;
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a topic" })
  async update(
    @Param("id") id: string,
    @Body() body: Partial<TopicWriteBody>,
    @Req() req: AuthedRequest,
  ) {
    if (body.domain) this.assertValidDomain(body.domain);
    const topic = await this.topics.update(id, body);
    await this.audit.log(req.adminId, {
      action: "socials.topic.updated",
      targetType: "socials_topic",
      targetId: id,
    });
    return topic;
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a topic" })
  async delete(@Param("id") id: string, @Req() req: AuthedRequest) {
    await this.topics.delete(id);
    await this.audit.log(req.adminId, {
      action: "socials.topic.deleted",
      targetType: "socials_topic",
      targetId: id,
    });
    return { ok: true };
  }

  @Post("test-query")
  @ApiOperation({
    summary: "Run a one-off X search using an idle session — no classify, no persist",
  })
  async testQuery(@Body() body: TestQueryBody) {
    if (!body.query) throw new BadRequestException("query required");

    const session = await this.sessions.claimRandomIdle();
    if (!session) {
      throw new BadRequestException(
        "no claimable bot sessions — capture cookies via Chrome extension first",
      );
    }
    // A 401/403 here means the session's cookies are dead. This preview is the
    // path an operator uses to discover expiry, so record it (auth_failed) and
    // alert ops instead of silently releasing the session back to idle — that
    // hid the failure and made expiry invisible on the dashboard.
    let authFailed = false;
    try {
      const page = await this.search.fetchSearchTimelinePage({
        query: body.query,
        cursor: body.cursor ?? null,
        sessionId: session.id,
        opHash: session.searchTimelineOpHash!,
      });
      return {
        sessionUserName: session.userName,
        tweets: page.tweets,
        oldestTweetAt: page.oldestTweetAt,
        nextCursor: page.nextCursor,
      };
    } catch (err) {
      if (err instanceof FetchAuthError) {
        authFailed = true;
        await this.sessions
          .markAuthFailed(session.id, `test-query ${err.message}`)
          .catch(() => {});
        await this.telegram
          .notify(
            `🔒 <b>Twitter session expired</b>: <code>${session.userName}</code> (${err.message}, detected via dashboard preview). Re-capture cookies via the extension.`,
          )
          .catch(() => {});
      }
      throw err;
    } finally {
      // Leave a dead session as auth_failed; only healthy sessions go back to
      // idle with a short cooldown (this was a single page, not a full window).
      if (!authFailed) {
        await this.sessions
          .release(session.id, { cooldownMs: 30_000 })
          .catch(() => {});
      }
    }
  }

  private assertValidDomain(domain: string): void {
    if (!VALID_DOMAINS.includes(domain)) {
      throw new BadRequestException(
        `invalid domain "${domain}". Must be one of: ${VALID_DOMAINS.join(", ")}`,
      );
    }
  }
}
