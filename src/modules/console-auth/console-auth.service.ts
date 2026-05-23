import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ConsoleRegisterDto,
  ConsoleLoginDto,
  ConsoleForgotPasswordDto,
  ConsoleResetPasswordDto,
  UpdateCompanyDto,
} from './dto';
import { ConsoleRole } from '@prisma/client';

@Injectable()
export class ConsoleAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ---- Register ----
  async register(dto: ConsoleRegisterDto) {
    const existing = await this.prisma.consoleUser.findUnique({
      where: { email: dto.username },
    });

    if (existing) {
      throw new ConflictException('username นี้ถูกใช้งานแล้ว');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const consoleUser = await this.prisma.consoleUser.create({
      data: {
        email: dto.username,
        password: hashedPassword,
        role: ConsoleRole.CUSTOMER,
        companyName: dto.companyName,
        companyAddress: dto.companyAddress,
        companyPhone: dto.companyPhone,
        companyEmail: dto.companyEmail,
      },
    });

    // Create Company record
    await this.prisma.company.create({
      data: {
        name: dto.companyName,
        address: dto.companyAddress,
        phone: dto.companyPhone,
        email: dto.companyEmail,
        consoleUserId: consoleUser.id,
      },
    });

    // Create branches + menus + tables
    if (dto.branches && dto.branches.length > 0) {
      for (const branchDto of dto.branches) {
        if (!branchDto.name?.trim()) continue;

        const code = this.generateCode(branchDto.name);
        const branch = await this.prisma.branch.create({
          data: {
            name: branchDto.name,
            code: await this.uniqueBranchCode(code),
            address: branchDto.address,
            phone: branchDto.phone,
            consoleUserId: consoleUser.id,
          },
        });

        // Create menus for this branch
        if (dto.menus && dto.menus.length > 0) {
          for (const menuDto of dto.menus) {
            if (!menuDto.name?.trim()) continue;
            await this.prisma.menuItem.create({
              data: {
                code: await this.uniqueMenuCode(this.generateCode(menuDto.name)),
                name: menuDto.name,
                category: menuDto.category || 'ทั่วไป',
                price: menuDto.price ?? 0,
                description: menuDto.description,
                type: 'SINGLE',
                isActive: true,
                branchId: branch.id,
              },
            });
          }
        }

        // Create tables for this branch
        if (branchDto.tables && branchDto.tables.length > 0) {
          for (const tableDto of branchDto.tables) {
            if (!tableDto.number?.trim()) continue;
            await this.prisma.table.create({
              data: {
                number: tableDto.number,
                capacity: tableDto.capacity ?? 4,
                size: 'medium',
                shape: 'square',
                positionX: 0,
                positionY: 0,
                branchId: branch.id,
              },
            });
          }
        }
      }
    }

    return {
      message: 'ลงทะเบียนสำเร็จ',
      user: {
        id: consoleUser.id,
        username: consoleUser.email,
        role: this.mapRole(consoleUser.role),
        companyName: consoleUser.companyName,
      },
    };
  }

  // ---- Login ----
  async login(dto: ConsoleLoginDto) {
    const user = await this.prisma.consoleUser.findUnique({
      where: { email: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('username หรือ password ไม่ถูกต้อง');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('username หรือ password ไม่ถูกต้อง');
    }

    const token = this.signToken(user.id, user.email, user.role, user.companyName);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.email,
        role: this.mapRole(user.role),
        companyName: user.companyName,
      },
    };
  }

  // ---- Me ----
  async getMe(userId: string) {
    const user = await this.prisma.consoleUser.findUnique({
      where: { id: userId },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            isActive: true,
            _count: { select: { menuItems: true, tables: true, users: true } },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('ไม่พบผู้ใช้งาน');
    }

    return {
      id: user.id,
      username: user.email,
      role: this.mapRole(user.role),
      companyName: user.companyName,
      companyAddress: user.companyAddress,
      companyPhone: user.companyPhone,
      companyEmail: user.companyEmail,
      branches: user.branches,
    };
  }

  // ---- Company ----
  async getCompany(userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { consoleUserId: userId },
    });
    return company;
  }

  async upsertCompany(userId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.upsert({
      where: { consoleUserId: userId },
      update: { ...dto },
      create: {
        consoleUserId: userId,
        name: dto.name || '',
        nameEn: dto.nameEn,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        logo: dto.logo,
        website: dto.website,
        description: dto.description,
        businessType: dto.businessType,
      },
    });

    // Keep ConsoleUser.companyName in sync
    if (dto.name) {
      await this.prisma.consoleUser.update({
        where: { id: userId },
        data: { companyName: dto.name },
      });
    }

    return company;
  }

  // ---- Forgot Password ----
  async forgotPassword(dto: ConsoleForgotPasswordDto) {
    const user = await this.prisma.consoleUser.findUnique({
      where: { email: dto.username },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'หากบัญชีนี้มีอยู่ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว' };
    }

    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.consoleUser.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const baseUrl =
      this.configService.get<string>('NEXT_PUBLIC_BASE_URL') ||
      'http://localhost:3001/food-ordering-console';

    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Send email if SMTP configured
    await this.sendResetEmail(dto.username, resetLink);

    return { message: 'หากบัญชีนี้มีอยู่ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว' };
  }

  // ---- Reset Password ----
  async resetPassword(dto: ConsoleResetPasswordDto) {
    const user = await this.prisma.consoleUser.findFirst({
      where: { resetToken: dto.token },
    });

    if (!user || !user.resetTokenExpiry) {
      throw new BadRequestException('ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว');
    }

    if (new Date() > user.resetTokenExpiry) {
      throw new BadRequestException('ลิงก์หมดอายุแล้ว กรุณาขอลิงก์ใหม่');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.consoleUser.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'รีเซ็ตรหัสผ่านสำเร็จ' };
  }

  // ---- Admin Stats ----
  async getAdminStats() {
    const customers = await this.prisma.consoleUser.findMany({
      where: { role: ConsoleRole.CUSTOMER },
      include: {
        branches: {
          include: {
            _count: { select: { menuItems: true, tables: true, users: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCustomers = customers.length;
    const totalBranches = customers.reduce((s, c) => s + c.branches.length, 0);
    const totalMenus = customers.reduce(
      (s, c) => s + c.branches.reduce((bs, b) => bs + b._count.menuItems, 0),
      0,
    );
    const totalStaff = customers.reduce(
      (s, c) => s + c.branches.reduce((bs, b) => bs + b._count.users, 0),
      0,
    );
    const totalTables = customers.reduce(
      (s, c) => s + c.branches.reduce((bs, b) => bs + b._count.tables, 0),
      0,
    );

    const customerList = customers.map((c) => ({
      id: c.id,
      username: c.email,
      companyName: c.companyName,
      branchCount: c.branches.length,
      menuCount: c.branches.reduce((s, b) => s + b._count.menuItems, 0),
      staffCount: c.branches.reduce((s, b) => s + b._count.users, 0),
      tableCount: c.branches.reduce((s, b) => s + b._count.tables, 0),
      createdAt: c.createdAt,
    }));

    return {
      totalCustomers,
      totalBranches,
      totalMenus,
      totalStaff,
      totalTables,
      customerList,
    };
  }

  // ---- Seed System Admin ----
  async seedSystemAdmin() {
    const existing = await this.prisma.consoleUser.findFirst({
      where: { role: ConsoleRole.SYSTEM_ADMIN },
    });
    if (existing) return;

    const hashed = await bcrypt.hash('Admin@1234', 10);
    await this.prisma.consoleUser.create({
      data: {
        email: 'admin@foodconsole.com',
        password: hashed,
        role: ConsoleRole.SYSTEM_ADMIN,
        companyName: 'Food Ordering Console',
      },
    });
  }

  // ---- Helpers ----
  private signToken(
    userId: string,
    email: string,
    role: ConsoleRole,
    companyName: string,
  ): string {
    const secret =
      this.configService.get<string>('CONSOLE_JWT_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'food-ordering-console-secret-key-2024';

    return this.jwtService.sign(
      {
        userId,
        username: email,
        role: this.mapRole(role),
        companyName,
      },
      { secret, expiresIn: '7d' },
    );
  }

  private mapRole(role: ConsoleRole): string {
    return role === ConsoleRole.SYSTEM_ADMIN ? 'system_admin' : 'customer';
  }

  private generateCode(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20) || 'branch';
  }

  private async uniqueBranchCode(base: string): Promise<string> {
    let code = base;
    let n = 1;
    while (await this.prisma.branch.findUnique({ where: { code } })) {
      code = `${base}-${n++}`;
    }
    return code;
  }

  private async uniqueMenuCode(base: string): Promise<string> {
    let code = base;
    let n = 1;
    while (
      await this.prisma.menuItem.findFirst({ where: { code } })
    ) {
      code = `${base}-${n++}`;
    }
    return code;
  }

  private async sendResetEmail(to: string, resetLink: string): Promise<void> {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpUser || !smtpPass) return; // Skip if not configured

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"Food Ordering Console" <${smtpUser}>`,
        to,
        subject: 'รีเซ็ตรหัสผ่าน - Food Ordering Console',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🍽️ Food Ordering Console</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #1f2937;">รีเซ็ตรหัสผ่านของคุณ</h2>
              <p style="color: #6b7280; line-height: 1.6;">
                เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ<br>
                กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์นี้จะหมดอายุใน <strong>1 ชั่วโมง</strong>
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                  รีเซ็ตรหัสผ่าน
                </a>
              </div>
              <p style="color: #9ca3af; font-size: 14px;">หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.error('Failed to send reset email:', err);
    }
  }
}
