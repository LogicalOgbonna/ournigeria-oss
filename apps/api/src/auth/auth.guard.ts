import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@ournigeria/database';
import { IS_PUBLIC_KEY } from './decorators/public';

const USER_COOKIE = 'nb_uid';

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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { banned: true, banReason: true },
    });

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

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
