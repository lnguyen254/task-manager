import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';

type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  refreshTokenHash: string | null;
  createdAt: Date;
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: { findById: jest.Mock<Promise<User | null>, [string]> };

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  });

  beforeEach(async () => {
    usersService = { findById: jest.fn<Promise<User | null>, [string]>() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
  });

  it('returns the safe user fields when the token subject matches an existing user', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Ada',
      passwordHash: 'hash',
      refreshTokenHash: 'refresh-hash',
      createdAt: new Date('2026-01-01'),
    });

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'a@example.com',
    });

    expect(result).toEqual({
      id: 'user-1',
      email: 'a@example.com',
      name: 'Ada',
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('refreshTokenHash');
  });

  it('throws UnauthorizedException when no user matches the token subject', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'deleted-user', email: 'a@example.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
