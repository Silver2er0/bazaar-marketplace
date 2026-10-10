import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../common/auth.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderDto } from './orders.dto.js';
import { PaymentsService } from './payments.service.js';

const WITH_ITEMS = { items: true } as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
  ) {}

  async create(user: AuthUser, { items }: CreateOrderDto) {
    const quantities = new Map<string, number>();
    for (const { productId, quantity } of items) {
      quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    }
    const products = await this.prisma.product.findMany({
      where: { id: { in: [...quantities.keys()] } },
    });
    if (products.length !== quantities.size) {
      throw new BadRequestException('Some products no longer exist');
    }
    const soldOut = products.find((p) => p.stock < quantities.get(p.id)!);
    if (soldOut) {
      throw new BadRequestException(`Not enough stock for "${soldOut.title}"`);
    }

    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        totalCents: products.reduce(
          (sum, p) => sum + p.priceCents * quantities.get(p.id)!,
          0,
        ),
        items: {
          create: products.map((p) => ({
            productId: p.id,
            title: p.title,
            unitPriceCents: p.priceCents,
            quantity: quantities.get(p.id)!,
          })),
        },
      },
      include: WITH_ITEMS,
    });

    // Without Stripe configured (local demos) the order is paid immediately.
    if (!this.payments.enabled) {
      await this.markPaid(order.id);
      return { orderId: order.id, checkoutUrl: null };
    }
    const { id, url } = await this.payments.createCheckout(
      order,
      (await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email,
    );
    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: id },
    });
    return { orderId: order.id, checkoutUrl: url };
  }

  mine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: WITH_ITEMS,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Paid line items for products sold by this seller. */
  sales(sellerId: string) {
    return this.prisma.orderItem.findMany({
      where: { product: { sellerId }, order: { status: 'PAID' } },
      include: { order: { select: { createdAt: true, user: { select: { name: true } } } } },
      orderBy: { order: { createdAt: 'desc' } },
    });
  }

  async findOne(id: string, userId: string) {
    let order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: WITH_ITEMS,
    });
    if (!order) throw new NotFoundException('Order not found');

    // Webhooks can lag (or be absent locally), so confirm pending orders with Stripe.
    if (order.status === 'PENDING' && order.stripeSessionId && this.payments.enabled) {
      if (await this.payments.isPaid(order.stripeSessionId)) {
        await this.markPaid(id);
        order = { ...order, status: 'PAID' };
      }
    }
    return order;
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const orderId = this.payments.paidOrderId(rawBody, signature);
    if (orderId) await this.markPaid(orderId);
  }

  /** Idempotent: flips PENDING -> PAID once and decrements stock. */
  async markPaid(orderId: string) {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'PAID' },
      });
      if (!count) return;
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const { productId, quantity } of items) {
        await tx.product.updateMany({
          where: { id: productId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
      }
    });
  }
}
