import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTableDto, UpdateTableStatusDto } from './dto';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: TableStatus, branchId?: number) {
    const where: any = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.table.findMany({
      where,
      orderBy: {
        number: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    return table;
  }

  async findByNumber(number: string) {
    const table = await this.prisma.table.findUnique({
      where: { number },
    });

    if (!table) {
      throw new NotFoundException(`Table ${number} not found`);
    }

    return table;
  }

  async create(createTableDto: CreateTableDto, branchId?: number) {
    const existing = await this.prisma.table.findUnique({
      where: { number: createTableDto.number },
    });

    if (existing) {
      throw new ConflictException(
        `Table ${createTableDto.number} already exists`,
      );
    }

    return this.prisma.table.create({
      data: { ...createTableDto, branchId },
    });
  }

  async update(id: number, updateTableDto: Partial<CreateTableDto>) {
    await this.findOne(id);

    return this.prisma.table.update({
      where: { id },
      data: updateTableDto,
    });
  }

  async updateStatus(id: number, updateStatusDto: UpdateTableStatusDto) {
    await this.findOne(id);

    return this.prisma.table.update({
      where: { id },
      data: updateStatusDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.table.delete({
      where: { id },
    });
  }

  async getAvailableTables(branchId?: number) {
    const where: any = { status: TableStatus.AVAILABLE };
    if (branchId) where.branchId = branchId;

    return this.prisma.table.findMany({
      where,
      orderBy: {
        number: 'asc',
      },
    });
  }

  async getTableStats(branchId?: number) {
    const branchFilter = branchId ? { branchId } : {};
    const [available, occupied, reserved] = await Promise.all([
      this.prisma.table.count({ where: { status: TableStatus.AVAILABLE, ...branchFilter } }),
      this.prisma.table.count({ where: { status: TableStatus.OCCUPIED, ...branchFilter } }),
      this.prisma.table.count({ where: { status: TableStatus.RESERVED, ...branchFilter } }),
    ]);

    return {
      available,
      occupied,
      reserved,
      total: available + occupied + reserved,
    };
  }

  async mergeTables(mainTableId: number, tableIds: number[]) {
    const mainTable = await this.findOne(mainTableId);

    // Verify all tables exist
    for (const tableId of tableIds) {
      await this.findOne(tableId);
    }

    // Update main table with merged table IDs
    return this.prisma.table.update({
      where: { id: mainTableId },
      data: {
        mergedWith: tableIds,
        status: TableStatus.OCCUPIED,
      },
    });
  }

  async unmergeTable(id: number) {
    const table = await this.findOne(id);

    // Reset merged tables status
    if (table.mergedWith && table.mergedWith.length > 0) {
      await this.prisma.table.updateMany({
        where: {
          id: { in: table.mergedWith },
        },
        data: {
          status: TableStatus.AVAILABLE,
        },
      });
    }

    // Reset main table
    return this.prisma.table.update({
      where: { id },
      data: {
        mergedWith: [],
        status: TableStatus.AVAILABLE,
        currentGuests: null,
      },
    });
  }
}
