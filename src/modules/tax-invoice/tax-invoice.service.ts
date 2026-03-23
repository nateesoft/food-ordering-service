import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaxInvoiceDto, VoidTaxInvoiceDto, UpdateCompanyTaxInfoDto } from './dto';

@Injectable()
export class TaxInvoiceService {
  constructor(private prisma: PrismaService) {}

  // === Invoice Number Generation ===
  private async generateInvoiceNumber(branchId?: number): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `IV-${yearMonth}-`;

    const lastInvoice = await this.prisma.taxInvoice.findFirst({
      where: {
        invoiceNumber: { startsWith: prefix },
        branchId: branchId || null,
      },
      orderBy: { invoiceNumber: 'desc' },
    });

    let nextNum = 1;
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0', 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  // === Tax Invoice CRUD ===
  async create(dto: CreateTaxInvoiceDto, branchId?: number) {
    // Fetch payment data
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: {
        order: { include: { items: { include: { menuItem: true } } } },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ID ${dto.paymentId} not found`);
    }

    if (payment.paymentStatus !== 'PAID') {
      throw new BadRequestException('Cannot create tax invoice for unpaid payment');
    }

    // Check if invoice already exists for this payment
    const existing = await this.prisma.taxInvoice.findFirst({
      where: { paymentId: dto.paymentId, voidedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`Tax invoice already exists: ${existing.invoiceNumber}`);
    }

    const invoiceNumber = await this.generateInvoiceNumber(branchId);

    // Build items JSON
    const items = payment.order?.items.map((item) => ({
      name: item.menuItem?.name || 'Unknown',
      quantity: item.quantity,
      unitPrice: item.price,
      amount: item.price * item.quantity,
    })) || [];

    const vatRate = 0.07;
    const subtotalBeforeVat = payment.totalAmount / (1 + vatRate);
    const vatAmount = payment.totalAmount - subtotalBeforeVat;

    const invoice = await this.prisma.taxInvoice.create({
      data: {
        invoiceNumber,
        paymentId: dto.paymentId,
        receiptNumber: payment.receiptNumber,
        buyerName: dto.buyerName,
        buyerTaxId: dto.buyerTaxId,
        buyerAddress: dto.buyerAddress,
        buyerBranch: dto.buyerBranch || '00000',
        subtotal: Math.round(subtotalBeforeVat * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        totalAmount: payment.totalAmount,
        items,
        branchId,
      },
    });

    return invoice;
  }

  async findAll(branchId?: number, startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) where.issuedAt.gte = startDate;
      if (endDate) where.issuedAt.lte = endDate;
    }

    return this.prisma.taxInvoice.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const invoice = await this.prisma.taxInvoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Tax invoice ID ${id} not found`);
    return invoice;
  }

  async voidInvoice(id: number, dto: VoidTaxInvoiceDto) {
    const invoice = await this.findOne(id);
    if (invoice.voidedAt) {
      throw new BadRequestException('Invoice already voided');
    }

    return this.prisma.taxInvoice.update({
      where: { id },
      data: { voidedAt: new Date(), voidReason: dto.reason },
    });
  }

  // === Company Tax Info ===
  async getCompanyInfo(branchId?: number) {
    return this.prisma.companyTaxInfo.findFirst({
      where: { branchId: branchId || null },
    });
  }

  async upsertCompanyInfo(dto: UpdateCompanyTaxInfoDto, branchId?: number) {
    const existing = await this.prisma.companyTaxInfo.findFirst({
      where: { branchId: branchId || null },
    });

    if (existing) {
      return this.prisma.companyTaxInfo.update({
        where: { id: existing.id },
        data: { ...dto, branchId },
      });
    }

    return this.prisma.companyTaxInfo.create({
      data: { ...dto, branchId },
    });
  }
}
