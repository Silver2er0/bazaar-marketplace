import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth, CurrentUser, type AuthUser } from '../common/auth.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('users')
@Auth('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    if (id === user.id) throw new BadRequestException('You cannot delete yourself');
    await this.prisma.user.delete({ where: { id } });
  }
}
