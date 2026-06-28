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
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../guards/admin-auth.guard.js";
import { BotSessionRepo } from "../roamer/bot-session.repo.js";
import { TopicRepo } from "../roamer/topic.repo.js";
import { TwitterSearchService } from "../roamer/twitter-search.service.js";

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
@UseGuards(AdminAuthGuard)
export class TopicsController {
  constructor(
    private readonly topics: TopicRepo,
    private readonly sessions: BotSessionRepo,
    private readonly search: TwitterSearchService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List all topics" })
  list() {
    return this.topics.list();
  }

  @Post()
  @ApiOperation({ summary: "Create a topic" })
  async create(@Body() body: TopicWriteBody) {
    this.assertValidDomain(body.domain);
    return this.topics.create({
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
  async update(@Param("id") id: string, @Body() body: Partial<TopicWriteBody>) {
    if (body.domain) this.assertValidDomain(body.domain);
    return this.topics.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a topic" })
  async delete(@Param("id") id: string) {
    await this.topics.delete(id);
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
    } finally {
      // Short cooldown — this was a single page, not a full window.
      await this.sessions
        .release(session.id, { cooldownMs: 30_000 })
        .catch(() => {});
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
