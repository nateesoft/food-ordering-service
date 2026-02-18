import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';
import { mockUser } from '../../test/fixtures';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('$2b$10$hashed'),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrismaService;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    jwtService = { sign: jest.fn().mockReturnValue('test-jwt-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return access_token and user on valid credentials', async () => {
      const user = mockUser();
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ username: 'testuser', password: 'pass123' });

      expect(result.access_token).toBe('test-jwt-token');
      expect(result.user).toEqual({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        branchId: user.branchId,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        username: user.username,
        role: user.role,
        branchId: user.branchId,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ username: 'nonexistent', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser({ isActive: false }));

      await expect(
        service.login({ username: 'testuser', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ username: 'testuser', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create user with hashed password and return user without password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const created = mockUser();
      prisma.user.create.mockResolvedValue(created);

      const result = await service.register({
        username: 'newuser',
        password: 'pass123',
        name: 'New User',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('pass123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: 'newuser',
          password: '$2b$10$hashed',
          name: 'New User',
        }),
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException when username already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser());

      await expect(
        service.register({ username: 'testuser', password: 'pass', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should default role to STAFF when not provided', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser());

      await service.register({ username: 'newuser', password: 'pass', name: 'Test' });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: 'STAFF' }),
      });
    });
  });

  describe('validateUser', () => {
    it('should return user when user exists and is active', async () => {
      const user = mockUser();
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.validateUser(1);
      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(999);
      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser({ isActive: false }));

      const result = await service.validateUser(1);
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user fields correctly', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser());
      prisma.user.update.mockResolvedValue(mockUser({ name: 'Updated' }));

      const result = await service.updateUser(1, { name: 'Updated' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated' },
        select: expect.any(Object),
      });
      expect(result.name).toBe('Updated');
    });

    it('should hash password when provided', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser());
      prisma.user.update.mockResolvedValue(mockUser());

      await service.updateUser(1, { password: 'newpass' });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ password: '$2b$10$hashed' }),
        select: expect.any(Object),
      });
    });

    it('should throw ConflictException when PIN is in use by another user', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser()) // findUserById
        .mockResolvedValueOnce(mockUser({ id: 2 })); // PIN check - different user

      await expect(
        service.updateUser(1, { pin: '1234' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return success message', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser());
      prisma.user.delete.mockResolvedValue(mockUser());

      const result = await service.deleteUser(1);
      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser(999)).rejects.toThrow(NotFoundException);
    });
  });
});
