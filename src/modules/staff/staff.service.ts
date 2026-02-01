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

  async checkIn(checkInDto: CheckInDto) {
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

    // Check if table exists
    const table = await this.prisma.table.findUnique({
      where: { number: tableNumber },
    });

    if (!table) {
      throw new NotFoundException(`Table ${tableNumber} not found`);
    }

    // Check if staff already checked in to this table
    const existingAssignment = await this.prisma.tableStaffAssignment.findUnique({
      where: {
        tableNumber_userId: {
          tableNumber,
          userId: staff.id,
        },
      },
    });

    if (existingAssignment && existingAssignment.isActive) {
      // Update lastSeenAt if already checked in
      const updated = await this.prisma.tableStaffAssignment.update({
        where: { id: existingAssignment.id },
        data: { lastSeenAt: new Date() },
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
        message: 'Already checked in, updated last seen time',
        assignment: updated,
      };
    }

    // Create or reactivate assignment
    const assignment = await this.prisma.tableStaffAssignment.upsert({
      where: {
        tableNumber_userId: {
          tableNumber,
          userId: staff.id,
        },
      },
      update: {
        isActive: true,
        checkedInAt: new Date(),
        lastSeenAt: new Date(),
      },
      create: {
        tableNumber,
        userId: staff.id,
        checkedInAt: new Date(),
        lastSeenAt: new Date(),
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
        table: true,
      },
    });

    return {
      message: 'Checked in successfully',
      assignment,
    };
  }

  async checkOut(checkOutDto: CheckOutDto) {
    const { pin, tableNumber } = checkOutDto;

    // Find staff by PIN
    const staff = await this.prisma.user.findUnique({
      where: { pin },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // Find active assignment
    const assignment = await this.prisma.tableStaffAssignment.findUnique({
      where: {
        tableNumber_userId: {
          tableNumber,
          userId: staff.id,
        },
      },
    });

    if (!assignment || !assignment.isActive) {
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

  async heartbeat(heartbeatDto: HeartbeatDto) {
    const { pin, tableNumber } = heartbeatDto;

    // Find staff by PIN
    const staff = await this.prisma.user.findUnique({
      where: { pin },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // Find and update active assignment
    const assignment = await this.prisma.tableStaffAssignment.findUnique({
      where: {
        tableNumber_userId: {
          tableNumber,
          userId: staff.id,
        },
      },
    });

    if (!assignment || !assignment.isActive) {
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

  async getTableStaff(tableNumber: string) {
    // Check if table exists
    const table = await this.prisma.table.findUnique({
      where: { number: tableNumber },
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

  async getAllActiveAssignments() {
    const assignments = await this.prisma.tableStaffAssignment.findMany({
      where: {
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
        table: true,
      },
      orderBy: [
        { tableNumber: 'asc' },
        { checkedInAt: 'desc' },
      ],
    });

    return assignments;
  }

  async getAssignmentsGroupedByTable() {
    const assignments = await this.prisma.tableStaffAssignment.findMany({
      where: {
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

    // Group by table number
    const grouped: Record<string, {
      staffId: number;
      staffName: string;
      staffRole: string;
      checkedInAt: Date;
      lastSeenAt: Date;
    }[]> = {};

    for (const assignment of assignments) {
      if (!grouped[assignment.tableNumber]) {
        grouped[assignment.tableNumber] = [];
      }
      grouped[assignment.tableNumber].push({
        staffId: assignment.user.id,
        staffName: assignment.user.name,
        staffRole: assignment.user.role,
        checkedInAt: assignment.checkedInAt,
        lastSeenAt: assignment.lastSeenAt,
      });
    }

    return grouped;
  }
}
