import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QueueStatus } from '@prisma/client';

export class UpdateQueueStatusDto {
  @ApiProperty({ enum: QueueStatus, example: QueueStatus.READY })
  @IsEnum(QueueStatus)
  status: QueueStatus;
}
