import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  ingredientId: number;

  @ApiProperty({ example: 500, description: 'Amount to add (positive) or remove (negative)' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ enum: ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'], example: 'STOCK_IN' })
  @IsString()
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';

  @ApiPropertyOptional({ example: 'Weekly restock delivery' })
  @IsString()
  @IsOptional()
  notes?: string;
}
