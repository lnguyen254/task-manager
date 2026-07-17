import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

describe('TagsService', () => {
  let service: TagsService;
  let prisma: {
    tag: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      tag: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
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

  describe('findAll', () => {
    it('returns tags scoped to the requesting user, ordered by name', async () => {
      const tags = [
        { id: 'tag-1', name: 'Groceries', userId: 'user-1' },
        { id: 'tag-2', name: 'Urgent', userId: 'user-1' },
      ];
      prisma.tag.findMany.mockResolvedValue(tags);

      const result = await service.findAll('user-1');

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(tags);
    });
  });

  describe('remove', () => {
    it('deletes the tag after confirming it belongs to the user', async () => {
      prisma.tag.findFirst.mockResolvedValue({ id: 'tag-1' });
      prisma.tag.delete.mockResolvedValue({ id: 'tag-1' });

      await service.remove('user-1', 'tag-1');

      expect(prisma.tag.findFirst).toHaveBeenCalledWith({
        where: { id: 'tag-1', userId: 'user-1' },
        select: { id: true },
      });
      expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: 'tag-1' } });
    });

    it('throws NotFoundException and does not delete when not found or not owned', async () => {
      prisma.tag.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', 'someone-elses-tag')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.tag.delete).not.toHaveBeenCalled();
    });
  });
});
