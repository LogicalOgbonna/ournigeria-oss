import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public';
import { TelegramService } from './telegram.service';

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);
  private readonly webhookSecret?: string;

  constructor(
    private telegramService: TelegramService,
    private config: ConfigService,
  ) {
    this.webhookSecret = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (!this.webhookSecret) {
      this.logger.warn("TELEGRAM_WEBHOOK_SECRET not set — webhook is unauthenticated");
    }
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Telegram bot webhook' })
  @ApiHeader({ name: 'x-telegram-bot-api-secret-token', required: false })
  async webhook(
    @Body() update: Record<string, unknown>,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ): Promise<{ ok: true }> {
    if (process.env.NODE_ENV === "production") {
      if (!this.webhookSecret) {
        this.logger.error("TELEGRAM_WEBHOOK_SECRET not configured in production");
        throw new ForbiddenException("Webhook not configured");
      }
      if (secretToken !== this.webhookSecret) {
        throw new ForbiddenException("Invalid webhook secret");
      }
    } else if (this.webhookSecret && secretToken !== this.webhookSecret) {
      throw new ForbiddenException('Invalid webhook secret');
    }

    try {
      await this.telegramService.handleUpdate(update);
    } catch (err) {
      this.logger.error('Webhook handler error:', err);
    }

    return { ok: true };
  }
}
