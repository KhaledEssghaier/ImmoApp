import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentSessionDto } from '../../dto/create-payment-session.dto';
import { QueryPaymentsDto } from '../../dto/query-payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-session')
  createSession(@Body() dto: CreatePaymentSessionDto) {
    return this.paymentsService.createPaymentSession(dto);
  }

  @Get('success')
  paymentSuccess(@Query('session_id') sessionId: string) {
    return {
      success: true,
      message: 'Payment completed successfully',
      sessionId,
      redirectUrl: 'appimmo://payment/success'
    };
  }

  @Get('cancel')
  paymentCancel(@Query('session_id') sessionId: string) {
    return {
      success: false,
      message: 'Payment cancelled',
      sessionId,
      redirectUrl: 'appimmo://payment/cancel'
    };
  }

  @Get('user/:userId')
  getUserPayments(@Param('userId') userId: string, @Query() query: QueryPaymentsDto) {
    return this.paymentsService.findByUserId(userId, query);
  }

  @Get(':id')
  getPayment(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
