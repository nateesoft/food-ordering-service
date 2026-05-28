import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
}

export class UpdateCustomerPlanDto {
  @ApiProperty({ enum: PlanType, description: 'แผนการใช้งาน' })
  @IsEnum(PlanType)
  plan: PlanType;
}
