import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PaymentsService } from './payments.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PaymentsService],
})
export class OrdersModule {}
