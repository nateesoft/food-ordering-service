import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentGatewayProvider,
  InitiatePaymentRequest,
  GatewayPaymentResponse,
  PaymentStatusResponse,
} from '../interfaces/payment-gateway.interface';

// Map to track mock transaction states
const mockTransactions = new Map<string, {
  status: string;
  amount: number;
  paymentMethod: string;
  createdAt: Date;
  autoCompleteAt: Date;
}>();

@Injectable()
export class MockPaymentProvider implements PaymentGatewayProvider {
  private readonly logger = new Logger(MockPaymentProvider.name);

  readonly providerName = 'mock';

  async initiatePayment(request: InitiatePaymentRequest): Promise<GatewayPaymentResponse> {
    const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Generate mock PromptPay QR data
    let qrCodeData: string | undefined;
    if (request.paymentMethod === 'TRANSFER') {
      // PromptPay-like payload (mock)
      qrCodeData = this.generatePromptPayQR(request.amount, transactionId);
    }

    // Store mock transaction with auto-complete after 10 seconds
    mockTransactions.set(transactionId, {
      status: 'PENDING',
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      createdAt: new Date(),
      autoCompleteAt: new Date(Date.now() + 10000),
    });

    this.logger.log(`Mock payment initiated: ${transactionId} for ${request.amount} THB via ${request.paymentMethod}`);

    return {
      transactionId,
      status: 'PENDING',
      qrCodeData,
      expiresAt: new Date(Date.now() + 300000), // 5 min expiry
    };
  }

  async checkStatus(transactionId: string): Promise<PaymentStatusResponse> {
    const txn = mockTransactions.get(transactionId);

    if (!txn) {
      return { transactionId, status: 'NOT_FOUND', amount: 0 };
    }

    // Auto-complete if past the auto-complete time
    if (txn.status === 'PENDING' && new Date() >= txn.autoCompleteAt) {
      txn.status = 'COMPLETED';
    }

    return {
      transactionId,
      status: txn.status,
      amount: txn.amount,
      completedAt: txn.status === 'COMPLETED' ? new Date() : undefined,
    };
  }

  async refund(transactionId: string): Promise<PaymentStatusResponse> {
    const txn = mockTransactions.get(transactionId);

    if (!txn) {
      return { transactionId, status: 'NOT_FOUND', amount: 0 };
    }

    txn.status = 'REFUNDED';

    return {
      transactionId,
      status: 'REFUNDED',
      amount: txn.amount,
    };
  }

  // Simulate completion (for testing)
  simulateComplete(transactionId: string): boolean {
    const txn = mockTransactions.get(transactionId);
    if (txn && txn.status === 'PENDING') {
      txn.status = 'COMPLETED';
      return true;
    }
    return false;
  }

  private generatePromptPayQR(amount: number, txnId: string): string {
    // Generate a mock PromptPay-like QR string
    // Real PromptPay uses EMVCo QR format
    const amountStr = amount.toFixed(2);
    return `00020101021230700016A00000067701011201130066000000001` +
      `0215${txnId}5303764` +
      `5405${amountStr}5802TH` +
      `6304`;
  }
}
