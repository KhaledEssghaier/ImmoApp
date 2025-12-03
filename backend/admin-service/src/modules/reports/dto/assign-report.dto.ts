import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignReportDto {
  @ApiProperty({ description: 'Admin user ID to assign the report to' })
  @IsMongoId()
  @IsNotEmpty()
  assignedTo: string;
}
