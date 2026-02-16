import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQueueTicketDto, UpdateQueueStatusDto } from './dto';
import { QueueStatus } from '@prisma/client';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  private generateQueueId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `Q-${timestamp}-${random}`;
  }

  private async getNextQueueNumber(branchId?: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = { createdAt: { gte: today } };
    if (branchId) where.branchId = branchId;

    const lastTicket = await this.prisma.queueTicket.findFirst({
      where,
      orderBy: {
        queueNumber: 'desc',
      },
    });

    return lastTicket ? lastTicket.queueNumber + 1 : 1;
  }

  async create(createQueueTicketDto: CreateQueueTicketDto, branchId?: number) {
    const queueNumber = await this.getNextQueueNumber(branchId);

    const { items, ...rest } = createQueueTicketDto;

    const ticket = await this.prisma.queueTicket.create({
      data: {
        ...rest,
        branchId,
        items: items as unknown as object, // Convert to JSON-compatible type
        queueId: this.generateQueueId(),
        queueNumber,
        estimatedTime: 15, // Default 15 minutes
      },
    });

    return ticket;
  }

  async findAll(status?: QueueStatus, branchId?: number) {
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.queueTicket.findMany({
      where,
      orderBy: {
        queueNumber: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const ticket = await this.prisma.queueTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException(`Queue ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async findByQueueId(queueId: string) {
    const ticket = await this.prisma.queueTicket.findUnique({
      where: { queueId },
    });

    if (!ticket) {
      throw new NotFoundException(`Queue ticket with ID ${queueId} not found`);
    }

    return ticket;
  }

  async updateStatus(id: number, updateStatusDto: UpdateQueueStatusDto) {
    await this.findOne(id);

    const updateData: any = {
      status: updateStatusDto.status,
    };

    if (updateStatusDto.status === QueueStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.prisma.queueTicket.update({
      where: { id },
      data: updateData,
    });
  }

  async callQueue(id: number) {
    await this.findOne(id);

    return this.prisma.queueTicket.update({
      where: { id },
      data: {
        status: QueueStatus.READY,
        calledAt: new Date(),
      },
    });
  }

  async getTodayQueue(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = { createdAt: { gte: today } };
    if (branchId) where.branchId = branchId;

    return this.prisma.queueTicket.findMany({
      where,
      orderBy: {
        queueNumber: 'asc',
      },
    });
  }

  async getWaitingQueue(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      createdAt: { gte: today },
      status: { in: [QueueStatus.WAITING, QueueStatus.PREPARING] },
    };
    if (branchId) where.branchId = branchId;

    return this.prisma.queueTicket.findMany({
      where,
      orderBy: {
        queueNumber: 'asc',
      },
    });
  }

  async getReadyQueue(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      createdAt: { gte: today },
      status: QueueStatus.READY,
    };
    if (branchId) where.branchId = branchId;

    return this.prisma.queueTicket.findMany({
      where,
      orderBy: {
        calledAt: 'desc',
      },
      take: 5, // Show last 5 ready tickets
    });
  }

  async getQueueStats(branchId?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const branchFilter = branchId ? { branchId } : {};
    const [waiting, preparing, ready, completed, cancelled] = await Promise.all(
      [
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.WAITING, ...branchFilter },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.PREPARING, ...branchFilter },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.READY, ...branchFilter },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.COMPLETED, ...branchFilter },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.CANCELLED, ...branchFilter },
        }),
      ],
    );

    return {
      waiting,
      preparing,
      ready,
      completed,
      cancelled,
      total: waiting + preparing + ready + completed + cancelled,
    };
  }
}
