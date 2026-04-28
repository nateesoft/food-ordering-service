import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@Injectable()
export class UploadService {
  constructor() {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async saveImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; filename: string }> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: jpeg, png, webp, gif',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filepath, file.buffer);

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const url = `${baseUrl}/uploads/${filename}`;

    return { url, filename };
  }

  async listImages(): Promise<
    { url: string; filename: string; size: number; uploadedAt: string }[]
  > {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return [];
    }

    const files = fs.readdirSync(UPLOAD_DIR);
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';

    return files
      .filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
      })
      .map((filename) => {
        const filepath = path.join(UPLOAD_DIR, filename);
        const stats = fs.statSync(filepath);
        return {
          url: `${baseUrl}/uploads/${filename}`,
          filename,
          size: stats.size,
          uploadedAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  async deleteImage(filename: string): Promise<void> {
    const sanitized = path.basename(filename);
    const filepath = path.join(UPLOAD_DIR, sanitized);

    if (!fs.existsSync(filepath)) {
      throw new BadRequestException('Image not found');
    }

    fs.unlinkSync(filepath);
  }
}
