import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPinDto {
  @ApiProperty({
    description: 'New PIN code (4-6 digits)',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6)
  pin: string;
}
