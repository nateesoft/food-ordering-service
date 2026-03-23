import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaxInvoiceDto {
  @ApiProperty({ description: 'Payment ID to create invoice for' })
  @IsNumber()
  paymentId: number;

  @ApiProperty({ description: 'Buyer company/person name' })
  @IsString()
  buyerName: string;

  @ApiProperty({ description: 'Buyer tax ID (13 digits)' })
  @IsString()
  buyerTaxId: string;

  @ApiProperty({ description: 'Buyer address' })
  @IsString()
  buyerAddress: string;

  @ApiPropertyOptional({ description: 'Buyer branch number', default: '00000' })
  @IsOptional()
  @IsString()
  buyerBranch?: string;
}

export class VoidTaxInvoiceDto {
  @ApiProperty({ description: 'Reason for voiding' })
  @IsString()
  reason: string;
}

export class UpdateCompanyTaxInfoDto {
  @ApiProperty()
  @IsString()
  companyName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyNameEn?: string;

  @ApiProperty({ description: 'Tax ID (13 digits)' })
  @IsString()
  taxId: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ default: '00000' })
  @IsOptional()
  @IsString()
  branchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchName?: string;

  @IsOptional()
  isHeadOffice?: boolean;
}
