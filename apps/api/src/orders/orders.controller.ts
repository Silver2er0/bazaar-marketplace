import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Auth, CurrentUser, type AuthUser } from '../common/auth.decorator.js';
import { CreateOrderDto } from './orders.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Auth()
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user, dto);
  }

  @Auth()
  @Get()
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.mine(user.id);
  }

  @Auth('SELLER', 'ADMIN')
  @Get('sales')
  sales(@CurrentUser() user: AuthUser) {
    return this.orders.sales(user.id);
  }

  @Auth()
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.findOne(id, user.id);
  }

  @ApiExcludeEndpoint()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody || !signature) throw new BadRequestException();
    try {
      await this.orders.handleWebhook(req.rawBody, signature);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }
    return { received: true };
  }
}
