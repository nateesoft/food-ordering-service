import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrintersService } from './printers.service';

@ApiTags('Printers')
@Controller('printers')
export class PrintersController {
  constructor(private readonly printersService: PrintersService) {}

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark printer active — called by local printer agent' })
  async heartbeat(@Body() body: { printerId: string; branchId: string; secret: string }) {
    await this.printersService.heartbeat(body.printerId, body.branchId, body.secret);
    return { ok: true };
  }

  @Post('offline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark printer offline — called by local printer agent' })
  async markOffline(@Body() body: { printerId: string; branchId: string; secret: string }) {
    await this.printersService.markOffline(body.printerId, body.branchId, body.secret);
    return { ok: true };
  }
}
