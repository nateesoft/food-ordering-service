import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ example: 'cash', enum: ['cash', 'credit-card', 'qr-code', 'mobile-banking'] })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ description: 'Cart items as JSON' })
  items: Record<string, any>;
}
