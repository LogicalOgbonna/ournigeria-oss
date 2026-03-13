# Authentication & API — Institutional Access

## Overview

Institutional users (financial analysts, banks, DFIs) access the platform through two channels:
1. **Portal** (`apps/institution/`) — session-based auth via email + password
2. **REST API** (`/api/pro/*`) — API key auth via Bearer token

Both channels share the `InstitutionalUser` Prisma model and `AnalystGuard`.

## Authentication Architecture

```
  ┌─────────────────────────────────────────────────────────────┐
  │                     REQUEST FLOW                            │
  │                                                             │
  │  Portal (Browser)              API Client (Programmatic)    │
  │  ┌──────────────┐              ┌──────────────┐             │
  │  │ Cookie-based  │              │ Bearer Token  │             │
  │  │ Session Auth  │              │ API Key Auth  │             │
  │  └──────┬───────┘              └──────┬───────┘             │
  │         │                             │                     │
  │         ▼                             ▼                     │
  │  ┌─────────────────────────────────────────────┐            │
  │  │              AnalystGuard                    │            │
  │  │  1. Check cookie → InstitutionalUser lookup  │            │
  │  │  2. Check Bearer → API key hash lookup       │            │
  │  │  3. Check rate limit (per user, per hour)    │            │
  │  │  4. Attach user to request                   │            │
  │  └─────────────────────────────────────────────┘            │
  │         │                                                   │
  │         ▼                                                   │
  │  ┌─────────────────────────────────────────────┐            │
  │  │           CreditController                   │            │
  │  │  POST /api/pro/assess/:state                 │            │
  │  │  POST /api/pro/compare                       │            │
  │  │  GET  /api/pro/rank                          │            │
  │  └─────────────────────────────────────────────┘            │
  │         │                                                   │
  │         ▼                                                   │
  │  ┌─────────────────────────────────────────────┐            │
  │  │         QueryAuditLog (recorded)             │            │
  │  └─────────────────────────────────────────────┘            │
  └─────────────────────────────────────────────────────────────┘
```

## AnalystGuard Implementation

```typescript
// apps/api/src/credit/guards/analyst.guard.ts

@Injectable()
export class AnalystGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Strategy 1: Session cookie (portal)
    const sessionToken = request.cookies?.['analyst_session'];
    if (sessionToken) {
      const user = await this.prisma.institutionalUser.findUnique({
        where: { sessionToken, isActive: true },
      });
      if (user) {
        request.analystUser = user;
        return this.checkRateLimit(user);
      }
    }

    // Strategy 2: Bearer token (API)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const apiKey = authHeader.slice(7);
      const hashedKey = hashApiKey(apiKey);
      const user = await this.prisma.institutionalUser.findUnique({
        where: { apiKey: hashedKey, isActive: true },
      });
      if (user) {
        request.analystUser = user;
        return this.checkRateLimit(user);
      }
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  private async checkRateLimit(user: InstitutionalUser): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Count queries in last hour
    const recentCount = await this.prisma.queryAuditLog.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= user.rateLimitPerHour) {
      throw new HttpException(
        {
          message: 'Rate limit exceeded',
          limit: user.rateLimitPerHour,
          resetAt: new Date(oneHourAgo.getTime() + 60 * 60 * 1000).toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
```

## Session Management

### Login Flow

```typescript
// apps/api/src/credit/auth/analyst-auth.controller.ts

@Controller('api/pro/auth')
export class AnalystAuthController {

  @Post('login')
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const { email, password } = body;

    const user = await this.prisma.institutionalUser.findUnique({
      where: { email, isActive: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.institutionalUser.update({
      where: { id: user.id },
      data: { sessionToken },
    });

    // Set secure cookie
    res.cookie('analyst_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,  // 24 hours
      path: '/',
    });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      organizationName: user.organizationName,
      tier: user.tier,
    });
  }

  @Post('logout')
  @UseGuards(AnalystGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    await this.prisma.institutionalUser.update({
      where: { id: req.analystUser.id },
      data: { sessionToken: null },
    });

    res.clearCookie('analyst_session');
    return res.json({ success: true });
  }
}
```

### Password Reset

```typescript
@Post('forgot-password')
async forgotPassword(@Body() body: { email: string }) {
  // Generate reset token, store hashed version
  // Send email with reset link
  // Token expires in 1 hour
}

@Post('reset-password')
async resetPassword(@Body() body: { token: string; password: string }) {
  // Validate token, hash new password, clear token
  // Invalidate existing sessions
}
```

## API Key Management

### Key Generation

