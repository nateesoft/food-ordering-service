import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

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
}
