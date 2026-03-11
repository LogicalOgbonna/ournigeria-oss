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

const USER_COOKIE = 'nb_uid';

interface CachedUserAuth {
  banned: boolean;
  banReason: string | null;
}

const authCache = cache.namespace('auth:user');

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
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
    const userId = request.cookies?.[USER_COOKIE];

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    // Check cache first
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
