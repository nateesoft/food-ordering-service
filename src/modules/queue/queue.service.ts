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

  private async getNextQueueNumber(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastTicket = await this.prisma.queueTicket.findFirst({
      where: {
        createdAt: {
          gte: today,
        },
      },
      orderBy: {
        queueNumber: 'desc',
      },
    });

    return lastTicket ? lastTicket.queueNumber + 1 : 1;
  }

  async create(createQueueTicketDto: CreateQueueTicketDto) {
    const queueNumber = await this.getNextQueueNumber();

    const ticket = await this.prisma.queueTicket.create({
      data: {
        ...createQueueTicketDto,
        queueId: this.generateQueueId(),
        queueNumber,
        estimatedTime: 15, // Default 15 minutes
      },
    });

    return ticket;
  }

  async findAll(status?: QueueStatus) {
    const where: any = {};

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

  async getTodayQueue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.queueTicket.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      orderBy: {
        queueNumber: 'asc',
      },
    });
  }

  async getWaitingQueue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.queueTicket.findMany({
      where: {
        createdAt: {
          gte: today,
        },
        status: {
          in: [QueueStatus.WAITING, QueueStatus.PREPARING],
        },
      },
      orderBy: {
        queueNumber: 'asc',
      },
    });
  }

  async getReadyQueue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.queueTicket.findMany({
      where: {
        createdAt: {
          gte: today,
        },
        status: QueueStatus.READY,
      },
      orderBy: {
        calledAt: 'desc',
      },
      take: 5, // Show last 5 ready tickets
    });
  }

  async getQueueStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [waiting, preparing, ready, completed, cancelled] = await Promise.all(
      [
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.WAITING },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.PREPARING },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.READY },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.COMPLETED },
        }),
        this.prisma.queueTicket.count({
          where: { createdAt: { gte: today }, status: QueueStatus.CANCELLED },
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
