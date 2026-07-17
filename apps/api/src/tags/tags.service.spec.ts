import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

describe('TagsService', () => {
  let service: TagsService;
  let prisma: {
    tag: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      tag: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TagsService);
  });

  describe('create', () => {
    it('creates a tag scoped to the requesting user', async () => {
      const created = { id: 'tag-1', name: 'Groceries', userId: 'user-1' };
      prisma.tag.create.mockResolvedValue(created);

      const result = await service.create('user-1', { name: 'Groceries' });

      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: { name: 'Groceries', userId: 'user-1' },
      });
      expect(result).toEqual(created);
    });

    it('throws ConflictException when the user already has a tag with that name', async () => {
      prisma.tag.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create('user-1', { name: 'Groceries' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows unexpected errors', async () => {
      prisma.tag.create.mockRejectedValue(new Error('connection lost'));

      await expect(
        service.create('user-1', { name: 'Groceries' }),
      ).rejects.toThrow('connection lost');
    });
  });
});
