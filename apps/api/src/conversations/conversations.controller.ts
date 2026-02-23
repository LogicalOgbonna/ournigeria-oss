import {
  Controller,
  Get,
  Delete,
  Param,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ConversationsService } from './conversations.service';
import { CurrentUser } from '../auth/decorators/current-user';

@ApiTags('Conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

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
    @Param('id') id: string,
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async delete(
    @Param('id') id: string,
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
