import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  menuItemId: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 120 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 'No spicy' })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiProperty({ example: 'dine-in', enum: ['dine-in', 'takeaway'] })
  @IsString()
  diningOption: string;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  selectedAddOns?: any;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  selectedAddOnGroups?: any;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  selectedNestedOptions?: any;
}

export class CreateOrderDto {
  @ApiProperty({ example: 350 })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  totalItems: number;

  @ApiPropertyOptional({ example: 'T01' })
  @IsString()
  @IsOptional()
  tableNumber?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
