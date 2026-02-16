import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { BranchId } from '../../common/decorators/branch-id.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get overview statistics' })
  @ApiResponse({ status: 200, description: 'Overview statistics' })
  getOverviewStats(@BranchId() branchId: number) {
    return this.dashboardService.getOverviewStats(branchId);
  }

  @Get('queue-stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  getQueueStats(@BranchId() branchId: number) {
    return this.dashboardService.getQueueStats(branchId);
  }

  @Get('order-stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Order statistics' })
  getOrderStats(@BranchId() branchId: number) {
    return this.dashboardService.getOrderStats(branchId);
  }

  @Get('popular-items')
  @ApiOperation({ summary: 'Get popular menu items' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Popular menu items' })
  getPopularItems(@BranchId() branchId: number, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.dashboardService.getPopularItems(limitNum, branchId);
  }

  @Get('revenue-by-hour')
  @ApiOperation({ summary: 'Get revenue by hour' })
  @ApiResponse({ status: 200, description: 'Hourly revenue data' })
  getRevenueByHour(@BranchId() branchId: number) {
    return this.dashboardService.getRevenueByHour(branchId);
  }

  // ===== Report Endpoints =====

  @Get('reports/revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Revenue report data' })
  getRevenueReport(
    @BranchId() branchId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getRevenueReport(
      new Date(startDate),
      new Date(endDate + 'T23:59:59.999Z'),
      branchId,
    );
  }

  @Get('reports/orders')
  @ApiOperation({ summary: 'Get orders report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Orders report data' })
  getOrdersReport(
    @BranchId() branchId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getOrdersReport(
      new Date(startDate),
      new Date(endDate + 'T23:59:59.999Z'),
      branchId,
    );
  }

  @Get('reports/menu-performance')
  @ApiOperation({ summary: 'Get menu performance report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Menu performance data' })
  getMenuPerformanceReport(
    @BranchId() branchId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getMenuPerformanceReport(
      new Date(startDate),
      new Date(endDate + 'T23:59:59.999Z'),
      branchId,
    );
  }

  @Get('reports/member-analytics')
  @ApiOperation({ summary: 'Get member analytics' })
  @ApiResponse({ status: 200, description: 'Member analytics data' })
  getMemberAnalytics() {
    return this.dashboardService.getMemberAnalytics();
  }

  @Get('reports/daily-summary')
  @ApiOperation({ summary: 'Get daily summary for trend charts' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Daily summary data' })
  getDailySummary(
    @BranchId() branchId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getDailySummary(
      new Date(startDate),
      new Date(endDate + 'T23:59:59.999Z'),
      branchId,
    );
  }
}
