import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TableRegistrationDto {
  @ApiProperty({ example: 'A1' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;
}

export class BranchRegistrationDto {
  @ApiProperty({ example: 'สาขาสยาม' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'ชั้น 3 สยามพารากอน' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '02-XXX-XXXX' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: [TableRegistrationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TableRegistrationDto)
  tables?: TableRegistrationDto[];
}

export class MenuRegistrationDto {
  @ApiProperty({ example: 'ข้าวผัดกุ้ง' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'อาหารจานเดียว' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 89 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'ข้าวผัดกุ้งสูตรพิเศษ' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ConsoleRegisterDto {
  // Account (required)
  @ApiProperty({ example: 'owner@myrestaurant.com' })
  @IsEmail({}, { message: 'username ต้องเป็น email ที่ถูกต้อง' })
  username: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'password ต้องมีอย่างน้อย 6 ตัวอักษร' })
  password: string;

  // Company (required)
  @ApiProperty({ example: 'บริษัท อร่อย จำกัด' })
  @IsString()
  @IsNotEmpty({ message: 'ชื่อบริษัทจำเป็นต้องกรอก' })
  companyName: string;

  @ApiPropertyOptional({ example: '123 ถนนสุขุมวิท' })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiPropertyOptional({ example: '02-XXX-XXXX' })
  @IsOptional()
  @IsString()
  companyPhone?: string;

  @ApiPropertyOptional({ example: 'contact@company.com' })
  @IsOptional()
  @IsEmail()
  companyEmail?: string;

  // Optional data
  @ApiPropertyOptional({ type: [BranchRegistrationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchRegistrationDto)
  branches?: BranchRegistrationDto[];

  @ApiPropertyOptional({ type: [MenuRegistrationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuRegistrationDto)
  menus?: MenuRegistrationDto[];
}
