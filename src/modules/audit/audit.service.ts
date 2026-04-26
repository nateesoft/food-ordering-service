import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';

export interface CreateAuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number;
  entityRef?: string;
  performedBy?: string;
  branchId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface QueryAuditLogsParams {
  entityType?: AuditEntityType;
  entityId?: number;
  action?: AuditAction;
  performedBy?: string;
  branchId?: number;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          entityRef: params.entityRef,
          performedBy: params.performedBy,
          branchId: params.branchId,
          oldValues: params.oldValues ?? Prisma.JsonNull,
          newValues: params.newValues ?? Prisma.JsonNull,
          metadata: params.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error}`, {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
      });
    }
  }

  async findAll(params: QueryAuditLogsParams) {
    const { page = 1, limit = 50, startDate, endDate, ...filters } = params;
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;
    if (filters.performedBy) {
      where.performedBy = {
        contains: filters.performedBy,
        mode: 'insensitive',
      };
    }
    if (filters.branchId) where.branchId = filters.branchId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }

  async findByEntity(entityType: AuditEntityType, entityId: number) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(startDate?: Date, endDate?: Date, branchId?: number) {
    const where: Prisma.AuditLogWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const stats = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { id: true },
    });

    const total = stats.reduce((sum, s) => sum + s._count.id, 0);

    return {
      total,
      byAction: stats.map((s) => ({
        action: s.action,
        count: s._count.id,
      })),
    };
  }
}
