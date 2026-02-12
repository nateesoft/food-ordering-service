import {
  Controller,
  Get,
  Post,
  Put,
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
import { BranchService } from './branch.service';
import { CreateBranchDto, UpdateBranchDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Branches')
@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of branches' })
  findAll(@Query('isActive') isActive?: string) {
    const isActiveBoolean =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.branchService.findAll(isActiveBoolean);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch details' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new branch (Admin only)' })
  @ApiResponse({ status: 201, description: 'Branch created' })
  create(@Body() dto: CreateBranchDto) {
    return this.branchService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update branch (Admin only)' })
  @ApiResponse({ status: 200, description: 'Branch updated' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete branch (Admin only)' })
  @ApiResponse({ status: 200, description: 'Branch deleted' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.branchService.remove(id);
  }
}
