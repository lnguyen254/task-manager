import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { CreateUserInput, UsersService } from '../users/users.service';

type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock<Promise<User | null>, [string]>;
    create: jest.Mock<Promise<User>, [CreateUserInput]>;
    setRefreshTokenHash: jest.Mock<Promise<void>, [string, string | null]>;
  };

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn<Promise<User | null>, [string]>(),
      create: jest.fn<Promise<User>, [CreateUserInput]>(),
      setRefreshTokenHash: jest.fn<Promise<void>, [string, string | null]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates a user with an argon2 hash of the password, not the plaintext', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((data) =>
        Promise.resolve({
          id: 'user-1',
          email: data.email,
          name: data.name,
          passwordHash: data.passwordHash,
          createdAt: new Date('2026-01-01'),
        }),
      );

      await service.register({
        email: 'a@example.com',
        password: 'correct-horse-battery',
        name: 'Ada',
      });

      const createdData: CreateUserInput = usersService.create.mock.calls[0][0];
      expect(createdData.email).toBe('a@example.com');
      expect(createdData.name).toBe('Ada');
      expect(createdData.passwordHash).not.toBe('correct-horse-battery');
      await expect(
        argon2.verify(createdData.passwordHash, 'correct-horse-battery'),
      ).resolves.toBe(true);
    });

    it('returns the created user without the password hash', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'user-1',
        email: 'a@example.com',
        name: 'Ada',
        passwordHash: 'hashed',
        createdAt: new Date('2026-01-01'),
      });

      const result = await service.register({
        email: 'a@example.com',
        password: 'correct-horse-battery',
        name: 'Ada',
      });

      expect(result).toEqual({
        id: 'user-1',
        email: 'a@example.com',
        name: 'Ada',
        createdAt: new Date('2026-01-01'),
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('rejects registration when the email is already taken', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'a@example.com',
        name: 'Existing',
        passwordHash: 'hash',
      });

      await expect(
        service.register({
          email: 'a@example.com',
          password: 'correct-horse-battery',
          name: 'Ada',
        }),
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when no user exists with the given email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'a@example.com',
        name: 'Ada',
        passwordHash: await argon2.hash('correct-password'),
        createdAt: new Date('2026-01-01'),
      });

      await expect(
        service.login({ email: 'a@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns an access token and refresh token signed with their respective secrets', async () => {
      const jwtService = new JwtService();
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'a@example.com',
        name: 'Ada',
        passwordHash: await argon2.hash('correct-password'),
        createdAt: new Date('2026-01-01'),
      });

      const result = await service.login({
        email: 'a@example.com',
        password: 'correct-password',
      });

      const accessPayload = await jwtService.verifyAsync<{ sub: string }>(
        result.accessToken,
        {
          secret: process.env.JWT_ACCESS_SECRET,
        },
      );
      expect(accessPayload.sub).toBe('user-1');

      const refreshPayload = await jwtService.verifyAsync<{ sub: string }>(
        result.refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET,
        },
      );
      expect(refreshPayload.sub).toBe('user-1');

      await expect(
        jwtService.verifyAsync(result.accessToken, {
          secret: process.env.JWT_REFRESH_SECRET,
        }),
      ).rejects.toThrow();
    });

    it('persists a hash of the refresh token, not the raw token', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'a@example.com',
        name: 'Ada',
        passwordHash: await argon2.hash('correct-password'),
        createdAt: new Date('2026-01-01'),
      });

      const result = await service.login({
        email: 'a@example.com',
        password: 'correct-password',
      });

      expect(usersService.setRefreshTokenHash).toHaveBeenCalledTimes(1);
      const [userId, storedHash] =
        usersService.setRefreshTokenHash.mock.calls[0];
      expect(userId).toBe('user-1');
      expect(storedHash).not.toBe(result.refreshToken);
      expect(storedHash).toBe(
        createHash('sha256').update(result.refreshToken).digest('hex'),
      );
    });
  });
});
