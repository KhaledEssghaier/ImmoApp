import { Controller, Post, Headers, RawBodyRequest, Req, BadRequestException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.error('Missing raw body');
      throw new BadRequestException('Missing raw body');
    }

    try {
      await this.webhookService.handleStripeEvent(rawBody, signature);
      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      throw error;
    }
  }
}
