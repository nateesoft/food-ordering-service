import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConsoleLoginDto {
  @ApiProperty({ example: 'owner@myrestaurant.com' })
  @IsEmail({}, { message: 'username ต้องเป็น email ที่ถูกต้อง' })
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
