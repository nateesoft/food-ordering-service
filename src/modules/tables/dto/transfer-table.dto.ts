import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferTableDto {
  @ApiProperty({ example: 5, description: 'ID ของโต๊ะปลายทาง' })
  @IsNumber()
  toTableId: number;

  @ApiPropertyOptional({ example: 'สมชาย', description: 'ชื่อแคชเชียร์ที่ดำเนินการ' })
  @IsString()
  @IsOptional()
  performedBy?: string;
}
