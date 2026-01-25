import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableStatus } from '@prisma/client';

export class CreateTableDto {
  @ApiProperty({ example: 'T01' })
  @IsString()
  number: string;

  @ApiProperty({ example: 4 })
  @IsNumber()
  capacity: number;

  @ApiProperty({ example: 'medium', enum: ['small', 'medium', 'large'] })
  @IsString()
  size: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  positionX: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  positionY: number;

  @ApiPropertyOptional({ enum: TableStatus, default: TableStatus.AVAILABLE })
  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currentGuests?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  mergedWith?: number[];
}
