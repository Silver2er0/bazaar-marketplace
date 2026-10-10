import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '../generated/prisma/client.js';
import type { AuthUser } from './auth.decorator.js';

export const ROLES_KEY = 'roles';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    if (!token) throw new UnauthorizedException();

    let user: AuthUser;
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      });
      user = { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException();
    }

    const roles = this.reflector.get<Role[]>(ROLES_KEY, ctx.getHandler());
    const classRoles = this.reflector.get<Role[]>(ROLES_KEY, ctx.getClass());
    const allowed = roles?.length ? roles : classRoles;
    if (allowed?.length && !allowed.includes(user.role)) {
      throw new ForbiddenException();
    }
    req.user = user;
    return true;
  }
}
