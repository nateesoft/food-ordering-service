import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BranchService } from './branch.service';
import { CreateBranchDto, UpdateBranchDto } from './dto';
import { ConsoleJwtAuthGuard } from '../console-auth/guards/console-jwt-auth.guard';

@ApiTags('Branches')
@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'companyId', required: false, type: String, description: 'Filter by Company UUID' })
  @ApiResponse({ status: 200, description: 'List of branches' })
  findAll(
    @Query('isActive') isActive?: string,
    @Query('companyId') companyId?: string,
  ) {
    const isActiveBoolean =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.branchService.findAll(isActiveBoolean, companyId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get branch by code (public, used by QR code URL)' })
  @ApiResponse({ status: 200, description: 'Branch details with company info' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findByCode(@Param('code') code: string) {
    return this.branchService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch details' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

  @Post()
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new branch (Console user)' })
  @ApiResponse({ status: 201, description: 'Branch created' })
  create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchService.create(dto, req.user.userId);
  }

  @Put(':id')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update branch (Console user)' })
  @ApiResponse({ status: 200, description: 'Branch updated' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete branch (Console user)' })
  @ApiResponse({ status: 200, description: 'Branch deleted' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
