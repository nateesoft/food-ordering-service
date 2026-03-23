import { IsString, IsArray, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKDSStationDto {
  @ApiProperty({ description: 'Station name', example: 'Grill Station' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Menu categories for this station', example: ['ปิ้งย่าง', 'สเต็ก'] })
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiPropertyOptional({ description: 'Station color', example: '#EF4444' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Alert timeout in seconds', example: 300 })
  @IsOptional()
  @IsNumber()
  @Min(60)
  alertTimeout?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateKDSStationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  alertTimeout?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class BumpItemDto {
  @ApiProperty({ description: 'New status', example: 'COMPLETED' })
  @IsString()
  status: string;
}
