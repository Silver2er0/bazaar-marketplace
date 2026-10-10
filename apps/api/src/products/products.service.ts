import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../common/auth.decorator.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateProductDto,
  CreateReviewDto,
  QueryProductsDto,
  UpdateProductDto,
} from './products.dto.js';

const ORDER_BY = {
  newest: { createdAt: 'desc' },
  price_asc: { priceCents: 'asc' },
  price_desc: { priceCents: 'desc' },
} as const;

const LIST_INCLUDE = {
  category: true,
  seller: { select: { id: true, name: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list({ q, category, minPrice, maxPrice, sort = 'newest', page, limit }: QueryProductsDto) {
    const where: Prisma.ProductWhereInput = {
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category: { slug: category } }),
      priceCents: { gte: minPrice, lte: maxPrice },
    };
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: ORDER_BY[sort],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      items: await this.withRatings(products),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  mine(sellerId: string) {
    return this.prisma.product
      .findMany({
        where: { sellerId },
        include: LIST_INCLUDE,
        orderBy: { createdAt: 'desc' },
      })
      .then((products) => this.withRatings(products));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        ...LIST_INCLUDE,
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    const count = product.reviews.length;
    const sum = product.reviews.reduce((s, r) => s + r.rating, 0);
    return { ...product, rating: count ? sum / count : null, reviewCount: count };
  }

  create(sellerId: string, dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto, sellerId } });
  }

  async update(id: string, user: AuthUser, dto: UpdateProductDto) {
    await this.assertCanEdit(id, user);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: AuthUser) {
    await this.assertCanEdit(id, user);
    if (await this.prisma.orderItem.count({ where: { productId: id } })) {
      throw new ConflictException('Product has orders; set its stock to 0 instead');
    }
    await this.prisma.product.delete({ where: { id } });
  }

  async review(productId: string, userId: string, dto: CreateReviewDto) {
    await this.findOne(productId);
    return this.prisma.review.upsert({
      where: { userId_productId: { userId, productId } },
      create: { ...dto, userId, productId },
      update: dto,
    });
  }

  private async assertCanEdit(id: string, { id: userId, role }: AuthUser) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (role !== 'ADMIN' && product.sellerId !== userId) {
      throw new ForbiddenException();
    }
  }

  private async withRatings<T extends { id: string }>(products: T[]) {
    const stats = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: products.map((p) => p.id) } },
      _avg: { rating: true },
      _count: true,
    });
    return products.map((p) => {
      const s = stats.find((x) => x.productId === p.id);
      return { ...p, rating: s?._avg.rating ?? null, reviewCount: s?._count ?? 0 };
    });
  }
}
