import { PaymentMethod } from '@prisma/client';

export interface InitiatePaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface GatewayPaymentResponse {
  transactionId: string;
  status: string;
  qrCodeData?: string;
  redirectUrl?: string;
  expiresAt?: Date;
}

export interface PaymentStatusResponse {
  transactionId: string;
  status: string;
  amount: number;
  completedAt?: Date;
  providerRef?: string;
}

export interface PaymentGatewayProvider {
  readonly providerName: string;
  initiatePayment(request: InitiatePaymentRequest): Promise<GatewayPaymentResponse>;
  checkStatus(transactionId: string): Promise<PaymentStatusResponse>;
  refund(transactionId: string): Promise<PaymentStatusResponse>;
}
