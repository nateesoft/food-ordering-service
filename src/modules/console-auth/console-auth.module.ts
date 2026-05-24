import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsoleAuthController } from './console-auth.controller';
import { ConsoleAuthService } from './console-auth.service';
import { ConsoleJwtAuthGuard } from './guards/console-jwt-auth.guard';
import { ConsoleRolesGuard } from './guards/console-roles.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('CONSOLE_JWT_SECRET') ||
          configService.get<string>('JWT_SECRET') ||
          'food-ordering-console-secret-key-2024',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ConsoleAuthController],
  providers: [ConsoleAuthService, ConsoleJwtAuthGuard, ConsoleRolesGuard],
  exports: [ConsoleAuthService, ConsoleJwtAuthGuard, JwtModule],
})
export class ConsoleAuthModule {}
