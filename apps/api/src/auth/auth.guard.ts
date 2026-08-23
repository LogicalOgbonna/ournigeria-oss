import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@ournigeria/database';
import { cache } from '@ournigeria/cache';
import { IS_PUBLIC_KEY } from './decorators/public';
import { SessionService } from './session.service';

const USER_COOKIE = 'nb_uid';

interface CachedUserAuth {
  banned: boolean;
  banReason: string | null;
}

const authCache = cache.namespace('auth:user');

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Legacy raw-UUID `nb_uid` cookies are honoured only during the migration window. */
function legacyUidSessionsEnabled(): boolean {
  return process.env.LEGACY_UID_SESSIONS !== 'false';
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const cookieValue = request.cookies?.[USER_COOKIE];

    if (!cookieValue) {
      throw new UnauthorizedException('Not authenticated');
    }

    // Resolve the cookie to a userId. New opaque session tokens (prefix `nbs_`)
    // are looked up server-side (with expiry + revocation). Legacy raw-UUID
    // cookies are accepted only while the migration window is open.
    let userId: string | null = null;
    if (SessionService.isSessionToken(cookieValue)) {
      userId = await this.sessionService.resolve(cookieValue);
    } else if (legacyUidSessionsEnabled() && UUID_REGEX.test(cookieValue)) {
      userId = cookieValue;
    }

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    // Check cache first (keyed on the resolved userId, not the session token)
    const cached = await authCache.get<CachedUserAuth>(userId);
    if (cached) {
      if (cached.banned) {
        throw new ForbiddenException({
          error: 'banned',
          reason: cached.banReason || 'Your account has been suspended.',
        });
      }
      request.userId = userId;
      return true;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { banned: true, banReason: true },
    });

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    // Cache the result (60s TTL)
    await authCache.set(userId, { banned: user.banned, banReason: user.banReason }, 60_000);

    if (user.banned) {
      throw new ForbiddenException({
        error: 'banned',
        reason: user.banReason || 'Your account has been suspended.',
      });
    }

    request.userId = userId;
    return true;
  }
}

/** Invalidate cached auth for a user (call after ban/unban). */
export async function invalidateUserAuthCache(userId: string): Promise<void> {
  await authCache.del(userId);
}
