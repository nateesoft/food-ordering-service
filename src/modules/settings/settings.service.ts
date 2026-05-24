import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string, branchId: string): Promise<any | null> {
    const compositeKey = `${key}:${branchId}`;
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: compositeKey },
    });
    return setting?.value ?? null;
  }

  async upsert(key: string, value: any, branchId: string) {
    const compositeKey = `${key}:${branchId}`;
    return this.prisma.systemSetting.upsert({
      where: { key: compositeKey },
      update: { value },
      create: { key: compositeKey, value, branchId },
    });
  }
}
