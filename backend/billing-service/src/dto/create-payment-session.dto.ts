import { IsEnum, IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';
import { PaymentType } from '../schemas/payment.schema';

export class CreatePaymentSessionDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsEnum(PaymentType)
  @IsNotEmpty()
  type: PaymentType;

  @IsMongoId()
  @IsOptional()
  propertyId?: string;

  @IsOptional()
  metadata?: any;
}
