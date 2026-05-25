import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateQrDto {
  @ApiProperty({ example: '305f0845-629c-4823-bb79-d07997407f9e' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'T01' })
  @IsString()
  @IsNotEmpty()
  tableNumber: string;

  @ApiPropertyOptional({ example: 'http://192.168.1.100:3333' })
  @IsString()
  @IsOptional()
  baseUrl?: string;
}
