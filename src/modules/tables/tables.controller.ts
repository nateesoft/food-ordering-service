import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto, UpdateTableStatusDto, OpenTableSessionDto, TransferTableDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BranchId } from '../../common/decorators/branch-id.decorator';
import { TableStatus } from '@prisma/client';
import { StaffService } from '../staff/staff.service';
import { RedisService } from '../redis/redis.service';
import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class RegisterSessionDto {
  @ApiProperty({ example: '1fcd142e-b993-4de0-bb10-232ecc282560' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ example: 'A1' })
  @IsString()
  tableNumber: string;
}

@ApiTags('Tables')
@Controller('tables')
export class TablesController {
  constructor(
    private readonly tablesService: TablesService,
    private readonly staffService: StaffService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all tables' })
  @ApiQuery({ name: 'status', required: false, enum: TableStatus })
  @ApiQuery({ name: 'zone', required: false })
  @ApiResponse({ status: 200, description: 'List of tables' })
  findAll(
    @BranchId() branchId: number,
    @Query('status') status?: TableStatus,
    @Query('zone') zone?: string,
  ) {
    return this.tablesService.findAll(status, branchId, zone);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available tables' })
  @ApiResponse({ status: 200, description: 'List of available tables' })
  getAvailableTables(@BranchId() branchId: number) {
    return this.tablesService.getAvailableTables(branchId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get table statistics' })
  @ApiResponse({ status: 200, description: 'Table statistics' })
  getTableStats(@BranchId() branchId: number) {
    return this.tablesService.getTableStats(branchId);
  }

  @Get('zones')
  @ApiOperation({ summary: 'Get all table zones' })
  @ApiResponse({ status: 200, description: 'List of zones' })
  getZones(@BranchId() branchId: number) {
    return this.tablesService.getZones(branchId);
  }

  @Patch('bulk-positions')
  @ApiOperation({ summary: 'Bulk update table positions (Admin)' })
  @ApiResponse({ status: 200, description: 'Positions updated' })
  bulkUpdatePositions(
    @Body() updates: { id: number; positionX: number; positionY: number }[],
  ) {
    return this.tablesService.bulkUpdatePositions(updates);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get table by ID' })
  @ApiResponse({ status: 200, description: 'Table details' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.findOne(id);
  }

  @Get('number/:number')
  @ApiOperation({ summary: 'Get table by number' })
  @ApiResponse({ status: 200, description: 'Table details' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  findByNumber(@Param('number') number: string) {
    return this.tablesService.findByNumber(number);
  }

  @Post('register-session')
  @ApiOperation({ summary: 'Register a sessionId in Redis (TTL 3h)' })
  @ApiResponse({ status: 201, description: 'Session registered' })
  async registerSession(
    @BranchId() branchId: number,
    @Body() dto: RegisterSessionDto,
  ) {
    await this.redisService.registerSession(dto.sessionId, dto.tableNumber, branchId);
    return { message: 'Session registered', sessionId: dto.sessionId, ttl: 10800 };
  }

  @Get('validate-session/:sessionId')
  @ApiOperation({ summary: 'Check if a sessionId is valid in Redis' })
  @ApiResponse({ status: 200, description: 'Session validity' })
  async validateSession(@Param('sessionId') sessionId: string) {
    const session = await this.redisService.validateSession(sessionId);
    const ttl = session ? await this.redisService.getSessionTTL(sessionId) : -1;
    return { valid: !!session, session, ttl };
  }

  @Get('number/:tableNumber/check-access')
  @ApiOperation({ summary: 'Check if a customer can access a table to order' })
  @ApiQuery({ name: 'sessionId', required: false })
  @ApiResponse({ status: 200, description: 'Access check result' })
  async checkTableAccess(
    @BranchId() branchId: number,
    @Param('tableNumber') tableNumber: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const activeSessionId = await this.redisService.getActiveSessionForTable(tableNumber, branchId);

    if (!activeSessionId) {
      return { canAccess: true, reason: 'NO_ACTIVE_SESSION' };
    }

    if (sessionId && activeSessionId === sessionId) {
      return { canAccess: true, reason: 'VALID_SESSION' };
    }

    return {
      canAccess: false,
      reason: 'TABLE_OCCUPIED',
      message: 'โต๊ะนี้ยังมีรายการที่ยังไม่ได้ชำระเงิน กรุณาติดต่อพนักงาน',
    };
  }

  @Get('number/:number/staff')
  @ApiOperation({ summary: 'Get staff assigned to a table' })
  @ApiResponse({ status: 200, description: 'List of staff assigned to the table' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  getTableStaff(@Param('number') number: string) {
    return this.staffService.getTableStaff(number);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new table (Admin only)' })
  @ApiResponse({ status: 201, description: 'Table created' })
  create(@BranchId() branchId: number, @Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto, branchId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update table (Admin only)' })
  @ApiResponse({ status: 200, description: 'Table updated' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTableDto: Partial<CreateTableDto>,
  ) {
    return this.tablesService.update(id, updateTableDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update table status' })
  @ApiResponse({ status: 200, description: 'Table status updated' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateTableStatusDto,
  ) {
    return this.tablesService.updateStatus(id, updateStatusDto);
  }

  @Post(':id/merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge tables' })
  @ApiResponse({ status: 200, description: 'Tables merged' })
  mergeTables(
    @Param('id', ParseIntPipe) id: number,
    @Body('tableIds') tableIds: number[],
  ) {
    return this.tablesService.mergeTables(id, tableIds);
  }

  @Post(':id/unmerge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unmerge table' })
  @ApiResponse({ status: 200, description: 'Table unmerged' })
  unmergeTable(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.unmergeTable(id);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer orders from one table to another' })
  @ApiResponse({ status: 200, description: 'Table transferred successfully' })
  transferTable(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferTableDto,
    @BranchId() branchId: number,
  ) {
    return this.tablesService.transferTable(id, dto, branchId);
  }

  @Post(':id/open-session')
  @ApiOperation({ summary: 'Open a table session' })
  @ApiResponse({ status: 201, description: 'Session opened' })
  openSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OpenTableSessionDto,
    @BranchId() branchId: number,
  ) {
    return this.tablesService.openSession(id, dto, branchId);
  }

  @Post(':id/close-session')
  @ApiOperation({ summary: 'Close active table session' })
  @ApiResponse({ status: 200, description: 'Session closed' })
  closeSession(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.closeSession(id);
  }

  @Get(':id/active-session')
  @ApiOperation({ summary: 'Get active session for table' })
  @ApiResponse({ status: 200, description: 'Active session or null' })
  getActiveSession(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.getActiveSession(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete table (Admin only)' })
  @ApiResponse({ status: 200, description: 'Table deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.remove(id);
  }
}
