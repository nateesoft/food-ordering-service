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
import { AddonsService } from './addons.service';
import { CreateAddOnDto, CreateAddOnGroupDto } from './dto';
import { BranchId } from '../../common/decorators/branch-id.decorator';
import { ConsoleJwtAuthGuard } from '../console-auth/guards/console-jwt-auth.guard';

@ApiTags('Add-ons')
@Controller()
export class AddonsController {
  constructor(private readonly addonsService: AddonsService) {}

  // Add-ons endpoints
  @Get('addons')
  @ApiOperation({ summary: 'Get all add-ons' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of add-ons' })
  findAllAddOns(
    @BranchId() branchId: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.addonsService.findAllAddOns(category, isActiveBoolean, branchId);
  }

  @Get('addons/categories')
  @ApiOperation({ summary: 'Get all add-on categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  getAddOnCategories(@BranchId() branchId: string) {
    return this.addonsService.getAddOnCategories(branchId);
  }

  @Get('addons/:id')
  @ApiOperation({ summary: 'Get add-on by ID' })
  @ApiResponse({ status: 200, description: 'Add-on details' })
  @ApiResponse({ status: 404, description: 'Add-on not found' })
  findOneAddOn(@Param('id', ParseIntPipe) id: number) {
    return this.addonsService.findOneAddOn(id);
  }

  @Post('addons')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new add-on (Admin only)' })
  @ApiResponse({ status: 201, description: 'Add-on created' })
  createAddOn(@BranchId() branchId: string, @Body() createAddOnDto: CreateAddOnDto) {
    return this.addonsService.createAddOn(createAddOnDto, branchId);
  }

  @Put('addons/:id')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update add-on (Admin only)' })
  @ApiResponse({ status: 200, description: 'Add-on updated' })
  @ApiResponse({ status: 404, description: 'Add-on not found' })
  updateAddOn(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAddOnDto: Partial<CreateAddOnDto>,
  ) {
    return this.addonsService.updateAddOn(id, updateAddOnDto);
  }

  @Delete('addons/:id')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete add-on (Admin only)' })
  @ApiResponse({ status: 200, description: 'Add-on deleted' })
  @ApiResponse({ status: 404, description: 'Add-on not found' })
  removeAddOn(@Param('id', ParseIntPipe) id: number) {
    return this.addonsService.removeAddOn(id);
  }

  // Add-on Groups endpoints
  @Get('addon-groups')
  @ApiOperation({ summary: 'Get all add-on groups' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of add-on groups' })
  findAllAddOnGroups(
    @BranchId() branchId: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean =
      isActive !== undefined ? isActive === 'true' : undefined;
    return this.addonsService.findAllAddOnGroups(category, isActiveBoolean, branchId);
  }

  @Get('addon-groups/:id')
  @ApiOperation({ summary: 'Get add-on group by ID' })
  @ApiResponse({ status: 200, description: 'Add-on group details' })
  @ApiResponse({ status: 404, description: 'Add-on group not found' })
  findOneAddOnGroup(@Param('id', ParseIntPipe) id: number) {
    return this.addonsService.findOneAddOnGroup(id);
  }

  @Post('addon-groups')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new add-on group (Admin only)' })
  @ApiResponse({ status: 201, description: 'Add-on group created' })
  createAddOnGroup(@BranchId() branchId: string, @Body() createAddOnGroupDto: CreateAddOnGroupDto) {
    return this.addonsService.createAddOnGroup(createAddOnGroupDto, branchId);
  }

  @Put('addon-groups/:id')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update add-on group (Admin only)' })
  @ApiResponse({ status: 200, description: 'Add-on group updated' })
  @ApiResponse({ status: 404, description: 'Add-on group not found' })
  updateAddOnGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAddOnGroupDto: Partial<CreateAddOnGroupDto>,
  ) {
    return this.addonsService.updateAddOnGroup(id, updateAddOnGroupDto);
  }

  @Delete('addon-groups/:id')
  @UseGuards(ConsoleJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete add-on group (Admin only)' })
  @ApiResponse({ status: 200, description: 'Add-on group deleted' })
  @ApiResponse({ status: 404, description: 'Add-on group not found' })
  removeAddOnGroup(@Param('id', ParseIntPipe) id: number) {
    return this.addonsService.removeAddOnGroup(id);
  }
}
