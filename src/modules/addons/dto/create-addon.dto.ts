import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddOnDto {
  @ApiProperty({ example: 'Extra Egg' })
  @IsString()
  name: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'topping' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
