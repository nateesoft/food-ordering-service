import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceRequestType } from '@prisma/client';

export class CreateServiceRequestDto {
  @ApiProperty({ enum: ServiceRequestType, example: ServiceRequestType.STAFF })
  @IsEnum(ServiceRequestType)
  type: ServiceRequestType;

  @ApiPropertyOptional({ example: 'T01' })
  @IsString()
  @IsOptional()
  tableNumber?: string;

  @ApiPropertyOptional({ example: 'Need more napkins' })
  @IsString()
  @IsOptional()
  details?: string;

  @ApiPropertyOptional({ type: [String], example: ['fork', 'spoon'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  items?: string[];
}
