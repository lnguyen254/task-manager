import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    tag: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      tag: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TasksService);
  });

  describe('create', () => {
    it('creates a task with only the required title and no tags', async () => {
      const created = {
        id: 't1',
        title: 'Buy milk',
        description: null,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: null,
        userId: 'user-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        tags: [],
      };
      prisma.task.create.mockResolvedValue(created);

      const result = await service.create('user-1', { title: 'Buy milk' });

      expect(prisma.tag.findMany).not.toHaveBeenCalled();
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: { title: 'Buy milk', userId: 'user-1' },
        include: { tags: { include: { tag: true } } },
      });
      expect(result).toEqual({ ...created, tags: [] });
    });

    it('creates a task with tags after validating they belong to the user', async () => {
      prisma.tag.findMany.mockResolvedValue([{ id: 'tag-1' }, { id: 'tag-2' }]);
      const created = {
        id: 't1',
        title: 'Buy milk',
        description: null,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: null,
        userId: 'user-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        tags: [
          { taskId: 't1', tagId: 'tag-1', tag: { id: 'tag-1', name: 'Groceries', userId: 'user-1' } },
          { taskId: 't1', tagId: 'tag-2', tag: { id: 'tag-2', name: 'Urgent', userId: 'user-1' } },
        ],
      };
      prisma.task.create.mockResolvedValue(created);

      const result = await service.create('user-1', {
        title: 'Buy milk',
        tagIds: ['tag-1', 'tag-2'],
      });

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['tag-1', 'tag-2'] }, userId: 'user-1' },
        select: { id: true },
      });
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Buy milk',
          userId: 'user-1',
          tags: { create: [{ tagId: 'tag-1' }, { tagId: 'tag-2' }] },
        },
        include: { tags: { include: { tag: true } } },
      });
      expect(result.tags).toEqual([
        { id: 'tag-1', name: 'Groceries' },
        { id: 'tag-2', name: 'Urgent' },
      ]);
    });

    it('rejects when a tagId does not belong to the user', async () => {
      prisma.tag.findMany.mockResolvedValue([{ id: 'tag-1' }]);

      await expect(
        service.create('user-1', {
          title: 'Buy milk',
          tagIds: ['tag-1', 'someone-elses-tag'],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.task.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns the task scoped to the requesting user', async () => {
      const found = {
        id: 't1',
        title: 'Buy milk',
        userId: 'user-1',
        tags: [{ taskId: 't1', tagId: 'tag-1', tag: { id: 'tag-1', name: 'Groceries', userId: 'user-1' } }],
      };
      prisma.task.findFirst.mockResolvedValue(found);

      const result = await service.findOne('user-1', 't1');

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: 't1', userId: 'user-1' },
        include: { tags: { include: { tag: true } } },
      });
      expect(result.tags).toEqual([{ id: 'tag-1', name: 'Groceries' }]);
    });

    it('throws NotFoundException when the task does not exist or belongs to another user', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'someone-elses-task')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the task after confirming it belongs to the user', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: 't1' });
      prisma.task.delete.mockResolvedValue({ id: 't1' });

      await service.remove('user-1', 't1');

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: 't1', userId: 'user-1' },
        select: { id: true },
      });
      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });

    it('throws NotFoundException and does not delete when not found or not owned', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', 'someone-elses-task')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException and does not update when not found or not owned', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'someone-elses-task', { title: 'New title' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('updates scalar fields without touching tags when tagIds is not provided', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: 't1' });
      const updated = {
        id: 't1',
        title: 'New title',
        userId: 'user-1',
        tags: [],
      };
      prisma.task.update.mockResolvedValue(updated);

      const result = await service.update('user-1', 't1', { title: 'New title' });

      expect(prisma.tag.findMany).not.toHaveBeenCalled();
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { title: 'New title' },
        include: { tags: { include: { tag: true } } },
      });
      expect(result.tags).toEqual([]);
    });

    it('replaces tags after validating ownership when tagIds is provided', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: 't1' });
      prisma.tag.findMany.mockResolvedValue([{ id: 'tag-2' }]);
      const updated = {
        id: 't1',
        title: 'Buy milk',
        userId: 'user-1',
        tags: [{ taskId: 't1', tagId: 'tag-2', tag: { id: 'tag-2', name: 'Urgent', userId: 'user-1' } }],
      };
      prisma.task.update.mockResolvedValue(updated);

      const result = await service.update('user-1', 't1', { tagIds: ['tag-2'] });

      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['tag-2'] }, userId: 'user-1' },
        select: { id: true },
      });
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { tags: { deleteMany: {}, create: [{ tagId: 'tag-2' }] } },
        include: { tags: { include: { tag: true } } },
      });
      expect(result.tags).toEqual([{ id: 'tag-2', name: 'Urgent' }]);
    });

    it('clears all tags when tagIds is an empty array', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: 't1' });
      const updated = { id: 't1', title: 'Buy milk', userId: 'user-1', tags: [] };
      prisma.task.update.mockResolvedValue(updated);

      await service.update('user-1', 't1', { tagIds: [] });

      expect(prisma.tag.findMany).not.toHaveBeenCalled();
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { tags: { deleteMany: {}, create: [] } },
        include: { tags: { include: { tag: true } } },
      });
    });

    it('rejects when a tagId does not belong to the user and does not update', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: 't1' });
      prisma.tag.findMany.mockResolvedValue([]);

      await expect(
        service.update('user-1', 't1', { tagIds: ['someone-elses-tag'] }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const defaultQuery = {
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      page: 1,
      limit: 20,
    };

    it('lists tasks scoped to the user with default sort and pagination', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      const result = await service.findAll('user-1', defaultQuery);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: { tags: { include: { tag: true } } },
      });
      expect(prisma.task.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
    });

    it('combines status, priority, tag, and search filters', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      await service.findAll('user-1', {
        ...defaultQuery,
        status: 'TODO',
        priority: 'HIGH',
        tagId: 'tag-1',
        search: 'milk',
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: 'TODO',
          priority: 'HIGH',
          tags: { some: { tagId: 'tag-1' } },
          title: { contains: 'milk', mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: { tags: { include: { tag: true } } },
      });
    });

    it('applies sortBy/sortOrder and page/limit to the Prisma query', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(45);

      const result = await service.findAll('user-1', {
        ...defaultQuery,
        sortBy: 'dueDate',
        sortOrder: 'asc',
        page: 3,
        limit: 10,
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { dueDate: 'asc' },
        skip: 20,
        take: 10,
        include: { tags: { include: { tag: true } } },
      });
      expect(result).toEqual({ data: [], total: 45, page: 3, limit: 10, totalPages: 5 });
    });

    it('flattens tags on each returned task', async () => {
      prisma.task.findMany.mockResolvedValue([
        {
          id: 't1',
          title: 'Buy milk',
          userId: 'user-1',
          tags: [{ taskId: 't1', tagId: 'tag-1', tag: { id: 'tag-1', name: 'Groceries', userId: 'user-1' } }],
        },
      ]);
      prisma.task.count.mockResolvedValue(1);

      const result = await service.findAll('user-1', defaultQuery);

      expect(result.data[0].tags).toEqual([{ id: 'tag-1', name: 'Groceries' }]);
    });
  });
});
