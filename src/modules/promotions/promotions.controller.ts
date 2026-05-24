import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, UpdatePromotionDto, ValidateCouponDto } from './dto';
import { BranchId } from '../../common/decorators/branch-id.decorator';
import { PromotionStatus } from '@prisma/client';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new promotion' })
  @ApiResponse({ status: 201, description: 'Promotion created' })
  create(@Body() dto: CreatePromotionDto, @BranchId() branchId: string) {
    return this.promotionsService.create(dto, branchId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all promotions' })
  @ApiQuery({ name: 'status', required: false, enum: PromotionStatus })
  @ApiResponse({ status: 200, description: 'List of promotions' })
  findAll(
    @BranchId() branchId: string,
    @Query('status') status?: PromotionStatus,
  ) {
    return this.promotionsService.findAll(branchId, status);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get currently available promotions' })
  @ApiQuery({ name: 'subtotal', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Available promotions' })
  getAvailable(
    @BranchId() branchId: string,
    @Query('subtotal') subtotal?: string,
  ) {
    return this.promotionsService.getAvailablePromotions(
      branchId,
      subtotal ? parseFloat(subtotal) : undefined,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get promotion statistics' })
  @ApiResponse({ status: 200, description: 'Promotion stats' })
  getStats(@BranchId() branchId: string) {
    return this.promotionsService.getPromotionStats(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promotion by ID' })
  @ApiResponse({ status: 200, description: 'Promotion details' })
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a promotion' })
  @ApiResponse({ status: 200, description: 'Promotion updated' })
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (deactivate) a promotion' })
  @ApiResponse({ status: 200, description: 'Promotion deactivated' })
  remove(@Param('id') id: string) {
    return this.promotionsService.delete(+id);
  }

  @Post('validate-coupon')
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiResponse({ status: 200, description: 'Coupon validation result' })
  validateCoupon(@Body() dto: ValidateCouponDto, @BranchId() branchId: string) {
    return this.promotionsService.validateCoupon(dto, branchId);
  }
}
