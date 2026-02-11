import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  orderId: number;

  @ApiProperty({ enum: PaymentMethod, example: 'CASH' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 500 })
  @IsNumber()
  paidAmount: number;

  @ApiPropertyOptional({ example: 'M1ABC2DEF' })
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @IsOptional()
  discountPoints?: number;

  @ApiPropertyOptional({ example: 'สมชาย' })
  @IsString()
  @IsOptional()
  cashierName?: string;

  @ApiPropertyOptional({ example: 'ลูกค้าขอใบกำกับภาษี' })
  @IsString()
  @IsOptional()
  note?: string;
}