```typescript
// apps/api/src/credit/auth/api-key.service.ts

@Injectable()
export class ApiKeyService {
  async generateApiKey(userId: string): Promise<{ key: string; prefix: string }> {
    // Generate key: oun_live_<32 random bytes hex>
    const rawKey = `oun_live_${crypto.randomBytes(32).toString('hex')}`;
    const prefix = rawKey.slice(0, 12);  // "oun_live_xxxx"
    const hashedKey = hashApiKey(rawKey);

    await this.prisma.institutionalUser.update({
      where: { id: userId },
      data: { apiKey: hashedKey, apiKeyPrefix: prefix },
    });

    // Return raw key ONCE — never stored or retrievable again
    return { key: rawKey, prefix };
  }

  async revokeApiKey(userId: string): Promise<void> {
    await this.prisma.institutionalUser.update({
      where: { id: userId },
      data: { apiKey: null, apiKeyPrefix: null },
    });
  }
}

// Hash function (consistent)
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}
```

### Key Format

```
  oun_live_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
  ├──────┤├──┤├──────────────────────────────────────────────────────────────────┤
  prefix  env   random bytes (32 bytes = 64 hex chars)

  Prefix stored unhashed (for display: "oun_live_a1b2...")
  Full key hashed with SHA-256 (for lookup)
```

## REST API Endpoints

### CreditController

```typescript
// apps/api/src/credit/credit.controller.ts

@Controller('api/pro')
@UseGuards(AnalystGuard)
export class CreditController {
  constructor(
    private creditService: CreditAssessmentService,
    private auditService: QueryAuditService,
  ) {}

  /**
   * POST /api/pro/assess/:state
   * Returns full credit assessment as JSON (not SSE).
   * For programmatic API access only.
   */
  @Post('assess/:state')
  async assess(
    @Param('state') state: string,
    @Query('year') year?: number,
    @Req() req: Request,
  ): Promise<CreditAssessmentResponse> {
    const startTime = Date.now();
    const sections: CreditSection[] = [];

    for await (const section of this.creditService.generateAssessment(state, year)) {
      sections.push(section);
    }

    const responseTimeMs = Date.now() - startTime;

    // Audit log
    await this.auditService.log({
      userId: req.analystUser.id,
      queryType: 'assessment',
      statesQueried: [state],
      year,
      responseTimeMs,
      sectionsReturned: sections.length,
      dataGapCount: sections.find(s => s.type === 'credit_section:data_gaps')?.data?.gaps?.length || 0,
    });

    return {
      state,
      year: sections[0]?.data?.year,
      sections,
      disclaimer: DISCLAIMER_TEXT,
      generatedAt: new Date().toISOString(),
      responseTimeMs,
    };
  }

  /**
   * POST /api/pro/compare
   * Compare 2-6 states.
   */
  @Post('compare')
  async compare(
    @Body() body: { states: string[]; year?: number },
    @Req() req: Request,
  ): Promise<ComparisonResult> {
    const startTime = Date.now();
    const result = await this.creditService.compare(body.states, body.year);
    const responseTimeMs = Date.now() - startTime;

    await this.auditService.log({
      userId: req.analystUser.id,
      queryType: 'comparison',
      statesQueried: body.states,
      year: body.year,
      responseTimeMs,
    });

    return result;
  }

  /**
   * GET /api/pro/rank
   * Rank states by creditworthiness.
   */
  @Get('rank')
  async rank(
    @Query('zone') zone?: string,
    @Query('year') year?: number,
    @Req() req: Request,
  ): Promise<RankingResult> {
    const startTime = Date.now();
    const result = await this.creditService.rank({ zone, year });
    const responseTimeMs = Date.now() - startTime;

    await this.auditService.log({
      userId: req.analystUser.id,
      queryType: 'ranking',
      statesQueried: [],
      year,
      responseTimeMs,
    });

    return result;
  }

  /**
   * GET /api/pro/snapshot/:state
   * Read cached snapshot (fast, no computation).
   */
  @Get('snapshot/:state')
  async snapshot(
    @Param('state') state: string,
  ): Promise<StateCreditSnapshot | null> {
    return this.creditService.getSnapshot(normalizeStateName(state));
  }

  /**
   * GET /api/pro/me
   * Current user profile + usage stats.
   */
  @Get('me')
  async me(@Req() req: Request) {
    const user = req.analystUser;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentQueries = await this.prisma.queryAuditLog.count({
      where: { userId: user.id, createdAt: { gte: oneHourAgo } },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      organizationName: user.organizationName,
      tier: user.tier,
      apiKeyPrefix: user.apiKeyPrefix,
      rateLimitPerHour: user.rateLimitPerHour,
      queriesThisHour: recentQueries,
      totalQueries: user.queryCount,
    };
  }

  /**
   * POST /api/pro/api-key
   * Generate or regenerate API key.
   */
  @Post('api-key')
  async generateApiKey(@Req() req: Request) {
    return this.apiKeyService.generateApiKey(req.analystUser.id);
  }

  /**
   * DELETE /api/pro/api-key
   * Revoke API key.
   */
  @Delete('api-key')
  async revokeApiKey(@Req() req: Request) {
    await this.apiKeyService.revokeApiKey(req.analystUser.id);
    return { success: true };
  }
}
```

