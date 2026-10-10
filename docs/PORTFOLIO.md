# Portfolio & LinkedIn kit


## Portfolio card

**Bazaar - Full-Stack Online Marketplace**

A multi-vendor marketplace with search and filters, cart, Stripe checkout, seller dashboard and admin panel.
React 19, TypeScript, Tailwind, NestJS, Prisma, PostgreSQL, Stripe, deployed on Vercel + Render + Neon.

Links: Live demo (https://bazaar-marketplace-tan.vercel.app) | Source (https://github.com/Silver2er0/bazaar-marketplace) | API docs (https://bazaar-api-l828.onrender.com/docs)

Demo logins: `buyer@bazaar.dev` / `Buyer123!`, `seller@bazaar.dev` / `Seller123!`

## LinkedIn "Projects" entry

**Name:** Bazaar - Full-Stack Online Marketplace
**Skills:** React, TypeScript, NestJS, PostgreSQL, Prisma, Stripe, REST APIs, JWT, Docker, CI/CD
**Description:**
Built and deployed a full-stack marketplace with role-based access (buyer, seller, admin).
- Designed a REST API in NestJS with Prisma/PostgreSQL, JWT access + refresh tokens, validation, rate limiting and Swagger docs
- Implemented Stripe Checkout with signed webhooks and an idempotent order-payment flow that updates stock transactionally
- Built a responsive React + Tailwind UI with TanStack Query, URL-driven filters and pagination, dark mode, and seller/admin dashboards
- Added unit and end-to-end tests, GitHub Actions CI, and free-tier deployment (Vercel, Render, Neon)

## LinkedIn post

I just shipped Bazaar, a full-stack online marketplace I built from scratch with React, NestJS and PostgreSQL.

What's inside:
- Buyers, sellers and admins with role-based access
- Search, filters, pagination and reviews
- Stripe Checkout (test mode) with webhook-driven order updates
- Seller dashboard with image uploads and sales stats
- Typed end to end, tested, and deployed with CI

The part I enjoyed most: making payments safe. Totals are recomputed on the server, and marking an order paid is idempotent so webhook retries can't double-decrement stock.

Try it (demo logins on the login page): https://bazaar-marketplace-tan.vercel.app
Code: https://github.com/Silver2er0/bazaar-marketplace

#React #NestJS #TypeScript #PostgreSQL #Stripe #FullStack #WebDevelopment

## Interview talking points

- Why integer cents for money, and why the server never trusts client prices
- Idempotent `markPaid` (`updateMany ... where status = PENDING`) shared by the webhook and the confirm-on-read fallback
- Access/refresh token flow, with one in-flight refresh shared across concurrent requests on the client
- Trade-offs: stateless refresh tokens (no revocation list) and single-currency checkout, and how you would extend both
