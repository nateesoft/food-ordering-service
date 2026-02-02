import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DeductStockRequest {
  orderId: string;
  items: {
    menuItemId: number;
    quantity: number;
  }[];
}

export interface DeductStockResult {
  orderId: string;
  processed: boolean;
  results: {
    success: boolean;
    menuItemId: number;
    deductions: {
      inventoryItemId: number;
      quantity: number;
      success: boolean;
      error?: string;
    }[];
  }[];
}

@Injectable()
export class InventoryIntegrationService {
  private readonly logger = new Logger(InventoryIntegrationService.name);
  private readonly inventoryServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.inventoryServiceUrl =
      this.configService.get<string>('INVENTORY_SERVICE_URL') ||
      'http://localhost:3003';
  }

  async deductStockForOrder(request: DeductStockRequest): Promise<DeductStockResult | null> {
    try {
      this.logger.log(`Sending stock deduction request for order: ${request.orderId}`);

      const response = await fetch(
        `${this.inventoryServiceUrl}/api/integration/deduct`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to deduct stock for order ${request.orderId}: ${response.status} - ${errorText}`,
        );
        return null;
      }

      const result: DeductStockResult = await response.json();
      this.logger.log(
        `Stock deduction completed for order ${request.orderId}: ${JSON.stringify(result)}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error calling inventory service for order ${request.orderId}: ${error}`,
      );
      return null;
    }
  }
}
