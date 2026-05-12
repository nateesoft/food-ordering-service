import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateServiceRequestDto, UpdateServiceRequestDto } from './dto';
import { OrderStatus, ServiceRequestStatus, ServiceRequestType, TableStatus } from '@prisma/client';

@Injectable()
export class ServiceRequestsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  private generateRequestId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SR-${timestamp}-${random}`;
  }

  async create(createServiceRequestDto: CreateServiceRequestDto, branchId?: number) {
    const serviceRequest = await this.prisma.serviceRequest.create({
      data: {
        ...createServiceRequestDto,
        branchId,
        requestId: this.generateRequestId(),
        items: createServiceRequestDto.items || [],
      },
    });

    if (createServiceRequestDto.type === ServiceRequestType.PAYMENT && createServiceRequestDto.tableNumber) {
      const tableNumber = createServiceRequestDto.tableNumber;
      await this.prisma.table.updateMany({
        where: {
          number: tableNumber,
          ...(branchId ? { branchId } : {}),
        },
        data: { status: TableStatus.BILLING },
      });
      // Clear Redis session so the table is no longer "occupied" for new customers
      if (branchId) {
        this.redisService.clearSessionForTable(tableNumber, branchId).catch(() => {});
      }
    }

    return serviceRequest;
  }

  async findAll(
    status?: ServiceRequestStatus,
    type?: ServiceRequestType,
    tableNumber?: string,
    branchId?: number,
  ) {
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (tableNumber) {
      where.tableNumber = tableNumber;
    }

    return this.prisma.serviceRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Service request with ID ${id} not found`);
    }

    return request;
  }

  async updateStatus(id: number, updateStatusDto: UpdateServiceRequestDto) {
    const request = await this.findOne(id);

    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
    });

    if (
      updateStatusDto.status === ServiceRequestStatus.COMPLETED &&
      request.type === ServiceRequestType.PAYMENT &&
      request.tableNumber
    ) {
      const where: any = {
        tableNumber: request.tableNumber,
        status: OrderStatus.PREPARING,
      };
      if (request.branchId) where.branchId = request.branchId;

      await this.prisma.order.updateMany({
        where,
        data: { status: OrderStatus.COMPLETED },
      });
    }

    return updated;
  }

  async getPendingRequests(branchId?: number) {
    const where: any = { status: ServiceRequestStatus.PENDING };
    if (branchId) where.branchId = branchId;

    return this.prisma.serviceRequest.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getRequestsByTable(tableNumber: string) {
    return this.prisma.serviceRequest.findMany({
      where: {
        tableNumber,
        status: ServiceRequestStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRequestStats(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const branchFilter = branchId ? { branchId } : {};
    const [
      pending,
      completed,
      staffRequests,
      utensilRequests,
      paymentRequests,
    ] = await Promise.all([
      this.prisma.serviceRequest.count({
        where: {
          createdAt: { gte: today },
          status: ServiceRequestStatus.PENDING,
          ...branchFilter,
        },
      }),
      this.prisma.serviceRequest.count({
        where: {
          createdAt: { gte: today },
          status: ServiceRequestStatus.COMPLETED,
          ...branchFilter,
        },
      }),
      this.prisma.serviceRequest.count({
        where: {
          createdAt: { gte: today },
          type: ServiceRequestType.STAFF,
          ...branchFilter,
        },
      }),
      this.prisma.serviceRequest.count({
        where: {
          createdAt: { gte: today },
          type: ServiceRequestType.UTENSILS,
          ...branchFilter,
        },
      }),
      this.prisma.serviceRequest.count({
        where: {
          createdAt: { gte: today },
          type: ServiceRequestType.PAYMENT,
          ...branchFilter,
        },
      }),
    ]);

    return {
      pending,
      completed,
      byType: {
        staff: staffRequests,
        utensils: utensilRequests,
        payment: paymentRequests,
      },
      total: pending + completed,
    };
  }
}
