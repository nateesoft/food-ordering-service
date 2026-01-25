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
import { CreateTableDto, UpdateTableStatusDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TableStatus } from '@prisma/client';

@ApiTags('Tables')
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tables' })
  @ApiQuery({ name: 'status', required: false, enum: TableStatus })
  @ApiResponse({ status: 200, description: 'List of tables' })
  findAll(@Query('status') status?: TableStatus) {
    return this.tablesService.findAll(status);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available tables' })
  @ApiResponse({ status: 200, description: 'List of available tables' })
  getAvailableTables() {
    return this.tablesService.getAvailableTables();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get table statistics' })
  @ApiResponse({ status: 200, description: 'Table statistics' })
  getTableStats() {
    return this.tablesService.getTableStats();
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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new table (Admin only)' })
  @ApiResponse({ status: 201, description: 'Table created' })
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
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
