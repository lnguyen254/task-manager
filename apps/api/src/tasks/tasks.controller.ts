import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user\'s tasks' })
  @ApiResponse({ status: 200, description: 'Paginated list of tasks' })
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryTasksDto,
  ) {
    return this.tasksService.findAll(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  @ApiResponse({ status: 201, description: 'The created task' })
  @ApiResponse({ status: 400, description: 'Validation failed or an invalid tagId was given' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiResponse({ status: 200, description: 'The task' })
  @ApiResponse({ status: 404, description: 'Not found or not owned by the requester' })
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.tasksService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'The updated task' })
  @ApiResponse({ status: 404, description: 'Not found or not owned by the requester' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found or not owned by the requester' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tasksService.remove(user.id, id);
  }
}
