import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';
import { SplitPaymentItemDto } from './create-payment.dto';

export class CreateMergedPaymentDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of order IDs to merge into one bill',
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  orderIds: number[];

  @ApiProperty({ enum: PaymentMethod, example: 'CASH' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 500 })
  @IsNumber()
  paidAmount: number;

  @ApiPropertyOptional({ example: 'M001' })
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @IsOptional()
  discountPoints?: number;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  cashierName?: string;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional({
    example: 'WELCOME50',
    description: 'Coupon code to apply',
  })
  @IsString()
  @IsOptional()
  couponCode?: string;

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
