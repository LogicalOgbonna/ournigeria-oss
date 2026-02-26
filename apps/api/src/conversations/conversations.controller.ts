import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ConversationsService } from './conversations.service';
import { CurrentUser } from '../auth/decorators/current-user';
import { Public } from '../auth/decorators/public';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,248}[a-z0-9]$/;

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  // ── Public routes (declared before :id to avoid route conflicts) ──

  @Get('public/:slug')
  @Public()
  @ApiOperation({ summary: 'Get a public conversation by slug' })
  @ApiParam({ name: 'slug', description: 'Conversation slug' })
  async getBySlug(@Param('slug') slug: string, @Res() res: Response) {
    try {
      if (!SLUG_RE.test(slug)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Invalid slug' });
      }

      const conversation = await this.conversationsService.getBySlug(slug);

      if (!conversation) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: 'Conversation not found' });
      }

      return res.json(conversation);
    } catch (err) {
      console.error('Public conversation error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to fetch conversation' });
    }
  }

  @Get('public/:slug/meta')
  @Public()
  @ApiOperation({ summary: 'Get OG metadata for a public conversation' })
  @ApiParam({ name: 'slug', description: 'Conversation slug' })
  async getPublicMeta(@Param('slug') slug: string, @Res() res: Response) {
    try {
      if (!SLUG_RE.test(slug)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Invalid slug' });
      }

      const meta = await this.conversationsService.getPublicMeta(slug);

      if (!meta) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: 'Conversation not found' });
      }

      return res.json(meta);
    } catch (err) {
      console.error('Public conversation meta error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to fetch conversation metadata' });
    }
  }

  // ── Authenticated routes ──

  @Get()
  @ApiOperation({ summary: 'List all conversations for current user' })
  async list(@CurrentUser() userId: string, @Res() res: Response) {
    try {
      if (!userId) {
        return res.json([]);
      }

      const result = await this.conversationsService.list(userId);
      return res.json(result);
    } catch (err) {
      console.error('Conversations list error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to fetch conversations' });
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ) {
    try {
      const conversation = await this.conversationsService.getById(id, userId);

      if (!conversation) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: 'Conversation not found' });
      }

      return res.json(conversation);
    } catch (err) {
      console.error('Conversation detail error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to fetch conversation' });
    }
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Toggle conversation visibility' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async share(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
    @Body() body: { public: boolean },
    @Res() res: Response,
  ) {
    try {
      const result = await this.conversationsService.toggleVisibility(
        id,
        userId,
        !!body.public,
      );

      if (!result) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: 'Conversation not found' });
      }

      return res.json(result);
    } catch (err) {
      console.error('Conversation share error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to update conversation visibility' });
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.conversationsService.delete(id, userId);

      if (!result) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: 'Conversation not found' });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('Conversation delete error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to delete conversation' });
    }
  }
}
