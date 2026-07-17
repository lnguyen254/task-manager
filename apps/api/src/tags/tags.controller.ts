import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';

@ApiTags('tags')
@ApiBearerAuth()
@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user\'s tags' })
  @ApiResponse({ status: 200, description: 'List of tags' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.tagsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a tag' })
  @ApiResponse({ status: 201, description: 'The created tag' })
  @ApiResponse({ status: 409, description: 'A tag with this name already exists for the user' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTagDto,
  ) {
    return this.tagsService.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found or not owned by the requester' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.tagsService.remove(user.id, id);
  }
}
