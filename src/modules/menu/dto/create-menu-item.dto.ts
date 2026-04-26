import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MenuType } from '@prisma/client';

class SetComponentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  quantity?: number;
}

export class CreateMenuItemDto {
  @ApiProperty({ example: 'PT001' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Pad Thai' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Thai Food' })
  @IsString()
  category: string;

  @ApiProperty({ example: 120 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ enum: MenuType, default: MenuType.SINGLE })
  @IsEnum(MenuType)
  @IsOptional()
  type?: MenuType;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [SetComponentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetComponentDto)
  @IsOptional()
  setComponents?: SetComponentDto[];

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  addOnIds?: number[];

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  addOnGroupIds?: number[];
}
