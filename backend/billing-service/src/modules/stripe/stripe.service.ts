import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentType } from '../../schemas/payment.schema';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(
    userId: string,
    type: PaymentType,
    propertyId?: string,
  ): Promise<Stripe.Checkout.Session> {
    try {
      const priceId = type === PaymentType.SINGLE_POST
        ? this.configService.get<string>('stripe.singlePostPriceId')
        : this.configService.get<string>('stripe.subscriptionPriceId');

      if (!priceId) {
        throw new BadRequestException(`Price ID not configured for ${type}`);
      }

      const successUrl = this.configService.get<string>('app.successUrl');
      const cancelUrl = this.configService.get<string>('app.cancelUrl');

      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: {
          userId,
          type,
          ...(propertyId && { propertyId }),
        },
      });

      this.logger.log(`Created checkout session: ${session.id} for user: ${userId}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new BadRequestException(`Failed to create payment session: ${error.message}`);
    }
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException(`Webhook signature verification failed: ${error.message}`);
    }
  }

  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  async refundPayment(paymentIntentId: string): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
      this.logger.log(`Refund created: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw new BadRequestException(`Failed to refund payment: ${error.message}`);
    }
  }
}
