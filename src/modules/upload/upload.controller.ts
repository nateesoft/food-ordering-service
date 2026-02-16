import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.saveImage(file);
  }

  @Get('images')
  @ApiOperation({ summary: 'List all uploaded images' })
  @ApiResponse({ status: 200, description: 'List of uploaded images' })
  async listImages() {
    const images = await this.uploadService.listImages();
    return { images };
  }

  @Delete('images/:filename')
  @ApiOperation({ summary: 'Delete an uploaded image' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  async deleteImage(@Param('filename') filename: string) {
    await this.uploadService.deleteImage(filename);
    return { message: 'Image deleted successfully' };
  }
}
