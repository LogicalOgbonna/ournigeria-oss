import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramApiService } from './telegram-api.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, TelegramApiService],
})
export class TelegramModule implements OnModuleInit {
  private readonly logger = new Logger(TelegramModule.name);

  constructor(
    private telegramApi: TelegramApiService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const webhookUrl = this.config.get<string>('TELEGRAM_WEBHOOK_URL');
    if (!webhookUrl) {
      this.logger.log('TELEGRAM_WEBHOOK_URL not set, skipping webhook registration');
      return;
    }

    const secret = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    try {
      await this.telegramApi.setWebhook(webhookUrl, secret);
    } catch (err) {
      this.logger.error('Failed to register Telegram webhook:', err);
    }
  }
}
