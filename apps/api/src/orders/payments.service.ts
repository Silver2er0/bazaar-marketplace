import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

interface CheckoutOrder {
  id: string;
  items: { quantity: number; unitPriceCents: number; title: string }[];
}

/** Thin wrapper around Stripe Checkout (test mode). Disabled when no key is set. */
@Injectable()
export class PaymentsService {
  private readonly stripe?: Stripe;

  constructor(private readonly config: ConfigService) {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    if (key) this.stripe = new Stripe(key);
  }

  get enabled() {
    return !!this.stripe;
  }

  createCheckout(order: CheckoutOrder, email: string) {
    const webUrl = this.config.getOrThrow('WEB_URL').split(',')[0];
    return this.stripe!.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      success_url: `${webUrl}/orders/${order.id}?paid=1`,
      cancel_url: `${webUrl}/orders/${order.id}`,
      line_items: order.items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: i.unitPriceCents,
          product_data: { name: i.title },
        },
      })),
    });
  }

  isPaid(sessionId: string) {
    return this.stripe!.checkout.sessions
      .retrieve(sessionId)
      .then((s) => s.payment_status === 'paid');
  }

  /** Returns the paid order id for a verified `checkout.session.completed` event. */
  paidOrderId(rawBody: Buffer, signature: string) {
    const event = this.stripe!.webhooks.constructEvent(
      rawBody,
      signature,
      this.config.getOrThrow('STRIPE_WEBHOOK_SECRET'),
    );
    if (event.type !== 'checkout.session.completed') return null;
    const session = event.data.object;
    return session.payment_status === 'paid' ? session.metadata?.orderId : null;
  }
}
