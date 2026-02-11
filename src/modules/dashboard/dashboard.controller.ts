import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get overview statistics' })
  @ApiResponse({ status: 200, description: 'Overview statistics' })
  getOverviewStats() {
    return this.dashboardService.getOverviewStats();
  }

  @Get('queue-stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  getQueueStats() {
    return this.dashboardService.getQueueStats();
  }

  @Get('order-stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Order statistics' })
  getOrderStats() {
    return this.dashboardService.getOrderStats();
  }

  @Get('popular-items')
  @ApiOperation({ summary: 'Get popular menu items' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Popular menu items' })
  getPopularItems(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.dashboardService.getPopularItems(limitNum);
  }

  @Get('revenue-by-hour')
  @ApiOperation({ summary: 'Get revenue by hour' })
  @ApiResponse({ status: 200, description: 'Hourly revenue data' })
  getRevenueByHour() {
    return this.dashboardService.getRevenueByHour();
  }

  // ===== Report Endpoints =====

  @Get('reports/revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Revenue report data' })
  getRevenueReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getRevenueReport(
      new Date(startDate),
      new Date(endDate + 'T23:59:59.999Z'),
    );
  }

  @Get('reports/orders')
  @ApiOperation({ summary: 'Get orders report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Orders report data' })
  getOrdersReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getOrdersReport(
      new Date(startDate),
      new Date(endDate + 'T23:59:59.999Z'),
    );
  }

  @Get('reports/menu-performance')
  @ApiOperation({ summary: 'Get menu performance report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Menu performance data' })
  getMenuPerformanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getMenuPerformanceReport(
      new Date(startDate),
      new Date(endDate + 'T23:59:59.999Z'),
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
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.dashboardService.getDailySummary(
      new Date(startDate),
      new Date(endDate + 'T23:59:59.999Z'),
    );
  }
}
