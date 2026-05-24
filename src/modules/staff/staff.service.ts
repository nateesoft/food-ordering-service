import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckInDto, CheckOutDto, HeartbeatDto, SetPinDto } from './dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async checkIn(checkInDto: CheckInDto, branchId?: string) {
    const { pin, tableNumber } = checkInDto;

    // Find staff by PIN
    const staff = await this.prisma.user.findUnique({
      where: { pin },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid PIN');
    }

    if (!staff.isActive) {
      throw new UnauthorizedException('Staff account is disabled');
    }

    // Check if table exists (scoped to branch)
    const table = await this.prisma.table.findFirst({
      where: { number: tableNumber, branchId: branchId ?? null },
    });

    if (!table) {
      throw new NotFoundException(`Table ${tableNumber} not found`);
    }

    // Check if staff already checked in to this table
    const existingAssignment = await this.prisma.tableStaffAssignment.findFirst({
      where: { branchId: branchId ?? null, tableNumber, userId: staff.id },
    });

    if (existingAssignment && existingAssignment.isActive) {
      const updated = await this.prisma.tableStaffAssignment.update({
        where: { id: existingAssignment.id },
        data: { lastSeenAt: new Date() },
        include: {
          user: { select: { id: true, name: true, role: true } },
          table: true,
        },
      });
      return { message: 'Already checked in, updated last seen time', assignment: updated };
    }

    // Create or reactivate assignment
    let assignment;
    if (existingAssignment) {
      assignment = await this.prisma.tableStaffAssignment.update({
        where: { id: existingAssignment.id },
        data: { isActive: true, checkedInAt: new Date(), lastSeenAt: new Date() },
        include: {
          user: { select: { id: true, name: true, role: true } },
          table: true,
        },
      });
    } else {
      assignment = await this.prisma.tableStaffAssignment.create({
        data: {
          tableNumber,
          branchId: branchId ?? null,
          userId: staff.id,
          checkedInAt: new Date(),
          lastSeenAt: new Date(),
          isActive: true,
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
          table: true,
        },
      });
    }

    return { message: 'Checked in successfully', assignment };
  }

  async checkOut(checkOutDto: CheckOutDto, branchId?: string) {
    const { pin, tableNumber } = checkOutDto;

    // Find staff by PIN
    const staff = await this.prisma.user.findUnique({
      where: { pin },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // Find active assignment
    const assignment = await this.prisma.tableStaffAssignment.findFirst({
      where: { branchId: branchId ?? null, tableNumber, userId: staff.id, isActive: true },
    });

    if (!assignment) {
      throw new NotFoundException('No active check-in found for this table');
    }

    // Deactivate assignment
    const updated = await this.prisma.tableStaffAssignment.update({
      where: { id: assignment.id },
      data: {
        isActive: false,
        lastSeenAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        table: true,
      },
    });

    return {
      message: 'Checked out successfully',
      assignment: updated,
    };
  }

  async heartbeat(heartbeatDto: HeartbeatDto, branchId?: string) {
    const { pin, tableNumber } = heartbeatDto;

    // Find staff by PIN
    const staff = await this.prisma.user.findUnique({
      where: { pin },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // Find and update active assignment
    const assignment = await this.prisma.tableStaffAssignment.findFirst({
      where: { branchId: branchId ?? null, tableNumber, userId: staff.id, isActive: true },
    });

    if (!assignment) {
      throw new NotFoundException('No active check-in found for this table');
    }

    const updated = await this.prisma.tableStaffAssignment.update({
      where: { id: assignment.id },
      data: { lastSeenAt: new Date() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return {
      message: 'Heartbeat updated',
      lastSeenAt: updated.lastSeenAt,
      staffName: updated.user.name,
    };
  }

  async getTableStaff(tableNumber: string, branchId?: string) {
    // Check if table exists (scoped to branch)
    const table = await this.prisma.table.findFirst({
      where: { number: tableNumber, branchId: branchId ?? null },
    });

    if (!table) {
      throw new NotFoundException(`Table ${tableNumber} not found`);
    }

    // Get all active staff assignments for this table
    const assignments = await this.prisma.tableStaffAssignment.findMany({
      where: {
        tableNumber,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    });

    return {
      tableNumber,
      staff: assignments.map((a) => ({
        id: a.user.id,
        name: a.user.name,
        role: a.user.role,
        checkedInAt: a.checkedInAt,
        lastSeenAt: a.lastSeenAt,
      })),
    };
  }

  async getMyTables(userId: number) {
    const assignments = await this.prisma.tableStaffAssignment.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        table: true,
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    });

    return assignments.map((a) => ({
      tableNumber: a.tableNumber,
      checkedInAt: a.checkedInAt,
      lastSeenAt: a.lastSeenAt,
      table: a.table,
    }));
  }

  async setPin(userId: number, setPinDto: SetPinDto) {
    const { pin } = setPinDto;

    // Check if PIN is already used
    const existingUser = await this.prisma.user.findUnique({
      where: { pin },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('PIN already in use');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { pin },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        pin: true,
      },
    });

    return {
      message: 'PIN set successfully',
      user,
    };
  }

  async verifyPin(pin: string) {
    const staff = await this.prisma.user.findUnique({
      where: { pin },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid PIN');
    }

    if (!staff.isActive) {
      throw new UnauthorizedException('Staff account is disabled');
    }

    return {
      valid: true,
      staff,
    };
  }

  async getAllActiveAssignments(branchId?: string) {
    const where: any = { isActive: true };
    if (branchId) {
      where.table = { branchId };
    }

    const assignments = await this.prisma.tableStaffAssignment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        table: true,
      },
      orderBy: [
        { tableNumber: 'asc' },
        { checkedInAt: 'desc' },
      ],
    });

    return assignments;
  }
}
