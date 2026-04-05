import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TelegramApiService } from "../telegram/telegram-api.service";

const DASHBOARD_URL = process.env.DASHBOARD_URL || "https://dashboard.arinze.online";

@Injectable()
export class ProposalNotifierService {
  private readonly logger = new Logger(ProposalNotifierService.name);
  private readonly adminChatId: number | null;

  constructor(
    private config: ConfigService,
    private telegram: TelegramApiService,
  ) {
    const chatId = this.config.get<string>("TELEGRAM_ADMIN_CHAT_ID");
    this.adminChatId = chatId ? parseInt(chatId, 10) : null;

    if (!this.adminChatId) {
      this.logger.warn(
        "TELEGRAM_ADMIN_CHAT_ID not set. Proposal notifications will be skipped.",
      );
    }
  }

  async notifyNewProposal(data: {
    proposalId: string;
    officialName: string;
    targetField: string;
    proposedValue: string;
    voteScore: number;
  }) {
    if (!this.adminChatId) return;

    try {
      const text = [
        `<b>New Proposal</b>`,
        ``,
        `<b>Official:</b> ${escapeHtml(data.officialName)}`,
        `<b>Field:</b> ${escapeHtml(data.targetField)}`,
        `<b>Value:</b> ${escapeHtml(String(data.proposedValue))}`,
        ``,
        `<a href="${DASHBOARD_URL}/dashboard/proposals">Review in Dashboard</a>`,
      ].join("\n");

      await this.telegram.sendMessage(this.adminChatId, text, {
        parse_mode: "HTML",
      });
    } catch (err) {
      this.logger.error("Failed to send proposal notification:", err);
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
