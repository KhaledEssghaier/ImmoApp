import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentRedirectController } from './payment-redirect.controller';
import { PaymentsService } from './payments.service';
import { Payment, PaymentSchema } from '../../schemas/payment.schema';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    StripeModule,
  ],
  controllers: [PaymentsController, PaymentRedirectController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
