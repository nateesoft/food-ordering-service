import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  async findAll(isActive?: boolean, companyId?: string) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    if (companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { consoleUserId: true },
      });
      if (!company) return [];
      where.consoleUserId = company.consoleUserId;
    }

    return this.prisma.branch.findMany({ where, orderBy: { id: 'asc' } });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return branch;
  }

  async findByCode(code: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { code },
      include: { consoleUser: { select: { companyName: true, companyPhone: true, companyEmail: true } } },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with code '${code}' not found`);
    }
    return branch;
  }

  async create(dto: CreateBranchDto, consoleUserId?: string) {
    const existing = await this.prisma.branch.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Branch code '${dto.code}' already exists`);
    }
    return this.prisma.branch.create({ data: { ...dto, consoleUserId } });
  }

  async update(id: string, dto: UpdateBranchDto) {
    await this.findOne(id);
    if (dto.code) {
      const existing = await this.prisma.branch.findUnique({
        where: { code: dto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Branch code '${dto.code}' already exists`);
      }
    }
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.branch.delete({ where: { id } });
    return { message: 'Branch deleted successfully' };
  }
}
