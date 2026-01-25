import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceRequestDto, UpdateServiceRequestDto } from './dto';
import { ServiceRequestStatus, ServiceRequestType } from '@prisma/client';

@Injectable()
export class ServiceRequestsService {
  constructor(private prisma: PrismaService) {}

  private generateRequestId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SR-${timestamp}-${random}`;
  }

  async create(createServiceRequestDto: CreateServiceRequestDto) {
    return this.prisma.serviceRequest.create({
      data: {
        ...createServiceRequestDto,
        requestId: this.generateRequestId(),
        items: createServiceRequestDto.items || [],
      },
    });
  }

  async findAll(
    status?: ServiceRequestStatus,
    type?: ServiceRequestType,
    tableNumber?: string,
  ) {
    const where: any = {};

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
    await this.findOne(id);

    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
    });
  }

  async getPendingRequests() {
    return this.prisma.serviceRequest.findMany({
      where: {
        status: ServiceRequestStatus.PENDING,
      },
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

  async getRequestStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, completed, staffRequests, utensilRequests, paymentRequests] =
      await Promise.all([
        this.prisma.serviceRequest.count({
          where: {
            createdAt: { gte: today },
            status: ServiceRequestStatus.PENDING,
          },
        }),
        this.prisma.serviceRequest.count({
          where: {
            createdAt: { gte: today },
            status: ServiceRequestStatus.COMPLETED,
          },
        }),
        this.prisma.serviceRequest.count({
          where: {
            createdAt: { gte: today },
            type: ServiceRequestType.STAFF,
          },
        }),
        this.prisma.serviceRequest.count({
          where: {
            createdAt: { gte: today },
            type: ServiceRequestType.UTENSILS,
          },
        }),
        this.prisma.serviceRequest.count({
          where: {
            createdAt: { gte: today },
            type: ServiceRequestType.PAYMENT,
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
