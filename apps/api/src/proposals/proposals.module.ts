import { Module } from "@nestjs/common";
import { ProposalsController } from "./proposals.controller";
import { ProposalsService } from "./proposals.service";
import { ProposalNotifierService } from "./proposal-notifier.service";
import { OfficialsModule } from "../officials/officials.module";
import { TelegramModule } from "../telegram/telegram.module";

@Module({
  imports: [OfficialsModule, TelegramModule],
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalNotifierService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
