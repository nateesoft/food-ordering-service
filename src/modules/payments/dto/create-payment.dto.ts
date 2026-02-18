import { IsNumber, IsOptional, IsString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class SplitPaymentItemDto {
  @ApiProperty({ enum: PaymentMethod, example: 'CASH' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 500 })
  @IsNumber()
  amount: number;
}

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

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  shiftId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Promotion ID to apply' })
  @IsNumber()
  @IsOptional()
  promotionId?: number;

  @ApiPropertyOptional({ example: 'WELCOME50', description: 'Coupon code to apply' })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({ example: 35, description: 'Service charge amount' })
  @IsNumber()
  @IsOptional()
  serviceCharge?: number;

  @ApiPropertyOptional({ example: 26.95, description: 'VAT amount' })
  @IsNumber()
  @IsOptional()
  vat?: number;

  @ApiPropertyOptional({
    example: [{ method: 'CASH', amount: 500 }, { method: 'TRANSFER', amount: 800 }],
    description: 'Split payment details for multiple payment methods',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitPaymentItemDto)
  splitPayments?: SplitPaymentItemDto[];
}
