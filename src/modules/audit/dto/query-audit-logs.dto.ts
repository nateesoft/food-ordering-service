import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ enum: ['ORDER', 'ORDER_ITEM', 'PAYMENT'] })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  entityId?: number;

  @ApiPropertyOptional({
    enum: [
      'ORDER_CREATED',
      'ORDER_STATUS_CHANGED',
      'ORDER_CANCELLED',
      'ORDER_ITEM_STATUS_CHANGED',
      'ORDER_SPLIT',
      'PAYMENT_CREATED',
      'PAYMENT_MERGED',
      'PAYMENT_REFUNDED',
    ],
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  performedBy?: string;

  @ApiPropertyOptional({ example: '2026-02-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-02-28' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
