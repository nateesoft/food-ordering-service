import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IngredientUnit } from '@prisma/client';

export class CreateIngredientDto {
  @ApiProperty({ example: 'ข้าวสาร' })
  @IsString()
  name: string;

  @ApiProperty({ enum: IngredientUnit, example: 'GRAM' })
  @IsEnum(IngredientUnit)
  unit: IngredientUnit;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  currentStock?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 0.05 })
  @IsNumber()
  @IsOptional()
  costPerUnit?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
