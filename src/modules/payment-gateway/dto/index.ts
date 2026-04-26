import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Payment amount', example: 350.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Currency', example: 'THB' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class SimulateCompleteDto {
  // No additional fields needed - txnId comes from URL param
}
