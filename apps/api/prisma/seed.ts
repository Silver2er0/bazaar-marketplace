import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Role } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&h=600&fit=crop&auto=format`;

const CATEGORIES = {
  electronics: 'Electronics',
  home: 'Home & Living',
  fashion: 'Fashion',
  books: 'Books',
  sports: 'Sports & Fitness',
};

// [category, title, priceCents, stock, photo id, description]
const PRODUCTS: [keyof typeof CATEGORIES, string, number, number, string, string][] = [
  ['electronics', 'Vintage Wired Headphones', 7900, 25, '1484704849700-f032a568e944', 'Warm, balanced sound with soft leather ear pads and a braided cable. Built for long listening sessions.'],
  ['electronics', 'Studio Wireless Headphones', 18900, 18, '1505740420928-5e560c06d30e', 'Active noise cancelling, 40-hour battery and fast USB-C charging. Folds flat for travel.'],
  ['electronics', 'Smartphone 128GB', 69900, 12, '1511707171634-5f897ff02aa9', 'Edge-to-edge OLED display, dual cameras and all-day battery life.'],
  ['electronics', 'UltraBook 14" Laptop', 129900, 8, '1517336714731-489689fd1ca8', 'Thin and light with a vivid 14 inch display, 16GB RAM and a 512GB SSD.'],
  ['electronics', 'Creator Laptop 15"', 149900, 6, '1593642632823-8f785ba67e45', 'Colour-accurate screen and a fast GPU for editing, design and development.'],
  ['electronics', 'Smartwatch Series 6', 29900, 30, '1546868871-7041f2a55e12', 'Track workouts, sleep and heart rate with an always-on retina display.'],
  ['electronics', 'Instant Film Camera', 11900, 14, '1526170375885-4d8ecf77b99f', 'Point, shoot and watch the picture develop in your hands. Film sold separately.'],
  ['home', 'Mint Succulent Planter', 1800, 60, '1485955900006-10f4d324d411', 'A hardy aloe in a matte ceramic pot. Brings a little green to any desk or shelf.'],
  ['home', 'Oak Bar Stool', 8900, 20, '1503602642458-232111445657', 'Solid oak with a smooth finish and a sturdy footrest. Seat height 65cm.'],
  ['home', 'Matte Grey Desk Lamp', 4500, 35, '1507473885765-e6ed057f782c', 'Adjustable arm and warm LED bulb for focused evenings.'],
  ['home', 'Emerald Velvet Sofa', 89900, 4, '1555041469-a586c61ea9bc', 'Three-seater with deep cushions and tapered wooden legs.'],
  ['home', 'Retro Lounge Armchair', 32900, 7, '1519125323398-675f0ddb6308', 'Mid-century inspired chair that is as comfortable as it is photogenic.'],
  ['fashion', 'Crimson Running Sneakers', 11900, 40, '1542291026-7eec264c27ff', 'Breathable knit upper and responsive cushioning for daily runs.'],
  ['fashion', 'Pastel Court Sneakers', 9900, 28, '1595950653106-6c9ebd614d3a', 'Soft pastel panels on a classic court silhouette.'],
  ['fashion', 'Teal Suede Brogues', 13900, 15, '1560343090-f0409e92791a', 'Hand-finished suede with a cushioned insole. Dress up or down.'],
  ['fashion', 'Classic Sunglasses', 6900, 50, '1572635196237-14b3f281503f', 'Timeless frame with UV400 polarised lenses.'],
  ['fashion', 'Urban Daypack', 5900, 45, '1553062407-98eeb64c6a62', 'Water-resistant 20L backpack with a padded laptop sleeve.'],
  ['fashion', 'Minimal Analog Watch', 15900, 22, '1523275335684-37898b6baf30', 'Clean dial, sapphire-coated glass and a soft silicone strap.'],
  ['fashion', 'Washed Linen Shirt', 4900, 33, '1558171813-4c088753af8f', 'Lightweight pre-washed linen that gets softer with every wear.'],
  ['books', 'Startup Playbook Bundle', 5400, 40, '1512820790803-83ca734da794', 'Five essential books on building products and companies, in one stack.'],
  ['books', 'Milk and Honey (Paperback)', 1500, 70, '1544947950-fa07a98d237f', 'A bestselling collection of poetry and prose about love, loss and healing.'],
  ['sports', 'Eco Yoga Mat', 3500, 55, '1571019613454-1cb2f99b2d8b', 'Non-slip natural rubber mat, 5mm thick, with a carry strap.'],
  ['sports', 'Insulated Steel Bottle', 2900, 80, '1602143407151-7111542de6e8', 'Keeps drinks cold for 24 hours or hot for 12. 750ml, BPA free.'],
  ['sports', 'Performance Trail Runner', 12900, 26, '1491553895911-0055eca6402d', 'Aggressive grip and a lightweight midsole for road and trail.'],
];

const USERS: [string, string, Role][] = [
  ['admin@bazaar.dev', 'Ada Admin', 'ADMIN'],
  ['seller@bazaar.dev', 'Sam Seller', 'SELLER'],
  ['buyer@bazaar.dev', 'Bea Buyer', 'BUYER'],
];

async function main() {
  const users = await Promise.all(
    USERS.map(async ([email, name, role]) =>
      prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name,
          role,
          passwordHash: await bcrypt.hash(`${name.split(' ')[1]}123!`, 10),
        },
      }),
    ),
  );
  const [, seller, buyer] = users;

  const categories = Object.fromEntries(
    await Promise.all(
      Object.entries(CATEGORIES).map(async ([slug, name]) => [
        slug,
        await prisma.category.upsert({ where: { slug }, update: { name }, create: { slug, name } }),
      ]),
    ),
  );

  if (await prisma.product.count()) return console.log('Products already seeded');

  await prisma.product.createMany({
    data: PRODUCTS.map(([category, title, priceCents, stock, photo, description]) => ({
      title,
      description,
      priceCents,
      stock,
      images: [img(photo)],
      sellerId: seller.id,
      categoryId: categories[category].id,
    })),
  });

  const products = await prisma.product.findMany({ take: 8, orderBy: { priceCents: 'asc' } });
  await prisma.review.createMany({
    data: products.map((p, i) => ({
      userId: buyer.id,
      productId: p.id,
      rating: 4 + (i % 2),
      comment: i % 2 ? 'Great quality, arrived quickly. Would buy again.' : 'Looks even better in person. Very happy.',
    })),
  });
  console.log(`Seeded ${PRODUCTS.length} products`);
}

await main().finally(() => prisma.$disconnect());
