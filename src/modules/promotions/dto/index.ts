import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionType, PromotionStatus } from '@prisma/client';

export class CreatePromotionDto {
  @ApiProperty({ example: 'ลด 10% ทุกเมนู' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'โปรโมชันพิเศษสำหรับลูกค้าใหม่' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PromotionType, example: 'PERCENTAGE' })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiProperty({ example: 10.0, description: 'Percentage value or fixed amount' })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ example: 100, description: 'Max discount for percentage type' })
  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @ApiPropertyOptional({ example: 'WELCOME50', description: 'Coupon code (for COUPON type)' })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: '14:00', description: 'Start time for HAPPY_HOUR (HH:mm)' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00', description: 'End time for HAPPY_HOUR (HH:mm)' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: 200, description: 'Minimum order amount' })
  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: ['อาหารจานเดียว', 'เครื่องดื่ม'] })
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ example: 100, description: 'Max number of uses (null = unlimited)' })
  @IsNumber()
  @IsOptional()
  maxUses?: number;
}

export class UpdatePromotionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: PromotionType })
  @IsEnum(PromotionType)
  @IsOptional()
  type?: PromotionType;

  @ApiPropertyOptional({ enum: PromotionStatus })
  @IsEnum(PromotionStatus)
  @IsOptional()
  status?: PromotionStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxUses?: number;
}

export class ValidateCouponDto {
  @ApiProperty({ example: 'WELCOME50' })
  @IsString()
  couponCode: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  subtotal: number;
}
