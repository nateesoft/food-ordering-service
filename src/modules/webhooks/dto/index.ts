import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsUrl,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WebhookEvent } from '@prisma/client';

export class CreateWebhookDto {
  @ApiProperty({ example: 'Kitchen Display System' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://example.com/webhook' })
  @IsUrl({ require_tld: false })
  url: string;

  @ApiProperty({
    enum: WebhookEvent,
    isArray: true,
    example: ['ORDER_CREATED', 'ORDER_STATUS_CHANGED'],
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: { Authorization: 'Bearer token123' } })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ example: 'Webhook for KDS integration' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateWebhookDto {
  @ApiPropertyOptional({ example: 'Kitchen Display System' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/webhook' })
  @IsUrl({ require_tld: false })
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    enum: WebhookEvent,
    isArray: true,
    example: ['ORDER_CREATED'],
  })
  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  @IsOptional()
  events?: WebhookEvent[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
