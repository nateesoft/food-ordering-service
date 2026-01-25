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
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new member' })
  @ApiResponse({ status: 201, description: 'Member created' })
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all members' })
  @ApiQuery({ name: 'tier', required: false, enum: ['bronze', 'silver', 'gold'] })
  @ApiResponse({ status: 200, description: 'List of members' })
  findAll(@Query('tier') tier?: string) {
    return this.membersService.findAll(tier);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get member statistics' })
  @ApiResponse({ status: 200, description: 'Member statistics' })
  getMemberStats() {
    return this.membersService.getMemberStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get member by ID' })
  @ApiResponse({ status: 200, description: 'Member details' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.findOne(id);
  }

  @Get('member-id/:memberId')
  @ApiOperation({ summary: 'Get member by member ID' })
  @ApiResponse({ status: 200, description: 'Member details' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  findByMemberId(@Param('memberId') memberId: string) {
    return this.membersService.findByMemberId(memberId);
  }

  @Get('phone/:phone')
  @ApiOperation({ summary: 'Get member by phone number' })
  @ApiResponse({ status: 200, description: 'Member details or null' })
  findByPhone(@Param('phone') phone: string) {
    return this.membersService.findByPhone(phone);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update member' })
  @ApiResponse({ status: 200, description: 'Member updated' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(id, updateMemberDto);
  }

  @Post(':memberId/add-points')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add points to member' })
  @ApiResponse({ status: 200, description: 'Points added' })
  addPoints(
    @Param('memberId') memberId: string,
    @Body('points') points: number,
  ) {
    return this.membersService.addPoints(memberId, points);
  }

  @Post(':memberId/redeem-points')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem member points' })
  @ApiResponse({ status: 200, description: 'Points redeemed' })
  @ApiResponse({ status: 409, description: 'Insufficient points' })
  redeemPoints(
    @Param('memberId') memberId: string,
    @Body('points') points: number,
  ) {
    return this.membersService.redeemPoints(memberId, points);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete member (Admin only)' })
  @ApiResponse({ status: 200, description: 'Member deleted' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.remove(id);
  }
}
