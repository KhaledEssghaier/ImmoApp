import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class DeductCreditDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsMongoId()
  propertyId?: string;
}
