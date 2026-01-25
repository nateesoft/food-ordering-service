import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemberDto, UpdateMemberDto } from './dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  private generateMemberId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `M${timestamp}${random}`;
  }

  private calculateTier(points: number): string {
    if (points >= 1000) return 'gold';
    if (points >= 500) return 'silver';
    return 'bronze';
  }

  async create(createMemberDto: CreateMemberDto) {
    return this.prisma.member.create({
      data: {
        ...createMemberDto,
        memberId: this.generateMemberId(),
      },
    });
  }

  async findAll(tier?: string) {
    const where: any = {};

    if (tier) {
      where.tier = tier;
    }

    return this.prisma.member.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return member;
  }

  async findByMemberId(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { memberId },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }

    return member;
  }

  async findByPhone(phone: string) {
    const member = await this.prisma.member.findFirst({
      where: { phone },
    });

    return member;
  }

  async update(id: number, updateMemberDto: UpdateMemberDto) {
    await this.findOne(id);

    // Auto-calculate tier based on points
    if (updateMemberDto.points !== undefined) {
      updateMemberDto.tier = this.calculateTier(updateMemberDto.points);
    }

    return this.prisma.member.update({
      where: { id },
      data: updateMemberDto,
    });
  }

  async addPoints(memberId: string, points: number) {
    const member = await this.findByMemberId(memberId);

    const newPoints = member.points + points;
    const newTier = this.calculateTier(newPoints);

    return this.prisma.member.update({
      where: { id: member.id },
      data: {
        points: newPoints,
        tier: newTier,
      },
    });
  }

  async redeemPoints(memberId: string, points: number) {
    const member = await this.findByMemberId(memberId);

    if (member.points < points) {
      throw new ConflictException('Insufficient points');
    }

    const newPoints = member.points - points;
    const newTier = this.calculateTier(newPoints);

    return this.prisma.member.update({
      where: { id: member.id },
      data: {
        points: newPoints,
        tier: newTier,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.member.delete({
      where: { id },
    });
  }

  async getMemberStats() {
    const [total, bronze, silver, gold] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { tier: 'bronze' } }),
      this.prisma.member.count({ where: { tier: 'silver' } }),
      this.prisma.member.count({ where: { tier: 'gold' } }),
    ]);

    return {
      total,
      byTier: {
        bronze,
        silver,
        gold,
      },
    };
  }
}
