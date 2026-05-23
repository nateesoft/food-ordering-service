import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConsoleAuthService } from './console-auth.service';
import {
  ConsoleRegisterDto,
  ConsoleLoginDto,
  ConsoleForgotPasswordDto,
  ConsoleResetPasswordDto,
} from './dto';
import { ConsoleJwtAuthGuard } from './guards/console-jwt-auth.guard';
import { ConsoleRolesGuard } from './guards/console-roles.guard';
import { ConsoleRoles } from './decorators/console-roles.decorator';

@ApiTags('Console Auth')
@Controller('console/auth')
export class ConsoleAuthController implements OnModuleInit {
  constructor(private readonly consoleAuthService: ConsoleAuthService) {}

  async onModuleInit() {
    await this.consoleAuthService.seedSystemAdmin();
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ลงทะเบียนลูกค้าใหม่ (food-ordering-console)' })
  @ApiResponse({ status: 201, description: 'ลงทะเบียนสำเร็จ' })
  @ApiResponse({ status: 409, description: 'Username ถูกใช้งานแล้ว' })
  async register(@Body() dto: ConsoleRegisterDto) {
    return this.consoleAuthService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'เข้าสู่ระบบ Console' })
  @ApiResponse({ status: 200, description: 'เข้าสู่ระบบสำเร็จ' })
  @ApiResponse({ status: 401, description: 'Username หรือ Password ไม่ถูกต้อง' })
  async login(@Body() dto: ConsoleLoginDto) {
    return this.consoleAuthService.login(dto);
  }

  @Get('me')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน' })
  @ApiResponse({ status: 200, description: 'Profile ของผู้ใช้' })
  async getMe(@Request() req: { user: { userId: string } }) {
    return this.consoleAuthService.getMe(req.user.userId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ขอลิงก์รีเซ็ตรหัสผ่าน' })
  @ApiResponse({ status: 200, description: 'ส่งอีเมลแล้ว (ถ้าบัญชีมีอยู่)' })
  async forgotPassword(@Body() dto: ConsoleForgotPasswordDto) {
    return this.consoleAuthService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'รีเซ็ตรหัสผ่านด้วย token' })
  @ApiResponse({ status: 200, description: 'รีเซ็ตสำเร็จ' })
  @ApiResponse({ status: 400, description: 'Token ไม่ถูกต้องหรือหมดอายุ' })
  async resetPassword(@Body() dto: ConsoleResetPasswordDto) {
    return this.consoleAuthService.resetPassword(dto);
  }

  @Get('admin/stats')
  @UseGuards(ConsoleJwtAuthGuard, ConsoleRolesGuard)
  @ConsoleRoles('system_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูสถิติภาพรวม (System Admin เท่านั้น)' })
  @ApiResponse({ status: 200, description: 'ข้อมูลสถิติ' })
  async getAdminStats() {
    return this.consoleAuthService.getAdminStats();
  }
}
