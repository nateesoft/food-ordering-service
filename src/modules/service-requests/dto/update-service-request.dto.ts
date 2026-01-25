import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceRequestStatus } from '@prisma/client';

export class UpdateServiceRequestDto {
  @ApiProperty({
    enum: ServiceRequestStatus,
    example: ServiceRequestStatus.COMPLETED,
  })
  @IsEnum(ServiceRequestStatus)
  status: ServiceRequestStatus;
}
