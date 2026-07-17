import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findByEmail', () => {
    it('returns the user matching the given email', async () => {
      const user = {
        id: '1',
        email: 'a@example.com',
        passwordHash: 'hash',
        name: 'A',
      };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail('a@example.com');

      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@example.com' },
      });
    });

    it('returns null when no user matches the email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the user matching the given id', async () => {
      const user = {
        id: '1',
        email: 'a@example.com',
        passwordHash: 'hash',
        name: 'A',
      };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(result).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('returns null when no user matches the id', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a user with the given email, password hash, and name', async () => {
      const input = { email: 'a@example.com', passwordHash: 'hash', name: 'A' };
      const created = { id: '1', ...input };
      prisma.user.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: input });
    });
  });

  describe('setRefreshTokenHash', () => {
    it('updates the user with the given refresh token hash', async () => {
      prisma.user.update.mockResolvedValue(undefined);

      await service.setRefreshTokenHash('1', 'a-hash');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { refreshTokenHash: 'a-hash' },
      });
    });

    it('clears the refresh token hash when given null', async () => {
      prisma.user.update.mockResolvedValue(undefined);

      await service.setRefreshTokenHash('1', null);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { refreshTokenHash: null },
      });
    });
  });
});
