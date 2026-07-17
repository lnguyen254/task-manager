import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

const TASK_INCLUDE = { tags: { include: { tag: true } } };

type TaskWithTags = {
  tags: { tag: { id: string; name: string } }[];
  [key: string]: unknown;
};

function toTaskResponse(task: TaskWithTags) {
  const { tags, ...rest } = task;
  return { ...rest, tags: tags.map(({ tag }) => ({ id: tag.id, name: tag.name })) };
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto) {
    const { tagIds, ...rest } = dto;

    if (tagIds?.length) {
      await this.assertTagsOwnedByUser(userId, tagIds);
    }

    const task = await this.prisma.task.create({
      data: {
        ...rest,
        userId,
        ...(tagIds?.length
          ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } }
          : {}),
      },
      include: TASK_INCLUDE,
    });

    return toTaskResponse(task);
  }

  async findAll(userId: string, query: QueryTasksDto) {
    const { status, priority, tagId, search, sortBy, sortOrder, page, limit } =
      query;

    const where = {
      userId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(tagId ? { tags: { some: { tagId } } } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: TASK_INCLUDE,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map(toTaskResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: TASK_INCLUDE,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return toTaskResponse(task);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const { tagIds, ...rest } = dto;

    if (tagIds?.length) {
      await this.assertTagsOwnedByUser(userId, tagIds);
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...rest,
        ...(tagIds !== undefined
          ? { tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } }
          : {}),
      },
      include: TASK_INCLUDE,
    });

    return toTaskResponse(task);
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({ where: { id } });
  }

  private async assertTagsOwnedByUser(userId: string, tagIds: string[]) {
    const owned = await this.prisma.tag.findMany({
      where: { id: { in: tagIds }, userId },
      select: { id: true },
    });

    if (owned.length !== tagIds.length) {
      throw new BadRequestException('One or more tagIds are invalid');
    }
  }
}
