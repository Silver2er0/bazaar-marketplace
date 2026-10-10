import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup-app.js';

describe('Marketplace (e2e)', () => {
  const stamp = Date.now();
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;

  const signup = async (role: 'BUYER' | 'SELLER') => {
    const { body } = await http
      .post('/auth/register')
      .send({ email: `${role}-${stamp}@test.dev`, name: `Test ${role}`, password: 'password123', role })
      .expect(201);
    return { token: `Bearer ${body.accessToken}`, id: body.user.id as string };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { user: { email: { endsWith: `-${stamp}@test.dev` } } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@test.dev` } } });
    await prisma.category.deleteMany({ where: { slug: `e2e-${stamp}` } });
    await app.close();
  });

  it('runs the full buy flow', async () => {
    const seller = await signup('SELLER');
    const buyer = await signup('BUYER');
    const category = await prisma.category.create({
      data: { name: 'E2E', slug: `e2e-${stamp}` },
    });
    const product = { title: 'E2E Widget', description: 'A widget for testing', priceCents: 1500, stock: 5, categoryId: category.id, images: [] };

    await http.get('/orders').expect(401);
    await http.post('/products').set('Authorization', buyer.token).send(product).expect(403);
    await http.post('/products').set('Authorization', seller.token).send({ ...product, priceCents: -1 }).expect(400);

    const { body: created } = await http
      .post('/products')
      .set('Authorization', seller.token)
      .send(product)
      .expect(201);

    await http
      .post('/orders')
      .set('Authorization', buyer.token)
      .send({ items: [{ productId: created.id, quantity: 99 }] })
      .expect(400);

    const { body: placed } = await http
      .post('/orders')
      .set('Authorization', buyer.token)
      .send({ items: [{ productId: created.id, quantity: 2 }] })
      .expect(201);
    const { body: order } = await http
      .get(`/orders/${placed.orderId}`)
      .set('Authorization', buyer.token)
      .expect(200);
    expect(order).toMatchObject({ status: 'PAID', totalCents: 3000 });

    const { body: after } = await http.get(`/products/${created.id}`).expect(200);
    expect(after.stock).toBe(3);

    await http
      .post(`/products/${created.id}/reviews`)
      .set('Authorization', buyer.token)
      .send({ rating: 5, comment: 'Works great' })
      .expect(201);
    const { body: rated } = await http.get(`/products/${created.id}`).expect(200);
    expect(rated).toMatchObject({ rating: 5, reviewCount: 1 });

    const { body: sales } = await http.get('/orders/sales').set('Authorization', seller.token).expect(200);
    expect(sales).toHaveLength(1);
  });
});
