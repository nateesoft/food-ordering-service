import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateQrDto {
  @ApiProperty({ example: '305f0845-629c-4823-bb79-d07997407f9e' })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({ example: 'T01' })
  @IsString()
  @IsNotEmpty()
  tableNumber: string;
}
