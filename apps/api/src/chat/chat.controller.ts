import { Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  async chat(@Req() req: Request, @Res() res: Response) {
    try {
      const { message, conversationId, tool } = req.body;
      const userId = (req as any).userId as string;

      if (!message || typeof message !== 'string') {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Message is required' });
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const send = (data: Record<string, unknown>) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        await this.chatService.processChat(
          userId,
          message,
          conversationId,
          tool,
          send,
        );
      } catch (err: any) {
        if (err.message === 'Conversation not found') {
          send({ type: 'error', content: 'Conversation not found' });
        } else {
          console.error('Stream error:', err);
          send({ type: 'error', content: 'Failed to process request' });
        }
      }

      res.end();
    } catch (err) {
      console.error('Chat API error:', err);
      if (!res.headersSent) {
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: 'Failed to process request' });
      }
      res.end();
    }
  }
}
