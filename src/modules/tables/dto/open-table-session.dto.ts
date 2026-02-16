import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
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
}
