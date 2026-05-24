export interface RabbitMQMessageEnvelope<T> {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  source: string;
  branchId: string | null;
  payload: T;
}

export interface OrderItemDetail {
  itemId: string;
  code: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions: string | null;
  diningOption: string | null;
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
  itemDetails: OrderItemDetail[];
}

export interface OrderStatusChangedPayload {
  orderId: string;
  internalId: number;
  tableNumber: string | null;
  previousStatus: string;
  currentStatus: string;
  updatedAt: string;
}
