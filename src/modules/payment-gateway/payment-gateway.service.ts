import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MockPaymentProvider } from './providers/mock.provider';
import { InitiatePaymentDto } from './dto';
import { GatewayTransactionStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private provider: MockPaymentProvider;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {
    this.provider = new MockPaymentProvider();
  }

  async initiatePayment(dto: InitiatePaymentDto, branchId?: number) {
    const result = await this.provider.initiatePayment({
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      currency: dto.currency,
    });

    const transaction = await this.prisma.gatewayTransaction.create({
      data: {
        transactionId: result.transactionId,
        paymentMethod: dto.paymentMethod,
        amount: dto.amount,
        currency: dto.currency || 'THB',
        status: GatewayTransactionStatus.PENDING,
        provider: this.provider.providerName,
        qrCodeData: result.qrCodeData,
        branchId,
      },
    });

    return {
      transactionId: transaction.transactionId,
      status: transaction.status,
      qrCodeData: result.qrCodeData,
      expiresAt: result.expiresAt,
    };
  }

  async checkStatus(transactionId: string) {
    const transaction = await this.prisma.gatewayTransaction.findUnique({
      where: { transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    // If already completed/failed in DB, return directly
    if (transaction.status !== GatewayTransactionStatus.PENDING) {
      return {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: transaction.amount,
        completedAt: transaction.completedAt,
      };
    }

    // Check with provider
    const providerStatus = await this.provider.checkStatus(transactionId);

    if (providerStatus.status === 'COMPLETED' && transaction.status === GatewayTransactionStatus.PENDING) {
      await this.prisma.gatewayTransaction.update({
        where: { transactionId },
        data: {
          status: GatewayTransactionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      this.eventEmitter.emit('gateway.payment.completed', {
        data: { ...transaction, status: 'COMPLETED' },
        branchId: transaction.branchId,
      });

      return {
        transactionId,
        status: 'COMPLETED',
        amount: transaction.amount,
        completedAt: new Date(),
      };
    }

    return {
      transactionId,
      status: transaction.status,
      amount: transaction.amount,
    };
  }

  async simulateComplete(transactionId: string) {
    const transaction = await this.prisma.gatewayTransaction.findUnique({
      where: { transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    this.provider.simulateComplete(transactionId);

    const updated = await this.prisma.gatewayTransaction.update({
      where: { transactionId },
      data: {
        status: GatewayTransactionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    this.eventEmitter.emit('gateway.payment.completed', {
      data: updated,
      branchId: updated.branchId,
    });

    return {
      transactionId: updated.transactionId,
      status: updated.status,
      amount: updated.amount,
      completedAt: updated.completedAt,
    };
  }

  async findAll(branchId?: number) {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    return this.prisma.gatewayTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
