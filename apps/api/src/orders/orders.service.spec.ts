import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';

describe('OrdersService.create', () => {
  const prisma = {
    product: { findMany: vi.fn() },
    order: { create: vi.fn() },
  };
  const service = new OrdersService(prisma as never, { enabled: false } as never);

  it('rejects unknown products', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    await expect(
      service.create({ id: 'u1', role: 'BUYER' }, { items: [{ productId: 'x', quantity: 1 }] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects quantities above stock', async () => {
    prisma.product.findMany.mockResolvedValue([{ id: 'p1', title: 'Lamp', stock: 1, priceCents: 100 }]);
    await expect(
      service.create({ id: 'u1', role: 'BUYER' }, { items: [{ productId: 'p1', quantity: 2 }] }),
    ).rejects.toThrow(/Not enough stock/);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });
});
