import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenTableSessionDto {
  @ApiProperty({ example: 'สมชาย' })
  @IsString()
  openedBy: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  customerCount?: number;

  @ApiPropertyOptional({ example: 'male', enum: ['male', 'female', 'mixed'] })
  @IsString()
  @IsOptional()
  customerGender?: string;

  @ApiPropertyOptional({ example: 'thai', enum: ['thai', 'foreign', 'mixed'] })
  @IsString()
  @IsOptional()
  customerNationality?: string;

  @ApiPropertyOptional({ example: 'dine_in', enum: ['dine_in', 'takeaway', 'delivery'] })
  @IsString()
  @IsOptional()
  orderType?: string;

  @ApiPropertyOptional({ example: '1fcd142e-b993-4de0-bb10-232ecc282560', description: 'UUID from QR code URL ?sessionId=' })
  @IsUUID()
  @IsOptional()
  sessionId?: string;
}
