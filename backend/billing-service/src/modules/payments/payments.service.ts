import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus, PaymentType } from '../../schemas/payment.schema';
import { StripeService } from '../stripe/stripe.service';
import { CreatePaymentSessionDto } from '../../dto/create-payment-session.dto';
import { QueryPaymentsDto } from '../../dto/query-payments.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private stripeService: StripeService,
  ) {}

  async createPaymentSession(dto: CreatePaymentSessionDto): Promise<{ url: string; sessionId: string }> {
    try {
      // Create Stripe checkout session
      const session = await this.stripeService.createCheckoutSession(
        dto.userId,
        dto.type,
        dto.propertyId,
      );

      // Create payment record
      const payment = new this.paymentModel({
        userId: new Types.ObjectId(dto.userId),
        type: dto.type,
        amount: dto.type === PaymentType.SINGLE_POST ? 10 : 50,
        status: PaymentStatus.PENDING,
        stripeSessionId: session.id,
        propertyId: dto.propertyId ? new Types.ObjectId(dto.propertyId) : undefined,
        metadata: dto.metadata,
      });

      await payment.save();

      this.logger.log(`Payment created: ${payment._id} for session: ${session.id}`);

      return {
        url: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment session: ${error.message}`);
      throw error;
    }
  }

  async updatePaymentStatus(
    sessionId: string,
    status: PaymentStatus,
    stripePaymentIntentId?: string,
  ): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ stripeSessionId: sessionId });

    if (!payment) {
      throw new NotFoundException(`Payment not found for session: ${sessionId}`);
    }

    payment.status = status;
    if (stripePaymentIntentId) {
      payment.stripePaymentIntentId = stripePaymentIntentId;
    }
    if (status === PaymentStatus.SUCCESS) {
      payment.paidAt = new Date();
    }

    await payment.save();

    this.logger.log(`Payment ${payment._id} updated to ${status}`);

    return payment;
  }

  async findBySessionId(sessionId: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ stripeSessionId: sessionId });
    if (!payment) {
      throw new NotFoundException(`Payment not found for session: ${sessionId}`);
    }
    return payment;
  }

  async findByUserId(userId: string, query: QueryPaymentsDto): Promise<{ data: Payment[]; total: number }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Only return successful payments (completed transactions)
    const filter = { 
      userId: new Types.ObjectId(userId),
      status: PaymentStatus.SUCCESS 
    };

    const [data, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter),
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }
}
