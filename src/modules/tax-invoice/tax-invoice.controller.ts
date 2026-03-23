import { Controller, Post, Get, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TaxInvoiceService } from './tax-invoice.service';
import { CreateTaxInvoiceDto, VoidTaxInvoiceDto, UpdateCompanyTaxInfoDto } from './dto';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Tax Invoice')
@Controller('tax-invoices')
export class TaxInvoiceController {
  constructor(private readonly taxInvoiceService: TaxInvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Create tax invoice' })
  create(@Body() dto: CreateTaxInvoiceDto, @BranchId() branchId?: number) {
    return this.taxInvoiceService.create(dto, branchId);
  }

  @Get()
  @ApiOperation({ summary: 'List tax invoices' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @BranchId() branchId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.taxInvoiceService.findAll(
      branchId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax invoice by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taxInvoiceService.findOne(id);
  }

  @Post(':id/void')
  @ApiOperation({ summary: 'Void tax invoice' })
  voidInvoice(@Param('id', ParseIntPipe) id: number, @Body() dto: VoidTaxInvoiceDto) {
    return this.taxInvoiceService.voidInvoice(id, dto);
  }

  // === Company Tax Info ===

  @Get('company/info')
  @ApiOperation({ summary: 'Get company tax info' })
  getCompanyInfo(@BranchId() branchId?: number) {
    return this.taxInvoiceService.getCompanyInfo(branchId);
  }

  @Post('company/info')
  @ApiOperation({ summary: 'Create or update company tax info' })
  upsertCompanyInfo(@Body() dto: UpdateCompanyTaxInfoDto, @BranchId() branchId?: number) {
    return this.taxInvoiceService.upsertCompanyInfo(dto, branchId);
  }
}
