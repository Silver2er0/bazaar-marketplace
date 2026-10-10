import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Role } from '../generated/prisma/client.js';
import { AuthGuard, ROLES_KEY } from './auth.guard.js';

export interface AuthUser {
  id: string;
  role: Role;
}

/** Requires a valid access token; optionally restricts to the given roles. */
export const Auth = (...roles: Role[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(AuthGuard),
    ApiBearerAuth(),
  );

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);
