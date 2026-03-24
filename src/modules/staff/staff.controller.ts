import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CheckInDto, CheckOutDto, HeartbeatDto, SetPinDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Staff check-in to a table using PIN' })
  @ApiResponse({ status: 200, description: 'Checked in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async checkIn(@BranchId() branchId: number, @Body() checkInDto: CheckInDto) {
    return this.staffService.checkIn(checkInDto, branchId);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Staff check-out from a table' })
  @ApiResponse({ status: 200, description: 'Checked out successfully' })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  @ApiResponse({ status: 404, description: 'No active check-in found' })
  async checkOut(@BranchId() branchId: number, @Body() checkOutDto: CheckOutDto) {
    return this.staffService.checkOut(checkOutDto, branchId);
  }

  @Patch('heartbeat')
  @ApiOperation({ summary: 'Update staff last seen time for a table' })
  @ApiResponse({ status: 200, description: 'Heartbeat updated' })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  @ApiResponse({ status: 404, description: 'No active check-in found' })
  async heartbeat(@BranchId() branchId: number, @Body() heartbeatDto: HeartbeatDto) {
    return this.staffService.heartbeat(heartbeatDto, branchId);
  }

  @Post('verify-pin')
  @ApiOperation({ summary: 'Verify staff PIN' })
  @ApiResponse({ status: 200, description: 'PIN is valid' })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  async verifyPin(@Body() body: { pin: string }) {
    return this.staffService.verifyPin(body.pin);
  }

  @Get('my-tables')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tables assigned to current staff' })
  @ApiResponse({ status: 200, description: 'Returns list of assigned tables' })
  async getMyTables(@Request() req: { user: { id: number } }) {
    return this.staffService.getMyTables(req.user.id);
  }

  @Post('set-pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set PIN for current staff' })
  @ApiResponse({ status: 200, description: 'PIN set successfully' })
  @ApiResponse({ status: 409, description: 'PIN already in use' })
  async setPin(
    @Request() req: { user: { id: number } },
    @Body() setPinDto: SetPinDto,
  ) {
    return this.staffService.setPin(req.user.id, setPinDto);
  }

  @Get('assignments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active staff-table assignments' })
  @ApiResponse({ status: 200, description: 'Returns all active assignments' })
  async getAllActiveAssignments(@BranchId() branchId: number) {
    return this.staffService.getAllActiveAssignments(branchId);
  }
}
