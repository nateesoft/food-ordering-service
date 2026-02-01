import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueueItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  menuItemId: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 120 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'dine-in' })
  @IsString()
  diningOption: string;

  @ApiPropertyOptional({ example: 'No onion' })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  selectedAddOns?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  selectedAddOnGroups?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  selectedNestedOptions?: string;
}

export class CreateQueueTicketDto {
  @ApiProperty({ example: 'dine-in', enum: ['dine-in', 'takeaway'] })
  @IsString()
  orderType: string;

  @ApiProperty({ example: 350 })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  totalItems: number;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ example: 'M001' })
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional({
    example: 'cash',
    enum: ['cash', 'credit-card', 'qr-code', 'mobile-banking'],
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ description: 'Cart items', type: [QueueItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QueueItemDto)
  items: QueueItemDto[];
}
