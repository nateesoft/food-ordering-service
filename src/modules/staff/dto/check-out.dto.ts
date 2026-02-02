import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckOutDto {
  @ApiProperty({
    description: 'Staff PIN code (4-6 digits)',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6)
  pin: string;

  @ApiProperty({
    description: 'Table number to check out from',
    example: 'A1',
  })
  @IsString()
  @IsNotEmpty()
  tableNumber: string;
}