## Rate Limiting Tiers

```
  TIER         │ RATE LIMIT   │ MAX STATES/COMPARE │ FEATURES
  ─────────────┼──────────────┼────────────────────┼───────────────────
  trial        │ 20/hour      │ 2                  │ assess, compare (2)
  standard     │ 100/hour     │ 4                  │ assess, compare, rank (zone)
  enterprise   │ 500/hour     │ 6                  │ assess, compare, rank (all), bulk snapshot
```

## Query Audit Logging

```typescript
// apps/api/src/credit/services/query-audit.service.ts

@Injectable()
export class QueryAuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: {
    userId: string;
    queryType: 'assessment' | 'comparison' | 'ranking' | 'chat';
    statesQueried: string[];
    year?: number;
    responseTimeMs: number;
    sectionsReturned?: number;
    dataGapCount?: number;
  }): Promise<void> {
    await this.prisma.queryAuditLog.create({ data: entry });

    // Increment total query count
    await this.prisma.institutionalUser.update({
      where: { id: entry.userId },
      data: {
        queryCount: { increment: 1 },
        lastQueryAt: new Date(),
      },
    });
  }
}
```

## Admin Account Management

```typescript
// apps/api/src/credit/admin/analyst-admin.controller.ts
// Protected by existing AdminGuard (admin dashboard access)

@Controller('api/admin/analysts')
@UseGuards(AdminGuard)
export class AnalystAdminController {

  @Post()
  async create(@Body() body: CreateAnalystDto, @Req() req: Request) {
    const passwordHash = await bcrypt.hash(body.password, 12);
    return this.prisma.institutionalUser.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        organizationName: body.organizationName,
        role: body.role || 'analyst',
        tier: body.tier || 'trial',
        rateLimitPerHour: TIER_LIMITS[body.tier || 'trial'],
        createdBy: req.adminUser.id,
      },
    });
  }

  @Get()
  async list() {
    return this.prisma.institutionalUser.findMany({
      select: {
        id: true, email: true, name: true, organizationName: true,
        tier: true, role: true, isActive: true, queryCount: true,
        lastQueryAt: true, createdAt: true,
      },
    });
  }

  @Patch(':id/tier')
  async updateTier(@Param('id') id: string, @Body() body: { tier: string }) {
    return this.prisma.institutionalUser.update({
      where: { id },
      data: {
        tier: body.tier,
        rateLimitPerHour: TIER_LIMITS[body.tier],
      },
    });
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.prisma.institutionalUser.update({
      where: { id },
      data: { isActive: false, sessionToken: null, apiKey: null },
    });
  }
}
```

## NestJS Module Structure

```typescript
// apps/api/src/credit/credit.module.ts

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [
    CreditController,
    AnalystAuthController,
    AnalystAdminController,
  ],
  providers: [
    CreditAssessmentService,
    QueryAuditService,
    ApiKeyService,
    AnalystGuard,
  ],
  exports: [CreditAssessmentService],  // ChatService needs access
})
export class CreditModule {}
```

## Route Isolation from Citizen API

```
  /api/chat          ← Citizen + Analyst (GlobalAuthGuard)
  /api/pro/auth/*    ← Public (no guard)
  /api/pro/assess/*  ← Analyst only (AnalystGuard)
  /api/pro/compare   ← Analyst only (AnalystGuard)
  /api/pro/rank      ← Analyst only (AnalystGuard)
  /api/pro/me        ← Analyst only (AnalystGuard)
  /api/pro/api-key   ← Analyst only (AnalystGuard)
  /api/admin/analysts/* ← Admin only (AdminGuard)
```

The `/api/chat` endpoint remains accessible to both citizen users (phone OTP auth) and institutional users (session auth). The router detects credit intent and delegates to CreditAssessmentService for institutional users. The REST `/api/pro/*` endpoints are the programmatic alternative.
