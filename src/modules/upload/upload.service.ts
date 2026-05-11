import {
  Injectable,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as Minio from 'minio';
import { Readable } from 'stream';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@Injectable()
export class UploadService implements OnModuleInit {
  private minioClient!: Minio.Client;
  private bucket!: string;
  private endpointUrl!: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const endpoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'http://localhost:9000',
    );
    const accessKey = this.configService.get<string>(
      'MINIO_ROOT_USER',
      'minioadmin',
    );
    const secretKey = this.configService.get<string>(
      'MINIO_ROOT_PASSWORD',
      'minioadmin',
    );
    this.bucket = this.configService.get<string>('MINIO_BUCKET', 'food-images');
    this.endpointUrl = endpoint;

    const url = new URL(endpoint);
    const useSSL = url.protocol === 'https:';
    const port = url.port ? parseInt(url.port) : useSSL ? 443 : 9000;

    this.minioClient = new Minio.Client({
      endPoint: url.hostname,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    const exists = await this.minioClient.bucketExists(this.bucket);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucket);
    }

    // Set public read policy so images are accessible without auth
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    });
    await this.minioClient.setBucketPolicy(this.bucket, policy);
  }

  async saveImage(
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
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

    const readable = Readable.from(file.buffer);
    await this.minioClient.putObject(
      this.bucket,
      filename,
      readable,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    const url = `${this.endpointUrl}/${this.bucket}/${filename}`;
    return { url, filename };
  }

  async listImages(): Promise<
    { url: string; filename: string; size: number; uploadedAt: string }[]
  > {
    return new Promise((resolve, reject) => {
      const images: {
        url: string;
        filename: string;
        size: number;
        uploadedAt: string;
      }[] = [];
      const stream = this.minioClient.listObjects(this.bucket, '', false);

      stream.on('data', (obj) => {
        const ext = path.extname(obj.name || '').toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
          images.push({
            url: `${this.endpointUrl}/${this.bucket}/${obj.name}`,
            filename: obj.name || '',
            size: obj.size || 0,
            uploadedAt: obj.lastModified?.toISOString() || new Date().toISOString(),
          });
        }
      });

      stream.on('end', () =>
        resolve(images.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))),
      );
      stream.on('error', reject);
    });
  }

  async deleteImage(filename: string): Promise<void> {
    const sanitized = path.basename(filename);
    try {
      await this.minioClient.removeObject(this.bucket, sanitized);
    } catch {
      throw new BadRequestException('Image not found');
    }
  }
}
