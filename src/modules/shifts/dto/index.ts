import { IsNumber, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenShiftDto {
  @ApiProperty({ example: '1234' })
  @IsString()
  pin: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  openingAmount: number;

  @ApiPropertyOptional({
    example: { '1000': 2, '500': 4, '100': 5, '50': 4, '20': 5 },
  })
  @IsObject()
  @IsOptional()
  openingCashCount?: Record<string, number>;

  @ApiPropertyOptional({ example: 'เปิดกะเช้า' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CloseShiftDto {
  @ApiProperty({ example: 15000 })
  @IsNumber()
  closingAmount: number;

  @ApiPropertyOptional({
    example: { '1000': 10, '500': 6, '100': 15, '50': 8, '20': 10 },
  })
  @IsObject()
  @IsOptional()
  closingCashCount?: Record<string, number>;

  @ApiPropertyOptional({ example: 'ปิดกะเย็น' })
  @IsString()
  @IsOptional()
  notes?: string;
}
