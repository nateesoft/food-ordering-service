import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ description: 'Branch name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Branch code (unique)' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Branch address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Branch phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Branch logo URL' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Theme mode for customer-facing UI', enum: ['LIGHT', 'DARK'] })
  @IsOptional()
  @IsIn(['LIGHT', 'DARK'])
  themeMode?: 'LIGHT' | 'DARK';
}
