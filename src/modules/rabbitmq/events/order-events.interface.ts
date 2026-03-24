export interface RabbitMQMessageEnvelope<T> {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  source: string;
  branchId: number | null;
  payload: T;
}

export interface OrderCreatedPayload {
  orderId: string;
  internalId: number;
  tableNumber: string | null;
  status: string;
  totalAmount: number;
  totalItems: number;
  itemCount: number;
  createdAt: string;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  internalId: number;
  tableNumber: string | null;
  previousStatus: string;
  currentStatus: string;
  updatedAt: string;
}
