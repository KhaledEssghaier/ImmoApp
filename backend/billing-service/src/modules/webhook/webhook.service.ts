import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { firstValueFrom } from 'rxjs';
import Stripe from 'stripe';
import { StripeService } from '../stripe/stripe.service';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentStatus, PaymentType } from '../../schemas/payment.schema';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private stripeService: StripeService,
    private paymentsService: PaymentsService,
    private subscriptionsService: SubscriptionsService,
    private configService: ConfigService,
    private httpService: HttpService,
    private eventEmitter: EventEmitter2,
  ) {}

  async handleStripeEvent(rawBody: Buffer, signature: string): Promise<void> {
    // Construct and verify the event
    const event = await this.stripeService.constructWebhookEvent(rawBody, signature);

    this.logger.log(`Received Stripe event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const { id: sessionId, metadata, payment_intent } = session;

      if (!metadata || !metadata.userId) {
        this.logger.error(`Missing metadata in session: ${sessionId}`);
        return;
      }

      const { userId, type, propertyId } = metadata;

      // Update payment status
      const payment = await this.paymentsService.updatePaymentStatus(
        sessionId,
        PaymentStatus.SUCCESS,
        payment_intent as string,
      );

      this.logger.log(`Payment successful: ${payment._id}`);

      // Handle based on payment type
      if (type === PaymentType.SUBSCRIPTION) {
        // Create subscription
        const subscription = await this.subscriptionsService.createSubscription(
          userId,
          payment._id.toString(),
        );

        // Send notification
        await this.sendNotification(userId, {
          type: 'payment_success',
          title: 'Subscription Activated',
          message: `Your subscription is now active with ${subscription.totalCredits} post credits!`,
          data: { subscriptionId: subscription._id.toString() },
        });

        this.logger.log(`Subscription created: ${subscription._id}`);
      } else if (type === PaymentType.SINGLE_POST) {
        // Publish property
        if (propertyId) {
          await this.publishProperty(propertyId);
        }

        // Send notification
        await this.sendNotification(userId, {
          type: 'payment_success',
          title: 'Payment Successful',
          message: 'Your property has been published successfully!',
          data: { propertyId, paymentId: payment._id.toString() },
        });

        this.logger.log(`Property published: ${propertyId}`);
      }

      // Emit payment success event
      this.eventEmitter.emit('payment.success', {
        userId,
        type,
        paymentId: payment._id.toString(),
        propertyId,
      });
    } catch (error) {
      this.logger.error(`Failed to handle checkout session completed: ${error.message}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
    // Additional handling if needed
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.error(`Payment intent failed: ${paymentIntent.id}`);
    
    // Try to find and update payment
    try {
      const payment = await this.paymentsService.findBySessionId(paymentIntent.id);
      if (payment) {
        await this.paymentsService.updatePaymentStatus(
          payment.stripeSessionId,
          PaymentStatus.FAILED,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to update failed payment: ${error.message}`);
    }
  }

  private async publishProperty(propertyId: string): Promise<void> {
    try {
      const propertyServiceUrl = this.configService.get<string>('services.property.url');
      const internalKey = this.configService.get<string>('security.internalApiKey');

      await firstValueFrom(
        this.httpService.patch(
          `${propertyServiceUrl}/api/v1/properties/${propertyId}/publish`,
          { draft: false },
          { headers: { 'X-Internal-Key': internalKey } },
        ),
      );

      this.logger.log(`Property ${propertyId} published via property-service`);
    } catch (error) {
      this.logger.error(`Failed to publish property: ${error.message}`);
      throw error;
    }
  }

  private async sendNotification(userId: string, notification: any): Promise<void> {
    try {
      const notificationServiceUrl = this.configService.get<string>('services.notification.url');
      const notificationKey = this.configService.get<string>('security.notificationInternalKey');

      await firstValueFrom(
        this.httpService.post(
          `${notificationServiceUrl}/api/v1/notifications`,
          {
            userId,
            ...notification,
            channel: ['inapp', 'push'],
          },
          { headers: { 'X-Internal-Key': notificationKey } },
        ),
      );

      this.logger.log(`Notification sent to user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      // Don't throw - notification failure shouldn't break payment flow
    }
  }
}
