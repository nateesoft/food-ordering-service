import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

export interface PrinterConfigItem {
  id: string;
  name: string;
  secret: string;
  connectionType: 'serial' | 'usb';
  serialConfig?: { baudRate: number };
  paperWidth: number;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopTaxId: string;
  footerText: string;
  isActive: boolean;
  lastSeen: string | null;
}

const SETTING_KEY = 'printer_configs';

@Injectable()
export class PrintersService {
  constructor(private readonly settingsService: SettingsService) {}

  async getPrinters(branchId: string): Promise<PrinterConfigItem[]> {
    const raw = await this.settingsService.get(SETTING_KEY, branchId);
    return Array.isArray(raw) ? raw : [];
  }

  private async savePrinters(branchId: string, printers: PrinterConfigItem[]): Promise<void> {
    await this.settingsService.upsert(SETTING_KEY, printers, branchId);
  }

  async heartbeat(printerId: string, branchId: string, secret: string): Promise<void> {
    const printers = await this.getPrinters(branchId);
    const idx = printers.findIndex((p) => p.id === printerId);
    if (idx === -1) throw new NotFoundException('Printer not found');
    if (printers[idx].secret !== secret) throw new UnauthorizedException('Invalid secret');
    printers[idx].isActive = true;
    printers[idx].lastSeen = new Date().toISOString();
    await this.savePrinters(branchId, printers);
  }

  async markOffline(printerId: string, branchId: string, secret: string): Promise<void> {
    const printers = await this.getPrinters(branchId);
    const idx = printers.findIndex((p) => p.id === printerId);
    if (idx === -1) throw new NotFoundException('Printer not found');
    if (printers[idx].secret !== secret) throw new UnauthorizedException('Invalid secret');
    printers[idx].isActive = false;
    await this.savePrinters(branchId, printers);
  }
}
