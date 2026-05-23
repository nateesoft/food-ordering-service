import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConsoleForgotPasswordDto {
  @ApiProperty({ example: 'owner@myrestaurant.com' })
  @IsEmail({}, { message: 'กรุณากรอก email ที่ถูกต้อง' })
  username: string;
}

export class ConsoleResetPasswordDto {
  @ApiProperty({ example: 'reset-token-uuid' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'newpassword123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'password ต้องมีอย่างน้อย 6 ตัวอักษร' })
  password: string;
}
